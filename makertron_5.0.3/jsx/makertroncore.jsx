	
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

	// ===============================================================
	// Makertron Core 
	// ===============================================================

	'use strict'
	
	import React from 'react'
	import ReactDOM from 'react-dom'	
	import $ from "jquery";
	import async from 'async'
	import { saveAs } from 'file-saver'

	import { Cell , Grid , FABButton , Icon , IconButton , Button , Textfield , Slider} from 'react-mdl';	

	import SplitPane from 'react-split-pane' 

	import styles from '../resource/styles/style.js' 
	import shared from '../resource/styles/shared.js'
 
	import ThreeComponent  from './three.jsx';  
	import EditorComponent from './editor.jsx'; 	
	import ConsoleComponent from './console.jsx'; 

	import 'react-mdl/extra/material.js';
	import 'react-mdl/extra/material.css';
	import '../resource/css/SplitPane.css';

	// --------------------------------------------------------
	// Generate a hashed string
	// --------------------------------------------------------
	var makeId = function() {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for( var i=0; i < 5; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	};

	// ------------------------------------------------------
	// Handle user login and hook up editor if successful 
	// ------------------------------------------------------
	class Login extends React.Component	{
		constructor(props) {
    	super(props);
    	this.state = { username: '',password:'' };
  	}	
		onUsernameChange(event) {}
		onPasswordChange(event) {}
		error( err ) {} 
		rejected( data ) {}
		onLoginClick(event) {}
		onLogoutClick(event) {}
		onRegisterClick(event) {}
		componentWillMount() {}
		about() {
			var url = 'https://github.com/mixotricha/makertron' 
			 window.open(url);
		}
		render() {
		  return (
				 <Grid className="demo-grid-ruler" style={styles.small_no_margin}>
					<Cell col={2} style={styles.logo}>MAKERTRON</Cell>
					<Cell col={8}></Cell>
					<Cell col={2} style={styles.about}><button style={styles.button} type="button" id="about" onClick={this.about}>About</button></Cell>
					</Grid>
    	);
  	}
	}
				
	// ---------------------------------------------------------
	// Tool bar. Empty for now
	// ---------------------------------------------------------
	class Tools extends React.Component	{
		constructor(props) {
    	super(props);
    	this.state = {};
  	}	
		render() {
    	return ( 
					<div className="row" >
					</div>
    	);
  	}
	}

	
	// -----------------------------------------------
	// Will become ceanotype frame 
	//------------------------------------------------
			
	class Start extends React.Component {

		constructor(props) {
    	super(props);
    	this.state = { resultObjs: [] , log: "" , text: "" , component: false , connected : false };
			this.updateScene = this.updateScene.bind(this);
			this.handleDrag = this.handleDrag.bind(this)	
			this.updateDimensions = this.updateDimensions.bind(this) 
  	}

		// turn progress bar on 
		progressOn() { 
			$("#gearstart").css('opacity'  ,   1)
			$("#gearstop").css('opacity'   ,   0)			
		}

		// turn progress bar off
		progressOff() { 
			$("#gearstart").css('opacity'  ,   0)
			$("#gearstop").css('opacity'   ,   0)			
		}

		// stop progress bar
		progressStop() { 
			$("#gearstart").css('opacity'  ,   0)
			$("#gearstop").css('opacity'   ,   1)			
		}

		// update our scene 
 		updateScene(results,expStl) {
 
			// This does not yet exist in Chrome. Even though a non DOM canvas is surely most compelling use case. 
			// Then all of three would go inside the workers but I am including it here for when it does.  
			//let htmlCanvas = document.getElementById("three_canvas")
			//let offscreen = htmlCanvas.transferControlToOffscreen()  
			
			this.setState({ resultObjs: [] })
			// output an stl string 
			let stlGenerate = (obj) => { 
				let stl = "" 
				for ( let i = 0; i < obj.length; i+=3*3 ) {
					stl += "facet normal 1 1 1\n" 
    			stl += "	outer loop\n" 
        	stl += "  vertex " + obj[i+2] + " " + obj[i+1] + " " + obj[i+0] + "\n"  
        	stl += "  vertex " + obj[i+5] + " " + obj[i+4] + " " + obj[i+3] + "\n"
        	stl += "  vertex " + obj[i+8] + " " + obj[i+7] + " " + obj[i+6] + "\n"
					stl += " endloop\n"       
					stl += " endfacet\n"
				}
				return stl
			}
			// When all our server chunks finished save to an stl ( if we asked to ) 
			let done = (err,results) => {  
				if ( expStl === true ) {
					let stl = "solid spewchickens\n" 
  				for ( let i = 0; i < this.state.resultObjs.length; i++ ) { 
						for ( let ii = 0; ii < this.state.resultObjs[i].length; ii++ ) {
							stl+=stlGenerate( JSON.parse(this.state.resultObjs[i][ii]) )
	  				}
					}
					stl += "endsolid spewchickens\n"
					let blob = new Blob([stl], {type: "text/plain;charset=utf-8"});
					saveAs( blob , "output.stl" )  
				}
				this.progressStop()
			}
			// hand a scad chunk to the server
			let worker = (result,callback) => { 
				this.progressOn()
				this.setState({ connected: true  })	
				let myWorker = new Worker("js/makertron_worker.js?hash="+makeId()); 
				myWorker.postMessage( result );				
				myWorker.onmessage = (e)=> { 
					let data = JSON.parse(e['data']) 
					if ( data['type'] === "result" ) {
						this.setState({ resultObjs: [...this.state.resultObjs , data['data'] ] })
						callback(null,true)
					}	
					if ( data['type'] === "log" ) {
						this.updateLog(data['data']+"\n")
					}
					if ( data['type'] === "pulse" ) { 
						if ( this.state.connected === true ) { 
							this.progressOn()
						}
						else { 
							this.progressStop()	
						}
					}
					if ( data['type'] === "close" ) { 
						this.setState({ connected: false  })	
					}
					if ( data['type'] === "error" ) { 
						this.updateLog(data['data']) 
						this.progressOff()
					}
				}			
			}	
			// similar pattern to editor .. hand now in 'parallel' to server. 
			let wrkers = [] 
			for ( let i = 0; i < results.length; i++ ) {
				wrkers.push( worker.bind(null,results[i]) )  
			}
			async.parallel( wrkers , done.bind( null ) )			
		}

		// output to log 
		updateLog(string) { 
			var txt = this.state.log+=string
			this.setState({ log   : txt })
		}

		// handle drag event 
		handleDrag(event) {
			this.setState({ component: true  })	  
		} 

		// return tools component 
		tools() { 
			return (<Tools patronus={this}/>)
		} 

		// return editor component 
		editor() { 
			if ( this.state.text !== undefined ) { 
				return (<EditorComponent patronus={this} text={this.state.text}/>)
			}
		}

		// return console component 
		console() { 	 
			return (<ConsoleComponent patronus={this} data={this.state.log} />)		
		}

		//return viewer component 
		viewer() { 	 
			return (<ThreeComponent patronus={this} data={this.state.resultObjs} />)		
		}

		//return login component 
		Login() { 
			return(<Login />)
		}

		// update our viewer dimensions 
		updateDimensions() { 
			this.setState({component:true})
		}

		// Load our default model on component being mounted 
		componentWillMount() { 
			if ( this.state.text === "" ) {
				$.get( "pipe.scad", ( data ) => { 
					this.setState({text:data})
					this.updateLog("Loading default example...\n") 	
				});
			} 			 
		}

		// We did mount the component. Disable things like context menus from the viewer
		componentDidMount() {
			window.addEventListener("resize", this.updateDimensions);
			$('#mainview').on("contextmenu",()=>{return false;}); 
		}

		// On a change of state decide if we do a componentDidUpdate or not 
		shouldComponentUpdate( nextProps , nextState ) { 
			if (  nextState.resultObjs !== this.state.resultObjs || nextState.text !== this.state.text ) { return true; } 
			return false;  
		}

		// Something in our state changed now update	
		componentDidUpdate() {  
			this.viewer()
			this.editor()  
			this.console() 
		}
	
  	render() {
    	return (
    		<div style={styles.whole_page}>
					<div>{this.Login()}</div>
					<SplitPane split="vertical"  primary="first" defaultSize={$(window).width()-600}>
						<div id='mainview'>
	      	  	<div style={styles.viewport}>{this.viewer()}</div>
							<div id="gearstart" style={styles.gears}><img width="100" height="90" src="resource/imgs/gears_started.gif"/></div>
							<div id="gearstop" style={styles.gears}><img width="100" height="90" src="resource/imgs/gears_stopped.gif"/></div>
						</div>
      	  	<SplitPane split="horizontal" onDragFinished={this.handleDrag} primary="first" defaultSize={300}>
      	      <div>{this.editor()}</div>
      	      <div>{this.console()}c</div>
      	  	</SplitPane>
    			</SplitPane> 	 
				</div>
    	);
  	}
	}

	ReactDOM.render( <Start/>, document.getElementById('root') );

