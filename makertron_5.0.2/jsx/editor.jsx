	
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
	
	// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	// Editor module 
	// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	'use strict'

	import React from 'react';
	import ReactDOM from 'react-dom';
	import $ from "jquery";

	import { Cell , Grid , FABButton , Icon , IconButton , Button , Textfield , Slider,DataTable , TableHeader} from 'react-mdl';
	
	import styles from '../resource/styles/style.js'  
	import shared from '../resource/styles/shared.js' 

	import Parser from '../js/parser.js' 

	import brace from 'brace' 
	import AceEditor from 'react-ace'
	import 'brace/mode/text'
	import 'brace/theme/eclipse'

	// --------------------------------------------------------
	// Fetch project data from server and load up editor 
	// --------------------------------------------------------

	module.exports =  class EditorComponent extends React.Component {
		constructor(props) {
    	super(props);
    	this.state = {text:""};
			this.refreshData = this.refreshData.bind(this);
  	}
		sendMessage(result) { this.props.patronus.updateScene(result)	  } 
		textArea() { 
			return <TextWidget  patronus={this} text={this.props.text}/>
		}
		refreshData() {	
			try { 
				var parser = new Parser(this.props.patronus) 
				parser.load("module foo(){"+sessionStorage.text+"}")  
				if ( parser.start() === false ) { 
					this.sendMessage(false)
				}
				else { 
					var result = parser.dump()
					this.sendMessage(result)	 
				}
			}
			catch(e) { 
				this.sendMessage(false)
			}
		}
		componentDidUpdate() {
		}
		render() {
    	return (
				<div style={{height:'100%',width:'100%',position:'absolute'}}>
					<button style={styles.button} type="button" id="update" onClick={this.refreshData}>Generate</button>
    			<div >{this.textArea()}</div>
				</div>
    	);
  	}
	}

	// -------------------------------------------------
	// Wrapper for react ace editor component 
	// -------------------------------------------------
	class TextWidget extends React.Component {	
		constructor(props) {
    	super(props);
    	this.state = { text: "" };
			this.onChange = this.onChange.bind(this);
			this.onFocusLeave = this.onFocusLeave.bind(this);
			this.onEnter = this.onEnter.bind(this);
  	}	
		onFocusLeave(event) {	// updata data
			console.log("We are leaving here!") 
		}
		onEnter(event) {	// updata data
			console.log("We are in here") 
		}
		onChange(text) {  
			sessionStorage.text = text
			//this.state.text = text;
		}
		componentDidUpdate() {
			sessionStorage.text = this.props.text 
		}
		render() {
    	return (
				
				<AceEditor  
									key={shared.makeId()}
									id="texteditor"
    							setOptions={{vScrollBarAlwaysVisible:true}}
									value={this.props.text}
									onChange={this.onChange}
									editorProps={{$blockScrolling:Infinity}}
									style={styles.ace_editor}
									mode="text"
        					theme="eclipse"
 							/>
				
    	);
  	}
	}



