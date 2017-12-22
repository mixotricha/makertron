
	# ----------------------------------------------
	# Configure and install Makertron  
	# ----------------------------------------------

	#!/bin/bash

	MAKERTRON_TARGET=("X86" "ARM")

	MAKERTRON_TARGET_LEN=${#MAKERTRON_TARGET[@]}

	TARGET=

	###############################################################
	## Choose target. We are taking responsibility for this because
	## node-ffi does not yet support arm as a target by default.  

	function choose_TARGET() {
		echo ""
		echo "Choose a Makertron Target:"
		i=0
		while [[ $i -lt $MAKERTRON_TARGET_LEN ]]
		do
			echo "$((${i}+1)). ${MAKERTRON_TARGET[$i]}"
			let i++
		done

		echo ""

		local DEFAULT_NUM
		DEFAULT_NUM=1

		export TARGET=
		local ANSWER
		while [ -z $TARGET ]
		do
			echo -n "Which target? ["$DEFAULT_NUM"] "
			if [ -z "$1" ]; then
				read ANSWER
			else
				echo $1
				ANSWER=$1
			fi

			if [ -z "$ANSWER" ]; then
				ANSWER="$DEFAULT_NUM"
			fi

			if [ -n "`echo $ANSWER | sed -n '/^[0-9][0-9]*$/p'`" ]; then
				if [ $ANSWER -le $MAKERTRON_TARGET_LEN ] && [ $ANSWER -gt 0 ]; then
					index=$((${ANSWER}-1))
					TARGET="${MAKERTRON_TARGET[$index]}"
				else
					echo
					echo "number not in range. Please try again."
					echo
				fi
			else
				echo
				echo "I didn't understand your response.  Please try again."
				echo
			fi
			if [ -n "$1" ]; then
				break
			fi
		done
	}

	sudo apt update -y 
	sudo apt upgrade -y 
  
	sudo apt -y install texinfo
	sudo apt -y install libtool 

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
	sudo apt -y install autoconf 
	sudo apt -y install cmake 

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

	if [ $TARGET = "X86" ]; then 
  	mkdir x64 
		cd x64 
		cp ../../../../../../ffi2.diff . 
		cp ../../../x86_64-pc-linux-gnu/include/ffi.h .
		cp ../../../x86_64-pc-linux-gnu/fficonfig.h .   
  	cp ../../../src/x86/ffitarget.h .
  	patch < ffi2.diff 
	fi 

	if [ $TARGET = "ARM" ]; then 
		mkdir arm64 
  	cd arm64 
  	cp ../../../../../../ffi.diff . 
  	cp ../../../aarch64-unknown-linux-gnu/include/ffi.h . 
  	cp ../../../aarch64-unknown-linux-gnu/fficonfig.h . 
  	cp ../../../src/aarch64/ffitarget.h . 
  	patch < ffi.diff 
	fi 

  cd ../../../../../../../
	
	npm update
	mv node-ffi node_modules 

	#cd node_modes/node-ffi 
  #node-gyp rebuild 

	#cd ../../brep_shared_lib 
	#tar -zxvf opencascade-7.1.0.tgz 
	#cd opencascade-7.1.0 
	#cmake . 
	#make 
	#cp lin64/gcc/lib/* /usr/lib/. 
	#cd .. 
	#make  
	
	

	
###############################################################
## Choose Khadas board
function choose_TARGET() {
	echo ""
	echo "Choose a Makertron Target:"
	i=0
	while [[ $i -lt $MAKERTRON_TARGET_LEN ]]
	do
		echo "$((${i}+1)). ${MAKERTRON_TARGET[$i]}"
		let i++
	done

	echo ""

	local DEFAULT_NUM
	DEFAULT_NUM=1

	export TARGET=
	local ANSWER
	while [ -z $TARGET ]
	do
		echo -n "Which target? ["$DEFAULT_NUM"] "
		if [ -z "$1" ]; then
			read ANSWER
		else
			echo $1
			ANSWER=$1
		fi

		if [ -z "$ANSWER" ]; then
			ANSWER="$DEFAULT_NUM"
		fi

		if [ -n "`echo $ANSWER | sed -n '/^[0-9][0-9]*$/p'`" ]; then
			if [ $ANSWER -le $MAKERTRON_TARGET_LEN ] && [ $ANSWER -gt 0 ]; then
				index=$((${ANSWER}-1))
				TARGET="${MAKERTRON_TARGET[$index]}"
			else
				echo
				echo "number not in range. Please try again."
				echo
			fi
		else
			echo
			echo "I didn't understand your response.  Please try again."
			echo
		fi
		if [ -n "$1" ]; then
			break
		fi
	done
}


#####################################################################3
choose_TARGET
if [ $TARGET = "X86" ]; then 
	echo $TARGET 
fi 


	sudo apt update -y 
	sudo apt upgrade -y 
  
	sudo apt -y install texinfo
	sudo apt -y install libtool 

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
	sudo apt -y install autoconf 
	sudo apt -y install cmake 

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


  cd ../../../../../../../
	npm update
	mv node-ffi node_modules 
	cd node_modes/node-ffi 
  node-gyp rebuild 

	#cd ../../brep_shared_lib 
	#tar -zxvf opencascade-7.1.0.tgz 
	#cd opencascade-7.1.0 
	#cmake . 
	#make 
	#cp lin64/gcc/lib/* /usr/lib/. 
	#cd .. 
	#make  
	
	

	
