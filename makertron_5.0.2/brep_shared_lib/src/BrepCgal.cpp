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
//#include <Standard.hxx>
//#include <Standard_DefineAlloc.hxx>
//#include <Standard_Handle.hxx>

//#include <Standard_Boolean.hxx>
//#include <StlAPI_ErrorStatus.hxx>
//#include <Standard_CString.hxx>

#include <CGAL/Exact_predicates_exact_constructions_kernel.h> 
#include <CGAL/Exact_predicates_inexact_constructions_kernel.h>
#include <CGAL/Polyhedron_3.h> 
#include <CGAL/Nef_polyhedron_3.h> 
#include <CGAL/IO/Nef_polyhedron_iostream_3.h> 
#include <CGAL/IO/Polyhedron_iostream.h> 
#include <CGAL/OFF_to_nef_3.h>
#include <CGAL/IO/OFF_reader.h>
#include <CGAL/IO/print_wavefront.h>
#include <CGAL/Polygon_mesh_processing/stitch_borders.h>
#include <CGAL/Polygon_mesh_processing/self_intersections.h>
#include <CGAL/Surface_mesh.h>
#include <CGAL/boost/graph/graph_traits_Surface_mesh.h>
#include <CGAL/boost/graph/graph_traits_Polyhedron_3.h>
#include <CGAL/Polygon_mesh_processing/orient_polygon_soup.h>
#include <CGAL/Polygon_mesh_processing/polygon_soup_to_polygon_mesh.h>
#include <CGAL/Polygon_mesh_processing/orientation.h>
#include <CGAL/Polygon_mesh_processing/triangulate_hole.h>
#include <CGAL/Nef_3/SNC_indexed_items.h>
#include <CGAL/convex_decomposition_3.h> 
#include <CGAL/convex_hull_3.h>

// Brep Includes

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

#include "ShapeAnalysis_ShapeTolerance.hxx"
#include "ShapeAnalysis_ShapeContents.hxx"
#include "ShapeAnalysis_CheckSmallFace.hxx"
#include "ShapeAnalysis_DataMapOfShapeListOfReal.hxx"
#include "ShapeAnalysis_Surface.hxx"

#include <ShapeUpgrade_ShapeDivideAngle.hxx>

#include "BRepCheck_Analyzer.hxx"
#include "BRepLib.hxx"
#include "ShapeBuild_ReShape.hxx"
#include "ShapeFix.hxx"
#include "ShapeFix_FixSmallFace.hxx"
#include "BRepAlgoAPI_Fuse.hxx"

#include <PrintUtils.h>
#include <BrepCgal.h>

#include <boost/foreach.hpp>
#include <boost/unordered_set.hpp>

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

typedef CGAL::Exact_predicates_exact_constructions_kernel Kernel;
typedef CGAL::Polyhedron_3<Kernel> Polyhedron; 
typedef Polyhedron::HalfedgeDS HalfedgeDS; 
typedef CGAL::Nef_polyhedron_3<Kernel> Nef_polyhedron; 

typedef Polyhedron::Halfedge_handle    Halfedge_handle;
typedef Polyhedron::Facet_handle       Facet_handle;
typedef Polyhedron::Vertex_handle      Vertex_handle;

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

BrepCgal::BrepCgal() {
}


// ---------------------------------------------------------------------------------
// export the result back out as vector list
// ---------------------------------------------------------------------------------
template <typename Polyhedron> bool createPolySetFromPolyhedron(const Polyhedron &p)
{
	int i = 0; 
	double xa,ya,za,xb,yb,zb,xc,yc,zc; 
	std::stringstream output;
	bool err = false;
	typedef typename Polyhedron::Vertex                                 Vertex;
	typedef typename Polyhedron::Vertex_const_iterator                  VCI;
	typedef typename Polyhedron::Facet_const_iterator                   FCI;
	typedef typename Polyhedron::Halfedge_around_facet_const_circulator HFCC;		
	output << "solid shape, STL ascii file, created with Makertron Technology\n"; 
	for (FCI fi = p.facets_begin(); fi != p.facets_end(); ++fi) {
		HFCC hc = fi->facet_begin();
		HFCC hc_end = hc;
		do {
			Vertex const& v = *((hc++)->vertex());
			if ( i == 0 )  {
				xa = CGAL::to_double(v.point().x());
				ya = CGAL::to_double(v.point().y());
				za = CGAL::to_double(v.point().z());
			}
			if ( i == 1 )  {
				xb = CGAL::to_double(v.point().x());
				yb = CGAL::to_double(v.point().y());
				zb = CGAL::to_double(v.point().z());
			}
			if ( i == 2 ) { 
				xc = CGAL::to_double(v.point().x());
				yc = CGAL::to_double(v.point().y());
				zc = CGAL::to_double(v.point().z());	
				output << " facet normal 0.0 0.0 0.0\n";
        output <<  "   outer loop\n";
        output <<  "     vertex " << xa << " " << ya << " " << za << "\n";
        output <<  "     vertex " << xb << " " << yb << " " << zb << "\n";
        output <<  "     vertex " << xc << " " << yc << " " << zc << "\n";
        output <<  "   endloop\n";
        output <<  " endfacet\n";
			}
			i++; 
			if ( i == 3 ) i = 0;  
			 
		} while (hc != hc_end);
	}
	output << "endsolid shape\n";
	std::cout << output.str() << std::endl; 
	return err;
}


