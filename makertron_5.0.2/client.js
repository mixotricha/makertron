
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

"use strict";   
/*global require,console,__dirname,VERSION,SERVER_PORT,CLIENT_PORT*/
/*jshint -W069 */
/*jslint node: true */

const fetchUrl = require("fetch").fetchUrl;
const WebSocket = require('ws');
let counter = 0; 

	// --------------------------------------------------------
	// Generate a hashed string
	// --------------------------------------------------------
	let makeId = function() {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for( var i=0; i < 5; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}

	// =============================================================
	// Post results back from worker 
	// =============================================================
	let postResult = function(result) { 
			console.log( 'finished' ) 			
	}

	// =============================================================
	// Post log results back from worker 
	// =============================================================
	let postLog = function(result) {
		//console.log( 'log',result )
	}

	// =============================================================
	// Report errors from Worker
	// =============================================================
	let reportError = function(result) {
		console.log('error' )
	}

	// =============================================================
	// Report Heart Beat  
	// =============================================================
	let pulse = function() { 
		console.log('pulse')
	}
	
	// =============================================================
	// Fetch The Geometry   
	// =============================================================	
	let fetchGeometry = function(ip,script) {  
			console.log("Fetching from: " + ip ) 
			const socket = new WebSocket(ip+':3000');
			socket.on('open', ()=> {
	 			console.log( 'started client' ) 
				socket.send( JSON.stringify( { type: 'OPENSCAD' , data : script}) ) 
				socket.on  ( 'message' , (str) => {
					let message = JSON.parse(str) 
					if ( message['type'] === 'OPENSCADRES' ) { postResult(message['data']); socket.close() }
					if ( message['type'] === 'OPENSCADLOG' ) { postLog(message['data'])    }
					if ( message['type'] === 'PULSE'       ) { pulse();                    }
				}) 
			}); 
	}



	

	let i = 0; 
	let script = 'this.foo = function(){for( var x=0;x<=50;x+=10) {for(var y=0;y<=50;y+=10) {for(var z=0;z<=50;z+=10) {this.translate({arg0:[x,y,z]});this.cube({size:5});this.stack_decrement(1);}}} this.minkowski(); this.cube({size:50/2,center:true}); this.sphere({r:25/2}); this.cylinder({r1:30/2,r2:5/2,h:100/2});this.minkowski_end();}'

	//for ( i = 0; i < 5; i++ ) { 
	//	fetchUrl("http://makertron.io/js/client_config.js", function(error, meta, body){
			// Quick and ugly string mash 
	//	  let ip = body.toString();
	//		ip = ip.split('\n')
	//		ip=ip[1].split("=")
	//		ip = ip[1].replace(" ","")
	//		ip = ip.replace("\"","")
	//		ip = ip.replace("\"","")
	//		console.log( ip ) 
			let ip = '203.222.144.52' 
			fetchGeometry( 'ws://'+ip , script )
	//	});
	//}
