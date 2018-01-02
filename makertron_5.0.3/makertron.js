
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
var cpuStat = require('cpu-stat')
const fs = require("fs"); 
const express = require('express');
const https = require('https') 
const WebSocket = require('ws');
const child_process = require('child_process');

const app = express();

const config = JSON.parse(fs.readFileSync('../config.jsn', 'utf8'));
const log = require('simple-node-logger').createSimpleLogger('../project.log');

const VERSION        = config['VERSION'] 

const SLAVE 				 = config['SLAVE'] 
const SLAVE_ADDR     = config['SLAVE_ADDR'] 
const SLAVE_PORT     = config['SLAVE_PORT']

const RELAY_ADDR     = config['RELAY_ADDR'] 
const RELAY_PORT     = config['RELAY_PORT'] 					

const MASTER         = config['MASTER'] 
const MASTER_PORT    = config['MASTER_PORT']  	
const MAX_CONN       = config['MAX_CONN']

const HSKEY          = config['HSKEY'] 
const HSCERT         = config['HSCERT'] 
const HTTPS          = config['HTTPS'] 

let connections = 0
         
let hskey = '' 
let hscert = '' 
if ( MASTER === true ) { 
	if ( HSKEY !== '' && HSCERT !== '' ) { 	
	  hskey = fs.readFileSync(HSKEY)
		hscert = fs.readFileSync(HSCERT)
	}
}

log.info("Total Cores: ", cpuStat.totalCores() )

// Serve up the back end 		
let slave = (function() {
	log.info( "Makertron Starting back end: " + VERSION + " On Port " + SLAVE_PORT );
	let ws_client = new WebSocket.Server({ port: SLAVE_PORT })
	ws_client.on('connection', (client_socket)=> {	
		log.info("Client Connecting") 
		client_socket.on('message', (str) => { 
			if ( connections >= MAX_CONN || SLAVE === false ) {
				log.info("Forwarding To Relay")  		
				let ws_relay = new WebSocket('ws://'+RELAY_ADDR+':'+RELAY_PORT);
				ws_relay.on('open', ()=> {
					ws_relay.send(str) 
				})
				ws_relay.on( 'message' , (str) => { 
					client_socket.send(str) 
				})
				ws_relay.on('close', ()=>{ log.info("Relay Socket closed"); client_socket.close() })
				ws_relay.on('error', ()=>{ log.info("Relay Socket Error");  client_socket.close() }) 
			}
			else { 
				let message = JSON.parse(str) 
				if ( message['type'] === 'RELAY' ) { // force to next node 
					log.info("Forwarding Script Section To Relay")  
					let ws_relay = new WebSocket('ws://'+RELAY_ADDR+':'+RELAY_PORT);
					ws_relay.on('open', ()=> {
						ws_relay.send(str) 
					})
					ws_relay.on( 'message' , (str) => { 
						client_socket.send(str) 
					})
					ws_relay.on('close', ()=>{ log.info("Relay Socket closed"); client_socket.close() })
					ws_relay.on('error', ()=>{ log.info("Relay Socket Error");  client_socket.close() }) 	
				}
				if ( message['type'] === 'OPENSCAD' ) { // process script 
					connections++ 					
					log.info("Processing Openscad Script On: " + connections ) 
					let forked = child_process.fork('./process_scad.js')
					forked.send(message['data'])	
					cpuStat.usagePercent( function(err, percent, seconds) { if (err) { return log.info(err) } log.info("CPU Usage: ", percent) })
					forked.on('message', (data) => { 
						data = JSON.parse(data); 
						if ( data['type'] === "log"     ) { client_socket.send(JSON.stringify({ type: 'OPENSCADLOG' ,  data: data['data']})); }
						if ( data['type'] === "objects" ) { 
							client_socket.send(JSON.stringify({ type: 'OPENSCADRES' ,  data: data['data']})) 
							forked.kill()
							client_socket.close()
							connections--  
						}
					})
				}
			} 
		})
		client_socket.on('close', ()=>{ log.info("Socket closed") })
		client_socket.on('error', ()=>{ log.info("Socket Error")  })
	})
}());
	
		
// Serve the front end 
let makertron_client = (function() {
	if ( MASTER === true ) { 
		if ( HTTPS === false ) { 
			app.listen(MASTER_PORT,function(){
				log.info('Http client being served on port: ',MASTER_PORT);
			})		
		}
		else { 
			log.info('Https client being served on port: ',MASTER_PORT);
			https.createServer(	{ key: hskey, cert: hscert } , app).listen(MASTER_PORT)
		}
		app.use('/', express.static(__dirname));
		app.get("/js/client_config.js", function(req, res) {	// give the client  								  
			let config = '' 
			config+= 'VERSION = "'+VERSION+'"\n'
			config+= 'SERVER_ADDRESS = "ws://'+SLAVE_ADDR+':'+SLAVE_PORT+'"\n'  
			res.send(config)
		}).on("error", function (){ log.info("GET Request Error Generating Client Config.")}) 
	}
}());

				
	

