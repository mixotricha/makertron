 
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

	// suggested references  
	//The Electric Lady - Janelle Monae / A Seat at the Table- Solange / New Amerykah Part One- Erykah Badu
	//Songversation- India Arie / BEcoming- Stacy Barthe

	"use strict";   
	/*global require,console,__dirname,Buffer*/
	/*jshint -W069 */ 
	const lodash = require('lodash') 
	
	module.exports = function Parser(callback) {

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
		const buildList = (stream,nme) => {
			let stack = [] 
			stream.forEach( (element,index) => {
				if ( element === nme ) stack.push( stream[index+1] )   
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
				let rowA = data.stream[data.index]
				if ( rowA.fBody !== false ) { 
					rowA.head = lodash
						.flatten([ 'function' , rowA.tkn , '(',rowA.funParam ,')', '{' , 'return' , rowA.fBody.slice(1,rowA.fBody.length) , '}' ])  
					data.stream[data.index] = rowA
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
				if ( rowA.mod === true ) {
					rowA.head = lodash.flatten([ 'function' , rowA.tkn , '(','{', rowA.modParam , '}' , ')' ])   	 
					data.stream[data.index] = rowA
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
				let parameters = stream.slice( 0 , stream.length )   
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
					parameters: parameters , len: parameters.length } , consumeDepth , evaConsumeDepth ).parameters 
				parameters = enumerate({ state:true , index: 0 , lft: '[' , rht: ']' , e: 0 , 
					parameters: parameters , len: parameters.length } , consumeDepth , evaConsumeDepth ).parameters 
				parameters = enumerate({ state:true , index: 0 , lft: '{' , rht: '}' , e: 0 , 
					parameters: parameters , len: parameters.length } , consumeDepth , evaConsumeDepth ).parameters 
				if ( parameters[0] === ' ' ) parameters[0]="' '" // if the parameter was empty 		
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
				let row = data.stream[data.index] 	
				if ( row.modParam !== false && row.mod === false ) {  
					row.modParam = argumentsToJson( row.modParam )
					data.stream[data.index] = row  
				}
				if ( row.csgParam !== false ) {  
					row.csgParam = argumentsToJson( row.csgParam )
					data.stream[data.index] = row
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
				let rowA = data.stream[data.index] 
				if ( rowA.forParam !== false ) { 
					debugger; 
					const parameter = rowA.forParam			
	 				const variable = parameter[0] 
					rowA.head = [ 'if (',  variable , '=== undefined ) { var ' , variable , ' }' ]  
					const fields = parameter.slice( 3 , parameter.length-1 )
						.reduce( (stack,tkn) => tkn !== ":" && tkn !== ")" && tkn !== "]" ? stack.concat(tkn) 
							: stack ,[])  
					if ( fields.length === 2 ) { // [0,10]
						rowA.head = fields[0] < fields[1] ?
							 rowA.head.concat(["for",'(',variable,"=",fields[0],";",variable,"<=",fields[1],";",variable,"++",')'])// + 
							: rowA.head.concat(["for",'(',variable,"=",fields[0],";",variable,">=",fields[1],";",variable,"--",')'])//-   		
					} 
					if ( fields.length === 3 ) { //  [0,45,360]
						rowA.head = fields[0] < fields[2] ?
							rowA.head.concat([ "for",'(',variable,"=",fields[0],";",variable,"<=",fields[2],";",variable,"+=",fields[1],')'])//+ 
							: rowA.head.concat(["for",'(',variable,"=",fields[0],";",variable,">=",fields[2],";",variable,"-=",fields[1],')'])//-   
					}  
					// if fields.length != 2 || 3 are we a forEach? will contain , values if we are
					data.stream[data.index] = rowA
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
				if ( rowA.varParam !== false  ) {			
					rowA.head = lodash.flatten([ 'if (', rowA.tkn , '=== undefined ) { var ' , rowA.tkn , ' }' , rowA.tkn , rowA.varParam ])    	
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
		// convert csg operations to stack operations  
		// =======================================================
		const reformatGenOps = stream => {  
			// *** enumerate task func
			const task = (data) => { 
				let rowA = data.stream[data.index]
				// general operations 
				if ( rowA.genParam !== false ) {			
					rowA.head = lodash.flatten([ rowA.tkn , '(',rowA.genParam , ')' ])  
					data.stream[data.index] = rowA
				}
				// else statements. Note that 'else if' statements will become else { if(){} }  
				if ( rowA.els === true ) { 
					rowA.head = lodash.flatten([ rowA.tkn ])  
					data.stream[data.index] = rowA
				}
				data.index++ 
				return data 
			} 
			// *** enumerate end condition 
			const eva = (data) => { return data.index < data.len ? true : false }
			return enumerate ( { index : 0 , stream : stream , len : stream.length , state : true  } , task , eva ).stream 
		} 

	 	// =======================================================
		// convert csg operations to stack operations  
		// =======================================================
		const reformatCsgOps = stream => {  
			// *** enumerate task func
			const task = (data) => { 
				let rowA = data.stream[data.index]
				if ( rowA.csgParam !== false ) {			
					rowA.head = lodash.flatten([ 'stack.push(' , rowA.tkn , rowA.csgParam , ')' ])  
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
		// Distributes attributes of tree to appropriate buckets 
		// =============================================================================
		const distributeTree = (stream) => { 
			// Any operations we want to call at the JS level but that are 
			// not directly native like sin/cos/sqrt.  
			stream = stream.map( tkn => isToken(tkn,trigOps) ? "O"+tkn : tkn ) 
			// *** Generate a row entry for a token. Break out arguments if it has any.   
			const treeToBuckets = (data) => {
					let tknA = data.stream[data.index]  
					let tknB = data.stream[data.index+1] // look forward
					let tknZ = data.stream[data.index-1] // look backward
					let nRow = {  'id'         : makeId() , // id of row  
												'children'   : false    , // row has children 
												'mod'        : false    , // function definition 
												'csgParam'   : false       , // csg parameters 
												'genParam'   : false       , // general parameters 
												'modParam'   : false       , // Module parameters
												'funParam'   : false       , // Function parameters 
												'fBody'      : false       , // Function Body 
												'varParam'   : false       , // Variable parameters 	
												'forParam'   : false       , // Loop Parameters
												'els'        : false       , // else part of condition 
		                    'parent'     : ''       , // parent of row 
		                    'head'       : false    , // head of row
		                    'tkn'        : tknA     , // tkn of row 
		                    'tail'       : []       , // tail of row
		                    'closure'    : []         // trailing closure     
		                  } 
					let parameters = false     // parameters 
					let end = -1            // -1 if no end of closure pair found  
					// if we have a sub chunk always just get it first 
					if ( tknB === "(" ) { 
						end = findPair('(',')',0,0,data.index+1,data.stream,tkn=>tkn)
						if ( end !== -1 )  { 
							parameters = data.stream.slice( data.index+2 , end ) 				 		  	
							parameters.length === 0 ? parameters = [" "] : parameters 		
						}		 
					}
					if ( end !== -1 ) { // we had some parameters  
						// if we are csgOp or genOp or modOp pick up parameters and drop in correct bucket 
						if ( isToken(tknA,csgOps) ) { nRow.csgParam = parameters; data.index = end } 
		 				if ( isToken(tknA,genOps) ) { 
							 tknA !== "for" ?  nRow.genParam = parameters 
									: nRow.forParam = parameters // for is general operation but has own arg struc 
							data.index = end 
						}  
						if ( isToken(tknA,modOps) ) { 
							nRow.modParam = parameters;
							if ( tknZ === "module" ) nRow.mod = true
	 						data.index = end 
						}   
						// functions will also have a function body as well as parameter
						if ( isToken(tknA,funOps) ) {
							nRow.funParam = parameters;
							if ( tknZ === "function" ) { 
								let st = end+1 
								end = findPair('=',';',0,0,st,data.stream,tkn=>tkn) 	
								if ( end !== -1 ) {
									nRow.fBody = data.stream.slice( st , end ) 
								}	
							}										   
							data.index = end
						}					
					} 
					// if we are none of the above perhaps we are a variable assignment ?
					if ( nRow.csgParam === false && nRow.genParam === false && nRow.modParam === false && nRow.funParam === false && nRow.fBody === false ) { 
						if ( isString(tknA) && tknB === "=" ) {   
							end = findPair('=',';',0,0,data.index+1,data.stream,tkn=>tkn) // find tkns between = ; 						
							nRow.tkn = tknA.replace("$",'DOLLAR_SIGN_') // dollar signs bad 
							nRow.varParam = data.stream.slice( data.index+1 , end+1 )
							data.index = end 
						}
						// if we have an else statement mark it. Becomes special case of general operation
						if ( tknA === "else" ) { nRow.els = true }
					}
					data.result = data.result.concat(nRow)
					data.index++ 
					return data 
			}
			// *** enumerate end condition 
			const eva = (data) => { return data.index < data.len ? true : false }
			// process rows in stream in to sub groups  	
			return enumerate( { state : true , index: 0 , stream: stream , len: stream.length , result : [] } , treeToBuckets , eva )
				.result 
					.reduce( (stack,row) => row.tkn !== "module" && row.tkn !== "function" ? stack.concat(row) : stack , [] ) 

		}

		// =============================================================================
		// Bulds Par/Child linked list of operations
		// =============================================================================
		const buildFullTree = (table) => {
				// *** Build parent / child relationship graph 
			const buildRelations = (data) => { 
				let rowA = data.table[data.index]
				let rowB = data.table[data.index+1] // now needs to pick up offset somehow 		 
				// parent child relationship  
				if ( isToken(rowA.tkn,csgOps) || isToken(rowA.tkn,genOps) || isToken(rowA.tkn,modOps) ) { 	//is operation
					if ( rowB.tkn === "{" ) { // has closure	
						data.table = setChildren(data.table,rowA.id,'{','}',data.index)  
						data.table[data.index].children = true 		
					}	
					if( isToken(rowB.tkn,csgOps) || 
							isToken(rowB.tkn,genOps) || 
							isToken(rowB.tkn,modOps) || 
							isToken(rowB.tkn,funOps) ) { // is another operation following on 
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
			// build parent / child relationship and eliminate unwanted tokens 
			return enumerate( { state : true , index: 0 , table: table , len: table.length-1 } , buildRelations , eva )
				.table
					.reduce( (stack,row) => 
							row.csgParam !== false || 
							row.genParam !== false || 
							row.modParam !== false || 
							row.funParam !== false ||
							row.fBody    !== false || 
							row.varParam !== false || 
							row.forParam !== false ||
							row.els      !== false     ? stack.concat(row) : stack ,[])	 
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
				if ( row.head === false ) { 
					row.head = [row.tkn]
					if ( row.csgParam !== false ) { row.head = row.head.concat( row.csgParam ) }
					if ( row.modParam !== false ) { row.head = row.head.concat( row.modParam ) }
					if ( row.genParam !== false ) { row.head = row.head.concat( row.genParam ) }
					if ( row.funParam !== false ) { row.head = row.head.concat( row.funParam ) }
					if ( row.varParam !== false ) { row.head = row.head.concat( row.varParam ) }
					if ( row.forParam !== false ) { row.head = row.head.concat( row.forParam ) }
				}
				row.head = row.head.concat(row.tail)
				row.head = row.head.concat(row.closure.reverse()) 	
			})  
			return stream  
		} 

		// ========================================================
		// Basic reformatting of generated code before revaluation 
		// ========================================================
		const PolishOutput = stream => { 
			let res = stream.reduce( (output,row) => {
				output += "\n" + streamToString(row.head) + "\n" 
				return output 				 
			}, "" )   
			return res 
		} 

			// =============================================================================
		// reDistributes attributes of tree to appropriate buckets 
		// =============================================================================
		const reDistributeTree = (stream) => { 
			// *** Generate a row entry for a token. Break out arguments if it has any.   
			const treeToBuckets = (data) => {
					let tknA = data.stream[data.index]  
					let tknB = data.stream[data.index+1] // look forward
					let tknZ = data.stream[data.index-1] // look backward
					let nRow = {  'id'         : makeId() , // id of row  
												'children'   : false    , // row has children 
												'csgParam'   : false       , // csg parameters 
		                    'parent'     : ''       , // parent of row 
		                    'tkn'        : tknA     , // tkn of row 
		                    'tail'       : []       , // tail of row
		                    'closure'    : []         // trailing closure     
		                  } 
					let parameters = false     // parameters 
					let end = -1            // -1 if no end of closure pair found  
					// if we have a sub chunk always just get it first 
					if ( tknB === "(" ) { 
						end = findPair('(',')',0,0,data.index+1,data.stream,tkn=>tkn)
						if ( end !== -1 )  { 
							parameters = data.stream.slice( data.index+2 , end ) 				 		  	
							parameters.length === 0 ? parameters = [" "] : parameters 		
						}		 
					}
					if ( end !== -1 ) { // we had some parameters  
						// if we are csgOp 
						nRow.csgParam = parameters; 
						data.index = end  
					} 
					data.result = data.result.concat(nRow)
					data.index++ 
					return data 
			}
			// *** enumerate end condition 
			const eva = (data) => { return data.index < data.len ? true : false }
			// process rows in stream in to sub groups  	
			return enumerate( { state : true , index: 0 , stream: stream , len: stream.length , result : [] } , treeToBuckets , eva )
				.result 
				
		}

		// =============================================================================
		// Bulds Par/Child linked list of operations
		// =============================================================================
		const reBuildFullTree = (table) => {
				// *** Build parent / child relationship graph 
			const buildRelations = (data) => { 
				let rowA = data.table[data.index]
				let rowB = data.table[data.index+1] // now needs to pick up offset somehow 		 
				// parent child relationship  
				if ( isToken(rowA.tkn,csgOps) ) { 	//is operation
					if ( rowB.tkn === "{" ) { // has closure	
						data.table = setChildren(data.table,rowA.id,'{','}',data.index)  
						data.table[data.index].children = true 		
					}	
					if( isToken(rowB.tkn,csgOps) ) { // is another operation following on 
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
			// build parent / child relationship and eliminate unwanted tokens 
			return enumerate( { state : true , index: 0 , table: table , len: table.length-1 } , buildRelations , eva )
				.table
					.reduce( (stack,row) => 
							row.csgParam !== false  
							   ? stack.concat(row) : stack ,[])	 
		} 


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

		let modOps = []
		let funOps = [] 

		// Operations that shall be excluded from having arguments 	
		const excOps = [ "else" , "function" ] 

		const trigOps = [ "cos" , "sin" , "atan2" , "pow" , "sqrt" , "max" , "min" ] 

		let gheader = "let stack = []; const start = () => ['{']; const end = () => ['}']; const union = (...args) => ['union','(',JSON.stringify(args[0]),')'];const difference = (...args) => ['difference','(',JSON.stringify(args[0]),')']; const intersection = (...args) => ['intersection','(',JSON.stringify(args[0]),')']; const translate = (...args) => ['translate','(',JSON.stringify(args[0]),')']; const rotate = (...args) => ['rotate','(',JSON.stringify(args[0]),')']; const scale = (...args) => ['scale','(',JSON.stringify(args[0]),')']; const cube = (...args) => ['cube','(',JSON.stringify(args[0]),')']; const sphere = (...args) => ['sphere','(',JSON.stringify(args[0]),')']; const cylinder = (...args) => ['cylinder','(',JSON.stringify(args[0]),')']; const color = (...args) => ['color','(',JSON.stringify(args[0]),')']; const polygon = (...args) => ['polygon','(',JSON.stringify(args[0]),')']; const circle = (...args) => ['circle','(',JSON.stringify(args[0]),')']; const echo = (...args) => ['echo','(',JSON.stringify(args[0]),')']; const version = (...args) => ['version','(',JSON.stringify(args[0]),')'];"


		let header = "let stack = []; const start = () => ['{']; const end = () => ['}']; const union = (...args) => ['union','(',JSON.stringify(args[0]),')'];const difference = (...args) => ['difference','(',JSON.stringify(args[0]),')']; const intersection = (...args) => ['intersection','(',JSON.stringify(args[0]),')']; const translate = (...args) => ['translate','(',JSON.stringify(args[0]),')']; const rotate = (...args) => ['rotate','(',JSON.stringify(args[0]),')']; const scale = (...args) => ['scale','(',JSON.stringify(args[0]),')']; const cube = (...args) => ['cube','(',JSON.stringify(args[0]),')']; const sphere = (...args) => ['sphere','(',JSON.stringify(args[0]),')']; const cylinder = (...args) => ['cylinder','(',JSON.stringify(args[0]),')']; const color = (...args) => ['color','(',JSON.stringify(args[0]),')']; const polygon = (...args) => ['polygon','(',JSON.stringify(args[0]),');']; const circle = (...args) => ['circle','(',JSON.stringify(args[0]),');']; const echo = (...args) => ['echo','(',JSON.stringify(args[0]),')']; const version = (...args) => ['version','(',JSON.stringify(args[0]),')'];"


	let trig = ' const truncate = (num, places) => num; const deg2rad  = (deg) => deg * (Math.PI/180);  const rad2deg  = (rad) => (rad * 180)/Math.PI; const Ocos     = (rad) => truncate(Math.cos(deg2rad(rad)),4); const Osin     = (rad) => truncate(Math.sin(deg2rad(rad)),4); const Oatan2   = (a,b) => truncate(Math.atan2(a,b),4); const Opow     = (a,b) => truncate(Math.pow(a,b),4);   const Osqrt    = (a)   => truncate(Math.sqrt(a),4);    const Omax     = (a,b) => truncate(Math.max(a,b),4);   const Omin     = (a,b) => truncate(Math.min(a,b),4);'  	

		let footer = "foo({}); return stack"

		this.testing = (scad) => { 

			const src = preProcess( scad ) 
		
			// Module operations  
			modOps = buildList( src , "module" )
			funOps = buildList( src , "function" )

			// 1. Generate parent/child tree
			// 2. Reformat variable assignments
			// 3. Reformat function call arguments to json  
			// 4. Reformat module format to js functions 
			// 5. Reformat loops to js loops 
			// 6. convert all CSG operations to stack pushes 
	
			//const newTree = reformatLoops( reformatGenOps( 
			//	reformatVariables( reformatCsgOps( reformatCalls( reformatModules( reformatFunctions( buildFullTree(distributeTree(src) ))))))))           
	
			// Build new code from tree
			/*const result = header + trig + PolishOutput( codeFromTree ( newTree ) ) + footer    
	
			let stack = new Function(result)();
			let output = stack.map( row => streamToString(row) ) 

			callback( composition ) 

			let res = reBuildFullTree(reDistributeTree(preProcess( streamToString(output)))) 

			let composition = res.reduce( (stack,row) =>  
				stack.concat({ id : row.id , parent: row.parent , children: row.children , tkn: row.tkn , param: 
					row.csgParam.reduce( (stack,tkn) => stack+=tkn )		
				})  
			,[])  
			return composition*/
			return "meh" 
		}
}


		// scad example 
		//const scad = 'module foo () { module blah() { union ( ) { cube (size=0.6); } } difference() { if ( 1 === 1 ) for (x=[0:10:20]) rotate ([x,0,0]) { translate([5,0,0]) { if ( 2 === 2 ) { cylinder (size=5); } else { sphere(r=7); } } translate ([90,0,0]) rotate ([5,5,5]) sphere (r=5); } } cube(size=0.4); blah(); }'

		//let scad = fs.readFileSync('test.scad', 'utf8');



