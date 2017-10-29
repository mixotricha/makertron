
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
		console.log( 'log',result )
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
	let fetchGeometry = function(script) {  

			const socket = new WebSocket('ws://localhost:3000');
			
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

	for ( i = 0; i < 10; i++ ) { 
		fetchGeometry( script ) 
	}
	

	// Add a connect listener
	//socketc.on('connect', function (socket) {
	//		socketc.emit('OPENSCAD', 'Ping Out'); 	   
	//});

	//socketc.on('RETURN' , (data) => { 
	//	console.log( data ) 
	//})


//var express = require('express')
//var app = new express();
//	var makertron_client = (function () {
//	app.listen(8080,function(){
//		console.log('Client being served on port: ',8080);
//	});
//	app.use('/', express.static(__dirname));
//}());
