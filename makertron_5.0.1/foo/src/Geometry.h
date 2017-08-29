class StlMesh_Mesh;
class TopoDS_Shape;

class Geometry { 
	public:
		Standard_EXPORT Geometry(); 
		
		std::vector<TopoDS_Shape> shapeStack; 

		Standard_EXPORT bool add(TopoDS_Shape shapeA);
		Standard_EXPORT bool get( int index , TopoDS_Shape &rShape);
		Standard_EXPORT bool set(int indexA , TopoDS_Shape shapeA);
		Standard_EXPORT int currentIndex(); 

		Standard_EXPORT bool circle(float r1,TopoDS_Shape &aShape);
		Standard_EXPORT bool polyhedron(int **faces,float *points,int f_length,TopoDS_Shape &aShape); 

		Standard_EXPORT bool sphere(float radius, float x , float y , float z , TopoDS_Shape &aShape );
		Standard_EXPORT bool cube(float x , float y , float z , float xs , float ys , float zs , TopoDS_Shape &aShape);
		Standard_EXPORT bool cone(float r1,float r2,float h,float z, TopoDS_Shape &aShape);
		Standard_EXPORT bool cylinder(float r1,float h,float z , TopoDS_Shape &aShape );
		
		Standard_EXPORT bool translate(float x , float y , float z , TopoDS_Shape &aShape);
		Standard_EXPORT bool scale(float x , float y , float z , TopoDS_Shape &aShape );
		Standard_EXPORT bool rotateX(float x , TopoDS_Shape &aShape);
		Standard_EXPORT bool rotateY(float y , TopoDS_Shape &aShape);
		Standard_EXPORT bool rotateZ(float z , TopoDS_Shape &aShape);
		
		Standard_EXPORT bool extrude(float h1, TopoDS_Shape &aShape);
		Standard_EXPORT bool minkowski(TopoDS_Shape &aShape,TopoDS_Shape bShape);

		Standard_EXPORT bool difference( TopoDS_Shape &aShape, TopoDS_Shape &bShape);
		Standard_EXPORT bool uni(TopoDS_Shape &aShape, TopoDS_Shape &bShape);
		Standard_EXPORT bool intersection(TopoDS_Shape &aShape,TopoDS_Shape &bShape);

	protected:
	private:
}; 
