
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
	importScripts('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js')  
	importScripts('core/lodash.min.js') 

	 // Pull server address here because no dom for sessionKeys 
  importScripts("config.js"); 

  SERVER_ADDRESS = SERVER_ADDRESS + ":" + SERVER_PORT;
	var socket
	
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
			socket.emit( 'close'               , ""  ) // we are done close socket 
	}

	// =============================================================
	// Post log results back from worker 
	// =============================================================
	var postLog = function(result) {
		postMessage( { type: 'log' , data: arguments[0] } )
	}

	// =============================================================
	// Report errors from Worker
	// =============================================================
	var reportError = function() {
		postMessage( { type: 'error' , data: "Failed to connect to server\n" } )
		socket.close()
	}

	// =============================================================
	// Report Heart Beat  
	// =============================================================
	var pulse = function() { 
		postMessage( { type: 'pulse' , data: "" } )
	}

	var close = function() { 
		postMessage({ type: 'close' , data: "" })
	}

	// =============================================================
	// Fetch The Geometry   
	// =============================================================	
	var fetchGeometry = function(script) {  
			
			 
			socket = io(SERVER_ADDRESS,{ 'connect timeout': 5000 })
			
			socket.error
			socket.emit( 'OPENSCAD'               , {script:script}  ) // send script
			socket.on  ( 'OPENSCADRES'            , postResult       )  
			socket.on  ( 'OPENSCADLOG'            , postLog          )  
			socket.on  ( 'connection_refused'     , reportError      ) 
			socket.on  ( 'PULSE'                  , pulse            )
		  socket.on  ( 'close'                  , close            )
			socket.on  ( 'error'                  , reportError      ) 
			socket.on  ( 'connect_failed'         , reportError      )
			socket.on  ( 'reconnect_failed'       , reportError      )
			socket.on  ( 'connect_error'          , reportError      )
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