// ---------------------------------------------------------------------------------
// export the result back out as Brep 
// ---------------------------------------------------------------------------------
template <typename Polyhedron> bool createBrepFromPolyhedron(const Polyhedron &p,TopoDS_Shape &aShape) {

	//if (CGAL::Polygon_mesh_processing::is_outward_oriented(p)) {
	//	PRINT("Polyhedron For Brep Conversion Is Closed");  
	//}

	int i = 0; 
	double xa,ya,za,xb,yb,zb,xc,yc,zc; 
	//std::stringstream output;
	bool err = false;

	gp_XYZ p1, p2, p3;
  TopoDS_Vertex Vertex1, Vertex2, Vertex3;
  TopoDS_Face AktFace;
  TopoDS_Wire AktWire;
 
  BRepBuilderAPI_Sewing aSewingTool;  
  aSewingTool.Init(1.0e-06,Standard_True);

	TopoDS_Compound aComp;
  BRep_Builder BuildTool;
  BuildTool.MakeCompound( aComp );
	
	// CGAL
	typedef typename Polyhedron::Vertex                                 Vertex;
	typedef typename Polyhedron::Vertex_const_iterator                  VCI;
	typedef typename Polyhedron::Facet_const_iterator                   FCI;
	typedef typename Polyhedron::Halfedge_around_facet_const_circulator HFCC;		
	typedef typename Polyhedron::Point_3  Point3;

	for (FCI fi = p.facets_begin(); fi != p.facets_end(); ++fi) {
		HFCC hc = fi->facet_begin();
		HFCC hc_end = hc;
		do {
			Vertex const& v = *((hc++)->vertex());
			if ( i == 0 )  {
				xa = CGAL::to_double(v.point().x());
				ya = CGAL::to_double(v.point().y());
				za = CGAL::to_double(v.point().z());
			}
			if ( i == 1 )  {
				xb = CGAL::to_double(v.point().x());
				yb = CGAL::to_double(v.point().y());
				zb = CGAL::to_double(v.point().z());
			}
			if ( i == 2 ) { 
				xc = CGAL::to_double(v.point().x());
				yc = CGAL::to_double(v.point().y());
				zc = CGAL::to_double(v.point().z());
				p1.SetCoord(xa,ya,za);
	      p2.SetCoord(xb,yb,zb);
	      p3.SetCoord(xc,yc,zc);
				Vertex1 = BRepBuilderAPI_MakeVertex(p1);
        Vertex2 = BRepBuilderAPI_MakeVertex(p2);
        Vertex3 = BRepBuilderAPI_MakeVertex(p3);
				AktWire = BRepBuilderAPI_MakePolygon( Vertex1, Vertex2, Vertex3, Standard_True);
				if( !AktWire.IsNull()) {
          AktFace = BRepBuilderAPI_MakeFace( AktWire);
          if(!AktFace.IsNull()) {
						BuildTool.Add( aComp, AktFace );
					}
        }  
			}
			i++; 
			if ( i == 3 ) i = 0;  
		} while (hc != hc_end);
	}

	aSewingTool.Load( aComp );
  aSewingTool.Perform();
  //aShape = aSewingTool.SewedShape();
  //aShape = aComp;
	
	TopoDS_Shape obj = aSewingTool.SewedShape(); // get the shape

	BRepBuilderAPI_MakeSolid brep_solid(TopoDS::Shell(obj)); // Now some unclear foo that took a bit to find 
																													 // Yes the shape will show type three as a shell 																													 // but you have to wrap it TopoDS::shell() anyway :| 	
	aShape = brep_solid.Solid();

	return err;
}

