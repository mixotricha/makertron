 
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
	const lodash = require('lodash') 
	const fs = require("fs");

	// =========================================================================================
	// Lex the input string against regexp set
	// =========================================================================================
	const preProcess = buffer => {
 
		const expressions = [ /(\{)/ , /(\})/ , /(\()/ , 
												/(\))/ , /(\[)/ , /(\])/ , 
												/(\;)/ , /(\:)/ , /(\=)/ , 
												/(\+)/ , /(\-)/ , /(\*)/ , 
												/(\<)/ , /(\/)/ , /(\,)/ , 
												/(\#\$\%\^)/, 
												/(module)/, /(function)/, /\n/] 
		
		buffer = buffer.replace(/(==)/g,'\#\$\%\^')
		buffer = buffer.replace(/(!=)/g,'\@\^\!\^')
		buffer = buffer.replace(/([\t])/g,'') 
		buffer = buffer.split(/ /)
		expressions.forEach( (regExp) => {
			buffer = lodash.flatten(buffer.map(tkn => tkn.split(regExp)))  	
		})

		buffer = buffer.map( tkn => tkn.replace(/(\#\$\%\^)/g,'===').replace(/(\@\^\!\^)/g,'!==') )  
		
		return buffer.filter( tkn => tkn !== '' ? true : false )   
	}

	// =========================================================================================
	// Generate a hashed string
	// =========================================================================================
	const makeId = () => {  
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		return [0,0,0,0,0].map( tkn => possible.charAt(Math.floor(Math.random() * possible.length))).join('') 
	}

	// =========================================================================================
	// Is this token an operation // operations is currently global :( 
	// =========================================================================================
	const isToken = (tkn,ops) => {			
		return ops.reduce( (stack,op) => op === tkn ? stack = true : stack , false )  
	}

	// =========================================================================================
	// Is a token a string 
	// =========================================================================================
	const isString = token => {	
		token = token.replace(/([A-Z-a-z])/g,'')
		token = token.replace(/([0-9])/g,'')
		token = token.replace(/(['_'])/g,'')
		token = token.replace(/(['$'])/g,'') // because some variables start with $ 
		token = token.replace(/(['_'])/g,'')  
			
		return token.length === 0 ? true : false
	}
	
	// =========================================================================================
	// Is a token a number ?
	// =========================================================================================
	const isNumber = token => {
		if ( token === undefined ) var token = this.tokens[this.stack]
		token = token.replace(/([0-9])/g,'')
		token = token.replace(/([.])/g,'')
		token = token.replace(/([-])/g,'')
		token = token.replace(/([+])/g,'')
		return token.length === 0 ? true : false
	}

	// =========================================================================================
	// Tokens : find matching closure 
	// =========================================================================================
	const findPair = (lft,rt,lftCount,rtCount,index,lst,pullThrough) => { 
		pullThrough(lst[index]) === lft ? lftCount++ : lftCount  
		pullThrough(lst[index]) === rt ? rtCount++ : rtCount  
		return ( index > lst.length ) ? -1 
			: ( lftCount === 0 && rtCount === 0 ) ? -1 
			: ( lftCount === rtCount ) ? index 
			: findPair(lft,rt,lftCount,rtCount,index+1,lst,pullThrough)
	}
	
	// =============================================================
	// enumerate through a json data structure 
	// =============================================================
	const enumerate = ( data , task , eva ) => {
		task( data )  
		data.state = eva( data ) 
		return data.state ? enumerate ( data , task , eva ) : data  
	}

	// =========================================================================================
	// Convert stream to string 
	// =========================================================================================
	const streamToString = stream => stream.reduce( (stack,tkn) => stack + tkn + " ", '' )  

	// =========================================================================================
	// Build list of modules from stream 
	// =========================================================================================
	const buildModuleList = stream => {
		let stack = [] 
		stream.forEach( (element,index) => {
			if ( element === "module" ) stack.push( stream[index+1] )   
		})
		return stack 
	}

	// ======================================================
	// convert function declarations to js functions 
	// ======================================================

	//function polar_to_cartesian (polar) = [
	//	polar[1]*cos(polar[0]),
	//	polar[1]*sin(polar[0])
	//];

	//function polar_to_cartesian(polar) { return (data) => [ polar[1]*cos(polar[0]), polar[1]*sin(polar[0]) ]; } 

	const reformatFunctions = stream => { 
		// *** enumerate task func
		const task = (data) => { 
			let row = data.stream[data.index]
			if ( row.tkn === "function" ) {
				row.head = lodash.flatten([ 'function' , row.head[0] , row.head[1] , '{' , 'return' ]) // flatten why ? 
				row.tail = ['}']   				
				data.stream[data.index] = row
			}
			data.index++ 
			return data 
		} 
		// *** enumerate end condition 
		const eva = (data) => { return data.index < data.len ? true : false }
		return enumerate ( { index : 0 , stream : stream , len : stream.length , state : true  } , task , eva )
			.stream.reduce( (stack,row) => row.tkn !== '' ? stack.concat(row) : stack ,[])  

	}

	// =======================================================
	// convert module declarations to js functions 
	// =======================================================
	const reformatModules = stream => { 
		// *** enumerate task func
		const task = (data) => { 
			let rowA = data.stream[data.index]
			let rowB = data.stream[data.index+1] 
			if ( rowA.tkn === "module" ) {
				rowB.def = true 
				rowB.parent = rowA.parent
				rowB.head = [ 'function' , rowB.tkn  ]
				rowB.args = ['(','{'].concat( rowB.args.slice(1,rowB.args.length-1).concat('}',')') )  
				rowB.tail = '' 	
				rowB.func = true 
				rowA.tkn = ''					
				rowA.id = ''
				rowA.parent = ''
				data.stream[data.index] = rowA
			  data.stream[data.index+1] = rowB 			
			}
			data.index++ 
			return data 
		} 
		// *** enumerate end condition 
		const eva = (data) => { return data.index < data.len ? true : false }
		return enumerate ( { index : 0 , stream : stream , len : stream.length , state : true  } , task , eva )
			.stream.reduce( (stack,row) => row.tkn !== '' ? stack.concat(row) : stack ,[])  
	} 

	
	// ==================================================
	// Reformat calls to functions to be of a jsn format 
	// ==================================================
	const reformatCalls = stream => { 
		// *** Take arguments to function and split up in to array
		const argumentsToJson = (stream) => {
			let parameters = stream.slice( 1 , stream.length-1 ) 
			if ( parameters.length === 0 ) return ['{','}']  
			//  *** enumerating task for argumentsToJson
			let consumeDepth = (data) => {
				const tkn = data.parameters[data.index] 
				if ( tkn === data.lft ) { data.e = findPair(data.lft,data.rht,0,0,data.index,data.parameters,tkn=>tkn) }
				( data.index <= data.e && data.e > 0 ) ? data.parameters[data.index] = "|||||"+data.parameters[data.index] : data.e = 0 
				data.index++ 
				return data
			} 
			//  enumerating condition for enumerate for argumentsToJson	
			let evaConsumeDepth = (data) => { return data.index < data.len ? true : false }
			parameters = enumerate({ state:true , index: 0 , lft: '(' , rht: ')' , e: 0 , 
				parameters: parameters , len: parameters.length-1 } , consumeDepth , evaConsumeDepth ).parameters 
			parameters = enumerate({ state:true , index: 0 , lft: '[' , rht: ']' , e: 0 , 
				parameters: parameters , len: parameters.length-1 } , consumeDepth , evaConsumeDepth ).parameters 
		  parameters = enumerate({ state:true , index: 0 , lft: '{' , rht: '}' , e: 0 , 
				parameters: parameters , len: parameters.length-1 } , consumeDepth , evaConsumeDepth ).parameters 
			parameters = [","].concat( parameters ) // since all valid expressions begin with comma add one for first expression 
			// build index of tkn after ',' Is next token followed by relation or is it something else? 
			//If something else becomes argument. Otherwise becomes key : value pair
			const table = parameters.reduce( ( stack , tkn , index ) => tkn === ',' ? stack.concat(index+1) : stack , [] ) 
			table.forEach( (offset,index) => { 
				if ( isString(parameters[offset]) && parameters[offset+1] === "=" ) { 
					 parameters[offset+1] = ":" 
				}
				else { 
				 isString(parameters[offset]) || isNumber(parameters[offset]) ?  parameters[offset] = "arg: " + parameters[offset]  
					 : parameters.splice( offset , 0 ,  "arg" , ":" )	
			  } 		  
			})	
			return ['(','{'].concat(parameters.map( tkn => tkn.replace("|||||",'')).slice(1,parameters.length).concat(['}',')']))
		}
		// *** enumerating task for reformatCalls
		const task = (data) => { 
			let args = data.stream[data.index].args 
			const tkn = data.stream[data.index].tkn 
			if ( args !== '' && 
					 data.stream[data.index].def === false && 
					 tkn !== "if" 
					 && tkn !== "for" ) { // come back clean this up 
						data.stream[data.index].args = argumentsToJson( data.stream[data.index].args )
			}
			data.index++
			return data
		} 
		// *** enumerating condition for reformatCalls
		const eva = (data) => { return data.index < data.len ? true : false }
		return enumerate( { state:true , index : 0 , stream: stream , len: stream.length } , task , eva ).stream  
	}

	// =============================================================================
	// Reformats for loop(s) in to js format. Does not handle forEach equivalents yet
	// =============================================================================
	const reformatLoops = stream => { 
		// *** enumerateing task 
		const task = (data) => { 
			const rowA = data.stream[data.index] 
			if ( rowA.tkn === "for" ) { 
				console.log( "Snacks!" , rowA.args ) 
				const args = rowA.args			
 				const variable = args[1] 
				const fields = args.slice( 4 , args.length )
					.reduce( (stack,tkn) => tkn !== ":" && tkn !== ")" && tkn !== "]" ? stack.concat(tkn) 
						: stack ,[])  
				if ( fields.length === 2 ) { // [0:10]
					data.stream[data.index].args = fields[0] < fields[1] ?
						 [ variable , "=" , fields[0] , ";" , variable , "<=" , fields[1] , ";" , variable , "++"  ]// + 
						: [ variable , "=" , fields[0] , ";" , variable , ">=" , fields[1] , ";" , variable , "--" ]//-   		
				} 
				if ( fields.length === 3 ) { //  [0:45:360]
					data.stream[data.index].args = fields[0] < fields[2] ?
						[ variable , "=" , fields[0] , ";" , variable , "<=" , fields[2] , ";" , variable , "+=" , fields[1]  ]//+ 
						: [ variable , "=" , fields[0] , ";" , variable , ">=" , fields[2] , ";" , variable , "-=" , fields[1] ]//-   
				}  
				// if fields.length != 2 || 3 are we a forEach? will contain , values if we are
			}
			data.index++
			return data 
		}
		// *** enumerateing condition 
		let eva = (data) => { return data.index < data.len ? true : false }
		return enumerate( { index: 0 , stream : stream , len : stream.length , state: true  },task,eva).stream 
	}

	// =======================================================
	// convert assignments to 'let'  
	// =======================================================
	const reformatVariables = stream => { 
		// *** enumerate task func
		const task = (data) => { 
			let rowA = data.stream[data.index]
			if ( rowA.assignment.length !== 0  ) {			
				rowA.head = [ 'if (',  rowA.tkn , '===undefined) { var ' , rowA.tkn , ' }' , rowA.tkn ]   	
				data.stream[data.index] = rowA
			}
			data.index++ 
			return data 
		} 
		// *** enumerate end condition 
		const eva = (data) => { return data.index < data.len ? true : false }
		enumerate ( { index : 0 , stream : stream , len : stream.length , state : true  } , task , eva ).stream 
		return stream 
	}

 	// =======================================================
	// convert module declarations to js functions 
	// =======================================================
	const reformatCsgOps = stream => {  
		// *** enumerate task func
		const task = (data) => { 
			let rowA = data.stream[data.index]
			if ( isToken(rowA.tkn,csgOps) ) {			
				rowA.head = [ 'stack.push(' , rowA.tkn ]
				rowA.args.length !== 2 ? rowA.args = rowA.args.slice(1,rowA.args.length)  : rowA.args = [ '{' , " " , '}' , ')' ] 
				data.stream[data.index] = rowA
			}
			data.index++ 
			return data 
		} 
		// *** enumerate end condition 
		const eva = (data) => { return data.index < data.len ? true : false }
		return enumerate ( { index : 0 , stream : stream , len : stream.length , state : true  } , task , eva ).stream 
	} 


//function polar_to_cartesian (polar) = [

	// =============================================================================
	// Bulds Par/Child linked list of operations
	// =============================================================================
	const buildFullTree = (stream) => {

		// Any operations we want to call at the JS level but that are 
		// not directly native like sin/cos/sqrt.  
		stream = stream.map( tkn => isToken(tkn,trigOps) ? "O"+tkn : tkn ) 
		
		// *** Generate a row entry for a token. Break out arguments if it has any.   
		const considerRow = (data) => {
				let tkn = data.stream[data.index]  
				let args = '' // function arguments 
				let assign = '' // assignments for variables
				let fbody = '' // function bodies ( not modules ) 
				let head = ''  // head of rewritten row 
				let tail = ''  // tail of rewritten row 
				let end = -1
				// if we are csgOp or genOp or cloOp or modOp pick up parameters
				if ( isToken(tkn,csgOps) || 
						 isToken(tkn,genOps) || 
						 isToken(tkn,cloOps) ||
						 isToken(tkn,modOps) ) { 
						 if ( data.stream[data.index+1] === "(" ) { 
						 		end = findPair('(',')',0,0,data.index+1,data.stream,tkn=>tkn) 
								args = data.stream.slice( data.index+1 , end+1 ) 
								data.index = end  									 
						 }
				} 
				else {  // we are some other form of expression assignment or function
					//Functions follow = ; pattern here. Parameters go in to the fbody  					
					if ( tkn === "function" ) { 
						if ( isString(data.stream[data.index+1]) ) { 
							if ( data.stream[data.index+2] === "(" ) { 
								end = findPair('(',')',0,0,data.index+2,data.stream,tkn=>tkn) 								
								head = [ data.stream[data.index+1] , data.stream.slice( data.index+2 , end+1 ) ]    
								data.index = end  	
								end = findPair('=',';',0,0,data.index+1,data.stream,tkn=>tkn)  
								fbody = data.stream.slice( data.index+2 , end+1 )
								data.index = end 																 
							}	
						}
					}
  				else { 
						// variable assignments go in to the assignment 
						if ( isString(tkn) && data.stream[data.index+1] === "=" ) {  
							end = findPair('=',';',0,0,data.index+1,data.stream,tkn=>tkn) 
							tkn = tkn.replace("$",'DOLLAR_SIGN_') // dollar signs bad 
							assign = data.stream.slice( data.index+1 , end+1 )
							data.index = end 
						}
					}
				}
				data.result = data.result.concat( {  'id'         : makeId() , 
																						 'children'   : false    , 
																						 'assignment' : assign   ,
																						 'fbody'      : fbody    , 
																						 'def'        : false    ,
                                             'parent'     : ''       , 
                                             'head'       : head     , 
                                             'tkn'        : tkn      , 
                                             'tail'       : tail     , 
                                             'closure'    : []       , 
                                             'args'       : args  } )
				data.index++ 
				return data 
		}
		// *** Build parent / child relationship graph 
		const buildRelations = (data) => { 
			const rowA = data.table[data.index]
			const tknA = rowA.tkn
			const rowB = data.table[data.index+1] // now needs to pick up offset somehow 
			const tknB = rowB.tkn 
			// parent child relationship  
			if ( isToken(tknA,csgOps) || isToken(tknA,genOps) || isToken(tknA,modOps) ) { 	//is operation
				if ( tknB === "{" ) { // has closure	
					data.table = setChildren(data.table,rowA.id,'{','}',data.index)  
					data.table[data.index].children = true 		
				}					
				if( isToken(tknB,csgOps) || isToken(tknB,genOps) || isToken(tknB,modOps) ) { // is another operation following on 
					data.table[data.index+1].parent = rowA.id
					data.table[data.index].children = true  
				}
			}			
			data.index++ 
			return data 
		}
		// *** Set group of children within {} to parent id 
		const setChildren = (table,id,lft,rht,st) => { 
			const end = findPair(lft,rht,0,0,st+1,table,rec=>rec.tkn) 
			if ( end !== -1 ) { 
				table.forEach( (row,index) => {
					if ( index > st && index < end ) row.parent = id 	
				})
			}
			return table 
		}
		// *** enumerate end condition 
		const eva = (data) => { return data.index < data.len ? true : false }
		// process rows in stream in to sub groups  	
		const table = enumerate( { state : true , index: 0 , stream: stream , len: stream.length , result : [] } , considerRow , eva ).result 
		// build parent / child relationship and eliminate unwanted tokens 
		return enumerate( { state : true , index: 0 , table: table , len: table.length-1 } , buildRelations , eva )
			.table
				.reduce( (stack,row) => 
						isToken(row.tkn,csgOps) || 
							isToken(row.tkn,genOps) || 
								isToken(row.tkn,modOps) ||
									row.assignment.length !== 0 ||
									row.fbody.length !== 0   
									? stack.concat(row) : stack ,[])	 
	} 

	// =======================================
	// construct code back out from tree 
	// =======================================
	const codeFromTree = (stream) => { 		
		//stream.map( (row) => [{ id: row.id , parent: row.parent , children: row.children ,  token: row.tkn }] ) ) 
		// All terminal nodes as indicated in build tree function by children = false  
		const terminals = stream.reduce( (stack,row,index) => row.children === false ? stack.concat( index ) : stack , [] ) 
		// *** enumerate task works from terminals to specified roots to find the 'furthest' child  
		const task = (data) => { 
			const row = data.stream[data.index]  
			if ( row.id === data.id ) { 
				if ( data.id === data.root ) data.result = true   
				data.id = row.parent 
			}	
			data.index--
			return data
		}
		// *** enumerate end 
		const eva = (data) => { return data.index >= 0 ? true : false }
		// iterate through every node specifing as root and handing to enumerate task to see if they own the specified terminal node 
		let cStack = [] 
		stream.forEach( row => {
			let rStack = []   
			terminals.forEach( term => {  	
				let state = enumerate( { state : true , root: row.id , id: stream[term].id , index: term , stream: stream , result: [] } , task , eva )
					.result 
				 	if ( state === true && row.id !== stream[term].id ) { rStack.push( stream[term].id ) }
			})
			if ( rStack.length !== 0 ) cStack.push( { root: row.id , term : rStack[rStack.length-1]} )
		}) 
		// iterate through stream to find each root and each 'furthest' child. This is where we put our closure  
		cStack.forEach( pair => { 
			let csg = false , st = '{' , en = '}' 
			stream.forEach( row => {
				if ( pair.root === row.id ) { if ( isToken(row.tkn,csgOps) ) { csg = true } }
				if ( csg === true ) { 
					st = "\nstack.push(start())\n" 
					en = "\nstack.push(end())\n" 
				}
				if ( pair.root === row.id ) { row.tail = row.tail.concat(st) } 
				if ( pair.term === row.id ) { row.closure = row.closure.concat(en) }
			})	
		})
		// generate concat of head tkn argument and tail for each row 
		stream.forEach( (row) => { 
			row.result = []
			// if we have a head otherwise begin with the tkn 
			row.head.length !== 0 ? row.result = row.result.concat(row.head) : row.result = row.result.concat(row.tkn)  
			// Some operations like 'else' and assignments to be excluded from having () 

			if ( row.args.length === 2 ) row.args = ['(','{','}',')']

			// not an assignment not excluded op not a module 
			if ( !isToken( row.tkn , excOps ) && 
					 row.assignment.length === 0 && 
					 !isToken(row.tkn,modOps) 
				) { row.result = row.result.concat('(',row.args,')') }
			// if it is arguments to module 
			if ( isToken(row.tkn,modOps) ) { row.result = row.result.concat(row.args) } 
			// if we have an assignment 	
			if ( row.assignment.length !== 0 ) { row.result = row.result.concat(row.assignment) }
			// if we have a function body 
			if ( row.fbody.length !== 0 ) { row.result = row.result.concat(row.fbody) }
			// if we have a tail 
			if ( row.tail.length !== 0 ) { row.result = row.result.concat( row.tail ) }
			// if we have some final closure 
			if ( row.closure.length !== 0 ) { row.result = row.result.concat( row.closure.reverse() ) } // Still not clear about the reverse here ! Why ?  
		})  
		return stream  
	} 

	// ========================================================
	// Basic reformatting of generated code before revaluation 
	// ========================================================
	const PolishOutput = stream => { 
		let res = stream.reduce( (output,row) => {
			output += "\n" + streamToString(row.result) + "\n" 
			return output 				 
		}, "" )   
		return res 
	} 

	// scad example 
	//const scad = 'module foo () { module blah() { union ( ) { cube (size=0.6); } } difference() { if ( 1 === 1 ) for (x=[0:10:20]) rotate ([x,0,0]) { translate([5,0,0]) { if ( 2 === 2 ) { cylinder (size=5); } else { sphere(r=7); } } translate ([90,0,0]) rotate ([5,5,5]) sphere (r=5); } } cube(size=0.4); blah(); }'

	let scad = fs.readFileSync('test.scad', 'utf8');

	const src = preProcess( scad ) 

	// general operations 
	const genOps = [ "for","if" ,"else","module"] 

	// constructive solids operations 
	const csgOps = ["difference","intersection","union",
										"circle", "sphere","translate",
										"scale","rotate","cube",
										"cylinder","linear_extrude","polygon",
										"polyhedron","echo","colour","color",]

	// closure operations 
	const cloOps = [ ";" , "{" , "}" ] 

	// Module operations  
	const modOps = buildModuleList( src )

	// Operations that shall be excluded from having arguments 	
	const excOps = [ "else" , "function" ] 

	const trigOps = [ "cos" , "sin" , "atan2" , "pow" , "sqrt" , "max" , "min" ] 

	let header = "let stack = []; const start = () => ['{']; const end = () => ['}']; const union = (...args) => ['union','(',JSON.stringify(args[0]),')'];const difference = (...args) => ['difference','(',JSON.stringify(args[0]),')']; const intersection = (...args) => ['intersection','(',JSON.stringify(args[0]),')']; const translate = (...args) => ['translate','(',JSON.stringify(args[0]),')']; const rotate = (...args) => ['rotate','(',JSON.stringify(args[0]),')']; const scale = (...args) => ['scale','(',JSON.stringify(args[0]),')']; const cube = (...args) => ['cube','(',JSON.stringify(args[0]),')']; const sphere = (...args) => ['sphere','(',JSON.stringify(args[0]),')']; const cylinder = (...args) => ['cylinder','(',JSON.stringify(args[0]),')']; const color = (...args) => ['color','(',JSON.stringify(args[0]),')']; const polygon = (...args) => ['polygon','(',JSON.stringify(args[0]),')']; const circle = (...args) => ['circle','(',JSON.stringify(args[0]),')']; const echo = (...args) => ['echo','(',JSON.stringify(args[0]),')']; const version = (...args) => ['version','(',JSON.stringify(args[0]),')'];"


let trig = ' const truncate = (num, places) => num; const deg2rad  = (deg) => deg * (Math.PI/180);  const rad2deg  = (rad) => (rad * 180)/Math.PI; const Ocos     = (rad) => truncate(Math.cos(deg2rad(rad)),4); const Osin     = (rad) => truncate(Math.sin(deg2rad(rad)),4); const Oatan2   = (a,b) => truncate(Math.atan2(a,b),4); const Opow     = (a,b) => truncate(Math.pow(a,b),4);   const Osqrt    = (a)   => truncate(Math.sqrt(a),4);    const Omax     = (a,b) => truncate(Math.max(a,b),4);   const Omin     = (a,b) => truncate(Math.min(a,b),4);'  	

	let footer = "foo({}); return stack"

	//console.log(src) 

	// 1. Generate parent/child tree
	// 2. Reformat variable assignments
	// 3. Reformat function call arguments to json  
	// 4. Reformat module format to js functions 
	// 5. Reformat loops to js loops 
	// 6. convert all CSG operations to stack pushes 
	
	const newTree = reformatCsgOps( reformatLoops( reformatCalls( reformatModules( reformatVariables( reformatFunctions( buildFullTree(src) ) ) ) ) ) )    

	//const newTree =  reformatModules( reformatCalls( reformatVariables( reformatFunctions( buildFullTree(src) ) ) ) )     

	//console.log( newTree ) 

	// Build new code from tree
	const result = header + trig + PolishOutput( codeFromTree ( newTree ) ) + footer    
	
	//console.log( result ) 
	
	let stack = new Function(result)();
	//console.log( stack ) 
	let output = stack.map( row => streamToString(row) ) 
	console.log( streamToString(output) ) 




