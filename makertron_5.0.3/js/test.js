 
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
	// steer through a json data structure 
	// =============================================================
	const steer = ( data , task , eva ) => {
		task( data )  
		data.state = eva( data ) 
		return data.state ? steer ( data , task , eva ) : data  
	}

	// =========================================================================================
	// Convert stream to string 
	// =========================================================================================
	const streamToString = stream => stream.reduce( (stack,tkn) => stack + tkn + " ", '' )  

	// =========================================================================================
	// Strip unique id from token 		
	// =========================================================================================
	String.prototype.getToken = function() { 
		return ( this !== false && this !== true ) ? this.split("__||__")[1] : false 
	}

	// =========================================================================================
	// Strip token from unique id 		
	// =========================================================================================
	String.prototype.getId = function() {
		return this.split("__||__")[0]
	}

	// =========================================================================================
	// find Id in id tagged stream 
	// =========================================================================================
	Array.prototype.findId = function( id ) { 
			return this.reduce( (stack,tkn,index) => id === tkn.getId() ? stack.concat(index) : stack , [] ) 
	}

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

	// =========================================================================================
	// Heal lazy closure statements such as 'translate() sphere();' -> translate() { sphere(); } 
	// =========================================================================================
	const healClosure = stream => { 

		// --------------------------------------------------------
		// Consume stream picking out valid operations 
		// --------------------------------------------------------
		const consumeStream = ( sObj , tkn , index ) => {
	 		const sTkn = tkn.getToken()
			if ( sTkn === ";" || sTkn === "{" ) { 
				if ( sTkn === ";" ) sObj.root = tkn   
				sObj.result.push( sObj.stack.reverse() ) 
				sObj.stack = [] 
			}		
			if ( isToken(sTkn,genOps) || isToken(sTkn,csgOps) || isToken(sTkn,modOps) ) { 
				sObj.stack.push( [ tkn , sObj.root] ) 
			}
			return sObj 
		}

		// ---------------------------------------------------------------
		// Update modified closure back in to new stream ( rawIdStream ) 
		// --------------------------------------------------------------
		const applyMap = ( stack , row , index ) => { 
			row.forEach( (element,i) => { 
				if ( i < row.length-1 ) {  
					const sOff =  findPair("(",")", // closure we want to match 
											0,0, // helper counting values 
											parseInt(stack.rIs.findId(element[0].getId()))+1, // index position + 1
											stack.rIs, // you must get the ({},x) type argument that comes after an operation 
											tkn => tkn.getToken()) // pull through function 
					stack.rIs.splice( sOff+1 , 0 , "new__||__{" ) // insert new closure start
					stack.rIs.splice( parseInt(stack.rIs.findId(element[1].getId()))+1 , 0 , "new__||__}" )// insert new closure end	 
				}
			}) 		  
			return stack 
		}

		// add lookup id to each token 
		const rawIdStream = stream.map( tkn => makeId()+"__||__"+tkn ) 
		// set everything that is not closure or operations to false
		const idStream = rawIdStream.map( tkn => isToken(tkn.getToken(),genOps) || 
																						 	isToken(tkn.getToken(),csgOps) ||
																							 isToken(tkn.getToken(),modOps) ||			 
																								isToken(tkn.getToken(),cloOps) ? tkn : false )
		// filter out all false tokens and then reverse stream 
		const table = idStream.filter( j => j !== false ? true : false  ).reverse()
		// Consume tokens backwards from ; to produce new map of new closure 
		const rMap = table.reduce( consumeStream , { stack : [] , result : [] , root : '' })
								.result
									.reduce( (stack,tkn) => tkn.length > 1 ? stack.concat([tkn]) : stack , [])    
		// apply map of new closure to original stream producing new result. rIs is rawIdStream  
		const result =  rMap.reduce( applyMap , {  rIs : rawIdStream } ) 
										.rIs 
											.reduce( (stack,tkn) => stack.concat( tkn.getToken() ) , [] ) 
		return result  

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

		// -----------------------------------------------------
		// steer task func
		// -----------------------------------------------------
		const task = (data) => { 
			const tknA = data.stream[data.index].tkn
			const tknB = data.stream[data.index+1].tkn

			if ( tknA === "module" ) {
					
				//const end = findPair('(',')',0,0,data.index+2,data.stream,tkn=>tkn)
				//const args = data.stream.slice(  data.index + 3 , end ) 
				//data.result.push( "let" , data.stream[data.index+1] , "=" , "(" , "{" )				
				//data.result = data.result.concat(args)  
				//data.result.push( "}" , ")" )  	
				//data.index=end+1  	  
			}
			//data.result.push( data.stream[data.index] ) 
			//data.index++ 
			return data 
		} 

		// -------------------------------
		// steer eval func 
		// -------------------------------
		const eva = (data) => { return data.index < data.len ? true : false }

		return steer ( { index : 0 , stream : stream , len : stream.length-1 , state : true , result : [] } , task , eva ).result 
	} 

	// ==================================================
	// Reformat calls to functions to be of a jsn format 
	// ==================================================
	const reformatCalls = stream => { 

		// ------------------------------------------------------------------
		// Take arguments to function and split up in to array
		// ------------------------------------------------------------------
		const argumentsToJson = (stream) => {

			let parameters = stream.slice( 1 , stream.length-1 ) 
			if ( parameters.length === 0 ) return ['{','}']  

			// --------------------------------------		
			// steer function for argumentsToJson
			// --------------------------------------
			let consumeDepth = (data) => {
				const tkn = data.parameters[data.index] 
				if ( tkn === data.lft ) { data.e = findPair(data.lft,data.rht,0,0,data.index,data.parameters,tkn=>tkn) }
				( data.index <= data.e && data.e > 0 ) ? data.parameters[data.index] = "|||||"+data.parameters[data.index] : data.e = 0 
				data.index++ 
				return data
			} 

			// --------------------------------------
			// eval function for steer for argumentsToJson	
			// --------------------------------------
			let evaConsumeDepth = (data) => { return data.index < data.len ? true : false }

			parameters = steer({ state:true , index: 0 , lft: '(' , rht: ')' , e: 0 , 
				parameters: parameters , len: parameters.length-1 } , consumeDepth , evaConsumeDepth ).parameters 
			parameters = steer({ state:true , index: 0 , lft: '[' , rht: ']' , e: 0 , 
				parameters: parameters , len: parameters.length-1 } , consumeDepth , evaConsumeDepth ).parameters 
		  parameters = steer({ state:true , index: 0 , lft: '{' , rht: '}' , e: 0 , 
				parameters: parameters , len: parameters.length-1 } , consumeDepth , evaConsumeDepth ).parameters 
			parameters = [","].concat( parameters ) // since all valid expressions begin with comma add one for first expression 
			// build index of tkn after ',' Is next token followed by relation or is it something else? 
			//If something else becomes argument. Otherwise becomes key : value pair
			const table = parameters.reduce( ( stack , tkn , index ) => tkn === ',' ? stack.concat(index+1) : stack , [] ) 
			table.forEach( (offset,index) => { 
				isString(parameters[offset]) && parameters[offset+1] === "=" ? parameters[offset+1] = ":" 
					: parameters.splice( offset , 0 ,  "arg" , ":" )				   		  
			})	
			return ['{'].concat(parameters.map( tkn => tkn.replace("|||||",'')).slice(1,parameters.length).concat(['}'])) 
		}

		// ----------------------------------------------------------------
		// steer function for reformatCalls
		// ----------------------------------------------------------------
		const task = (data) => { 
			let args = data.stream[data.index].args 
			const tkn = data.stream[data.index].tkn 
			if ( args !== '' && !isToken(tkn,genOps) ) { 
				data.stream[data.index].args = argumentsToJson( data.stream[data.index].args )
			}
			data.index++
			return data
		} 

		// --------------------------------------
		// eval function for reformatCalls
		// --------------------------------------
		const eva = (data) => { return data.index < data.len ? true : false }

		return steer( { state:true , index : 0 , stream: stream , len: stream.length } , task , eva ).stream  
	}

	// =============================================================================
	// Reformats for loops in to js format. Does not handle forEach equivalents yet
	// =============================================================================
	const reformatLoops = stream => { 
	 	// --------------------------------------------------
		// steering task 
		// --------------------------------------------------
		const task = (data) => { 
			const tkn = data.stream[data.index] 
			if ( tkn === "for" ) { 
				const end = findPair("(",")",0,0,data.index+1,data.stream,tkn=>tkn)
 				const variable = data.stream[ data.index+2 ] 
				const fields = data.stream.slice( data.index+5 , end-1 ).reduce( (stack,tkn) => tkn !== ":" ? stack.concat(tkn) : stack ,[]) 
				if ( fields.length === 2 ) { // [0:10]
					fields[0] < fields[1] ?
						data.result.push("for","(", variable , "=" , fields[0] , ";" , variable , "<=" , fields[1] , ";" , variable , "++" , ")" )// + 
						: data.result.push("for","(", variable , "=" , fields[0] , ";" , variable , ">=" , fields[1] , ";" , variable , "--" , ")" )//-   		
				} 
				if ( fields.length === 3 ) { //  [0:45:360]
					fields[0] < fields[2] ?
						data.result.push("for","(", variable , "=" , fields[0] , ";" , variable , "<=" , fields[2] , ";" , variable , "+=" , fields[1] , ")" )//+ 
						: data.result.push("for","(", variable , "=" , fields[0] , ";" , variable , ">=" , fields[2] , ";" , variable , "-=" , fields[1] , ")" )//-   
				}  
				// if fields.length != 2 || 3 are we a forEach? will contain , values if we are
				data.index = end 											 
			}
			else { 
				data.result.push( data.stream[data.index] ) 
			}
			data.index++
			return data 
		}

		// -------------------------------------------------
		// steering condition 
		// -------------------------------------------------
		let eva = (data) => { return data.index < data.len ? true : false }

		return steer( { index: 0 , stream : stream , len : stream.length-1 , state: true , result : [] },task,eva).result
	}

	// =============================================================================
	// 
	// =============================================================================
	const reformatCsgOps = stream => {  
	
		const mapOps = (data) => { 
			const tkn = data.stream[data.index]
			if ( isToken(tkn,csgOps) ) { 
				let st = -1 
				let en = -1 
				st = findPair("(",")",0,0,data.index+1,data.stream,tkn=>tkn)
				en = findPair("{","}",0,0,st+1,data.stream,tkn=>tkn)  
				if ( st === 51 ) console.log( stream[st+1] , en )  						  
				data.result = data.result.concat( { op : data.index , st : st , end: en } ) 
			} 
			data.index++
			return data
		}
 
		// -------------------------------------------------
		// steering condition 
		// -------------------------------------------------
		let eva = (data) => { return data.index < data.len ? true : false }
			
		let res = steer( { state: true , index : 0 , stream: stream , len: stream.length-1 , result: [] } , mapOps , eva ).result 

		res.forEach( entry => { 
		
			stream[entry.op] = ['stack.push' , '(' , stream[entry.op] ]   
			stream[entry.st] = [ ')' , ')' ] 

			if ( entry.end !== -1 ) {  
				stream[entry.st+1] = [  'start' , '(' , ')' ] 	 	
				stream[entry.end] = [ 'end' , '(' , ')' ] 
			}
		  
		})   

	 	return lodash.flatten(stream)   
	}
 

	// =============================================================================
	// Bulds Par/Child linked list of operations
	// =============================================================================
	const buildFullTree = (stream) => {

		// ----------------------------------------
		// Fold arguments in to each operation row 
		// ----------------------------------------  
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
				data.result = data.result.concat( { 'lup': data.index , 'id': makeId() , 'parent': '' , 'tkn': tkn , args: args } )
				data.index++ 
				return data 
		}

		// ----------------------------------------
		// Build parent / child relationship graph 
		// ----------------------------------------
		const buildRelations = (data) => { 
			const rowA = data.table[data.index]
			const tknA = rowA.tkn
			const rowB = data.table[data.index+1] // now needs to pick up offset somehow 
			const tknB = rowB.tkn 
			if ( isToken(tknA,csgOps) || isToken(tknA,genOps) || isToken(tknA,modOps) ) { 	
				if ( tknB === "{" ) { 	
					data.table = setChildren(data.table,rowA.id,'{','}',data.index)
				}					
				if( isToken(tknB,csgOps) || isToken(tknB,genOps) || isToken(tknB,modOps) ) { 
					data.table[data.index+1].parent = rowA.id 
				}
			}
			data.index++ 
			return data 
		}

		// ---------------------------------------------
		// Set group of children within {} to parent id 
		// ---------------------------------------------
		const setChildren = (table,id,lft,rht,st) => { 
			const end = findPair(lft,rht,0,0,st+1,table,rec=>rec.tkn) 
			if ( end !== -1 ) { 
				table.forEach( (row,index) => {
					if ( index > st && index < end ) row.parent = id 	
				})
			}
			return table 
		}

		const eva = (data) => { return data.index < data.len ? true : false }

		const table = steer( { state : true , index: 0 , stream: stream , len: stream.length , result : [] } , foldInArgs , eva ).result 

		const relations = steer( { state : true , index: 0 , table: table , len: table.length-1 } , buildRelations , eva )
			.table
				.reduce( (stack,row) => 
						isToken(row.tkn,csgOps) || 
							isToken(row.tkn,genOps) || 
							isToken(row.tkn,modOps) ? stack.concat(row) : stack ,[])
  
	
		return relations 
		 

	} 





	// scad example 
	const scad = 'module foo () { union ( ) { cube (j=2,m=12,size=[1,2,3],sin(20+6)); } difference() { for (x=[0:10:20]) rotate ([x,0,0]) { translate([5,0,0]) { cylinder (size=5); } translate ([90,0,0]) rotate ([5,5,5]) sphere (r=5); } } }'

	//let scad = fs.readFileSync('test.scad', 'utf8');

	const src = preProcess( scad ) 

	// general operations 
	const genOps = [ "for","if" ,"module"] 

	// constructive solids operations 
	const csgOps = ["difference","intersection","union",
										"circle", "sphere","translate",
										"scale","rotate","cube",
										"cylinder","linear_extrude","polygon",
										"polyhedron","echo","colour","color","root"]

	// closure operations 
	const cloOps = [ ";" , "{" , "}" ] 

	// Module operations  
	const modOps = buildModuleList( src )

	// Operations that shall be excluded 	
	const excOps = [ "for","if" ] 

	// Generate consistent closure. 
	// Reformat modules to functions with arguments to json. 
	// Reformat Loops. 
	// Reformat function call arguments to json. 
	// convert all CSG operations to stack pushes 
	
	//const res =  reformatCsgOps( reformatCalls( reformatLoops( reformatModules( healClosure( src ) ) ) ) )   

	const res =   reformatCalls( buildFullTree(src) )  

	console.log( res ) 

	
	// Now we have a result where we can seperate the CSG from the imperative things 
	// by building the CSG in to a series of stack pushes and then evaluating the 
	// whole baboosha 

	let stack = [] 

	const start = () => '{' 
	const end = () => '}' 
	const union = (...args) => ['union','(',args,')'] 
	const difference = (...args) => ['difference','(',args,')'] 
	const translate = (...args) => ['translate','(',JSON.stringify(args),')'] 
	const rotate = (...args) => ['rotate','(',JSON.stringify(args),')'] 
 	const cube = (...args) => ['cube','(',args,')'] 
	const sphere = (...args) => ['sphere','(',JSON.stringify(args),')'] 
	const cylinder = (...args) => ['cylinder','(',JSON.stringify(args),')'] 
	const Osin = (...args) => ['Osin','(',JSON.stringify(args),')'] 

	//console.log( streamToString(lodash.flatten(res)) ) 

	/*stack.push(union()) 
	stack.push(start()) 
		stack.push(cube ( { j : 3 , m : 12 , size : [ 1 , 2 , 3 ] , arg : Osin ( 20 + 6 ) } ))  
	stack.push(end()) 
	stack.push(difference([]))
	stack.push(start()) 
		for ( let x = 0 ; x <= 20 ; x += 10 ) { 
			stack.push(rotate ( { arg : [ x , 0 , 0 , ] } ))
			stack.push(start()) 
				stack.push(translate({ arg : [ 5 , 0 , 0 ] }))
					stack.push(start())  
						stack.push(cylinder({ size : 5 }))  
					stack.push(end()) 
				stack.push(end())
			stack.push(translate ( { arg : [ 90 , 0 , 0 ] } ))
			 stack.push(start()) 
				stack.push(rotate ( { arg : [ 5 , 5 , 5 ] } ))
				stack.push(start()) 
					stack.push(sphere ( { r : 5 } ))  
				stack.push(end()) 
			stack.push(end()) 
		} 
	stack.push(end()) 

	stack = lodash.flatten(stack)  

	const m = buildTree(stack,0,stack.length-1,makeId(),'root') 

	const poop = stack.map( (tkn,index) => { 	
		let row = m.reduce( (result,tkn) => tkn.index===index ? tkn : result , false)  
		return row !== false ? tkn+"('"+row.id+"','"+row.parent+"')" : tkn 
 	}) 

	console.log( streamToString(lodash.flatten(poop)) )*/



	
	//console.log( lodash.flatten(res) ) 
 
	//console.log( res.slice(28,54) ) 
	
	//console.log( splitArguments(res,28,52) )
 
	//console.log( res.slice(17,24) ) 
	//console.log( splitArguments(res,17,24) )
	

	//console.log( streamToString(lodash.flatten(res)) ) 

	/*let stack = [] 
	let start = () => '{' 
	let end = () => '}' 
	let union = (...args) => 'union('+args+')' 
	let difference = (...args) => 'difference('+args+')' 
	let translate = (...args) => 'translate('+args+')' 
	let rotate = (...args) => 'rotate('+args+')' 
 	let cube = (...args) => 'cube('+JSON.stringify(args)+')' 
	let sphere = (...args) => 'sphere('+JSON.stringify(args)+')' 
	let cylinder = (...args) => 'cylinder('+JSON.stringify(args)+')' 

	let test = () => { 
		stack.push( cylinder ( {size :5 }) )  
	}

	stack.push(union()) 
	stack.push(start()) 
	stack.push(cube())  
	stack.push(end()) 
	stack.push(difference())  
  stack.push(start())     
		for ( let x = 0 ; x <= 20 ; x+=10  ) { 
			stack.push( rotate ( [ x , 0 , 0 , ] )) 
      stack.push( start() )   
			stack.push( translate ( [ 5 , 0 , 0 ] ))  
      stack.push( start() )   
			test();   
			stack.push( end() )  
			stack.push( end() )  
			stack.push( translate([ 90 , 0 , 0 ] ))  
      stack.push( start() )  
			stack.push( rotate ([ 5 , 5 , 5 ] ) )  
      stack.push( start() )  
			stack.push( sphere ( {r : 5} ) )  
			stack.push( end() )  
			stack.push( end() )   
		} 
	stack.push( end() )    
	console.log( streamToString(stack) ) */

	//let m = buildTree(res,0,res.length-1,makeId(),'root')  
	//let poop = res.map( (tkn,index) => { 	

	//let row = m.reduce( (result,tkn) => tkn.index===index ? tkn : result , false)  
	//	return row !== false ? tkn+"("+row.id+","+row.parent+")" : tkn 
 	//}) 


	//console.log( streamToString(poop) ) 
	
	/*difference() {  
		for ( x = [ 0 : 10 : 20 ] ) { 
			translate([x,0,0]) { 
				sphere(r=5);
			}
		}
	}*/

		
	//let difference = (...args) => (...child) => " difference ( " + args + " " + child + " ) " 
	//let translate  = (...args) => (...child) => " translate ( " + args + " , " + child + " ) "
	//let sphere     = (...args) => (...child) => " sphere ( " + args + " " + child + " ) "  

	//let r = [ 0 , difference() , 0 , translate([1,2,3]) , sphere(5) , 0 ,  translate([4,5,6]) , sphere(5) ] 
	
	//console.log( output ) 

	//let stream = [ "{" , "{" , "{" , "}" , "}" , "}" ] 

	

 //const compose = (...functions) => (...data) => functions.reduceRight((value, func) => func(value), data)
 
 /*const end = (...args) => (obj) => "end"  

 const cube = (...args) => (obj) => "{ cube: '"+args[0]+"' , child: '" +obj+"'}"

 const sphere = (...args) => (obj) => "{ sphere: '"+args[0]+"' , child: '" +obj+"'}"

 const translate = (...args) => (obj) => "{ vector: '"+args[0]+"' , child: "+obj+"}"   
 	 
 const difference = (...args) => (obj) => args[0].reduce( ( result , line ) => result + "--" + line )    

 const compose = (...func) => (...args) => func.reduce( ( value , f , i) =>  i === 1 ? f( args[i] )( value(args[0])() ) : f( args[i] )(value) )  
  */
 //let res = compose ( difference )(  [
 //                                      compose( sphere , translate )( [5] , [1,2,3] ),
 //																			 compose( cube )( [7] ), 
 //																			 compose( cube )( [7] )	
 //                                   ] ) 



/*“So there it is", said Pooh, when he had sung this to himself three times "It's come
different from what I thought it would, but it's come. Now I must go and sing it to
Piglet.”*/ 


