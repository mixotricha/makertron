FROM ubuntu:xenial

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install packages 
RUN  apt-get --fix-missing update
RUN apt-get -y install nodejs
RUN apt-get -y install npm 
RUN apt-get -y install git
RUN ln -s /usr/bin/nodejs /usr/bin/node

# Install app npm deps
COPY package.json /usr/src/app/package.json
#RUN npm install
RUN npm update
RUN npm install --global webpack 
COPY . /usr/src/app
RUN ./build_webpack.sh

 # Install CGAL and OCE. Note that we bundle a big chunk of OpenCascade here because 7.x is not available as a package yet 
RUN apt-get -y install libcgal-dev 
RUN apt-get -y install libeigen3-dev
RUN apt-get -y install libboost-all-dev

# Build brep.so shared library
WORKDIR /usr/src/app/brep_shared_lib
RUN make 
RUN cp brep.so ../. 
RUN cp oce/lib/* /usr/lib
WORKDIR /usr/src/app

RUN export DEBUG=*	
EXPOSE 3000
EXPOSE 8080

CMD [ "npm", "start" ]
