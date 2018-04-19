
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
	/*global require,console,__dirname,Buffer*/
	/*jshint -W069 */ 
	var lodash = require('lodash') 
	
	module.exports = function Parser(callback) {
		this.load = function(buffer)  {
			console.log("Slam slam slam") 
		}
	}
	/*
	module.exports = function arser(callback) {
 
		// These are functions that will have .this appended 
		// these arguments will parsed to json format unless they are excluded 
		this.modules  = ["circle", "sphere","translate","scale","rotate","cube","cylinder","linear_extrude","polygon","polyhedron","echo"] 

		// These are tokens that are not to be classed as variables for each module scope 
		this.standard = [ "for" ,  "false" , "true", "if" , "max" , "min" , "sin" , "cos" , "union" , "difference" , "intersection", 
		                  "minkowski","rotate" , "translate" , "scale" , "+" , "-" , "++" , "--" , "*" , "function" , "sqrt" , ";" ]

		// These are funnctioned excluded from having arguments parsed in to json 
		this.exclude = [ "translate" , "scale", "rotate" , "echo" ]  

		this.globals = [] 
		this.stack = 0 
		this.tokens = [] 	
		this.ntokens = [] 

		// ----------------------------------------------------------
		// Set character at position in index
		// ----------------------------------------------------------
		this.setCharAt = (str,index,chr) => {
		  if(index > str.length-1) return str;
		  return str.substr(0,index) + chr + str.substr(index+1);
		}

		// ----------------------------------------------------------
		// buffer to a string 
		// ----------------------------------------------------------
		this.toStr = ( buffer ) => {
			let nstring = "" 
			let i = 0 
			for ( i = 0; i < buffer.length;i++ ) {
				buffer[i] = buffer[i].replace(/([' '])/g,'')
				nstring+=buffer[i]+"\n"  
			}
			return nstring 
		}

		// ----------------------------------------------------------
		// trim comments 
		// ----------------------------------------------------------
		this.trimComments = (string) => {
			let i = 0
			for ( i = 0; i < string.length; i++) { 
  			let result = string[i].split(/(\/\/)/)	
 				if ( result.length > 1 ) string[i] = result[0]
	 		}	
   		return string
 		}
 
		// ----------------------------------------------------------
		// Lex the input string
		// ----------------------------------------------------------
		this.load = function(buffer)  {
			console.log( "Going where sore losers go...")  
			buffer = buffer.replace(/([\t])/g,'')
			
			//buffer = buffer.replace(/(["eval"])/g,'')
			//buffer = buffer.replace(/(["Function"])/g,'')

			buffer = buffer.split(/(\{)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 	
			buffer = buffer.split(/(\})/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\()/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\))/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\[)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\])/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\;)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\:)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\=)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\+)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer)
			buffer = buffer.split(/(\-)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\*)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\>)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\<)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\/)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(\,)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split(/(module)/)
			buffer = lodash.flatten( buffer )  
			buffer = this.toStr(buffer) 
			buffer = buffer.split("\n")
			buffer = this.trimComments(buffer) 	
			let i = 0  
			for (  i = 0; i < buffer.length; i++ ) { 
				if ( buffer[i] != '' ) this.tokens.push(buffer[i]) 
			}

			console.log("To here mate") 
		}

		// ----------------------------------------------------------
		// Is a token in the in the list
		// ----------------------------------------------------------
		this.isAssigned = (token,lst) => {
			let i = 0 
			if ( token === undefined ) token = this.tokens[this.stack]  
			for ( i = 0; i < lst.length; i++ ) { 
				if ( token === lst[i] ) return true 
			}
			return false
		}

		// ----------------------------------------------------------
		// Is a token a number ?
		// ----------------------------------------------------------
		this.isNumber = (token) => {
			if ( token === undefined ) token = this.tokens[this.stack]
			token = token.replace(/([0-9])/g,'')
			token = token.replace(/([.])/g,'')
			token = token.replace(/([-])/g,'')
			token = token.replace(/([+])/g,'')
			return token.length === 0 ? true : false
		}

		// ----------------------------------------------------------
		// Is a token a string ?
		// ----------------------------------------------------------
		this.isString = (token) => {	
			if ( token === undefined ) token = this.tokens[this.stack]  
			token = token.replace(/([A-Z-a-z])/g,'')
			token = token.replace(/([0-9])/g,'')
			token = token.replace(/(['_'])/g,'')
			return token.length === 0 ? true : false
		}

		// ------------------------------------------------------------
		// Is token in list 
		// ------------------------------------------------------------
		this.isInList = ( lst , tokens) => { 
			if ( tokens === undefined ) tokens = this.tokens
			let i = 0 
			for ( i = 0; i < lst.length; i++ ) { 
				if ( tokens[this.stack] === lst[i] ) return true 
				if ( lst[i] === "STRING" ) { if ( this.isString(tokens[this.stack]) ) return true }
			}
			return false 
		}

		// ------------------------------------------------------------
		// Walk a tree 
		// ------------------------------------------------------------
		this.walk = ( tree ) => { 
			let i = 0
			let state = true
			while ( state === true && i < tree.length ) {  
				if ( this.isInList(tree[i][0]) ) { 
						//tree[i][1]();
						this.hooks(tree[i][1]) 
						state = true 
					} else { 
						//tree[i][2]();
						this.hooks(tree[i][2]) 
						state = false 
					}	  
				i++	
			}
		}

		// -----------------------------------------------------------
		// increment stack 
		// -----------------------------------------------------------
		this.next = () => {  this.stack++; } 

		// -----------------------------------------------------------
		// Copy current token to new tree	
		// -----------------------------------------------------------
		this.copy = (target) => { 
			if ( target === undefined ) { this.ntokens.push( this.tokens[this.stack] ) } else { target.push(this.tokens[this.stack]) }
			this.next()	
		}

		// -----------------------------------------------------------
		// Grab range of tokens from tree
		// -----------------------------------------------------------
		this.grab = ( st , en ) => { 
			let chnk = [] 
			let i = 0 
			for ( i = st; i < en; i++ ) { chnk.push( this.tokens[i] ) } 
			return chnk 		
		}

		// -----------------------------------------------------------
		// find matching closure 
		// -----------------------------------------------------------
		this.findPair = (a,b,index,lst) => { 
			let i = 0, o = 0 , c = 0 
			if ( lst === undefined ) lst = this.tokens 
			for ( i = index; i < lst.length; i++ ) { 
				if ( lst[i] === a ) o++ 
				if ( lst[i] === b ) c++ 	
				if ( o === 0 && c === 0 ) break 
				if ( o === c ) return i 
			}
			return -1
		}

		// ----------------------------------------------------------
		// remove duplicates
		// ----------------------------------------------------------
		this.removeDuplicates = (lst) => {
			return lodash.uniqWith( lst , lodash.isEqual ) 
		}

		// ----------------------------------------------------------
		// seek a token 
		// ----------------------------------------------------------
		this.seek = (tkn,tokens,ind) => { 
			if ( tokens === undefined ) tokens = this.tokens
			if ( ind === undefined ) ind = this.stack  
			for ( let i = ind; i < tokens.length; i++ ) { 
				if ( tokens[i] === tkn ) return i 
			}
			//console.log("Did not find " , tkn ) 
			return false 
		}

		// ----------------------------------------------------------
		// cross out a series of tokens 
		// ----------------------------------------------------------
		this.delete = ( start , end ) => { 
			for ( let i = start; i < end; i++ ) { this.tokens[i] = "*" } 
		}

		// --------------------------------------------------------
		// Generate a hashed string
		// --------------------------------------------------------
		this.makeId = () => { 
			let i = 0 
			let text = "";
			let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( i=0; i < 5; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));
			return text;
		};

		// -------------------------------------------------
		// Insert a token in to target at i 
		// -------------------------------------------------
		this.insert = ( i , tkns , target ) => { 
			let ii = 0 
			if ( target === undefined ) { 
				target = this.tokens
			}
			for ( ii = 0; ii < tkns.length; ii++ ) target.splice( i , 0 , tkns[ii] ) 
		}

		// ---------------------------------------------------------------
		// Take arguments to function and split up in to array 
		// ---------------------------------------------------------------
		this.splitArguments = (start,end) => {
			let i =0,ii=0,token_depth=0,splits=[],chk="",args=[]
			for ( i = start; i < end; i++ ) { 
  			if ( token_depth === 0 && this.tokens[i] === "," ) splits.push(i)
    		if ( this.tokens[i] === "[" || this.tokens[i] === "(" ) token_depth++
    		if ( this.tokens[i] === "]" || this.tokens[i] === ")" ) token_depth--
  		}
			
			splits.push(end)  

			for ( i = 0; i < splits.length; i++) {
  			let end = splits[i]
    		for ( ii = start; ii < end; ii++) { if ( start === ii && this.tokens[ii] === ",") { /* do nothing */ } else { chk+=this.tokens[ii] } }
    		args.push(chk)
    		chk=""
   			start = end
  		}
			return args 
		}

		
		// -----------------------------------------------------------
		// Check closure is complete 
		// -----------------------------------------------------------
		this.isClosed = () => {  
			let start = "" , end = "", state = true , i = 0 
			// Now check the closure for conformance 
			for ( i = 0; i < this.tokens.length; i++ ) { 
				if ( this.tokens[i] === "(" ) { start = "("; end = ")" } 
				if ( this.tokens[i] === "{" ) { start = "{"; end = "}" }
				if ( this.tokens[i] === "[" ) { start = "["; end = "]" }   
				if ( start !== "" && end !== "" ) { 
					let result = this.findPair(start,end,i)
					if ( result === -1 ) { state = false}
				}
				start=""
				end=""
			}
			return state
		}

		// ==========================================================
		// process boolean operations union,intersection,difference,minkowski
		// ==========================================================
		this.process_booleans=() => {   
		 
			this.tokens[ this.findPair("{","}",this.stack) ] = "\nthis."+this.tokens[this.stack-3]+"_end()\n"
			this.ntokens.push("\nthis."+this.tokens[this.stack-3]+"()\n") 

			// Note we know what comes after since the tree confirmed the '(',')','{' 
			// but you can also see how a variation would break it. (a=b) for example. 
			// Also note how the closure has been transformed in to a stack operation. 
			// difference() -> pushes to the csg stack 

			this.next()
		}

		// ==========================================================
		// Process openscad 'function arrays' in to functions 
		// ==========================================================
		this.process_functions = () => { 
			let function_name = this.tokens[this.stack-1] // name of module 	
			this.exclude.push(function_name) // exclude from parsing arguments 
			this.modules.push(function_name) // but also treat as module 
			let p =  this.findPair("(",")",this.stack)  // get the end index p of arguments closure  		 
			let chk = this.grab(this.stack, p )
			this.ntokens.push( "\nthis." , function_name , "=" , "function" )
			for ( let i = 0; i < chk.length; i++ ) { this.ntokens.push( chk[i] ) }
			this.ntokens.push(")","{","return") 
			let s = this.seek(";") 
			if ( s!== false ) { // probably broken right now 
				let i = 0 
				let chk = this.grab( p+2 , s )
				for ( i = 0; i < chk.length; i++ ) { this.ntokens.push( chk[i] ) } 
		 		this.ntokens.push("}") 
				this.stack=s+1
			}
		}

		// ========================================================================
		// cut out anything that is in a module or function leaving globals behind
		// ========================================================================
		this.process_globals = () => { 
			let p =  this.findPair("(",")",this.stack) 		  		 
			this.stack = p + 1 
			if ( this.tokens[this.stack] === "=" ) { 
				this.stack = this.seek(";") + 1
				//if ( this.stack === false ) console.log( "Error processing globals" )   
			}
			else if ( this.tokens[this.stack] === "{" ) { 
				this.stack = this.findPair("{","}",this.stack)+1 
			}
		}

		// ===============================================================================
		// find variables in the remaining global tokens left over from processing globals 
		// ===============================================================================
		this.sort_globals = () => {  		  
			if ( !this.isAssigned(this.tokens[this.stack],this.standard) && 
				this.isString(this.tokens[this.stack]) && 
				!this.isNumber(this.tokens[this.stack]) && 
				this.tokens[this.stack+1] === '=' ) { 
				this.globals.push(this.tokens[this.stack]) 
			} 
			this.next()
		}

		// ====================================================================
		// Process modules in to functions and arguments in to json 0.2 effort  
		// ====================================================================
		this.process_arguments = () => {  
			let module_name = this.tokens[this.stack-1] // name of module 
			this.modules.push(module_name) 
			this.ntokens.push("\nthis." + module_name + " = () => { ") // then our rephrasing of function 		
			let p =  this.findPair("(",")",this.stack)  // get the end index p of arguments closure  
			let chk = this.grab(this.stack+1, p )       // get the section between stack and p of tokens
			let args = []  
			let i = 0
			for ( i = 0; i < chk.length; i+=4 ) {     // push our passed arguments to scope of operations object  
				if ( chk[i+2] !== undefined ) { 		
					this.ntokens.push( "let " + chk[i+0] + " = this.default(arguments[0]['"+chk[i+0]+"']," + chk[i+2] + ")\n" )                     
				}    
			} 
			this.stack = p + 1
			// now find variables that are not arguments and require 'let'  
			///var lst = [] 
			//var q = this.findPair("{","}", this.stack) 
			//var sec = this.grab( this.stack+1 , q ) 
			/*for ( var i = 0; i < sec.length; i++ ) {
				var found = false
		 		for ( var ii = 0; ii < chk.length; ii+=4 ) {
					if ( sec[i] === chk[ii] ) found = true 	   
				}
				if ( found !== true ) { 
					if ( !this.isAssigned(sec[i],this.standard) && this.isString(sec[i]) && !this.isNumber(sec[i]) && sec[i+1] === '=' ) { 
						lst.push(sec[i]) 
					}
				} 
			} 
			lst = this.removeDuplicates(lst) 
			if ( lst.length !== 0 ) { // we actually had variables 
				this.ntokens.push( "let " ) 
				for ( var i = 0; i < lst.length; i++ ) { 
					if ( i === 0 ) { this.ntokens.push( lst[i] ) } else { this.ntokens.push( "," , lst[i] ) }
				} 
				this.ntokens.push("\n") 
			}
			*/
			this.next()	// move to next item in stack 
		}

		
		// ===================================================================
		// let openscad variables  
		// ===================================================================
		this.process_variables = () => {  
			console.log( "\n" , "test" , this.tokens[this.stack-1] , this.tokens[this.stack] ,this.tokens[this.stack+1] , "\n" ) 
			//this.ntokens.push( "let" , this.tokens[this.stack-1] , this.tokens[this.stack] ,this.tokens[this.stack+1] ) 
			//this.next()
			this.next()
		} 

		// ====================================================================
		// Process modules in to functions and arguments in to json 0.1 effort  
		// ====================================================================
		this.process_arguments_meh = () => {  
			let module_name = this.tokens[this.stack-1] // name of module 
			this.modules.push(module_name) 
			this.ntokens.push("\nthis." + module_name + " = () => { ") // then our rephrasing of function 		
			let p =  this.findPair("(",")",this.stack)  // get the end index p of arguments closure  
			let chk = this.grab(this.stack+1, p )       // get the section between stack and p of tokens
			let args = []  
			let i = 0 
			for ( i = 0; i < chk.length; i+=4 ) {     // push our passed arguments to scope of operations object  
				if ( chk[i+2] !== undefined ) { 		
					this.ntokens.push( "let " + chk[i+0] + " = this.default(arguments[0]['"+chk[i+0]+"']," + chk[i+2] + ")\n" )                     
				}    
			} 
			this.stack = p + 1
			// now find variables that are not arguments and require 'let'  
			let lst = [] 
			let q = this.findPair("{","}", this.stack) 
			let sec = this.grab( this.stack+1 , q ) 
			for ( let i = 0; i < sec.length; i++ ) {
				let found = false
		 		for ( ii = 0; ii < chk.length; ii+=4 ) {
					if ( sec[i] === chk[ii] ) found = true 	   
				}
				if ( found !== true ) { 
					if ( !this.isAssigned(sec[i],this.standard) && this.isString(sec[i]) && !this.isNumber(sec[i]) && sec[i+1] === '=' ) { 
						lst.push(sec[i]) 
					}
				} 
			} 
			lst = this.removeDuplicates(lst) 
			if ( lst.length !== 0 ) { // we actually had variables 
				this.ntokens.push( "let " ) 
				for ( i = 0; i < lst.length; i++ ) { 
					if ( i === 0 ) { this.ntokens.push( lst[i] ) } else { this.ntokens.push( "," , lst[i] ) }
				} 
				this.ntokens.push("\n") 
			}
			this.next()	// move to next item in stack 
		}

		// ==========================================================
		// Convert all arguments to Json
		// ==========================================================
		this.process_arguments_toJson = () => { 
			let i = 0 , arg_num = 0 , comma = ""    
			let p = this.findPair("(",")",this.stack) 
			let args = this.splitArguments( this.stack+1 , p ) 
			this.ntokens.push(this.tokens[this.stack-1],"(")
			for ( i = 0; i < args.length; i++ ) { 
				if ( this.seek("=",args[i],0) !== false ) { // Was it a variable assignment a = b 
					args[i] = args[i].replace("=",":")  
					arg_num++
				}
				else { // Then it is either a number or a string or something complex like array. 
						args[i] = "arg"+arg_num+":"+args[i]
						arg_num++
				}
				this.ntokens.push( comma , args[i] ) 
				comma = ","
			}
			this.stack = p  
		}

		// ==========================================================
		// Process trig functions 
		// ==========================================================
		this.process_trig = () => { 
			this.ntokens.push(" this.")
			this.ntokens.push(this.tokens[this.stack-1]) 
		}

		// =====================================================================
		// Process operations 
		// ===================================================================== 
		this.process_operations = () => {   
			this.stack--; // because we moved forwards on '(' but we want to be on the operation 
			this.ntokens.push("\nthis."+this.tokens[this.stack])+"\n"
			let operation = this.tokens[this.stack]
			this.next()
			// closure around operations which we CANNOT disguard	
			let p =  this.findPair("(",")",this.stack)
			if ( this.tokens[p+1] === "{" ) { 
				let q = this.findPair("{","}",p+1)
				this.tokens[p+1]=""
				if ( q !== -1 ) this.tokens[q]="\nthis.stack_decrement(1)\n" 
			}  
			this.ntokens.push("(")	
				let chk = this.grab(this.stack+1, p )       
				this.ntokens.push("{")
				let i = 0
				for ( i = 0; i < chk.length; i++ ) {
					if ( chk[i] === "=" ) { this.ntokens.push(":") } else { this.ntokens.push(chk[i]) }   
					this.next()
				}	
				this.ntokens[this.ntokens.length] = "}"
		
			this.next()
		}

		// ============================================================
		// Attempt to fix loose /  implied closure
		// ()  (){ (){ (); (())  (());   (())  ();   } ()  ()  ();       } 
		// (){ (){ (){ (); (  ){ (  ); } (  ){ (); } } (){ (){ (); } } } }
		// ============================================================
		this.fixClosure = () => {  
			let i , ii , closure = [] , index = [] , p_closure = 0    
			let lst = [ "(" , ")" , "{" , "}" , ";" ]
			// generate list of pure closure and hash table so we can merge fixed closure back in when done 
			for ( i = 0; i < this.tokens.length; i++ ) { 
				if ( this.isAssigned(this.tokens[i],lst) ) {
					let id = this.makeId()
					closure.push(this.tokens[i]) 
					index.push( { token: this.tokens[i] , index: i , hash: id , state: false  , additions: [] } ) 
					this.tokens[i] = id
				}
			}  
			// Any sub closure contained in primary closure becomes false giving us clean condensed closure list 
			i = 0 
			while ( i < closure.length ) { 
				let p = this.findPair("(",")",i,closure)
				if ( p!==-1 ) {
					index[i]['state']=true
					index[p]['state']=true
					i = p					 
				}
				else if ( closure[i] === "{" || 
									closure[i] === "}" ||
									closure[i] === ";" 	  ){
					index[i]['state']=true
				} 
				i++
			}
			// now repair bad closure on the rules )( => ){( , } => } + }*p_closure , ; => + }*p_closure  
			i = 0 
			while ( i < closure.length) { 
				if ( closure[i+0] === ")" && closure[i+1] === "(" && index[i]['state'] === true && index[i+1]['state'] === true ) { 
					index[i+0]['additions'].push("{"); 
					p_closure++ 
				} 
				else if ( closure[i]==="{" && index[i]['state'] === true && p_closure > 0 ) { 
					let p = this.findPair("{","}",i,closure)
					for ( ii = 0; ii < p_closure; ii++ ) index[p]['additions'].push("}")
					p_closure = 0 
				}
				else if ( closure[i]===";" && index[i]['state'] === true && p_closure > 0 ) { 
					for ( ii = 0; ii < p_closure; ii++ ) index[i]['additions'].push("}")
					p_closure = 0 
				} 
				i++	 
			}
			// reinsert repaired closure 
			for ( i = 0; i < index.length; i++ ) { 
				let hash = index[i]['hash'] 
				for ( ii = 0; ii < this.tokens.length; ii++ ) { 
					if ( this.tokens[ii] === hash ) { 
						this.tokens[ii] = index[i]['token'] 
						this.insert( ii+1 , index[i]['additions'].reverse() ) 
					}
				}
			}
			if ( this.isClosed() === false ) { 
				callback.updateLog("Incomplete or Malformed Closure\n")  
				return false   
			}

		}
	
		// ==========================================================
		// Handle parsing for next loops
		// ==========================================================
		this.process_forloops = () => {  
			let p =  this.findPair("(",")",this.stack)
			let chk = this.grab(this.stack+1, p )  
			let variable = chk[0] 
			let arg = ""
			let fields = [] 
			let i = 0 
			for ( i = 3; i < chk.length-1;i++ ) {
				if ( chk[i] === ":" ) { fields.push(arg); arg = "" } else { arg+=chk[i] } 
			}  
			fields.push(arg) 
			if ( fields.length === 2 ) { // [0:10]
				if ( fields[0] < fields[1] ) {  // positive increment
					this.ntokens.push("for","(", variable , "=" , fields[0] , ";" , variable , "<=" , fields[1] , ";" , variable , "++" )    
				}
				else { // negative increment 
					this.ntokens.push("for","(", variable , "=" , fields[0] , ";" , variable , ">=" , fields[1] , ";" , variable , "--" )    
				}
			} 		
			else if ( fields.length === 3 ) { //  [0:45:360]
				if ( fields[0] < fields[2] ) {  // positive increment
					this.ntokens.push("for","(", variable , "=" , fields[0] , ";" , variable , "<=" , fields[2] , ";" , variable , "+=" , fields[1] )    
				}
				else { // negative increment 
					this.ntokens.push("for","(", variable , "=" , fields[0] , ";" , variable , ">=" , fields[2] , ";" , variable , "-=" , fields[1] )    
				}  
			}
			else { 
				// we must be a for each 
			}
			this.stack = p  
		}

		// =============================================================
		// This language contains so many stupid random fringe cases 
		// none of which seem to feature any sane or meaningful closure
		// =============================================================
		this.process_assign = () => {
			postLog( "This code contains assigns. These are depreciated since 2015.03." )
			this.next() 
		}

		// ==========================================================
		// dump output to console 
		// ==========================================================
		this.dump = () => {
			let i = 0 
			let lines = ""	
			for ( i = 0; i < this.ntokens.length; i++ ) {
				if ( this.ntokens[i] === "}" ) this.ntokens[i] += "\n" 
				if ( this.ntokens[i] === ";" ) this.ntokens[i] += "\n" 
				if ( this.ntokens[i] === "{" ) this.ntokens[i] = "\n" + this.ntokens[i]  
				if ( this.ntokens[i] === "}" ) this.ntokens[i] = "\n" + this.ntokens[i]   
				if ( this.ntokens[i] === ")" ) this.ntokens[i] = "\n" + this.ntokens[i] 
				if ( this.ntokens[i] === ";" ) this.ntokens[i] = "\n" + this.ntokens[i] 
				if ( this.ntokens[i][0] === "/" && this.ntokens[i][1] === "/" ) this.ntokens[i] = "\n" + this.ntokens[i] + "\n"
				lines+=this.ntokens[i]
			}
			return lines 
		}

		// ==========================================================
		// dump raw tokens 
		// ==========================================================
		this.dump_raw = () => { 
			console.log( this.ntokens ) 
		}

		// copy to previous token 
		this.copy_previous = () => { 
			this.ntokens.push( this.tokens[this.stack-1] ) // make sure to include previous token if we failed 
			this.copy() 
		}
		
		// ==========================================================
		// Simple grammar type object 
		// ==========================================================
		this.gram = [ 
			// parse boolean instructions
			// traverse a descent tree of boolean instr till we reach a goal ( sometimes another start ) 
			[ 
				[["difference" , "intersection" , "union" , "minkowski"] , NEXT  ,  COPY  ] ,
				[ ["("                                     ] ,             NEXT  ,  COPY  ] , 
				[	[")"                                     ] ,             NEXT  ,  COPY  ] , 
				[	["{"                                     ] , PROCESS_BOOLEANS  ,  COPY  ]                        
			], 	  
			// parse function instructions
			[
				[["function"] , NEXT ,             COPY ], // are we a function 
				[["STRING"]   , NEXT ,             COPY ], // do we have a string name 
				[["("     ]   , PROCESS_FUNCTIONS ,COPY ]  
			],			
			// parse modules
			[
				[["module"],NEXT ,             COPY ], // are we a module 
				[["STRING"],NEXT ,             COPY ], // do we have a string name 
				[["("     ],PROCESS_ARGUMENTS ,COPY ]  
			],
			// parse variables 
			//[
					//		[["STRING"], NEXT             , COPY ], // are we a module 
					//		[["="]     , PROCESS_VARIABLES, COPY ] // do we have a string name 	 
					//],		
			// Process arguments in to json strings   
			[
				[ MODULES  ,  NEXT  ,   COPY ] ,
				[["("  ] ,  PROCESS_ARGUMENTS_TOJSON , COPY_PREVIOUS	]
			],			
			// parse openscad operations ( rotate , translate , scale ... )   
			[
				[ MODULES ,  NEXT                  ,  COPY          ] ,
					[["("  ]  ,  PROCESS_OPERATIONS    ,  COPY_PREVIOUS ]
			],
			// parse for loops   
			[
				[["for"] ,  NEXT              ,  COPY   ] ,
				[["("  ]  , PROCESS_FORLOOPS  ,  COPY   ]
			],			
			// parse trig instructions   
			[
				[["sin","cos","atan2","pow","sqrt","min","max"] , NEXT,  COPY  ] ,
				[["("  ]  ,  PROCESS_TRIG ,  COPY ]
			],			
			// parse assign instructions   
			[
				[["assign"] ,  PROCESS_ASSIGN ,  COPY ] 
			]
		]

		// ==========================================================
		// List of hooks to be called. 
		// ==========================================================
		this.hooks = (hook) => { 
			if ( hook === "NEXT"                     ) this.next()            
			if ( hook === "COPY"                     ) this.copy() 
			if ( hook === "PROCESS_FUNCTIONS"        ) this.process_functions()  
			if ( hook === "PROCESS_ARGUMENTS"      	 ) this.process_arguments()  			
			if ( hook === "PROCESS_ARGUMENTS_TOJSON" ) this.process_arguments_toJson() 
			if ( hook === "PROCESS_OPERATIONS"			 ) this.process_operations()   
			if ( hook === "PROCESS_FORLOOPS" 			   ) this.process_forloops() 		
			if ( hook === "PROCESS_TRIG"        		 ) this.process_trig()
			if ( hook ===	"PROCESS_ASSIGN"		       ) this.process_assign()  
		} 
		
		// ==========================================================
		// start here to begin walking tree 
		// ==========================================================
		this.start = () => {  

			console.log( "gram" , this.gram ) 

			// Repair implied closure 
			if ( this.fixClosure() === false ) { 
				return false 
			}
			else {    
				let set = 0 
				for ( set = 0; set < this.gram.length; set++ ) { 
					this.stack = 0 
					while ( this.stack < this.tokens.length ) { // walk our stack of tokens 	
						this.walk(this.gram[set]) 	  
					} 
				}
			}	
		}

}
	
	
		 */


	 
	





