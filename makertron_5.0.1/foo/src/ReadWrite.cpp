#include <gp.hxx>
#include <gp_Pln.hxx>
#include <gp_Ax2.hxx>
#include <gp_Circ.hxx>

#include <TopoDS.hxx>
#include <TopoDS_Shape.hxx>
#include <TopoDS_Face.hxx>
#include <TopExp_Explorer.hxx>
#include <Poly_Triangulation.hxx>

#include <Bnd_Box.hxx>
#include <BRepBndLib.hxx>
#include <OSD_Path.hxx>
#include <OSD_OpenFile.hxx>
#include <RWStl.hxx>

#include <StlAPI_Writer.hxx>

#include <StlMesh_Mesh.hxx>
#include <StlTransfer.hxx>

#include <BRep_Tool.hxx>
#include <BRepTools.hxx>

#include <BRepPrimAPI_MakeSphere.hxx>
#include <BRepPrimAPI_MakeBox.hxx>
#include <BRepPrimAPI_MakeCylinder.hxx>
#include <BRepPrimAPI_MakeCone.hxx>
#include <BRepPrimAPI_MakePrism.hxx>
#include <BRepPrimAPI_MakeRevol.hxx>

#include <BRepFeat_MakeCylindricalHole.hxx>
#include <BRepMesh_IncrementalMesh.hxx>

#include <BRepAlgoAPI_Cut.hxx>
#include <BRepAlgoAPI_Fuse.hxx>
#include <BRepAlgoAPI_Common.hxx>
#include <BRepPrimAPI_MakeTorus.hxx>

#include <BRepBuilderAPI_MakeWire.hxx>
#include <BRepBuilderAPI_MakeEdge.hxx>
#include <BRepBuilderAPI_MakeFace.hxx>
#include <BRepBuilderAPI_MakePolygon.hxx>
#include <BRepBuilderAPI_MakeVertex.hxx>
#include <BRepBuilderAPI_GTransform.hxx>
#include <BRepBuilderAPI_MakeSolid.hxx>
#include <BRepBuilderAPI_Transform.hxx>
#include <BRepOffsetAPI_Sewing.hxx>

// Brep To CGAL conversion 
#include <PrintUtils.h>
#include <ReadWrite.h>
 
// Streams 
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

// Math
#include <math.h>
#include <float.h>
#include <cmath>
#include <assert.h>

using namespace std;

// Auxiliary tools
namespace
{
  // Tool to get triangles from triangulation taking into account face
  // orientation and location
  class TriangleAccessor
  {
  public:
    TriangleAccessor (const TopoDS_Face& aFace)
    {
      TopLoc_Location aLoc;
      myPoly = BRep_Tool::Triangulation (aFace, aLoc);
      myTrsf = aLoc.Transformation();
      myNbTriangles = (myPoly.IsNull() ? 0 : myPoly->Triangles().Length());
      myInvert = (aFace.Orientation() == TopAbs_REVERSED);
      if (myTrsf.IsNegative())
        myInvert = ! myInvert;
    }

    int NbTriangles () const { return myNbTriangles; } 

    // get i-th triangle and outward normal
    void GetTriangle (int iTri, gp_Vec &theNormal, gp_Pnt &thePnt1, gp_Pnt &thePnt2, gp_Pnt &thePnt3)
    {
      // get positions of nodes
      int iNode1, iNode2, iNode3;
      myPoly->Triangles()(iTri).Get (iNode1, iNode2, iNode3); 
      thePnt1 = myPoly->Nodes()(iNode1);
      thePnt2 = myPoly->Nodes()(myInvert ? iNode3 : iNode2);
      thePnt3 = myPoly->Nodes()(myInvert ? iNode2 : iNode3);	

      // apply transormation if not identity
      if (myTrsf.Form() != gp_Identity)
      {
        thePnt1.Transform (myTrsf);
        thePnt2.Transform (myTrsf);
        thePnt3.Transform (myTrsf);
      }

      // calculate normal
      theNormal = (thePnt2.XYZ() - thePnt1.XYZ()) ^ (thePnt3.XYZ() - thePnt1.XYZ());
      Standard_Real aNorm = theNormal.Magnitude();
      if (aNorm > gp::Resolution()) theNormal /= aNorm;
    }

