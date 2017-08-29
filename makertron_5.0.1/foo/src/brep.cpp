
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

// brep shared library includes
#include <PrintUtils.h>
#include <ReadWrite.h>
#include <BrepCgal.h>
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

// Instances because \m/ \m/ ...

ReadWrite readwrite;
Geometry geometry; 		

// ffi bindings 

extern "C" int   ffi_sphere(float radius, float x , float y , float z );
extern "C" int   ffi_cube(float x , float y , float z , float xs , float ys , float zs);
extern "C" int   ffi_cone(float r1,float r2,float h,float z);
extern "C" int   ffi_polyhedron(int **faces,float *points,int f_length); 
extern "C" int   ffi_difference(int indexA, int indexB);
extern "C" int   ffi_union(int indexA, int indexB);
extern "C" int   ffi_intersection(int indexA, int indexB);
extern "C" int   ffi_translate(float x , float y , float z , int indexA);
extern "C" int   ffi_scale(float x , float y , float z , int indexA);
extern "C" int   ffi_rotateX(float x , int indexA);
extern "C" int   ffi_rotateY(float y , int indexA);
extern "C" int   ffi_rotateZ(float z , int indexA);
extern "C" int   ffi_circle(float r1);
extern "C" int   ffi_extrude(float h1, int indexA);
extern "C" int   ffi_cylinder(float r1,float h,float z);
extern "C" int   ffi_minkowski(int indexA, int indexB);
extern "C" char* ffi_convert_brep_tostring(int indexA,float quality);
extern "C" int   ffi_cleanup(); 

int ffi_cleanup() { geometry.shapeStack.clear(); }

char* ffi_convert_brep_tostring(int indexA,float quality) {
	TopoDS_Shape brep; 
	geometry.get( indexA , brep );  
	return readwrite.ConvertBrepTostring(brep,quality);
} 

int ffi_sphere(float radius, float x , float y , float z ) { 
	TopoDS_Shape shape_a; 
	geometry.sphere( radius , x , y , z , shape_a ); 
	geometry.add( shape_a ); 
	return geometry.currentIndex(); 
}

int ffi_cube(float x , float y , float z , float xs , float ys , float zs) { 
	TopoDS_Shape shape_a; 
	geometry.cube( x , y , z , xs , ys , zs , shape_a ); 
	geometry.add( shape_a ); 
	return geometry.currentIndex(); 
}

int ffi_cylinder(float r1,float h,float z) { 
	TopoDS_Shape shape_a; 
	geometry.cylinder( r1 , h , z , shape_a ); 
	geometry.add( shape_a ); 
	return geometry.currentIndex(); 
}

int ffi_circle(float r1) { 
	TopoDS_Shape shape_a; 
	geometry.circle( r1 ,shape_a ); 
	geometry.add( shape_a ); 
	return geometry.currentIndex(); 
}

int ffi_cone(float r1,float r2,float h,float z) { 
	TopoDS_Shape shape_a; 
	geometry.cone( r1 , r2 , h , z , shape_a ); 
	geometry.add( shape_a ); 
	return geometry.currentIndex(); 
}

int ffi_polyhedron(int **faces,float *points,int f_length) { 
	TopoDS_Shape shape_a; 
	geometry.polyhedron( faces , points , f_length , shape_a ); 
	geometry.add( shape_a ); 
	return geometry.currentIndex(); 
}

int ffi_difference(int indexA, int indexB) { 
	TopoDS_Shape shape_a; 
	TopoDS_Shape shape_b;
	geometry.get( indexA , shape_a ); 
	geometry.get( indexB , shape_b ); 
	geometry.difference( shape_a , shape_b ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

int ffi_union(int indexA, int indexB) { 
	TopoDS_Shape shape_a; 
	TopoDS_Shape shape_b;
	geometry.get( indexA , shape_a ); 
	geometry.get( indexB , shape_b ); 
	geometry.uni( shape_a , shape_b ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

int ffi_intersection(int indexA, int indexB) { 
	TopoDS_Shape shape_a; 
	TopoDS_Shape shape_b;
	geometry.get( indexA , shape_a ); 
	geometry.get( indexB , shape_b ); 
	geometry.intersection( shape_a , shape_b ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

int ffi_translate(float x , float y , float z , int indexA) { 
	TopoDS_Shape shape_a; 
	geometry.get( indexA , shape_a ); 
	geometry.translate( x , y , z , shape_a  ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

int ffi_scale(float x , float y , float z , int indexA) { 
	TopoDS_Shape shape_a; 
	geometry.get( indexA , shape_a ); 
	geometry.scale( x , y , z , shape_a  ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

int ffi_rotateX(float x , int indexA) { 
	TopoDS_Shape shape_a; 
	geometry.get( indexA , shape_a ); 
	geometry.rotateX( x , shape_a  ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

int ffi_rotateY(float y , int indexA) { 
	TopoDS_Shape shape_a; 
	geometry.get( indexA , shape_a ); 
	geometry.rotateY( y , shape_a  ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

int ffi_rotateZ(float z , int indexA) { 
	TopoDS_Shape shape_a; 
	geometry.get( indexA , shape_a ); 
	geometry.rotateZ( z , shape_a  ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

int ffi_extrude(float h1, int indexA) { 
	TopoDS_Shape shape_a; 
	geometry.get( indexA , shape_a ); 
	geometry.extrude( h1 , shape_a  ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

// ffi hook for minkowski
int ffi_minkowski(int indexA , int indexB ) { 
	TopoDS_Shape shape_a; 
	TopoDS_Shape shape_b;
	geometry.get( indexA , shape_a ); 
	geometry.get( indexB , shape_b ); 
	geometry.minkowski( shape_a , shape_b ); 
	geometry.set( indexA , shape_a ); 
	return indexA; 
}

#ifdef DEBUG
	int main() { 
	
		
		ffi_scale( 1.0 , 1.0 , 2.0 ,ffi_difference(
		   ffi_minkowski(
		   	ffi_cube(-25.0,-25.0,-25.0,50.0,50.0,50.0), 
		    ffi_sphere(25.0, 0.0 , 0.0 , 0.0)
		  ),
			ffi_translate( 0.0 , 0.0 , 50.0 , ffi_sphere(15.0,0.0,0.0,0.0))
		 )); 
		
		std::cout << ffi_convert_brep_tostring( 2 , 0.9 ); 

		//ffi_uni(
		//	ffi_minkowski(
		//  	ffi_box(-25.0,-25.0,-25.0,50.0,50.0,50.0), 
		//    ffi_sphere(25.0, 0.0 , 0.0 , 0.0)
		//  ),
		//	ffi_translate( 0.0 , 0.0 , -100.0 , ffi_cylinder(25.0,200.0,0.0))
		//);
	  //ffi_scale( 1.0 , 1.0 , 2.0 , ffi_sphere(25.0, 0.0 , 0.0 , 0.0) );*/
	 
	 return 0;  
	}
#endif