// -------------------------------------------------------------------------------------------------------------
// Build a CGAL surface given coords and tris. 
// Based on the http://jamesgregson.blogspot.com.au/2012/05/example-code-for-building.html 
// -------------------------------------------------------------------------------------------------------------
template<class HDS>
class surface_builder : public CGAL::Modifier_base<HDS> {
public:
 std::vector<double> &coords;
 std::vector<int>    &tris;
    surface_builder( std::vector<double> &_coords, std::vector<int> &_tris ) : coords(_coords), tris(_tris) {}
    void operator()( HDS& hds) {
  		typedef typename HDS::Vertex   Vertex;
      typedef typename Vertex::Point Point;
      CGAL::Polyhedron_incremental_builder_3<HDS> B( hds, true);
      B.begin_surface( coords.size(), tris.size() );
  		for( int i=0; i<(int)coords.size(); i+=3 ){
  			B.add_vertex( Point( coords[i+0], coords[i+1], coords[i+2] ) );
  		}
  		for( int i=0; i<(int)tris.size(); i+=3 ){
   			B.begin_facet();
	  			B.add_vertex_to_facet( tris[i+0] );
   				B.add_vertex_to_facet( tris[i+1] );
   				B.add_vertex_to_facet( tris[i+2] );
   			B.end_facet();
  		} 
    	B.end_surface();
  	}
};

// --------------------------------------------------------------
// Convert a BREP in to a CGAL surface. Sure a more optimal way 
// exists to do this. Classic issues with bad floating point 
// and convexity. 
// --------------------------------------------------------------
template <typename Polyhedron> bool BrepCgal::BrepToCgal(TopoDS_Shape& aShape, Polyhedron& p) { 
	std::vector<double> points;   
	std::vector<double> nPoints;   
	std::vector<int> nFaces;
	typedef typename Polyhedron::Point_3  Point3;
	// complete winding of points in triangle order. Every 9 values is a face. 
	for (TopExp_Explorer exp (aShape , TopAbs_FACE); exp.More(); exp.Next())
	{
		TopoDS_Face face = TopoDS::Face (exp.Current());
		TriangleAccessor aTool (face);
		for (int iTri = 1; iTri <= aTool.NbTriangles(); iTri++)
		{
		 gp_Vec aNorm;
	   gp_Pnt aPnt1, aPnt2, aPnt3;
		 aTool.GetTriangle (iTri, aNorm, aPnt1, aPnt2, aPnt3);		
		 Point3 a(aPnt1.X(),aPnt1.Y(),aPnt1.Z()); 
		 Point3 b(aPnt2.X(),aPnt2.Y(),aPnt2.Z()); 
		 Point3 c(aPnt3.X(),aPnt3.Y(),aPnt3.Z()); 
		  if ( CGAL::squared_distance(a, b) != 0.0 ) { 
		 		if ( CGAL::squared_distance(b, c) != 0.0 ) { 
		 			if ( CGAL::squared_distance(c, a) != 0.0 ) { 
						 points.push_back( aPnt1.X() ); points.push_back( aPnt1.Y() ); points.push_back( aPnt1.Z() );
						 points.push_back( aPnt2.X() ); points.push_back( aPnt2.Y() ); points.push_back( aPnt2.Z() );
		         points.push_back( aPnt3.X() ); points.push_back( aPnt3.Y() ); points.push_back( aPnt3.Z() ); 	
					}	
				}
			}
		}
	}
	for ( int i = 0; i < points.size()/3; i+=3 ) { 
		nFaces.push_back( i + 0 ); nFaces.push_back( i + 1 ); nFaces.push_back( i + 2 );
	}
	surface_builder<HalfedgeDS> builder( points, nFaces );
	p.delegate( builder ); 
	return true; 
}

// -------------------------------------------------------------------------------
// Check if a Polyhedron is weakly convex. As per the OpenSCAD code. 
// Did not implement the shell checking part yet. Do I need to?
// ------------------------------------------------------------------------------- 
bool is_weakly_convex(Polyhedron const& p) {
	for (typename Polyhedron::Edge_const_iterator i = p.edges_begin(); i != p.edges_end(); ++i) {
  	typename Polyhedron::Plane_3 p(i->opposite()->vertex()->point(), i->vertex()->point(), i->next()->vertex()->point());
    if (p.has_on_positive_side(i->opposite()->next()->vertex()->point()) &&
       CGAL::squared_distance(p, i->opposite()->next()->vertex()->point()) > 1e-8) {
				PRINT("Was Weakly Convex");  
     		return true;
 		 }
	}
  PRINT("Was Not Weakly Convex");  
  return false; 
}

