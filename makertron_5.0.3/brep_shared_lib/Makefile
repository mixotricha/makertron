
CXX=g++
DEFINES= -DCGAL_EIGEN3_ENABLED -DCGAL_USE_GMP -DCGAL_USE_MPFR

CXXFLAGS = -O3 -std=gnu++11 -frounding-math -m64 -shared -fPIC -DCGAL_EIGEN3_ENABLED -DCGAL_USE_GMP -DCGAL_USE_MPFR 
TARGET=brep.so

#CXXFLAGS= -std=gnu++11 -frounding-math -m64 -fPIC  
#TARGET=brep

OC_INCL_DIR=$(OCE_PATH)/inc
OC_LIB_DIR=$(OCE_PATH)/lin64/gcc/lib

OC_LIB=-lTKOpenGl -lTKernel -lTKGeomBase -lTKTopAlgo -lTKOffset -lTKBool -lTKPrim -lTKFillet -lTKMath -lTKService -lTKV3d -lTKIGES -lTKSTL -lTKVRML -lTKSTEP -lTKG3d -lTKG2d -lTKXSBase -lTKShHealing -lTKBO -lTKBRep -lTKMesh 

BOOST_LIBS=-lboost_iostreams -lboost_system -lboost_chrono -lboost_date_time -lboost_atomic -lboost_thread

CGAL_INCL_DIR=/usr/local/include/CGAL
#CGAL_LIB_DIR =/usr/local/lib

CGAL_LIB_DIR =/usr/lib/x86_64-linux-gnu

CGAL_LIB=-lGGAL 

INCLUDES = -I. -I./src \
-I/usr/include/eigen3 \
-I/usr/lib/x86_64-linux-gnu/glib-2.0/include \
-I$(OC_INCL_DIR) 
	  
LIBS = -L/usr/local/lib -ldl -lm -lz -lmpfr -lgmp -lpthread \
-Wl,-rpath,$(OC_LIB_DIR) -L$(OC_LIB_DIR) $(OC_LIB) \
-Wl,-rpath,$(CGAL_LIB_DIR) -L$(CGAL_LIB_DIR) -lCGAL \
$(BOOST_LIBS) 

SRC = ./src/ReadWrite.cpp ./src/PrintUtils.cc ./src/BrepCgal.cpp ./src/Geometry.cc ./src/brep.cpp
		
first: shared

shared:	
	$(CXX) $(SRC) $(CXXFLAGS) -o $(TARGET) $(DEFINES) $(INCLUDES) $(LIBS) 



