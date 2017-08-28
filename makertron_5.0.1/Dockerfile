FROM ubuntu:xenial

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install packages 
run apt-get --fix-missing update
RUN apt-get -y install nodejs
RUN apt-get -y install npm 
RUN ln -s /usr/bin/nodejs /usr/bin/node

# Install app dependencies
COPY package.json /usr/src/app/package.json
#RUN npm install
RUN npm update
# Bundle app source
COPY . /usr/src/app

# Build Open Cascade ... why doesn't it have a package .. where the heck is the package ?!?! 

#COPY brep.so /usr/src/app

# Install Opencascade libaries 
#RUN mkdir -p /home/mixotricha/workspace/opencascade-7.1.0/lin64/gcc/lib/
#RUN mv lib/* /home/mixotricha/workspace/opencascade-7.1.0/lin64/gcc/lib/

# Install CGAL libraries 
#RUN apt-get -y install libcgal-dev 

#RUN export DEBUG=*	
#EXPOSE 3000
#EXPOSE 80 

CMD [ "npm", "start" ]
