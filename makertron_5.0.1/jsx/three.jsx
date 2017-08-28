
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

	// ------------------------------------------------------
	// Three Module 
	// ------------------------------------------------------

	'use strict'

	import React from 'react';
	import ReactDOM from 'react-dom';
	import THREE from '../js/three/three.js'

	var dark_primary_color  = "#303F9F" 
	var primary_width = '95vw' 
	var secondary_width = '94vw' 
	var canvas_width = '93.2vw'

	module.exports =  class ThreeComponent extends React.Component {
    
		constructor(props) {
    	super(props);
    	this.state = {data:[]};
			this.onMouseMove = this.onMouseMove.bind(this);
			this.onMouseUp = this.onMouseUp.bind(this);
			this.onMouseDown = this.onMouseDown.bind(this);
			this.onMouseWheel = this.onMouseWheel.bind(this);
  	}	

		// Setup the orbit control state 
		orbit_init() { 	
			// API
			this.enabled = true;
			this.center = new THREE.Vector3();
			this.userZoom = true;
			this.userZoomSpeed = 1.0;
			this.userRotate = true;
			this.userRotateSpeed = 1.0;
			this.userPan = true;
			this.userPanSpeed = 2.0;
			this.autoRotate = false;
			this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60
			this.minPolarAngle = 0; // radians
			this.maxPolarAngle = Math.PI; // radians
			this.minDistance = 0;
			this.maxDistance = Infinity;
			this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
			// internals
			this.scope = this;
			this.EPS = 0.000001;
			this.PIXELS_PER_ROUND = 1800;
			this.rotateStart = new THREE.Vector2();
			this.rotateEnd = new THREE.Vector2();
			this.rotateDelta = new THREE.Vector2();
			this.zoomStart = new THREE.Vector2();
			this.zoomEnd = new THREE.Vector2();
			this.zoomDelta = new THREE.Vector2();
			this.phiDelta = 0;
			this.thetaDelta = 0;
			this.scale = 1;
			this.lastPosition = new THREE.Vector3();
			this.STATE_WTF = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
			this.state_wtf = this.STATE_WTF.NONE;
			this.lastX = 0; 
			this.lastY = 0;
			// events
			this.changeEvent = { type: 'change' };
		}
		rotateLeft( angle  ) { if ( angle === undefined ) {	angle = this.getAutoRotationAngle(); } this.thetaDelta -= angle; }
		rotateRight( angle ) { if ( angle === undefined ) { angle = this.getAutoRotationAngle(); } this.thetaDelta += angle; }
		rotateUp( angle    ) { if ( angle === undefined ) { angle = this.getAutoRotationAngle(); } this.phiDelta -= angle;   }
		rotateDown( angle  ) { if ( angle === undefined ) { angle = this.getAutoRotationAngle(); } this.phiDelta += angle;   }
		zoomIn( zoomScale  ) { if ( zoomScale === undefined ) { zoomScale = this.getZoomScale(); } this.scale /= zoomScale;  }
		zoomOut( zoomScale ) { if ( zoomScale === undefined ) { zoomScale = this.getZoomScale(); } this.scale *= zoomScale;  }
		pan( distance ) {
			distance.transformDirection( this.camera.matrix );
			distance.multiplyScalar( this.userPanSpeed );
			this.camera.position.add( distance );
			this.center.add( distance );
		}
		getAutoRotationAngle() { return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed; }
		getZoomScale() { return Math.pow( 0.95, this.userZoomSpeed ); }
		// update orbit control
		orbit_update() {
			var position = this.camera.position;
			var offset = position.clone().sub( this.center );
			// angle from z-axis around y-axis
			var theta = Math.atan2( offset.x, offset.z );
			// angle from y-axis
			var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );
			if ( this.autoRotate ) {
				this.rotateLeft( this.getAutoRotationAngle() );
			}
			theta += this.thetaDelta;
			phi += this.phiDelta;
			// restrict phi to be between desired limits
			phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );
			// restrict phi to be betwee EPS and PI-EPS
			phi = Math.max( this.EPS, Math.min( Math.PI - this.EPS, phi ) );
			var radius = offset.length() * this.scale;
			// restrict radius to be between desired limits
			radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );
			offset.x = radius * Math.sin( phi ) * Math.sin( theta );
			offset.y = radius * Math.cos( phi );
			offset.z = radius * Math.sin( phi ) * Math.cos( theta );
			position.copy( this.center ).add( offset );
			this.camera.lookAt( this.center );
			this.thetaDelta = 0;
			this.phiDelta = 0;
			this.scale = 1;
			if ( this.lastPosition.distanceTo( this.camera.position ) > 0 ) {
				this.lastPosition.copy( this.camera.position );
			}
			this.render_scene()
		}
		// Mouse Movement
		onMouseMove(event) {
    	if ( this.enabled === false ) return;
			if ( this.state_wtf === this.STATE_WTF.ROTATE ) {
				this.rotateEnd.set( event.clientX, event.clientY );
				this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart );
				this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / this.PIXELS_PER_ROUND * this.userRotateSpeed );
				this.rotateUp( 2 * Math.PI * this.rotateDelta.y / this.PIXELS_PER_ROUND * this.userRotateSpeed );
				this.rotateStart.copy( this.rotateEnd );
				this.orbit_update()
			} else if ( this.state_wtf === this.STATE_WTF.ZOOM ) {
				this.zoomEnd.set( event.clientX, event.clientY );
				this.zoomDelta.subVectors( this.zoomEnd, this.zoomStart );
				if ( this.zoomDelta.y > 0 ) {
					this.zoomIn();
					this.orbit_update()
				} else {
					this.zoomOut();
					this.orbit_update()
				}
				this.zoomStart.copy( this.zoomEnd );
			} else if ( this.state_wtf === this.STATE_WTF.PAN ) {
				var movementX = event.clientX + this.lastX
				var movementY = event.clientY + this.lastY 
				//var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
				//var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
				//console.log( movementX , movementY ) 
				this.pan( new THREE.Vector3( - movementX, movementY, 0 ) );
				this.orbit_update()
				this.lastX = movementX
				this.lastY = movementY  
			}
  	}
		// On mouse click down 
		onMouseDown(event) {
    	if ( this.enabled === false ) return;
			if ( this.userRotate === false ) return;
			if ( event.button === 0 ) {
				this.state_wtf = this.STATE_WTF.ROTATE;
				this.rotateStart.set( event.clientX, event.clientY );
			} else if ( event.button === 1 ) {
					this.state_wtf = this.STATE_WTF.ZOOM;
					this.zoomStart.set( event.clientX, event.clientY );
			} else if ( event.button === 2 ) {
					this.state_wtf = this.STATE_WTF.PAN;
			}
  	}
		onMouseUp(event) {
			if ( this.enabled === false ) return;
			if ( this.userRotate === false ) return;
			this.state_wtf = this.STATE_WTF.NONE;
		}
		onMouseWheel( event ) {
			event.preventDefault()
			if ( this.enabled === false ) return;
			if ( this.userZoom === false ) return;
			if ( event.deltaY < 0 ) {
				this.zoomOut();
				this.orbit_update()
			} else {
				this.zoomIn();
				this.orbit_update()
			}
		}
		onTouchStart(event) { 
			if ( this.enabled === false ) return;
			if ( this.userRotate === false ) return;
			this.state_wtf = this.STATE_WTF.ROTATE;
			this.rotateStart.set( event.touches[0].clientX, event.touches[0].clientY );
		}
		onTouchEnd(event) { 
			if ( this.enabled === false ) return;
			if ( this.userRotate === false ) return;
			this.state_wtf = this.STATE_WTF.NONE;
		}
		onTouchMove(event) { 
			event.preventDefault()
			if ( this.enabled === false ) return;
			if ( this.state_wtf === this.STATE_WTF.ROTATE ) {
				this.rotateEnd.set( event.touches[0].clientX, event.touches[0].clientY );
				this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart );
				this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / this.PIXELS_PER_ROUND * this.userRotateSpeed );
				this.rotateUp( 2 * Math.PI * this.rotateDelta.y / this.PIXELS_PER_ROUND * this.userRotateSpeed );
				this.rotateStart.copy( this.rotateEnd );
				this.orbit_update()
			} 
		} 
		init_scene() {
			this.container = document.getElementById("three_canvas");
			this.width = this.container.clientWidth; 
			this.height = this.container.clientHeight; 
			this.renderer = new THREE.WebGLRenderer( { antialias: true , alpha: true } );
			this.renderer.setSize( this.width, this.height );
			this.renderer.sortObjects = true;
			this.renderer.setClearColor( 0xff0000 , 0); // the default
			this.renderer.shadowMap.enabled = true;
			this.camera = new THREE.PerspectiveCamera( 45 , this.width / this.height, 1, 10000 );
			this.camera.position.set( 400,400 , 400 ); 
			this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
			this.orbit_init()
			this.scene = new THREE.Scene(); 	
			this.container.appendChild( this.renderer.domElement ); // bind to the container element 
		}
		resize_scene() { 
			var container = document.getElementById("three_canvas");
			var width = container.clientWidth; 
			var height = container.clientHeight; 
			this.renderer.setSize( width , height );
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();
		}
		render_scene() { // Render out to canvas 
			this.resize_scene(); 
			this.renderer.render( this.scene, this.camera );
		}
		lights() { 
			this.scene.add( new THREE.AmbientLight( 0xffffff ) );
			var back_light = new THREE.SpotLight( 0xefefef, 0.2 );
			back_light.position.set( 0, 0, -500 );
			back_light.castShadow = true;
			back_light.shadow.camera.near = 200;
			back_light.shadow.camera.far = this.camera.far;
			back_light.shadow.camera.fov = 50;
			back_light.shadow.bias = -0.00022;
			back_light.shadow.darkness = 0.5;
			this.scene.add(back_light);	
		
			var front_light = new THREE.SpotLight( 0xefefef, 0.3 );
			front_light.position.set( 0, 0, 500 );
			front_light.castShadow = true;
			front_light.shadow.camera.near = 200;
			front_light.shadow.camera.far = this.camera.far;
			front_light.shadow.camera.fov = 50;
			front_light.shadow.bias = -0.00022;
			front_light.shadow.darkness = 0.5;
			this.scene.add(front_light);	
	
		}
		radians (deg) { 
			return deg * (Math.PI / 180); 
		}  

		createObject(geoBuffer) {
			var i = 0, f = 0 , vertices = [] , normals = [] , colors = [] , data , data_length  
			var geoBufferLength = geoBuffer.length-1
			
			// No normals 
			//0,2,1,3,5,4,6,8,7
			//a,b,c,a,b,c,a,b,c

			for ( i = 0; i < geoBufferLength; i+=9 ) {
				vertices.push( 
					geoBuffer[i+0] , geoBuffer[i+2] , geoBuffer[i+1] , 
					geoBuffer[i+3] , geoBuffer[i+5] , geoBuffer[i+4] , 
					geoBuffer[i+6] , geoBuffer[i+8] , geoBuffer[i+7] 
				) 
			}				 
			vertices =  new Float32Array(vertices)
			var geometry = new THREE.BufferGeometry();
			geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
			geometry.computeBoundingSphere()			
			geometry.computeVertexNormals()

			var msh = [] 
			var material = new THREE.MeshPhongMaterial({ color: 0x303F9F,specular: 0xffffff , shininess: 1, side: THREE.DoubleSide })
			msh.push( new THREE.Mesh( geometry, material ))

			//var materials = [ new THREE.MeshPhongMaterial({ color: 0x48473e,specular: 0xffffff , shininess: 1, side: THREE.DoubleSide }),
			//								  new THREE.MeshBasicMaterial({ color: 0x000000, shading: THREE.FlatShading, wireframe: true, transparent: true } )]
			//var obj = THREE.SceneUtils.createMultiMaterialObject( geometry, materials );

			var edges = new THREE.EdgesGeometry( geometry );
			var lines = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0xffffff , linewidth: 2 } ) );
			msh.push(lines) 

			return msh
		}

		update_scene() { 	
			var _this = this
			var i = 0 
			// Scene defaults
			this.scene = new THREE.Scene(); 
			this.lights(); 		
			
			var geometry = new THREE.PlaneGeometry( 5000, 5000 );
			var material = new THREE.MeshLambertMaterial({side: THREE.DoubleSide, color: 0x0000ff, transparent: true, opacity: 0.2});
			var plane = new THREE.Mesh( geometry, material );
			plane.receiveShadow  = true;
			plane.rotation.set( this.radians(90) , 0, 0 )
			plane.position.set( 0 , -500 , 0 );  
			this.scene.add( plane );

			var size = 400;
			var divisions = 5;
			var gridHelper_a = new THREE.GridHelper( size, divisions , 0x718EA4  , 0x718EA4 );
			this.scene.add( gridHelper_a );

			var size = 400;
			var divisions = 40;
			var gridHelper_b = new THREE.GridHelper( size, divisions , 0x123652 , 0x123652 );
			this.scene.add( gridHelper_b );
	
			var axisHelper = new THREE.AxisHelper( 400 );
			this.scene.add( axisHelper );			

			for ( i = 0; i < this.props.data.length; i++ ) { 
				var msh =  this.createObject(JSON.parse(this.props.data[i])) 
				this.scene.add( msh[0] ) 
				this.scene.add( msh[1] )  	
			}		
		}

		componentWillMount() { 
		}
		componentDidMount() { 
			this.init_scene()
			this.update_scene() 			
			this.orbit_update()
		}
		componentDidUpdate() { 	
			this.update_scene() 			
			this.orbit_update()
		}
		render() {
    	return (
      	<div 
							id="three_canvas" 
							style={{'width': canvas_width ,'height':'88vh','background':dark_primary_color}}  
							onMouseMove={this.onMouseMove}
							onMouseDown={this.onMouseDown}
							onMouseUp={this.onMouseUp}
							onWheel={this.onMouseWheel}
							onTouchMove={this.onTouchMove}
							onTouchStart={this.onTouchStart}
							onTouchEnd={this.onTouchEnd}
			 />
    	);
  	}
	}
