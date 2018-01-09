	
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
				

	// =========================================================
	// Tools 
	// =========================================================
	class Tools extends React.Component	{
		constructor(props) {
    	super(props);
    	this.state = {};
			this.editor_front = this.editor_front.bind(this);
			this.viewer_front = this.viewer_front.bind(this);	
  	}	
		componentWillMount() {}
		componentDidMount() { this.viewer_front() }

		editor_front(){	
			console.log("editor")

			//$("#editor").css('opacity'    , 0.8);
			//$("#widgets").css('opacity' , 0);
			//$("#console").css('opacity'   , 0);
			//$("#viewer").css('opacity'    ,  1);

			//$("#editor").css('z-index' ,  3)
			//$("#viewer").css('z-index' ,  2)
			//$("#console").css('z-index' , 1)
		}
		viewer_front(){
			console.log("viewer")
			//$("#editor").css('opacity' , 0)
			//$("#widgets").css('opacity', 0)
			//$("#console").css('opacity' ,0)
			//$("#viewer").css('opacity' , 1)
			//$("#viewer").css('z-index' , 3)
			//$("#editor").css('z-index' , 2)
			//$("#console").css('z-index' , 1)
		}
		widgets_front(){
			//console.log("widgets") 
			//$("#editor").css('opacity'  ,   0);
			//$("#widgets").css('opacity' , 0.8);
			//$("#console").css('opacity' ,   0);
			//$("#viewer" ).css('opacity' ,   1);
			//$("#widgets").css('z-index' ,   2);
		}

		console_front(){
			console.log("console") 
			$("#editor").css('opacity'  ,   0);
			$("#widgets").css('opacity' ,   0);
			$("#console").css('opacity' , 0.8);
			$("#viewer" ).css('opacity' ,   1);

			$("#console").css('z-index' , 3)
			$("#viewer").css('z-index'  , 2)
			$("#editor").css('z-index'  , 1)

		}

		render() {

			//<div className="col-xs-1"><button style={styles.button} type="button" id="Widgets" onClick={this.widgets_front}>Widgets</button></div>
		
    	return ( 
					<div className="row" >
						<div className="col-xs-1"><button style={styles.button} type="button" id="Edit" onClick={this.editor_front}>Edit</button></div>
						<div className="col-xs-1"><button style={styles.button} type="button" id="3D" onClick={this.viewer_front}>3D</button></div>
						<div className="col-xs-1"><button style={styles.button} type="button" id="Console" onClick={this.console_front}>Console</button></div> 
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
		progressOn() { 
			$("#gearstart").css('opacity'  ,   1)
			$("#gearstop").css('opacity'   ,   0)			
		}
		progressOff() { 
			$("#gearstart").css('opacity'  ,   0)
			$("#gearstop").css('opacity'   ,   0)			
		}
		progressStop() { 
			$("#gearstart").css('opacity'  ,   0)
			$("#gearstop").css('opacity'   ,   1)			
		}

		

 		updateScene(results) {

			let worker = (result) => { 
				this.progressOn()
				this.setState({ connected: true  })	
				let myWorker = new Worker("js/makertron_worker.js?hash="+makeId()); 
				myWorker.postMessage( result );				
				myWorker.onmessage = (e)=> { 
					let data = JSON.parse(e['data']) 
					if ( data['type'] === "result" ) {
						this.setState({ resultObjs: [...this.state.resultObjs , data['data'] ] })
					}	
					if ( data['type'] === "log" ) {
						//let out = ""
						//let rows = JSON.parse(data['data'])
						//if ( rows['0'] !== undefined ) out+= rows['0']	 					
						//this.updateLog(data['data']+"\n")
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
						this.progressStop()
					}
					if ( data['type'] === "error" ) { 
						this.updateLog(data['data']) 
						this.progressOff()
					}
				}
			
			}	

			for ( let i = 0; i < results.length; i++ ) { 	
				worker(results[i]) 
			}			 
		}

		updateLog(string) { 
			var txt = this.state.log+=string
			this.setState({ log   : txt })
		}

		handleDrag(event) {
		//	this.setState({ component: true  })	  
		} 

		tools() { 
			return (<Tools patronus={this}/>)
		} 
		editor() { 
			if ( sessionStorage.text === undefined ) { 
				return (<EditorComponent patronus={this} text={this.state.text}/>)
			}
			else { 
				return (<EditorComponent patronus={this} text={sessionStorage.text}/>)
			}
		}
		console() { 	 
			return (<ConsoleComponent patronus={this} data={this.state.log} />)		
		}
		viewer() { 	 
			return (<ThreeComponent patronus={this} data={this.state.resultObjs} />)		
		}
		Login() { 
			return(<Login />)
		}

		// update our viewer dimensions 
		updateDimensions() { 
			this.setState({component:true})
		}

		// Load our default model on component being mounted 
		componentWillMount() { 
			if ( sessionStorage.text === undefined ) {
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

  	componentWillUnmount() {
		}

		// Something in our state changed now update	
		componentDidUpdate() {  
			this.viewer()
			this.editor()  
			this.console() 
		}
	
		// On a change of state decide if we do a componentDidUpdate or not 
		shouldComponentUpdate( nextProps , nextState ) { 

			console.log( nextState.resultObjs ) 
			console.log( this.state.resultObjs ) 
 
			if (  nextState.resultObjs !== this.state.resultObjs || nextState.text !== this.state.text ) { return true; } 
			return false;  
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

