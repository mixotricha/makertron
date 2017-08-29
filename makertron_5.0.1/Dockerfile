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

# Install app dependencies
COPY package.json /usr/src/app/package.json
#RUN npm install
RUN npm update
# Bundle app source
COPY . /usr/src/app

# Build brep.so shared library. Note that we bundle a big chunk of OpenCascade here because 7.x is not available as a package yet. 
RUN apt-get -y install libcgal-dev 
RUN apt-get -y install libeigen3-dev
RUN apt-get -y install libboost-all-dev
WORKDIR /usr/src/app/brep_shared_lib
RUN make 
WORKDIR /usr/src/app

#RUN export DEBUG=*	
#EXPOSE 3000
#EXPOSE 80 

CMD [ "npm", "start" ]
