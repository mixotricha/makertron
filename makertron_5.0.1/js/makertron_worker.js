
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
  importScripts("config.js"); 

  SERVER_ADDRESS = SERVER_ADDRESS + ":" + SERVER_PORT;
		
	// ============================================================
	// Generate three cube 
	// ============================================================
	var cube = function() {
		var msh = new THREE.BoxGeometry( 10, 10, 10 );
		return new THREE.Mesh(msh,new THREE.MeshNormalMaterial());
	}

	// =============================================================
	// Post results back from worker 
	// =============================================================
	var postResult = function(result) { 
			postLog('{"0":"Finished processing on server..."}') 
			postMessage({ type: 'result' , data: result })
			close()
	}

	// =============================================================
	// Post log results back from worker 
	// =============================================================
	var postLog = function(result) {
		postMessage( { type: 'log' , data: result } )
	}

	// =============================================================
	// Report errors from Worker
	// =============================================================
	var reportError = function() {
		postMessage( { type: 'error' , data: "Failed to connect to server\n" } )
	}

	// =============================================================
	// Report Heart Beat  
	// =============================================================
	var pulse = function() { 
		postMessage( { type: 'pulse' , data: "" } )
	}

	var close = function() { 
		postMessage( { type: 'close' , data: "" } )
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
			socket.send(  JSON.stringify({ 'type': 'OPENSCAD' , 'data' : script}) ) 
			socket.onmessage = function(event) {
				let message = JSON.parse(event['data']) 
				if ( message['type'] === 'OPENSCADRES' ) { postResult(message['data']); socket.close() }
				if ( message['type'] === 'OPENSCADLOG' ) { postLog(message['data'])    									}
				if ( message['type'] === 'PULSE'       ) { pulse();                    									}
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


