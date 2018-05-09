 
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
		const expressions = [ /([\t])/g , /(\{)/ , /(\})/ , /(\()/ , 
												/(\))/ , /(\[)/ , /(\])/ , 
												/(\;)/ , /(\:)/ , /(\=)/ , 
												/(\+)/ , /(\-)/ , /(\*)/ , 
												/(\<)/ , /(\/)/ , /(\,)/ , 
												/(module)/, /\n/] 
		buffer = buffer.split(/ /)
		expressions.forEach( (regExp) => {
			buffer = lodash.flatten(buffer.map( tkn => tkn.split(regExp)))  	
		}) 
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
	const reformatFunctions = stream => { 
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
				//rowB.id = rowA.id 
				rowB.parent = rowA.parent
				rowB.head = [ 'const' , rowB.tkn , '=' ]  
				rowB.tail = '=>' 	
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
					if ( isString(parameters[offset]) || isNumber(parameters[offset]) ) { 
						 parameters[offset] = "arg: " + parameters[offset]  
					}
					else { 
						parameters.splice( offset , 0 ,  "arg" , ":" )	
					}
			  } 		  
			})	
			return ['{'].concat(parameters.map( tkn => tkn.replace("|||||",'')).slice(1,parameters.length).concat(['}'])) 
		}
		// *** enumerating task for reformatCalls
		const task = (data) => { 
			let args = data.stream[data.index].args 
			const tkn = data.stream[data.index].tkn 
			if ( args !== '' && !isToken(tkn,genOps) ) { 
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
	// convert module declarations to js functions 
	// =======================================================
	const reformatCsgOps = stream => {  
		// *** enumerate task func
		const task = (data) => { 
			let rowA = data.stream[data.index]
			if ( isToken(rowA.tkn,csgOps) ) {			
				rowA.head = [ 'stack.push(' , rowA.tkn ]  
				rowA.tail = [')'] 	
				data.stream[data.index] = rowA
			}
			data.index++ 
			return data 
		} 
		// *** enumerate end condition 
		const eva = (data) => { return data.index < data.len ? true : false }
		return enumerate ( { index : 0 , stream : stream , len : stream.length , state : true  } , task , eva ).stream 
	} 

	// =============================================================================
	// Bulds Par/Child linked list of operations
	// =============================================================================
	const buildFullTree = (stream) => {
		// *** Fold arguments in to each operation row 
		const foldInArgs = (data) => {
				const tkn = data.stream[data.index]  
				let args = ''
				let end = -1  
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
				data.result = data.result.concat( {  'id': makeId() , children: false , 'parent': '' , head: '', 'tkn': tkn , tail: '' , closure:[], args: args } )
				data.index++ 
				return data 
		}
		// *** Build parent / child relationship graph 
		const buildRelations = (data) => { 
			const rowA = data.table[data.index]
			const tknA = rowA.tkn
			const rowB = data.table[data.index+1] // now needs to pick up offset somehow 
			const tknB = rowB.tkn 
			if ( isToken(tknA,csgOps) || isToken(tknA,genOps) || isToken(tknA,modOps) ) { 	//is operation
				if ( tknB === "{" ) { 	
					data.table = setChildren(data.table,rowA.id,'{','}',data.index) // has closure 
					data.table[data.index].children = true 		
				}					
				if( isToken(tknB,csgOps) || isToken(tknB,genOps) || isToken(tknB,modOps) ) { // is another operation 
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
		const table = enumerate( { state : true , index: 0 , stream: stream , len: stream.length , result : [] } , foldInArgs , eva ).result 
		return enumerate( { state : true , index: 0 , table: table , len: table.length-1 } , buildRelations , eva )
			.table
				.reduce( (stack,row) => 
						isToken(row.tkn,csgOps) || 
							isToken(row.tkn,genOps) || 
								isToken(row.tkn,modOps) 
									? stack.concat(row) : stack ,[])	 
	} 


	// =======================================
	// construct code 
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
			if ( row.head.length !== 0 ) {
				row.result = row.result.concat(row.head) 
			}
			else { row.result = row.result.concat(row.tkn) } 
			// Some operations like 'else' to be excluded from having () 
			if ( !isToken( row.tkn , excOps )  ) { row.result = row.result.concat('(',row.args,')') }
			if ( row.tail.length !== 0 ) { row.result = row.result.concat( row.tail ) }
			if ( row.closure.length !== 0 ) { row.result = row.result.concat( row.closure.reverse() ) } // Still not clear about the reverse here ! Why ?  
		})  
		return stream  
	} 

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
	const excOps = [ "else" ] 

	// 1. Generate parent/child tree
	// 2. Reformat function call arguments to json  
	// 3. Reformat module format to js functions 
	// 4. Reformat loops to js loops 
	// 5. convert all CSG operations to stack pushes 
	
	const newTree = reformatCsgOps( reformatLoops( reformatModules( reformatCalls( buildFullTree(src) ) ) ) )    
   
	// Build new code from tree
	const result = PolishOutput( codeFromTree ( newTree ) )  
	
	//console.log( result ) 
	
	// Following is an example of a stack generated by the code above 

	let stack = [] 

	const start = () => ['('] 
	const end = () => [')'] 
	const union = (...args) => ['union','(',JSON.stringify(args[0]),')']
	const difference = (...args) => ['difference','(',JSON.stringify(args[0]),')'] 
	const intersection = (...args) => ['intersection','(',JSON.stringify(args[0]),')'] 
	const translate = (...args) => ['translate','(',JSON.stringify(args[0]),')'] 
	const rotate = (...args) => ['rotate','(',JSON.stringify(args[0]),')'] 
	const scale = (...args) => ['scale','(',JSON.stringify(args[0]),')'] 

 	const cube = (...args) => ['cube','(',JSON.stringify(args[0]),')'] 
	const sphere = (...args) => ['sphere','(',JSON.stringify(args[0]),')'] 
	const cylinder = (...args) => ['cylinder','(',JSON.stringify(args[0]),')'] 
	const color = (...args) => ['color','(',JSON.stringify(args[0]),')'] 
	const Osin = (...args) => ['Osin','(',JSON.stringify(args[0]),')'] 
	const echo = (...args) => ['echo','(',JSON.stringify(args[0]),')'] 
	const version = (...args) => ['version','(',JSON.stringify(args[0]),')'] 

		const foo = ( { } ) =>{ 
			const debug = true 
			stack.push( difference ( { } ) ) 
			stack.push(start())
				stack.push( intersection ( { } ) ) 
				stack.push(start())
					body ( { } ) 
					intersector ( { } ) 
				stack.push(end())
				holes ( { } ) 
			stack.push(end())
		 
			if ( ( debug ) ) { helpers ( { } ) } 

		} 

		const body = ( { } ) =>{ 

		stack.push( color ( { arg : "Blue" } ) ) 
		stack.push(start())
		 

		stack.push( sphere ( { arg: 10 } ) ) 
		stack.push(end())
		 } 

		const intersector = ( { } ) =>{ 

		stack.push( color ( { arg : "Red" } ) ) 
		stack.push(start())
		 

		stack.push( cube ( { arg: 15 , center : true } ) ) 
		stack.push(end())
		 } 

		const holeObject = ( { } ) =>{ 

		stack.push( color ( { arg : "Lime" } ) ) 
		stack.push(start())
		 

		stack.push( cylinder ( { h : 20 , r : 5 , center : true } ) ) 
		stack.push(end())
		 } 

		const intersected = ( { } ) =>{ 

		stack.push( intersection ( { } ) ) 
		stack.push(start())
		 

		body ( { } ) 

		intersector ( { } ) 
		stack.push(end())
		 } 

		const holeA = ( { } ) =>{ 

		stack.push( rotate ( { arg : [ 0 , 90 , 0 ] } ) ) 
		stack.push(start())
		 

		holeObject ( { } ) 
		stack.push(end())
		 } 

		const holeB = ( { } ) =>{ 

		stack.push( rotate ( { arg : [ 90 , 0 , 0 ] } ) ) 
		stack.push(start())
		 

		holeObject ( { } ) 
		stack.push(end())
		 } 

		const holeC = ( { } ) =>{ 

		holeObject ( { } ) } 

		const holes = ( { } ) =>{ 

		stack.push( union ( { } ) ) 
		stack.push(start())
		 

		holeA ( { } ) 

		holeB ( { } ) 

		holeC ( { } ) 
		stack.push(end())
		 } 

		const helpers = ( { } ) =>{ 

		const line = ( { } ) =>{ 

		stack.push( color ( { arg : "Black" } ) ) 
		stack.push(start())
		 

		stack.push( cylinder ( { r : 1 , h : 10 , center : true } ) ) 
		stack.push(end())
		 } 

		stack.push( scale ( { arg: 0.5 } ) ) 
		stack.push(start())
		 

		stack.push( translate ( { arg : [ - 30 , 0 , - 40 ] } ) ) 
		stack.push(start())
		 

		intersected ( { } ) 

		stack.push( translate ( { arg : [ - 15 , 0 , - 35 ] } ) ) 
		stack.push(start())
		 

		body ( { } ) 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ 15 , 0 , - 35 ] } ) ) 
		stack.push(start())
		 

		intersector ( { } ) 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ - 7.5 , 0 , - 17.5 ] } ) ) 
		stack.push(start())
		 

		stack.push( rotate ( { arg : [ 0 , 30 , 0 ] } ) ) 
		stack.push(start())
		 

		line ( { } ) 
		stack.push(end())
		 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ 7.5 , 0 , - 17.5 ] } ) ) 
		stack.push(start())
		 

		stack.push( rotate ( { arg : [ 0 , - 30 , 0 ] } ) ) 
		stack.push(start())
		 

		line ( { } ) 
		stack.push(end())
		 
		stack.push(end())
		 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ 30 , 0 , - 40 ] } ) ) 
		stack.push(start())
		 

		holes ( { } ) 

		stack.push( translate ( { arg : [ - 10 , 0 , - 35 ] } ) ) 
		stack.push(start())
		 

		holeA ( { } ) 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ 10 , 0 , - 35 ] } ) ) 
		stack.push(start())
		 

		holeB ( { } ) 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ 30 , 0 , - 35 ] } ) ) 
		stack.push(start())
		 

		holeC ( { } ) 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ 5 , 0 , - 17.5 ] } ) ) 
		stack.push(start())
		 

		stack.push( rotate ( { arg : [ 0 , - 20 , 0 ] } ) ) 
		stack.push(start())
		 

		line ( { } ) 
		stack.push(end())
		 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ - 5 , 0 , - 17.5 ] } ) ) 
		stack.push(start())
		 

		stack.push( rotate ( { arg : [ 0 , 30 , 0 ] } ) ) 
		stack.push(start())
		 

		line ( { } ) 
		stack.push(end())
		 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ 15 , 0 , - 17.5 ] } ) ) 
		stack.push(start())
		 

		stack.push( rotate ( { arg : [ 0 , - 45 , 0 ] } ) ) 
		stack.push(start())
		 

		line ( { } ) 
		stack.push(end())
		 
		stack.push(end())
		 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ - 20 , 0 , - 22.5 ] } ) ) 
		stack.push(start())
		 

		stack.push( rotate ( { arg : [ 0 , 45 , 0 ] } ) ) 
		stack.push(start())
		 

		line ( { } ) 
		stack.push(end())
		 
		stack.push(end())
		 

		stack.push( translate ( { arg : [ 20 , 0 , - 22.5 ] } ) ) 
		stack.push(start())
		 

		stack.push( rotate ( { arg : [ 0 , - 45 , 0 ] } ) ) 
		stack.push(start())
		 

		line ( { } ) 
		stack.push(end())
		 
		stack.push(end())
		 
		stack.push(end())
		 } 

	  

	foo({}); 
	let output = stack.map( row => streamToString(row) ) 
	console.log( streamToString(output) ) 

