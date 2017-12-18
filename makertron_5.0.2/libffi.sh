
	# ----------------------------------------------
	# aarch64 node-ffi using aarch64 on Khadas Vim 
	# ----------------------------------------------

	apt update -y 
	apt upgrade -y 
  
  apt-get install texinfo
  apt install libtool 

	apt-get -y install libcgal-dev
	apt-get -y install libeigen3-dev
	apt-get -y install libboost-all-dev

	apt install doxygen 
	apt install freetype*
	apt install libfreetype*
	apt-get install tk tcl
	apt-get install tk8.5-dev tcl8.5-dev
	apt install libgl-dev
	apt install libxmu-dev
	apt install libxi-dev

	# Some sort of random nonsense involving perl. 
	apt-get -y install locales
	locale-gen en_AU.UTF-8
	
	# More -garbage- involving locale + perl 
	ln -s /usr/include/locale.h /usr/include/xlocale.h

	# -------------------------
	# Patch and build node-ffi  
	# -------------------------

	tar -zxvf ffi-patch.tar.gz 
	mv ffi_patch/* . 
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
  #cd .. 
  #mkdir x64 
	#cd x64 
	#cp ../../../../../../ffi2.diff . 
	#cp ../../../x86_64-pc-linux-gnu/include/ffi.h .
	#cp ../../../x86_64-pc-linux-gnu/fficonfig.h .   
  #cp ../../../src/x86/ffitarget.h .
  #patch < ffi2.diff 
  cd ../../../../../
  node-gyp rebuild 
	cd .. 
	move node-ffi node_modules 

	cd brep_shared_lib 
	cd oce 
	tar -zxvf xxx.xxx.tgz 
	cd xxx.xxx.xxx 
	cmake . 
	make 
	cp lin64/gcc/lib/* /usr/lib/. 

	cd ../.. 
	make
	cp brep.so ../. 
	cd .. 
	npm update 

	
