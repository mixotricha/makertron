	/**
	 * @author qiao / https://github.com/qiao
	 * @author mrdoob / http://mrdoob.com
	 * @author alteredq / http://alteredqualia.com/
	 * @author WestLangley / http://github.com/WestLangley
	 * @author erich666 / http://erichaines.com
	 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe


module.exports = function OrbitControls(THREE,  object , container ) {  

		this.object = object
		this.container = container

		this.enabled = true;
		this.target = new THREE.Vector3();
		this.minDistance = 0;
		this.maxDistance = Infinity;
		this.minZoom = 0;
		this.maxZoom = Infinity;
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians
		this.minAzimuthAngle = - Infinity; // radians
		this.maxAzimuthAngle = Infinity; // radians
		this.enableDamping = false;
		this.dampingFactor = 0.25;
		this.enableZoom = true;
		this.zoomSpeed = 1.0;
		this.enableRotate = true;
		this.rotateSpeed = 1.0;
		this.enablePan = true;
		this.keyPanSpeed = 7.0;	// pixels moved per arrow key push
		this.autoRotate = false;
		this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60
		this.enableKeys = true;
		this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
		this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
		this.target0 = this.target.clone();
		this.position0 = this.object.position.clone();
		this.zoom0 = this.object.zoom;

		this.changeEvent = { type: 'change' };
		this.startEvent = { type: 'start' };
		this.endEvent = { type: 'end' };
		this.STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };
		this.state = this.STATE.NONE;
		this.EPS = 0.000001;
		this.spherical = new THREE.Spherical();
		this.sphericalDelta = new THREE.Spherical();
		this.scale = 1;
		this.panOffset = new THREE.Vector3();
		this.zoomChanged = false;
		this.rotateStart = new THREE.Vector2();
		this.rotateEnd = new THREE.Vector2();
		this.rotateDelta = new THREE.Vector2();
		this.panStart = new THREE.Vector2();
		this.panEnd = new THREE.Vector2();
		this.panDelta = new THREE.Vector2();
		this.dollyStart = new THREE.Vector2();
		this.dollyEnd = new THREE.Vector2();
		this.dollyDelta = new THREE.Vector2();

		//
		// public methods
		//

		this.getPolarAngle = function () { return this.spherical.phi; };

		this.getAzimuthalAngle = function () { return this.spherical.theta; };

		this.reset = function () {
			this.target.copy( this.target0 );
			this.object.position.copy( this.position0 );
			this.object.zoom = this.zoom0;
			this.object.updateProjectionMatrix();
			this.update();
			this.state = this.STATE.NONE;
		};

		// this method is exposed, but perhaps it would be better if we can make it private...
		this.update = function() {
			var offset = new THREE.Vector3();
			// so camera.up is the orbit axis
			var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
			var quatInverse = quat.clone().inverse();
			var lastPosition = new THREE.Vector3();
			var lastQuaternion = new THREE.Quaternion();
			return function update () {
				var position = this.object.position;
				offset.copy( position ).sub( this.target );
				// rotate offset to "y-axis-is-up" space
				offset.applyQuaternion( quat );
				// angle from z-axis around y-axis
				this.spherical.setFromVector3( offset );
				if ( this.autoRotate && this.state === this.STATE.NONE ) {
					this.rotateLeft( this.getAutoRotationAngle() );
				}
				this.spherical.theta += this.sphericalDelta.theta;
				this.spherical.phi += this.sphericalDelta.phi;
				// restrict theta to be between desired limits
				this.spherical.theta = Math.max( this.minAzimuthAngle, Math.min( this.maxAzimuthAngle, this.spherical.theta ) );
				// restrict phi to be between desired limits
				this.spherical.phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, this.spherical.phi ) );
				this.spherical.makeSafe();
				this.spherical.radius *= this.scale;
				// restrict radius to be between desired limits
				this.spherical.radius = Math.max( this.minDistance, Math.min( this.maxDistance, this.spherical.radius ) );
				// move target to panned location
				this.target.add( this.panOffset );
				offset.setFromSpherical( this.spherical );
				// rotate offset back to "camera-up-vector-is-up" space
				offset.applyQuaternion( quatInverse );
				position.copy( this.target ).add( offset );
				this.object.lookAt( this.target );
				if ( this.enableDamping === true ) {
					this.sphericalDelta.theta *= ( 1 - this.dampingFactor );
					this.sphericalDelta.phi *= ( 1 - this.dampingFactor );
				} else {
					this.sphericalDelta.set( 0, 0, 0 );
				}
				this.scale = 1;
				this.panOffset.set( 0, 0, 0 );
				// update condition is:
				// min(camera displacement, camera rotation in radians)^2 > this.EPS
				// using small-angle approximation cos(x/2) = 1 - x^2 / 8
				if ( this.zoomChanged ||
					lastPosition.distanceToSquared( this.object.position ) > this.EPS ||
					8 * ( 1 - lastQuaternion.dot( this.object.quaternion ) ) > this.EPS ) {
					lastPosition.copy( this.object.position );
					lastQuaternion.copy( this.object.quaternion );
					this.zoomChanged = false;
					return true;
				}
				return false;
			};
		}();


		this.getAutoRotationAngle = function() { return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed; }

		this.getZoomScale = function() { return Math.pow( 0.95, this.zoomSpeed ); }

		this.rotateLeft = function( angle ) { this.sphericalDelta.theta -= angle; }
		this.rotateUp = function( angle ) { this.sphericalDelta.phi -= angle; }

		this.panLeft = function() {
			var v = new THREE.Vector3();
			return function panLeft( distance, objectMatrix ) {
				v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
				v.multiplyScalar( - distance );
				this.panOffset.add( v );
			};
		}();

		this.panUp = function() {
			var v = new THREE.Vector3();
			return function panUp( distance, objectMatrix ) {
				v.setFromMatrixColumn( objectMatrix, 1 ); // get Y column of objectMatrix
				v.multiplyScalar( distance );
				this.panOffset.add( v );
			};
		}();

		// deltaX and deltaY are in pixels; right and down are positive
		this.pan = function() {
			var offset = new THREE.Vector3();
			return function pan ( deltaX, deltaY ) {
				// perspective
				var position = this.object.position;
				offset.copy( position ).sub( this.target );
				var targetDistance = offset.length();
				// half of the fov is center to top of screen
				targetDistance *= Math.tan( ( this.object.fov / 2 ) * Math.PI / 180.0 );
				// we actually don't use screenWidth, since perspective camera is fixed to screen height
				this.panLeft( 2 * deltaX * targetDistance / this.container.clientHeight, this.object.matrix );
				this.panUp( 2 * deltaY * targetDistance / this.container.clientHeight, this.object.matrix );
			};
		}();

		this.dollyIn = function( dollyScale ) { this.scale /= dollyScale; }

		this.dollyOut = function( dollyScale ) { this.scale *= dollyScale; }

		//
		// event callbacks - update the object this.state
		//

		this.handleMouseDownRotate = function( event ) { this.rotateStart.set( event.clientX, event.clientY ); }
		this.handleMouseDownDolly = function( event ) { this.dollyStart.set( event.clientX, event.clientY ); }
		this.handleMouseDownPan = function( event ) { this.panStart.set( event.clientX, event.clientY ); }

		this.handleMouseMoveRotate = function( event ) {
			this.rotateEnd.set( event.clientX, event.clientY );
			this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart );
			// rotating across whole screen goes 360 degrees around
			this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / this.container.clientWidth * this.rotateSpeed );
			// rotating up and down along whole screen attempts to go 360, but limited to 180
			this.rotateUp( 2 * Math.PI * this.rotateDelta.y / this.container.clientHeight * this.rotateSpeed );
			this.rotateStart.copy( this.rotateEnd );
			this.update();
		}

		this.handleMouseMoveDolly = function( event ) {
			this.dollyEnd.set( event.clientX, event.clientY );
			this.dollyDelta.subVectors( this.dollyEnd, this.dollyStart );
			if ( this.dollyDelta.y > 0 ) {
				this.dollyIn( this.getZoomScale() );
			} else if ( this.dollyDelta.y < 0 ) {
				this.dollyOut( this.getZoomScale() );
			}
			this.dollyStart.copy( this.dollyEnd );
			this.update();
		}

		this.handleMouseMovePan = function( event ) {
			this.panEnd.set( event.clientX, event.clientY );
			this.panDelta.subVectors( this.panEnd, this.panStart );
			this.pan( this.panDelta.x, this.panDelta.y );
			this.panStart.copy( this.panEnd );
			this.update();
		}

		this.handleMouseUp = function( event ) {}

		this.handleMouseWheel = function( event ) {
			if ( event.deltaY < 0 ) {
				this.dollyOut( this.getZoomScale() );
			} else if ( event.deltaY > 0 ) {
				this.dollyIn( this.getZoomScale() );
			}
			this.update();
		}

		//
		// touch event handlers 
		//
		
		this.handleTouchStartRotate = function( event ) { this.rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ); }

		this.handleTouchStartDolly = function( event ) {
			var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
			var distance = Math.sqrt( dx * dx + dy * dy );
			this.dollyStart.set( 0, distance );
		}

		this.handleTouchStartPan = function( event ) { this.panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ); }

		this.handleTouchMoveRotate = function( event ) {
			this.rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
			this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart );
			// rotating across whole screen goes 360 degrees around
			this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / this.container.clientWidth * this.rotateSpeed );
			// rotating up and down along whole screen attempts to go 360, but limited to 180
			this.rotateUp( 2 * Math.PI * this.rotateDelta.y / this.container.clientHeight * this.rotateSpeed );
			this.rotateStart.copy( this.rotateEnd );
			this.update();
		}

		this.handleTouchMoveDolly = function( event ) {
			var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
			var distance = Math.sqrt( dx * dx + dy * dy );
			this.dollyEnd.set( 0, distance );
			this.dollyDelta.subVectors( this.dollyEnd, this.dollyStart );
			if ( this.dollyDelta.y > 0 ) {
				this.dollyOut( this.getZoomScale() );
			} else if ( this.dollyDelta.y < 0 ) {
				this.dollyIn( this.getZoomScale() );
			}
			this.dollyStart.copy( this.dollyEnd );
			this.update();
		}

		this.handleTouchMovePan = function( event ) {
			this.panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
			this.panDelta.subVectors( this.panEnd, this.panStart );
			this.pan( panDelta.x, panDelta.y );
			this.panStart.copy( this.panEnd );
			this.update();
		}

		this.handleTouchEnd = function( event ) {}

		//
		// event handlers - FSM: listen for events and reset this.state
		//

		this.onMouseDown = function( event ) {
			if ( this.enabled === false ) return;
			event.preventDefault();
			if ( event.button === this.mouseButtons.ORBIT ) {
				if ( this.enableRotate === false ) return;
				this.handleMouseDownRotate( event );
				this.state = this.STATE.ROTATE;
			} else if ( event.button === this.mouseButtons.ZOOM ) {
				if ( this.enableZoom === false ) return;
				this.handleMouseDownDolly( event );
				this.state = this.STATE.DOLLY;
			} else if ( event.button === this.mouseButtons.PAN ) {
				if ( this.enablePan === false ) return;
				this.handleMouseDownPan( event );
				this.state = this.STATE.PAN;
			}
			if ( this.state !== this.STATE.NONE ) {
			}
		}

		this.onMouseMove = function( event ) {
			if ( this.enabled === false ) return;
			event.preventDefault();
			if ( this.state === this.STATE.ROTATE ) { 
				if ( this.enableRotate === false ) return;
				this.handleMouseMoveRotate( event );
			} else if ( this.state === this.STATE.DOLLY ) {
				if ( this.enableZoom === false ) return;
				this.handleMouseMoveDolly( event );
			} else if ( this.state === this.STATE.PAN ) {
				if ( this.enablePan === false ) return;
				this.handleMouseMovePan( event );
			}
		}

		this.onMouseUp = function( event ) {
			if ( this.enabled === false ) return;
			this.handleMouseUp( event );
			this.state = this.STATE.NONE;
		}

		this.onMouseWheel = function( event ) {
			if ( this.enabled === false || this.enableZoom === false || ( this.state !== this.STATE.NONE && this.state !== this.STATE.ROTATE ) ) return;
			event.preventDefault();
			event.stopPropagation();
			this.handleMouseWheel( event );
		}

		this.onTouchStart = function( event ) {
			if ( this.enabled === false ) return;
			switch ( event.touches.length ) {
				case 1:	// one-fingered touch: rotate
					if ( this.enableRotate === false ) return;
					this.handleTouchStartRotate( event );
					this.state = this.STATE.TOUCH_ROTATE;
					break;
				case 2:	// two-fingered touch: dolly
					if ( this.enableZoom === false ) return;
					this.handleTouchStartDolly( event );
					this.state = this.STATE.TOUCH_DOLLY;
					break;
				case 3: // three-fingered touch: pan
					if ( this.enablePan === false ) return;
					this.handleTouchStartPan( event );
					this.state = this.STATE.TOUCH_PAN;
					break;
				default:
					this.state = this.STATE.NONE;
			}
		}

		this.onTouchMove = function( event ) {
			if ( this.enabled === false ) return;
			event.preventDefault();
			event.stopPropagation();
			switch ( event.touches.length ) {
				case 1: // one-fingered touch: rotate
					if ( this.enableRotate === false ) return;
					if ( this.state !== this.STATE.TOUCH_ROTATE ) return; // is this needed?...
					this.handleTouchMoveRotate( event );
					break;
				case 2: // two-fingered touch: dolly
					if ( this.enableZoom === false ) return;
					if ( this.state !== this.STATE.TOUCH_DOLLY ) return; // is this needed?...
					this.handleTouchMoveDolly( event );
					break;
				case 3: // three-fingered touch: pan
					if ( this.enablePan === false ) return;
					if ( this.state !== this.STATE.TOUCH_PAN ) return; // is this needed?...
					this.handleTouchMovePan( event );
					break;
				default:
					this.state = this.STATE.NONE;
			}
		}

		this.onTouchEnd = function( event ) {
			if ( this.enabled === false ) return;
			this.handleTouchEnd( event );
			this.state = this.STATE.NONE;
		}

};

	

