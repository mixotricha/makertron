
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

var csgProcess = (function () {
  
	"use strict";

 /*global $,widgets,window,CSG,document,makertron*/
 /*jshint -W069 */

	importScripts('three/three.js');
	importScripts('core/lodash.min.js') 

	// Pull server address here because no dom for sessionKeys 
  importScripts("client_config.js"); 


	// ============================================================
	// Generate three cube 
	// ============================================================
	var testGeometry = function() {
		var triangles = 5000;
		var geometry = new THREE.BufferGeometry();
		var positions = new Float32Array( triangles * 3 * 3 );
		var normals = new Float32Array( triangles * 3 * 3 );
		var colors = new Float32Array( triangles * 3 * 3 );
		var color = new THREE.Color();
		var n = 800, n2 = n/2;	// triangles spread in the cube
		var d = 120, d2 = d/2;	// individual triangle size
		var pA = new THREE.Vector3();
		var pB = new THREE.Vector3();
		var pC = new THREE.Vector3();
		var cb = new THREE.Vector3();
		var ab = new THREE.Vector3();
		for ( var i = 0; i < positions.length; i += 9 ) {
			// positions
			var x = Math.random() * n - n2;
			var y = Math.random() * n - n2;
			var z = Math.random() * n - n2;
			var ax = x + Math.random() * d - d2;
			var ay = y + Math.random() * d - d2;
			var az = z + Math.random() * d - d2;
			var bx = x + Math.random() * d - d2;
			var by = y + Math.random() * d - d2;
			var bz = z + Math.random() * d - d2;
			var cx = x + Math.random() * d - d2;
			var cy = y + Math.random() * d - d2;
			var cz = z + Math.random() * d - d2;
			positions[ i ]     = ax;
			positions[ i + 1 ] = ay;
			positions[ i + 2 ] = az;
			positions[ i + 3 ] = bx;
			positions[ i + 4 ] = by;
			positions[ i + 5 ] = bz;
			positions[ i + 6 ] = cx;
			positions[ i + 7 ] = cy;
			positions[ i + 8 ] = cz;
			// flat face normals
			pA.set( ax, ay, az );
			pB.set( bx, by, bz );
			pC.set( cx, cy, cz );
			cb.subVectors( pC, pB );
			ab.subVectors( pA, pB );
			cb.cross( ab );
			cb.normalize();
			var nx = cb.x;
			var ny = cb.y;
			var nz = cb.z;
			normals[ i ]     = nx;
			normals[ i + 1 ] = ny;
			normals[ i + 2 ] = nz;
			normals[ i + 3 ] = nx;
			normals[ i + 4 ] = ny;
			normals[ i + 5 ] = nz;
			normals[ i + 6 ] = nx;
			normals[ i + 7 ] = ny;
			normals[ i + 8 ] = nz;
			// colors
			var vx = ( x / n ) + 0.5;
			var vy = ( y / n ) + 0.5;
			var vz = ( z / n ) + 0.5;
			color.setRGB( vx, vy, vz );
			colors[ i ]     = color.r;
			colors[ i + 1 ] = color.g;
			colors[ i + 2 ] = color.b;
			colors[ i + 3 ] = color.r;
			colors[ i + 4 ] = color.g;
			colors[ i + 5 ] = color.b;
			colors[ i + 6 ] = color.r;
			colors[ i + 7 ] = color.g;
			colors[ i + 8 ] = color.b;
		}
		geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
		geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
		geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
		geometry.computeBoundingSphere();
		return geometry; 
	}

	// =============================================================
	// Post results back from worker 
	// =============================================================
	var postResult = function(result) { 
			postLog('Finished processing on server...')
			postMessage(JSON.stringify({ type: 'result' , data: result }))
			close()
	}

	// =============================================================
	// Post log results back from worker 
	// =============================================================
	var postLog = function(result) {
		postMessage( JSON.stringify({ type: 'log' , data: result }))
	}

	// =============================================================
	// Report errors from Worker
	// =============================================================
	var reportError = function() {
		postMessage(JSON.stringify({ type: 'error' , data: "Failed to connect to server\n" }));
	}

	// =============================================================
	// Report Heart Beat  
	// =============================================================
	var pulse = function() { 
		postMessage(JSON.stringify({ type: 'pulse' , data: "" }));
	}

	var close = function() { 
		postMessage(JSON.stringify({ type: 'close' , data: "" }));
	}

	// --------------------------------------------------------
	// Generate a hashed string
	// --------------------------------------------------------
	var makeId = function() {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for( var i=0; i < 5; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}


	// =============================================================
	// Fetch The Geometry   
	// =============================================================	
	var fetchGeometry = function(script) {  
		let socket = new WebSocket(SERVER_ADDRESS);

		socket.onopen = function() { 
			console.log( script ) 
			socket.send(  JSON.stringify({ 'type': 'OPENSCAD' , 'data' : script}) ) 
			socket.onmessage = function(event) {
				let message = JSON.parse(event['data']) 
				if ( message['type'] === 'OPENSCADRES' ) { postResult(message['data']); socket.close();  }
				if ( message['type'] === 'OPENSCADLOG' ) { postLog(message['data'])    									 }
				if ( message['type'] === 'PULSE'       ) { pulse();                    									 }
				if ( message['type'] === 'NEXT'        ) { console.log( "next!");                        }
			} 
		}; 

		socket.close = function() { 
			console.log("closed")
			close(); 
		}

	}
	
	// Output our scene to the renderer 
	onmessage = function(e) {
	  fetchGeometry(e['data'])    
	}
  
	return {
		onmessage: function(e) { 
			onmessage(e); 
		}
	};
 
}());


