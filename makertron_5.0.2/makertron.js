
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

const ip = require("ip");
const async = require('async'); 
const express = require('express');
const app = express();
const WebSocket = require('ws');
const log = require('simple-node-logger').createSimpleLogger('project.log');
const child_process = require('child_process');

let VERSION        = "5.0.2"
let SLAVE 				 = true 
let SLAVE_PORT    = "3000"
let SLAVES         = ['localhost', '192.168.1.193']
let MASTER         = true
let MASTER_PORT    = "8080"  	
let MAX_CONN       = 4
let connections = 0; 

// Find out which slave machines are available to process a request
let available = function(i , callback ) { 
	let socket = new WebSocket('ws://'+SLAVES[i]+':'+SLAVE_PORT); 
	socket.on('error', (e)=> {
		socket.close()
		callback( null , null );  
	})
	socket.on('open', ()=> {
		socket.send( JSON.stringify( { type: 'AVAILABLE' }) ) 
		socket.on  ( 'message' , (str) => {
			let message = JSON.parse(str) 
			if ( message['type'] === 'ADDR' ) {	
				let data = message['data']; 
				if ( data !== null ) { callback(null,data) } else { callback(null,null) }  
				socket.close()
			}
		})
	}); 
}

// Machine the master runs on can also serve slaves  
let slave = (function () {
	if ( SLAVE === true ) { 
		log.info( "Makertron Starting slave Version: " + VERSION );
		const wss = new WebSocket.Server({ port: SLAVE_PORT });
			wss.on('connection', function connection(socket) {
				socket.on('message', (str) => { 
					let message = JSON.parse(str);  
					if ( message['type'] === 'AVAILABLE' ) { 
						if ( connections < MAX_CONN ) { 
							socket.send( JSON.stringify({ type: 'ADDR' ,  data: 'ws://'+ip.address()+':'+SLAVE_PORT }));
						}
						else { 
							socket.send( JSON.stringify({ type: 'ADDR' ,  data: null }));
						}
					}
					if ( message['type'] === 'OPENSCAD' ) { 
						connections++; 
						let forked = child_process.fork('./process_scad.js');
						let heartBeat = setInterval(() => { socket.send('{"type":"PULSE","data":""}'); }, 25000);
						forked.send(JSON.stringify({result: message['data']}))
						forked.on('message', (data) => { 
							data = JSON.parse(data); 
							if ( data['type'] === "log"     ) { socket.send(JSON.stringify({ type: 'OPENSCADLOG' ,  data: data['data']}));                 }
							if ( data['type'] === "objects" ) { socket.send(JSON.stringify({ type: 'OPENSCADRES' ,  data: data['data']})); socket.close(); }
						});
						socket.on('close', ()=>{
							log.info("Socket closed");  
							clearInterval(heartBeat); 
							forked.kill(); 
							connections--;
						})
					}
				}) 
		});
	}
}());

// Serve the front end 
let makertron_client = (function () {
	if ( MASTER === true ) { 
		app.listen(MASTER_PORT,function(){
			log.info('Client being served on port: ',MASTER_PORT);
		});
		app.use('/', express.static(__dirname));
		app.get("/js/client_config.js", function(req, res) {	// give the client the next available slave 								  
			async.parallel([
					available.bind(null,0), 
	 				available.bind(null,1) 
				], function(err,nodes) { 
					for ( let i = 0; i < nodes.length; i++ ) { 
						if ( err !== null ) { 
							log.info( err ) 
						}
						else {  
							if ( nodes[i]!==null) { 
								log.info("Handing out to " + nodes[i] )
								let config = '' 
								config+= 'VERSION = "'+VERSION+'"\n'
								config+= 'SERVER_ADDRESS = "'+nodes[i]+'"\n'  
								res.send(config); 
								break; 
							}  
						}
					}
			});		
	 	});
	}
}());



