const express = require('express')
cluster = require('cluster')
net = require('net'),
sio = require('socket.io'),
sio_redis = require('socket.io-redis')
farmhash = require('farmhash');
log = require('simple-node-logger').createSimpleLogger('project.log');
//debug = require('debug');

//ProcessScad = require('./processscad.js')
config = require('./js/config.js');




//var done = (data) => { 
//	if ( data!==false) {			 
//		if ( data['type'] === "object" ) { console.log(data) }
//	}		
//}

//var result = 'this.foo = function(){var x;for(x=0;x<=50;x+=10);{var y;for(y=0;y<=50;y+=10);{var z;for(z=0;z<=50;z+=10);{this.translate({arg0:[x,y,z]});this.cube({size:5});this.stack_decrement(1);}}}}'

const { fork } = require('child_process');

//let i = 0; 
//for ( i = 0; i < 100; i++ ) { 
//	let forked = fork('./child.js');
//	forked.send({ result: result })
//	forked.on('message', (data) => { 
//		console.log( i , data ) 
//	});
//}

//et i = 0; 
//for ( i = 0; i < 10; i++ ) { 
//	ProcessScad(result,done); 		
//}
		
//var thunder = (callback) => { 
//	console.log('thunder')
//	setTimeout( ()=> { 
//		callback() 
//	} , 9000 );   
//}

let port = 3000;

let num_processes = require('os').cpus().length;
let forked = fork('./child.js');

//var num_processes = 4; 

if (cluster.isMaster) {
	var workers = []; // store workers

	console.log(`Master ${process.pid} is running`);

	// Helper function for spawning worker at index 'i'.
	var spawn = function(i) {
		workers[i] = cluster.fork();

		// Optional: Restart worker on exit
		workers[i].on('exit', function(code, signal) {
			console.log('respawning worker', i);
			spawn(i);
		});
   };

   // Spawn workers.
	for (var i = 0; i < num_processes; i++) {
		spawn(i);
	}

	// convert ip to hash .. nice 
	var worker_index = function(ip, len) {
		return farmhash.fingerprint32(ip[i]) % len; // Farmhash is the fastest and works with IPv6, too
	};

	// Create the outside facing server listening on our port.
	var server = net.createServer({ pauseOnConnect: true }, function(connection) {
		var worker = workers[worker_index(connection.remoteAddress, num_processes)];
		worker.send('sticky-session:connection', connection);
	}).listen(port);

} else {
    // Note we don't use a port here because the master listens on it for us.
	var app = new express();

	// Don't expose our internal server to the outside.
	var server = app.listen(0, 'localhost'),
	io = sio(server);

	// Tell Socket.IO to use the redis adapter. By default, the redis server is assumed to be on localhost:6379. 
	io.adapter(sio_redis({ host: 'localhost', port: 6379 }));

	// Do our own core socket stuff 
	io.on('connection', (socket) => {
			// Parse an openscad object
			socket.on('OPENSCAD', (id) => { 
				log.info("Socket opened: ", id ); 		
				socket.on('JSCAD'+id, (data) => { 
					forked.send({ result: data['script'] })
					forked.on('message', (data) => { 
						if ( data!==false) {			 
							if ( data['type'] === "log"    ) { socket.emit('OPENSCADLOG'+id ,  data['data'] );                          }
							if ( data['type'] === "object" ) { socket.emit('OPENSCADRES'+id ,  data['data'] );                          }
							if ( data['type'] === "pulse"  ) { socket.emit('PULSE'+id , "" );                                           }
							if ( data['type'] === "close"  ) { log.info("Socket closed");  socket.emit('CLOSE'+id , "");  socket.conn.close();              }
							if ( data['type'] === "error"  ) { log.info(data['data']);     socket.emit('ERROR', "BOOM!");               }
							if ( data['type'] === "debug"  ) { log.info(data['data']);                                                  }
						}		
					});
		
			});
		}); 
	});

	// Listen to messages sent from the master. Ignore everything else.
	process.on('message', function(message, connection) {
		if (message !== 'sticky-session:connection') {
			return;
		}
		// Emulate a connection event on the server by emitting the event with the connection the master sent us.
		server.emit('connection', connection);
		connection.resume();
	});
}


//var makertron_client = (function () {
//	var app = new express();
//	app.listen(CLIENT_PORT,function(){
//		log.info('Client being served on port: ',CLIENT_PORT);
//	});
//	app.use('/', express.static(__dirname));	
//}());
