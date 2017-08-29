
/***************************************************************************
 *   Copyright (c) Damien Towning         (connolly.damien@gmail.com) 2017 *
 *                                                                         *
 *   This file is part of the Makertron CSG cad system.                    *
 *                                                                         *
 *   This library is free software; you can redistribute it and/or         *
 *   modify it under the terms of the GNU Library General Public           *
 *   License as published by the Free Software Foundation; either          *
 *   version 2 of the License, or (at your option) any later version.      *
 *                                                                         *
 *   This library  is distributed in the hope that it will be useful,      *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU Library General Public License for more details.                  *
 *                                                                         *
 *   You should have received a copy of the GNU Library General Public     *
 *   License along with this library; see the file COPYING.LIB. If not,    *
 *   write to the Free Software Foundation, Inc., 59 Temple Place,         *
 *   Suite 330, Boston, MA  02111-1307, USA                                *
 *                                                                         *
 ***************************************************************************/

// OpenCascade Includes 

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
#include <BrepCgal.h>
#include <ReadWrite.h>
#include <Geometry.h>
 
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

ReadWrite reader; 

Geometry::Geometry() {
}

// Prim 2d circle 
bool Geometry::circle(float r1,TopoDS_Shape &aShape ) {
	try {  
		Standard_Real radius = r1;
		gp_Circ c = gp_Circ(gp_Ax2(gp_Pnt(0,0,0),gp_Dir(0,0,1)), radius );
		TopoDS_Edge Ec = BRepBuilderAPI_MakeEdge(c);
		TopoDS_Wire Wc = BRepBuilderAPI_MakeWire(Ec);
		//TopoDS_Face F = BRepBuilderAPI_MakeFace(Wc);
		aShape = BRepBuilderAPI_MakeFace(Wc).Shape();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed to create circle"); 
	}
	return false; 
}

// Polyhedron 
bool Geometry::polyhedron(int **faces,float *points,int f_length, TopoDS_Shape &aShape ) {
	try { 
		BRepOffsetAPI_Sewing sew(0.1);
		Standard_Integer a,b; 
		Standard_Integer width = 0; 
		Standard_Real x1, y1, z1;
		Standard_Real x2, y2, z2; 
		TopoDS_Wire wire;		
		BRep_Builder builder;
		std::vector<TopoDS_Vertex> foo; 
		for ( int i = 0; i < f_length; i++ ) { // through face sets
			width = faces[i][0]; 		
			for ( int ii = 1; ii < width; ii++ ) { // make list of points
				a = faces[i][ii]; 
				x1 = points[(a*3)+0]; y1 = points[(a*3)+1]; z1 = points[(a*3)+2];
				foo.push_back( BRepBuilderAPI_MakeVertex(gp_Pnt(x1,y1,z1)) ); 	
			}
			builder.MakeWire(wire);			
			for ( int iii = 0; iii < foo.size()-1; iii++ ) { // build wire from points in foo for a face set
				builder.Add(wire, BRepBuilderAPI_MakeEdge(foo[iii],foo[iii+1]));
			}
			builder.Add(wire, BRepBuilderAPI_MakeEdge(foo[foo.size()-1],foo[0])); // closing wire for face set 
			sew.Add( BRepBuilderAPI_MakeFace( wire ) ); // add to sewing object 
			foo.clear(); 
		} 
		sew.Perform(); // sew it together
		TopoDS_Shape obj = sew.SewedShape(); // get the shape
		BRepBuilderAPI_MakeSolid brep_solid(TopoDS::Shell(obj)); // Now some unclear foo that took a bit to find 
																														 // Yes the shape will show type three as a shell 
																														 // but you have to wrap it TopoDS::shel() anyway :| 	
		aShape = brep_solid.Solid();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed to create polyhedron"); 
	}
	return false; 
}


// Prim Sphere
bool Geometry::sphere(float radius, float x , float y , float z , TopoDS_Shape &aShape ) {
	try { 
		Standard_Real sphere_radius = radius;
		//gp_Ax2 sphere_origin = gp_Ax2(gp_Pnt(x,y,z), gp_Dir(0,0,1));
		//TopoDS_Shape sphere = BRepPrimAPI_MakeSphere(sphere_origin, sphere_radius ).Shape();
		aShape = BRepPrimAPI_MakeSphere( sphere_radius ).Shape();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed to create sphere"); 
	}
	return false; 
} 

// Prim box 
bool Geometry::cube(float x , float y , float z , float xs , float ys , float zs , TopoDS_Shape &aShape ) {
	try { 	
		Standard_Real box_xs = xs;
		Standard_Real box_ys = ys;
		Standard_Real box_zs = zs;
		gp_Ax2 box_origin = gp_Ax2(gp_Pnt(x,y,z), gp_Dir(0,0,1));
		aShape = BRepPrimAPI_MakeBox(     box_origin,   box_xs , box_ys  , box_zs ).Shape();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed to create cube"); 
	}
	return false; 
} 

// Prim cone 
bool Geometry::cone(float r1,float r2,float h,float z , TopoDS_Shape &aShape ) {
	try {   	  	
		Standard_Real cone_r1 = r1;
		Standard_Real cone_r2 = r2;
		Standard_Real cone_h  = h;
		Standard_Real cone_z = z; 
		gp_Ax2 cone_origin = gp_Ax2(gp_Pnt(0,0,cone_z), gp_Dir(0,0,1));
		aShape = BRepPrimAPI_MakeCone( cone_origin , cone_r1, cone_r2 , cone_h ).Shape();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed to create cone"); 
	}
	return false; 
} 

