 
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
	var fs = require("fs");

	// =========================================================================================
	// Lex the input string against regexp set
	// =========================================================================================
	let preProcess = buffer => { 
		let expressions = [ /([\t])/g , /(\{)/ , /(\})/ , /(\()/ , 
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
	let makeId = () => { 
		let i = 0 
		let text = "";
		let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for( i=0; i < 5; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}

	// =========================================================================================
	// Is this token an operation // operations is currently global :( 
	// =========================================================================================
	let isToken = tkn => {			
		return operations.reduce( (stack,op) => op === tkn ? stack = true : stack , false )  
	}

	// =========================================================================================
	// Is this token in excluded list
	// =========================================================================================
	let isExclude = tkn => {			
		return exclude.reduce( (stack,op) => op === tkn ? stack = true : stack , false )  
	}

	// =========================================================================================
	// Is a token a string 
	// =========================================================================================
	let isString = token => {	
		token = token.replace(/([A-Z-a-z])/g,'')
		token = token.replace(/([0-9])/g,'')
		token = token.replace(/(['_'])/g,'')
		return token.length === 0 ? true : false
	}

	// =========================================================================================
	// Is this token closure / compound related
	// =========================================================================================
	let isClosure = tkn => 
		tkn === ";" ||
		tkn === "}" ||
		tkn === "{" 
			? true : false
 		

	// =========================================================================================
	// Tokens : find matching closure 
	// =========================================================================================
	let findPair = (lft,rt,lftCount,rtCount,index,lst,pullThrough) => { 
		pullThrough(lst[index]) === lft ? lftCount++ : lftCount  
		pullThrough(lst[index]) === rt ? rtCount++ : rtCount  
		return ( index > lst.length ) ? -1 
			: ( lftCount === 0 && rtCount === 0 ) ? -1 
			: ( lftCount === rtCount ) ? index 
			: findPair(lft,rt,lftCount,rtCount,index+1,lst,pullThrough)
	}
	
	// =========================================================================================
	// Convert stream to string 
	// =========================================================================================
	let streamToString = stream => stream.reduce( (stack,tkn) => stack + tkn + " ", '' )  

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
	let buildModuleList = stream => {
		let stack = [] 
		stream.forEach( (element,index) => {
			if ( element === "module" ) stack.push( stream[index+1] )   
		})
		return stack 
	}

	// =========================================================================================
	// Heal lazy closure statements such as 'translate() sphere();' -> translate() { sphere(); } 
	// =========================================================================================
	let healClosure = stream => { 

		// --------------------------------------------------------
		// Consume stream picking out valid operations 
		// --------------------------------------------------------
		let consumeStream = ( sObj , tkn , index ) => {
	 		let sTkn = tkn.getToken()
			if ( sTkn === ";" || sTkn === "{" ) { 
				if ( sTkn === ";" ) sObj.root = tkn   
				sObj.result.push( sObj.stack.reverse() ) 
				sObj.stack = [] 
			}		
			if ( isToken(sTkn) ) { sObj.stack.push( [ tkn , sObj.root] ) }
			return sObj 
		}

		// ---------------------------------------------------------------
		// Update modified closure back in to new stream ( rawIdStream ) 
		// --------------------------------------------------------------
		let applyMap = ( stack , row , index ) => { 
			row.forEach( (element,i) => { 
				if ( i < row.length-1 ) {  
					let sOff =  findPair("(",")", // closure we want to match 
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
		let rawIdStream = stream.map( tkn => makeId()+"__||__"+tkn ) 
		// set everything that is not closure or operations to false
		let idStream = rawIdStream.map( tkn => isToken(tkn.getToken()) || isClosure(tkn.getToken()) ? tkn : false )
		// filter out all false tokens and then reverse stream 
		let table = idStream.filter( j => j !== false ? true : false  ).reverse()
		// Consume tokens backwards from ; to produce new map of new closure 
		let rMap = table.reduce( consumeStream , { stack : [] , result : [] , root : '' })
								.result
									.reduce( (stack,tkn) => tkn.length > 1 ? stack.concat([tkn]) : stack , [])    
		// apply map of new closure to original stream producing new result. rIs is rawIdStream  
		let result =  rMap.reduce( applyMap , {  rIs : rawIdStream } ) 
										.rIs 
											.reduce( (stack,tkn) => stack.concat( tkn.getToken() ) , [] ) 
		return result  

	}

	// ======================================================
	// convert openscad function declarations to js functions 
	// ======================================================
	let reformatFunctions = stream => { 
	}

	// ======================================================
	// convert module declarations to js functions 
	// ======================================================
	let reformatModules = stream => { 
		let result = [] 
		// -----------------------------------------------------
		// Iterate through modules reformating to js syntax
		// -----------------------------------------------------
		let iterate = (index) => { 
			if ( stream[index] === "module" ) {
				let end = findPair('(',')',0,0,index+2,stream,tkn=>tkn)
				let args = stream.slice(  index + 3 , end ) 				
				result.push( "let" , stream[index+1] , "=" , "(" , "{" )
				result = result.concat(args)    
				result.push( "}" , ")" )  	
				index=end+1  	
			}
			result.push( stream[index] ) 
			if ( index < stream.length-1 ) iterate(index+1) 
		}
		iterate(0) 
		return result 
	} 

// ===================================================================
	// Take arguments to function and split up in to array
	// More work required here for things not passed as a = b expressions
	// such as foo(true,false,blah())   
	// (a,a=b,a=foo([1,2,3]),false,20)
	// (j=k,m=12,size=[1,2,3],m=sin(20+6))
	// ([x,0,0,])
	// (size=5)
	// ([5,0,0])
	// ==================================================================
	let splitArguments = (stream,start,end) => {

		let parameters = stream.slice( start , end ) 

		 if ( parameters.length === 0 ) return [{}] 

		// ------------------------------------------------------------------------------------
		// blank out all tkns in closure at any depth leaving top level expression relationship behind  
		// ------------------------------------------------------------------------------------
		let consumeDepth = ( lft , rht , index , e ) => { 
			let tkn = parameters[index] 
			if ( tkn === lft ) { e = findPair(lft,rht,0,0,index,parameters,tkn=>tkn) }
			( index <= e && e > 0 ) ? parameters[index] = "|||||"+parameters[index] : e = 0  
			if ( index < parameters.length ) consumeDepth( lft , rht , index + 1 , e ) 
		}
		consumeDepth( '(' , ')' , 0 , 0 ) // blank (***)
		consumeDepth( '[' , ']' , 0 , 0 ) // blank [***]
		consumeDepth( '{' , '}' , 0 , 0 ) // blank {***}
		parameters = [","].concat( parameters ) // since all valid expressions begin with comma add one for first expression 
		let table = parameters.reduce( ( stack , tkn , index ) => tkn === ',' ? stack.concat(index+1) : stack , [] ) // build index of tkn aft ,   
		// Is next token followed by relation or is it something else. If something else becomes argument. Otherwise key : value pair 
		table.forEach( (offset,index) => { 
			if ( isString(parameters[offset]) && parameters[offset+1] === "=" ) {  
				parameters[offset+1] = ":"
			}
			else {
				parameters.splice( offset , 0 ,  "arg" , ":" ) 
			}   		  
		})	
		return ['{'].concat(parameters.map( tkn => tkn.replace("|||||",'')).slice(1,parameters.length).concat(['}']))  
	}

	// ==================================================
	// Reformat calls to functions to be of a jsn format 
	// ==================================================
	let reformatFunCalls = stream => { 
		// ----------------------------------------------------------------
		// iterate through function calls 
		// ----------------------------------------------------------------
		let result = [] 
		let iterate = (index) => { 
			let tkn = stream[index] 
			if ( isToken(tkn) && !isExclude(tkn) && stream[index+1] === "(" ) {
				let end = findPair('(',')',0,0,index+1,stream,tkn=>tkn)
				if ( end !== -1 ) { 
					result.push( tkn , '(' , splitArguments( stream , index+2, end ) )  
					//console.log( splitArguments( stream , index+2, end ) ) 
					index = end   	
				}
			}
			result.push( stream[index] )   
			if ( index < stream.length-1 ) iterate(index+1) 
		}
		iterate(0) 
		return result 
	}

	//-------------------------------------------------------------------------------
	// Reformats loops in to js format. Does not handle forEach equivalents yet
	// ------------------------------------------------------------------------------
	let reformatLoops = stream => { 
		let stack = [] 
		let iterate = index => {
			let tkn = stream[index] 
			if ( tkn === "for" ) {
				var end = findPair("(",")",0,0,index+1,stream,tkn=>tkn) 
				let variable = stream[ index+2 ] 
				let fields = stream.slice( index+5 , end-1 ).reduce( (stack,tkn) => tkn !== ":" ? stack.concat(tkn) : stack ,[]) 
				if ( fields.length === 2 ) { // [0:10]
					fields[0] < fields[1] ?
						stack.push("for","(", variable , "=" , fields[0] , ";" , variable , "<=" , fields[1] , ";" , variable , "++" , ")" ) // positive 
							: stack.push("for","(", variable , "=" , fields[0] , ";" , variable , ">=" , fields[1] , ";" , variable , "--" , ")" )  // negative   		
				} 
				if ( fields.length === 3 ) { //  [0:45:360]
					fields[0] < fields[2] ?
						stack.push("for","(", variable , "=" , fields[0] , ";" , variable , "<=" , fields[2] , ";" , variable , "+=" , fields[1] , ")" ) // positive   
							: stack.push("for","(", variable , "=" , fields[0] , ";" , variable , ">=" , fields[2] , ";" , variable , "-=" , fields[1] , ")" ) // nega   
				}  
				// if fields.length != 2 || 3 are we a forEach? will contain , values if we are
				index = end 											 
			} 				
			else { 
				stack.push( stream[index] ) 
			}
			if ( index < stream.length-1 ) iterate(index+1) 				
		}
		iterate(0) 
		return stack 
	}
 
	// ----------------------------------------------------------------------------------
	// Bulds linked list of 'pure' openscad instructions excluding non pure instructions
	// ----------------------------------------------------------------------------------
	let buildTree = (set,start,end,parent) => {
	  let stack = [] 
		let iterate = (index) => { 
			let tkn = set[index]
			let id = makeId()
			if ( isToken(tkn) && !isExclude(tkn) ) {  
				stack.push( { index : index , id : id , token : tkn , parent : parent } ) 
				let s = findPair('(',')',0,0,index+1,set,tkn=>tkn)+1
				if ( set[s] === "{" ) {
					let e = findPair('{','}',0,0,s,set,tkn=>tkn) 
					index = e 
					stack.push( buildTree(set,s+1,e,id) )  
				}
			}
			if ( index < end-1 ) iterate( index + 1 )
		}
		iterate( start )
		return lodash.flatten(stack) 
	} 

	let scad = 'module foo ( s = 6 , j = 9 ) { union ( g = 3 , a = 4 ) { cube (j=k,m=12,size=[1,2,3],sin(20+6)); } difference() { for (x=[0:10:20]) rotate ([x,0,0,]) { translate([5,0,0]) { cylinder (size=5); } translate ([90,0,0]) rotate ([5,5,5]) sphere (r=5); } } }'

	//let scad = fs.readFileSync('test.scad', 'utf8');

	let src = preProcess( scad ) 

	let modules = buildModuleList( src )

	let operations = ["difference","intersection","union",
										"circle", "sphere","translate",
										"scale","rotate","cube",
										"cylinder","linear_extrude","polygon",
										"polyhedron","for","if","echo","colour","color","root"].concat( modules )  
  
	let exclude = [ "for","if" ] 
 	
	//let res = reformatLoops( reFormatModules( healClosure( src ) ) ) 

	let res = reformatFunCalls( reformatLoops( reformatModules( healClosure( src ) ) ) )  

	let m = buildTree(res,0,res.length-1,makeId(),'root') 

	let poop = res.map( (tkn,index) => { 	
		let row = m.reduce( (result,tkn) => tkn.index===index ? tkn : result , false)  
		return row !== false ? tkn+"("+row.id+","+row.parent+")" : tkn 
 	}) 

	console.log( streamToString(lodash.flatten(poop)) )
	
		union (3IgZo,82IXb) ( { g : 3 , a : 4 } )  
			cube(QrF5T,3IgZo) ( { j : k , m : 12 , size : [ 1 , 2 , 3 ] , arg : sin ( 20 + 6 ) } ) ; 
		end() 
		difference(zwzLm,82IXb) ( [] )  
			for ( x = 0 ; x <= 20 ; x += 10 ) { 
				rotate(f6TTt,zwzLm) ( { arg : [ x , 0 , 0 , ] } )  
					translate(BBL7U,f6TTt) ( { arg : [ 5 , 0 , 0 ] } )  
						cylinder(R0bOX,BBL7U) ( { size : 5 } ) ; 
					end() 
				end() 
				translate(3NtL5,zwzLm) ( { arg : [ 90 , 0 , 0 ] } )  
					rotate(jX5LI,3NtL5) ( { arg : [ 5 , 5 , 5 ] } )  
						sphere(5DnoS,jX5LI) ( { r : 5 } ) ; 
					end() 
				end() 
			} 
		end() 
	 

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


