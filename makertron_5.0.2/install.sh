
	# ----------------------------------------------
	# aarch64 node-ffi using aarch64 on Khadas Vim 
	# ----------------------------------------------

	sudo apt update -y 
	sudo apt upgrade -y 
  
	sudo apt install texinfo
	sudo apt install libtool 

	sudo apt -y install libcgal-dev
	sudo apt -y install libeigen3-dev
	sudo apt -y install libboost-all-dev

	sudo apt -y install doxygen 
	sudo apt -y install freetype*
	sudo apt -y install libfreetype*
	sudo apt -y install tk tcl
	sudo apt -y install tk8.5-dev tcl8.5-dev
	sudo apt -y install libgl-dev
	sudo apt -y install libxmu-dev
	sudo apt -y install libxi-dev

	# Some sort of random nonsense involving perl. 
	sudo apt -y install locales
	sudo locale-gen en_AU.UTF-8
	
	# More -garbage- involving locale + perl 
	sudo ln -s /usr/include/locale.h /usr/include/xlocale.h

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

	