  private:
    Handle(Poly_Triangulation) myPoly;
    gp_Trsf myTrsf;
    int myNbTriangles;
    bool myInvert;
  };

}

ReadWrite::ReadWrite() {
}

// Write BREP 
std::string ReadWrite::WriteBREP(const TopoDS_Shape& shape)
{
		//std::cout << "Generating BREP" << std::endl; 
		std::stringstream stream;
    BRepTools::Write(shape,stream);		
		return stream.str(); 
}

// Read BREP 
TopoDS_Shape ReadWrite::ReadBREP(std::string brep)
{
		//std::cout << "Reading BREP" << std::endl; 
		BRep_Builder brepb;

		std::stringstream stream;
		TopoDS_Shape shape;
		stream << brep << std::endl; 
    BRepTools::Read(shape,stream,brepb);		
		return shape; 
}

// Write as STL
void ReadWrite::WriteSTL(const TopoDS_Shape& shape)
{
    StlAPI_Writer stl_writer;
		BRepMesh_IncrementalMesh ( shape, 0.01);	
    stl_writer.Write(shape, "demo1.stl");		
}



std::string  ReadWrite::Dump(const TopoDS_Shape& theShape)
{
	std::stringstream output;
	output << "[";
  for (TopExp_Explorer exp (theShape, TopAbs_FACE); exp.More(); exp.Next())
  {
   TriangleAccessor aTool (TopoDS::Face (exp.Current()));
   for (int iTri = 1; iTri <= aTool.NbTriangles(); iTri++)
   {
     gp_Vec aNorm;
     gp_Pnt aPnt1, aPnt2, aPnt3;
     aTool.GetTriangle (iTri, aNorm, aPnt1, aPnt2, aPnt3);
     output << aPnt1.X() << "," << aPnt1.Y() << "," << aPnt1.Z() << ",";
     output << aPnt2.X() << "," << aPnt2.Y() << "," << aPnt2.Z() << ",";
     output << aPnt3.X() << "," << aPnt3.Y() << "," << aPnt3.Z() << ",";
   }
  }
  output << "0]\n"; 
  return output.str(); 
}


// Write a brep out to an STL string 
char* ReadWrite::ConvertBrepTostring(TopoDS_Shape brep,float quality) { 

	TopoDS_Shape shape = brep; 
	StlAPI_Writer stl_writer;
	
	// Tolerances 
	Standard_Real tolerance = quality;
  Standard_Real angular_tolerance = 0.5;
  Standard_Real minTriangleSize = Precision::Confusion();

	// Set the mesh tolerances 6.x and onwards .. ( standard distribution library ) useless as does not support setMinSize yet??
	//BRepMesh_IncrementalMesh ocmesher;
  //ocmesher.SetControlSurfaceDeflection(Standard_False);
  //ocmesher.SetShape(shape);
  //ocmesher.SetDeflection(tolerance);
  //ocmesher.SetMinSize(minTriangleSize);
  //ocmesher.SetInternalVerticesMode(Standard_False);
  //ocmesher.SetRelative(Standard_False);
  //ocmesher.SetAngle(angular_tolerance);
  //ocmesher.Perform();

	// Set the mesh tolerances 7.x and onwards .. forcing us to do our own build and distribution of the library 
	BRepMesh_FastDiscret::Parameters m_MeshParams;
  m_MeshParams.ControlSurfaceDeflection = Standard_True; 
  m_MeshParams.Deflection = tolerance;
  m_MeshParams.MinSize = minTriangleSize;
  m_MeshParams.InternalVerticesMode = Standard_False;
  m_MeshParams.Relative=Standard_False;
  m_MeshParams.Angle = angular_tolerance;
	BRepMesh_IncrementalMesh ( shape, m_MeshParams );

		
	char *new_buf = strdup((char*)Dump(shape).c_str());			
  return new_buf; 
}