// -------------------------------------------------------------------------
// Following the exising openscad code as guide. Generate hull. 
// -------------------------------------------------------------------------
bool BrepCgal::hull( TopoDS_Shape *shapes, TopoDS_Shape &rShape ) {

	rShape = shapes[0]; 

	//const Geometry::Geometries &children, PolySet &result
	/*typedef CGAL::Epick K;
	// Collect point cloud
	// NB! CGAL's convex_hull_3() doesn't like std::set iterators, so we use a list
	// instead.
	std::list<K::Point_3> points;
	for(const auto &item : children) {
		const shared_ptr<const Geometry> &chgeom = item.second;
		const CGAL_Nef_polyhedron *N = dynamic_cast<const CGAL_Nef_polyhedron *>(chgeom.get());
		if (N) {
			if (!N->isEmpty()) {
				for (CGAL_Nef_polyhedron3::Vertex_const_iterator i = N->p3->vertices_begin(); i != N->p3->vertices_end(); ++i) {
					points.push_back(vector_convert<K::Point_3>(i->point()));
				}
			}
		} else {
			const PolySet *ps = dynamic_cast<const PolySet *>(chgeom.get());
			if (ps) {
				for(const auto &p : ps->polygons) {
					for(const auto &v : p) {
						points.push_back(K::Point_3(v[0], v[1], v[2]));
					}
				}
			}
		}
	}
	if (points.size() <= 3) return false;
	// Apply hull
	bool success = false;
	if (points.size() >= 4) {
		CGAL::Failure_behaviour old_behaviour = CGAL::set_error_behaviour(CGAL::THROW_EXCEPTION);
		try {
			CGAL::Polyhedron_3<K> r;
			CGAL::convex_hull_3(points.begin(), points.end(), r);
     	PRINTDB("After hull vertices: %d", r.size_of_vertices());
      PRINTDB("After hull facets: %d", r.size_of_facets());
      PRINTDB("After hull closed: %d", r.is_closed());
      PRINTDB("After hull valid: %d", r.is_valid());
			success = !createPolySetFromPolyhedron(r, result);
		}
		catch (const CGAL::Failure_exception &e) {
			PRINTB("ERROR: CGAL error in applyHull(): %s", e.what());
		}
		CGAL::set_error_behaviour(old_behaviour);
	}
	return success;*/
	return true; 
}

// -------------------------------------------------------------------------
// Following the existing openscad code as guide. Two Brep shapes converted
// to CGAL Polyhedrons. 
// -------------------------------------------------------------------------
 
