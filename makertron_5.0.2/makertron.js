
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

const VERSION        = "5.0.2"

const ip = require("ip");
const async = require('async'); 
const express = require('express');
const app = express();
const WebSocket = require('ws');
const log = require('simple-node-logger').createSimpleLogger('project.log');
const child_process = require('child_process');

let config = JSON.parse(fs.readFileSync('config.jsn', 'utf8'));

const SLAVE 				 = config['SLAVE'] 
const SLAVE_PORT     = config['SLAVE_PORT']
const SLAVES         = config['SLAVES'] 
const MASTER         = config[['MASTER'] 
const MASTER_PORT    = config[['MASTER_PORT']  	
const MAX_CONN       = config['MAX_CONN']

let connections = 0; 

// Find out which slave machines are available to process a request
let available = function(i , callback ) { 
	let socket = new WebSocket('ws://'+SLAVES[i]); 
	socket.on('open', ()=> {
		socket.send( JSON.stringify( { type: 'AVAILABLE' }) ) 
		socket.on  ( 'message' , (str) => {
			let message = JSON.parse(str) 
			if ( message['type'] === 'ADDR' ) {	
				let data = message['data']; 
				if ( data !== null ) { callback(null,SLAVES[i]) } else { callback(null,null) }  
				socket.close()
			}
		})
		socket.on( 'error' , (e) => {
			socket.close()
			callback( "Socket Failure: "+e , null ) 
		})
	})
	socket.on( 'error' , (e) => {
		socket.close()
		callback( "Socket Failure: "+e , null ) 		
	})
}

// Machine the master runs on can also serve slaves  
let slave = (function () {
	if ( SLAVE === true ) { 
		log.info( "Makertron Starting slave Version: " + VERSION + " On Port " + SLAVE_PORT );
		let wss = new WebSocket.Server({ port: SLAVE_PORT });
		wss.on('connection', function connection(socket) {
				//let heartBeat = setInterval(() => { 
				//		if ( socket.readyState === socket.OPEN ) { socket.send('{"type":"PING","data":""}');  } 
				//}, 5000);
				socket.on('message', (str) => { 
					let message = JSON.parse(str);  
					if ( message['type'] === 'AVAILABLE' ) { 
						if ( connections < MAX_CONN ) { 
							socket.send( JSON.stringify({ type: 'ADDR' ,  data: true }));
						}
						else { 
							socket.send( JSON.stringify({ type: 'ADDR' ,  data: null }));
						}
					}
					if ( message['type'] === 'OPENSCAD' ) { 
						connections++;
						let forked = child_process.fork('./process_scad.js');
						forked.send(JSON.stringify({result: message['data']}))
						forked.on('message', (data) => { 
							data = JSON.parse(data); 
							if ( data['type'] === "log"     ) { socket.send(JSON.stringify({ type: 'OPENSCADLOG' ,  data: data['data']}));                 }
							if ( data['type'] === "objects" ) { 
								socket.send(JSON.stringify({ type: 'OPENSCADRES' ,  data: data['data']})); 
								forked.kill(); 
								connections--;	
								socket.close(); 
							}
						});
					}
				}) 
			socket.on('close', ()=>{
				log.info("Socket closed");  
				//clearInterval(heartBeat); 
			})
			socket.on('error', ()=>{
					log.info("Socket Error");  
			})
	});
}
}());


// restart server 
fs.watchFile('restart', (curr, prev) => { process.exit(); });

// Serve the front end 
let makertron_client = (function () {
		
	if ( MASTER === true ) { 
		app.listen(MASTER_PORT,function(){
			log.info('Client being served on port: ',MASTER_PORT);
		});
		app.use('/', express.static(__dirname));
		app.get("/js/client_config.js", function(req, res) {	// give the client the next available slave 								  
			let avails = [] 
			for ( let i = 0; i < SLAVES.length; i++ ) { avails.push(available.bind(null,i)) }
			async.parallel( avails , function(err,nodes) { 					
					if ( err !== null ) { 
							log.info( "Error: ", err ) 
							res.send(err); 
					}
					else { 
						for ( let i = 0; i < nodes.length; i++ ) {   
							if ( nodes[i]!==null) { 
								log.info("Handing out to " )
								let config = '' 
								config+= 'VERSION = "'+VERSION+'"\n'
								config+= 'SERVER_ADDRESS = "ws://'+nodes[i]+'"\n'  
								res.send(config); 
								break; 
							}  
						}
					}
			});		
	 	});
	}
}());


