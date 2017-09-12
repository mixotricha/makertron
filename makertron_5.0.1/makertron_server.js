
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

const express = require('express');
const app = express();
const WebSocket = require('ws');
const log = require('simple-node-logger').createSimpleLogger('project.log');
const { fork } = require('child_process');
const config = require('./js/config.js');

let beat = '{"type":"PULSE","data":""}';

// serve the back end 
let makertron_server = (function () {
  log.info( "Makertron Starting Version: " + VERSION );
	const wss = new WebSocket.Server({ port: SERVER_PORT });
	wss.on('connection', function connection(socket) { 
		let forked = fork('./process_scad.js');
		let heartBeat = setInterval(() => { socket.send(beat); }, 25000);
		socket.on('message', (str) => { 
			let message = JSON.parse(str);  
			if ( message['type'] === 'OPENSCAD' ) { 
				forked.send({ result: message['data'] })
				forked.on('message', (data) => { 
					if ( data['type'] === "log"    ) { socket.send(JSON.stringify({ type: 'OPENSCADLOG' ,  data: data['data']})); }
					if ( data['type'] === "object" ) { socket.send(JSON.stringify({ type: 'OPENSCADRES' ,  data: data['data']})); }
				});
			}	
		}) 
		socket.on('close', ()=>{
			log.info("Socket closed");  
			clearInterval(heartBeat); 
			forked.kill(); 
		})
	});
}());

// Serve the front end 
let makertron_client = (function () {
	app.listen(CLIENT_PORT,function(){
		log.info('Client being served on port: ',CLIENT_PORT);
	});
	app.use('/', express.static(__dirname));
}());


