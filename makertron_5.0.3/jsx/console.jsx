
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
	// Console module 
	// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	'use strict'

	import React from 'react';
	import ReactDOM from 'react-dom';
	import { Cell , Grid , FABButton , Icon , IconButton , Button , Textfield , Slider,DataTable , TableHeader} from 'react-mdl';
	import $ from "jquery";
	import styles from '../resource/styles/style.js' 
	import shared from '../resource/styles/shared.js' 

	import brace from 'brace' 
	import AceEditor from 'react-ace'
	import 'brace/mode/text'
	import 'brace/theme/eclipse'

	// --------------------------------------------------------
	// Fetch project data from server and load up editor 
	// --------------------------------------------------------
	module.exports =  class ConsoleComponent extends React.Component {
    	
		constructor(props) {
    	super(props);
    	this.state = {};
			this.refreshData = this.refreshData.bind(this);
  	}
		refreshData() {		 
		}
		componentWillMount() { 
		}
	
			render() {
    	return (
			<div>
					<div id="output" style={styles.scroller} ></div>
						<TextWidget  patronus={this} data={this.props.data}/>
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
		}
		componentDidUpdate() {
			this.ace.editor.scrollToRow(this.ace.editor.getCursorPosition().row+1)
			this.ace.editor.setReadOnly(true)
		}
		render() {
    	return (
				
				<AceEditor  
									key={shared.makeId()}
									id="consolearea"
									name="consolearea"
    							setOptions={{vScrollBarAlwaysVisible:true}}
									value={this.props.data}
									onChange={this.onChange}
									editorProps={{$blockScrolling:Infinity}}
									style={styles.ace_console}
 									mode="text"
        					theme="eclipse"
									
									ref={instance => { this.ace = instance; }}
								
 							/>
				
    	);
  	}
	}

	
