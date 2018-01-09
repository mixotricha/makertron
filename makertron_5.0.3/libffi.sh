 # Prepare X64+aarch64 node-ffi 

 git clone git://github.com/node-ffi/node-ffi.git
 cp libffi.diff node-ffi/deps/. 
 cd node-ffi/deps
 mv libffi oldffi 
 git clone git://github.com/libffi/libffi 
 cp oldffi/libffi.gyp libffi/. 
 rm -rf oldffi 
 mv libffi.diff libffi/. 
 cd libffi 
 patch < libffi.diff    
 ./autogen.sh 
 ./configure 
 make 
 mkdir config 
 cd config 
 mkdir linux
 cd linux

  mkdir arm64 
  cd arm64 
  cp ../../../../../../ffi.diff . 
  cp ../../../aarch64-unknown-linux-gnu/include/ffi.h . 
  cp ../../../aarch64-unknown-linux-gnu/fficonfig.h . 
  cp ../../../src/aarch64/ffitarget.h . 
  patch < ffi.diff 
  cd .. 

  mkdir x64 
	cd x64 
	cp ../../../../../../ffi2.diff . 
	cp ../../../x86_64-pc-linux-gnu/include/ffi.h .
	cp ../../../x86_64-pc-linux-gnu/fficonfig.h .   
  cp ../../../src/x86/ffitarget.h .
  patch < ffi2.diff 
  cd ../../../../../

 #node-gyp rebuild 