// Prim Cylinder
bool Geometry::cylinder(float r1, float h,float z , TopoDS_Shape &aShape ) {
	try { 
		Standard_Real cylinder_r1 = r1;
		Standard_Real cylinder_h  = h;
		Standard_Real cylinder_z = z; 
		gp_Ax2 cylinder_origin = gp_Ax2(gp_Pnt(0,0,cylinder_z), gp_Dir(0,0,1));
		aShape = BRepPrimAPI_MakeCylinder( cylinder_origin , cylinder_r1, cylinder_h ).Shape();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed to create cylinder"); 
	}
	return false; 	
} 


// Translate a brep 
bool Geometry::translate( float x , float y , float z , TopoDS_Shape &aShape ) { 
	try { 
		gp_Trsf translate;
 	  translate.SetTranslation(gp_Vec(x, y, z));
		aShape = BRepBuilderAPI_Transform(aShape, translate, false).Shape();
		return true;
	}
	catch(const std::exception&) { 
		PRINT("Translate Failed"); 
	}
	return false;
}

// Translate a brep 
bool Geometry::scale( float x , float y , float z , TopoDS_Shape &aShape ) { 
	try {
		gp_GTrsf scale;
		gp_Mat m( x, 0, 0, 0, y, 0, 0, 0, z );	
		scale.SetVectorialPart(m);
		aShape = BRepBuilderAPI_GTransform(aShape, scale, true).Shape();
		return true;
	}
	catch(const std::exception&) { 
		PRINT("Scale Failed");
	}
	return false;
}

// Rotate brep x axis 
bool Geometry::rotateX( float x , TopoDS_Shape &aShape ) { 
	try { 
		Standard_Real xr = x;
		gp_Trsf rotate;
  	rotate.SetRotation( gp::OX(), xr );
		aShape = BRepBuilderAPI_Transform(aShape, rotate).Shape();
		return true;
	}
	catch(const std::exception&) { 
		PRINT("Rotate Failed x");
	}
	return false;
}

// Rotate brep y axis 
bool Geometry::rotateY( float y ,  TopoDS_Shape &aShape ) { 
	try { 
		Standard_Real yr = y;
		gp_Trsf rotate;
		rotate.SetRotation( gp::OY(), yr );
		aShape = BRepBuilderAPI_Transform(aShape, rotate).Shape();
		return false; 
	}
	catch(const std::exception&) { 
		PRINT("Rotate Failed y");
	}
	return false;
}

// Rotate brep z axis 
bool Geometry::rotateZ( float z , TopoDS_Shape &aShape ) { 
	try { 
		Standard_Real zr = z;
		gp_Trsf rotate;
  	rotate.SetRotation( gp::OZ(), zr );
		aShape = BRepBuilderAPI_Transform(aShape, rotate).Shape();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Rotate Failed z");
	}
	return false;
}


// Extrusion ( does not include twist yet ) 
bool Geometry::extrude(float h1,TopoDS_Shape &aShape) {
	try {  
		Standard_Real height = h1;
		aShape = BRepPrimAPI_MakePrism(aShape,gp_Vec(0,0,height));
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed to create linear extrude"); 
	}
	return false; 
}

// Generate minkowski 
bool Geometry::minkowski(TopoDS_Shape &aShape,TopoDS_Shape bShape) { 	
	try { 	
		// Tolerances 
		Standard_Real tolerance = 0.25;
		Standard_Real angular_tolerance = 0.5;
		Standard_Real minTriangleSize = Precision::Confusion();
		// Set the tolerances
		BRepMesh_FastDiscret::Parameters m_MeshParams;
		m_MeshParams.ControlSurfaceDeflection = Standard_True; 
		m_MeshParams.Deflection = tolerance;
		m_MeshParams.MinSize = minTriangleSize;
		m_MeshParams.InternalVerticesMode = Standard_False;
		m_MeshParams.Relative=Standard_False;
		m_MeshParams.Angle = angular_tolerance;
		// Incremental meshes from shapes 
		BRepMesh_IncrementalMesh ( aShape, m_MeshParams );
		BRepMesh_IncrementalMesh ( bShape, m_MeshParams );
		TopoDS_Shape rShape;
	 	// In to the CGAL. Putting cgal geometry operations in thar for now  
		BrepCgal brepcgal;
		brepcgal.minkowski( aShape , bShape , rShape );
		aShape = rShape; 
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("CGAL Assertion in Minkowski"); 
	}
	return false; 
}


// Difference between two objects
bool Geometry::difference(TopoDS_Shape &aShape, TopoDS_Shape &bShape) { 
	try { 
		aShape = BRepAlgoAPI_Cut( aShape ,  bShape ).Shape();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed Union"); 
	}
	return false; 
}

// Union between two objects
bool Geometry::uni(TopoDS_Shape &aShape, TopoDS_Shape &bShape) { 
	try { 
		aShape = BRepAlgoAPI_Fuse( aShape ,  bShape ).Shape();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed Union"); 
	}
	return false; 
}

// Intersection between two objects
bool Geometry::intersection(TopoDS_Shape &aShape, TopoDS_Shape &bShape) { 
	try { 
		aShape = BRepAlgoAPI_Common( aShape ,  bShape ).Shape();
		return true; 
	}
	catch(const std::exception&) { 
		PRINT("Failed Union"); 
	}
	return false; 
}

// add a new shape to the stack 
bool Geometry::add(TopoDS_Shape shapeA) {
		shapeStack.push_back( shapeA );
		return true; 
}
// alter an existing shape in the stack 
bool Geometry::set(int indexA , TopoDS_Shape shapeA) {
		shapeStack[indexA] = shapeA;
		return true; 
}

// get a shape from the stack 
bool Geometry::get( int index , TopoDS_Shape &rShape) { 
	rShape = shapeStack[index]; 
	return true; 
}

// get the current location ( size - 1 ) of the stack 
int Geometry::currentIndex() { 
	return shapeStack.size()-1; 
}