bool BrepCgal::minkowski( TopoDS_Shape aShape , TopoDS_Shape bShape , TopoDS_Shape &rShape ) {

	PRINT("Performing Minkowski."); 

	std::stringstream output;

	Polyhedron aMesh;
	BrepToCgal(aShape,aMesh); 
	CGAL::Polygon_mesh_processing::stitch_borders(aMesh);
	Nef_polyhedron A(aMesh);

	Polyhedron bMesh;
	BrepToCgal(bShape,bMesh);
 	CGAL::Polygon_mesh_processing::stitch_borders(bMesh);
	Nef_polyhedron B(bMesh);

	typedef CGAL::Epick Hull_kernel;

 std::list<Polyhedron> P[2];
 std::list<CGAL::Polyhedron_3<Hull_kernel> > result_parts;	

  if ( (A.is_convex()) || (is_weakly_convex(aMesh))) {
	PRINT("Minkowski: child A is convex"); 
	P[0].push_back(aMesh);
 }
 else { 
	PRINT("Minkowski: A was not convex doing decomposition"); 
	Nef_polyhedron decomposed_nef;
	decomposed_nef = A; 
	CGAL::convex_decomposition_3(decomposed_nef);
	Nef_polyhedron::Volume_const_iterator ci = ++decomposed_nef.volumes_begin();
	for(; ci != decomposed_nef.volumes_end(); ++ci) {
		if(ci->mark()) {
			Polyhedron poly;
			decomposed_nef.convert_inner_shell_to_polyhedron(ci->shells_begin(), poly);
			P[0].push_back(poly);
		}
	}
	output << "Minkowski: decomposed into " << P[0].size();	
  PRINT( output.str() ); 
  output.clear(); 
 } 


  if ( (B.is_convex()) || (is_weakly_convex(bMesh))) {
	PRINT("Minkowski: child B is convex");  
	P[1].push_back(bMesh);
 }
 else { 
	PRINT("Minkowski: child B was not convex doing decomposition");  
	Nef_polyhedron decomposed_nef;
	decomposed_nef = B; 
	CGAL::convex_decomposition_3(decomposed_nef);
	Nef_polyhedron::Volume_const_iterator ci = ++decomposed_nef.volumes_begin();
	for(; ci != decomposed_nef.volumes_end(); ++ci) {
		if(ci->mark()) {
			Polyhedron poly;
			decomposed_nef.convert_inner_shell_to_polyhedron(ci->shells_begin(), poly);
			P[1].push_back(poly);
		}
	}
	output << "Minkowski: decomposed into " << P[1].size();	
  PRINT( output.str() ); 
  output.clear(); 
 } 
 

 std::vector<Hull_kernel::Point_3> points[2];
 std::vector<Hull_kernel::Point_3> minkowski_points;

 for (size_t i = 0; i < P[0].size(); i++) {
 	for (size_t j = 0; j < P[1].size(); j++) {
		points[0].clear();
		points[1].clear();
		for (int k = 0; k < 2; k++) {
			std::list<Polyhedron>::iterator it = P[k].begin();
			std::advance(it, k==0?i:j);
			Polyhedron const& poly = *it;
			points[k].reserve(poly.size_of_vertices());
			for (Polyhedron::Vertex_const_iterator pi = poly.vertices_begin(); pi != poly.vertices_end(); ++pi) {
				Polyhedron::Point_3 const& p = pi->point();
				points[k].push_back(Hull_kernel::Point_3(to_double(p[0]),to_double(p[1]),to_double(p[2])));
			}
		}
		minkowski_points.clear();
		minkowski_points.reserve(points[0].size() * points[1].size());
		for (int i = 0; i < points[0].size(); i++) {
			for (int j = 0; j < points[1].size(); j++) {
				minkowski_points.push_back(points[0][i]+(points[1][j]-CGAL::ORIGIN));
			}
		}
		if (minkowski_points.size() <= 3) { continue;}
		CGAL::Polyhedron_3<Hull_kernel> result;
		CGAL::convex_hull_3(minkowski_points.begin(), minkowski_points.end(), result);
		std::vector<Hull_kernel::Point_3> strict_points;
		strict_points.reserve(minkowski_points.size());
		for (CGAL::Polyhedron_3<Hull_kernel>::Vertex_iterator i = result.vertices_begin(); i != result.vertices_end(); ++i) {
			Hull_kernel::Point_3 const& p = i->point();
			CGAL::Polyhedron_3<Hull_kernel>::Vertex::Halfedge_handle h,e;
			h = i->halfedge();
			e = h;
			bool collinear = false;
			bool coplanar = true;
			do {
				Hull_kernel::Point_3 const& q = h->opposite()->vertex()->point();
				if (coplanar && !CGAL::coplanar(p,q,
					h->next_on_vertex()->opposite()->vertex()->point(),
					h->next_on_vertex()->next_on_vertex()->opposite()->vertex()->point())) {
					coplanar = false;
				}
				for (CGAL::Polyhedron_3<Hull_kernel>::Vertex::Halfedge_handle j = h->next_on_vertex();
					j != h && !collinear && ! coplanar;
					j = j->next_on_vertex()) {
						Hull_kernel::Point_3 const& r = j->opposite()->vertex()->point();
						if (CGAL::collinear(p,q,r)) { collinear = true; }
					}
					h = h->next_on_vertex();
				} 
				while (h != e && !collinear);
					if (!collinear && !coplanar) strict_points.push_back(p);
				}
				result.clear();
				CGAL::convex_hull_3(strict_points.begin(), strict_points.end(), result);
				result_parts.push_back(result);
		}
 	}

	int count = 0; 
	TopoDS_Shape nShape; 
	for (std::list<CGAL::Polyhedron_3<Hull_kernel> >::iterator i = result_parts.begin(); i != result_parts.end(); ++i) {
		createBrepFromPolyhedron( *i , nShape );
		if ( count == 0 ) rShape = nShape; 
		if ( count > 0 ) { 
			rShape = BRepAlgoAPI_Fuse( rShape ,  nShape ).Shape();
		} 
		count++; 
  }

  return 0;
	

}


