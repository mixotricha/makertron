//import Parser from 'parser.js' 

//var Parser = require('./parser.js') 

//let callback = (result) => { 
//	console.log( result ) 
//}

//let str = " module foo() { sphere(r=5); }"
//let parser = new Parser(callback)
//parser.load(str)  
//parser.start()
//console.log(parser.dump()) 	 
 
var lodash = require('lodash') 

let modules  = ["circle", "sphere","translate","scale","rotate","cube","cylinder","linear_extrude","polygon","polyhedron","echo"] 

let ntokens = [] 


 /* | ONCE ? CLOSURE : COPY 

	| function ? NEXT : COPY -> 
	| @STRING  ? NEXT :  COPY ->   
	| ( ? PROCESS_FUNCTIONS : COPY   

	| difference intersection union minkowski ? NEXT : COPY ->
	|	( ? NEXT  : COPY -> 
	| ) ? NEXT  : COPY ->   
	| { ? PROCESS_BOOLEANS : COPY                        
	
	| module ? NEXT : COPY ->  
	| @STRING ? NEXT : COPY ->  
	| ( ? @PROCESS_ARGUMENTS : COPY  
	
	| @MODULES ? NEXT : COPY ->
	| ( ? PROCESS_ARGUMENTS_TOJSON : COPY_PREVIOUS
		
	| for ? NEXT : COPY -> 
	| ( ? PROCESS_FORLOOPS : COPY
	
	| sin cos atan2 pow sqrt min max ? NEXT : COPY ->
	| ( ? PROCESS_TRIG : COPY
		 
	| assign ? PROCESS_ASSIGN : COPY*/
 
// ==========================================================
// Simple grammar type object 
// ==========================================================
let gram = [ 
			// fix closure
			[
				[["ONCE"] , "CLOSURE" ,             "COPY" ]  // single non walked operation on whole script 
			],		
			// parse function instructions
			[
				[["function"] , "NEXT" ,             "COPY" ], // are we a function 
				[["STRING"]   , "NEXT" ,             "COPY" ], // do we have a string name 
				[["("     ]   , "PROCESS_FUNCTIONS" ,"COPY" ]  
			],		
			// parse boolean instructions
			// traverse a descent tree of boolean instr till we reach a goal ( sometimes another start ) 
			[ 
				[["difference" , "intersection" , "union" , "minkowski"] , "NEXT"  ,  "COPY"  ] ,
				[ ["("                                     ] ,             "NEXT"  ,  "COPY"  ] , 
				[	[")"                                     ] ,             "NEXT"  ,  "COPY"  ] , 
				[	["{"                                     ] , "PROCESS_BOOLEANS"  ,  "COPY"  ]                        
			], 	  
			// parse modules
			[
				[["module"],"NEXT" ,             "COPY" ], // are we a module 
				[["STRING"],"NEXT" ,             "COPY" ], // do we have a string name 
				[["("     ],"PROCESS_ARGUMENTS" ,"COPY" ]  
			],
			// parse variables 
			//[
			//	[["STRING"], NEXT             , COPY ], // are we a string 
			//	[["="]     , PROCESS_VARIABLES, COPY ] // do we an assignment  	 
			//],		
			// Process arguments in to json strings   
			[
				[ "MODULES"  ,  "NEXT"  ,   "COPY" ] ,
				[["("  ]     ,  "PROCESS_ARGUMENTS_TOJSON" , "COPY_PREVIOUS"	]
			],			
			// parse openscad operations ( rotate , translate , scale ... )   
			[
				[ "MODULES" ,  "NEXT"                  ,  "COPY"          ] ,
					[["("  ]  ,  "PROCESS_OPERATIONS"    ,  "COPY_PREVIOUS" ]
			],
			// parse for loops   
			[
				[["for"] ,  "NEXT"              ,  "COPY"   ] ,
				[["("  ]  , "PROCESS_FORLOOPS"  ,  "COPY"   ]
			],			
			// parse trig instructions   
			[
				[["sin","cos","atan2","pow","sqrt","min","max"] , "NEXT",  "COPY"  ] ,
				[["("  ]  ,  "PROCESS_TRIG" ,  "COPY" ]
			],			
			// parse assign instructions   
			[
				[["assign"] ,  "PROCESS_ASSIGN" ,  "COPY" ] 
			]
		]


// -----------------------------------------------------------
// Tokens : Stack Modifier 
// -----------------------------------------------------------
let stackModify = stackIndex => sign => { 
	sign!==0 ? stackIndex+=sign : stackIndex=stackIndex
	return stackIndex 
}

// -----------------------------------------------------------
// Tokens : Grab range of tokens from tree
// -----------------------------------------------------------
let tokenGrab = start => end => tkns => { 
	return tkns.slice( start , end ) 
} 
  
// -----------------------------------------------------------
// Tokens : Copy current token to new tree	
// -----------------------------------------------------------
let tokenCopy = src => dst => sIndex => { 
	dst.push( src[sIndex] ) 
	return dst 
}

// ------------------------------
// extra parameter for .filter
// ------------------------------
let compare = tkn =>  { return element => { if ( tkn === element ) return true; return false }}


// ------------------------------------------------------------
// Parser : Walk a tree 
// ------------------------------------------------------------
//let gramWalk = tree => tokens => ntokens => modules => strings => i => { 	
//	ntokens = isInList(tree[i][0])(tokens)(modules)(strings) === true ?  hooks(tree[i][1])(ntokens) : hooks(tree[i][2])(ntokens)
//	i < tree.length ? gramWalk(tree)(tokens)(ntokens)(modules)(strings)(i+1) : return ntokens 
//}				
			


// ------------------------------------------------------------
// Is token in list 
// ------------------------------------------------------------
//isInList = treeTkn => tokens => lst => i => { 			 
//		if ( treeTkn === "MODULE" ) { 
//			if ( tokens[i] === modules[i] ) return true 
//		}
//		if ( treeTkn === "STRING" ) { 
//			if ( isString(tokens[i])(strings) === true ) return true  
//		}				
//		i < tokens.length ? isInList(treeTkn)(tokens)(modules)(strings)(i) : return false 
//}

		

// unit tests 
//let t = stackModify(-1,1) // create and set to zero 
//console.log( t(1) ) // increment by one 
//console.log( t(1) ) // increment by one 
//console.log( tokenCopy(tokens)(ntokens)(t(0)) ) // copy token at stack index 1 from tokens to ntokens 
//console.log( t(1) ) // increment by one 
//console.log( tokenGrab(1)(5)(tokens) ) // grab a range of tokens 
//console.log( tokens[findPair("(")(")")(0)(0)(0)(tokens)] ) // different character outside index
//console.log( tokens[findPair("{")("}")(0)(0)(1)(tokens)] ) // different character deeper index
//console.log( tokens[findPair("{")("}")(0)(0)(0)(tokens)] ) // wrong index 
//console.log( tokens[findPair("{")("!")(0)(0)(0)(tokens)] ) // end termination wrong  
//console.log( tokens[findPair("{")("!")(0)(0)(0)(tokens)] ) // end termination wrong  

//const compose = (...functions) => data => functions.reduceRight((value, func) => func(value), data)

//@BOOLEAN|difference|intersection|union|minkowski

	// ===========================================================
	// Tokens : find matching closure 
	// ===========================================================
	/*const findPair = lft => rt => lftCount => rtCount => index => lst => { 
		lst[index] === lft ? lftCount++ : lftCount  
		lst[index] === rt ? rtCount++ : rtCount  
		return ( index > lst.length ) ? -1 
			: ( lftCount === 0 && rtCount === 0 ) ? -1 
			: ( lftCount === rtCount ) ? index 
			: findPair(lft)(rt)(lftCount)(rtCount)(index+1)(lst)
	}*/

	// =========================================================
	// Generate new series by calling appropriate hook
	// =========================================================
	const hooks = ( fun , index , tokens ) => { 

		// ====================================
		// copy token 
		// ====================================
		const copy = () => { 
			return tokens[index] 
		}

		// ===================================================================
		// process boolean operations union,intersection,difference,minkowski
		// ===================================================================
		const process_booleans = () => {   
			 
			//tokens[ findPair("{","}",this.stack) ] = "\nthis."+this.tokens[this.stack-3]+"_end()\n"

			console.log( findPair("{")("}")(0)(0)(index+3)(tokens) ) 

			return "this."+tokens[index] 

			// Note we know what comes after since the tree confirmed the '(',')','{' 
			// but you can also see how a variation would break it. (a=b) for example. 
			// Also note how the closure has been transformed in to a stack operation. 
			// difference() -> pushes to the csg stack 

		}

		if ( fun === "@PROCESS_BOOLEAN" ) return process_booleans() 
		if ( fun === "@COPY"            ) return copy()  

	}
					
	// -------------------------------------------------
	// Flow a grammar stream past the tokens stream 
	// -------------------------------------------------
	const applyRule = ( g , t ) => {

		const tokens = t.split(" ") // split tokens stream 

		// split each tern delimited by => && " "  
		const gram = g.split("=>").map( ternaryGroup => ternaryGroup.split(" ") .filter( a => a.length!==0 ? true : false ))  

		// split up chains in to smaller chunks 
		const tree = gram[0].map( tkn => tkn.split("|") )  

		// generate result map note we +1 to cIndex so no series ever starts with 0 
		const resMap = tokens
			.map( (tkn,index) => tree
				.map( (cTkn,cIndex) => tkn ===  cTkn[0] ? cIndex+1 : false	)
					.reduce( (sum,val)=>sum+val) )	


		// Take the result map and slice it on the tree series length then reduce that series 
		// and compare against the triangular number 
		const resTable = resMap.map( (a,i,arr) =>
			a === 1 && arr.slice(i,i+tree.length)
						.reduce( (sum,val) => sum+val) === (tree.length*(tree.length+1))/2 ? i : false )
							.filter( val => val !== false )

		console.log( resTable ) 

		// return new series after having called appropriate hook  
		//return tokens.map( (root,i) => res.indexOf(i) !== -1 ? hooks(gram[1][0],i,tokens) : hooks(gram[1][1],i,tokens) ).reduce( (str,tkn) => str+" "+tkn )    
	}	 

	
	//let grammar = [ "difference ( ) { => @PROCESS_BOOLEAN @COPY" , "union ( ) { => @PROCESS_BOOLEAN @COPY" ]    
	//let stream = "other { } difference ( ) { difference ( ) { union ( ) { circle ( size = 5 ) ; } } }"  // set of tokens to iterate over 
	//const res = applyRule(grammar[0],stream)
	//console.log( res ) 
 //const compose = (...functions) => (...data) => functions.reduceRight((value, func) => func(value), data)
 
 const end = (...args) => (obj) => "end"  

 const cube = (...args) => (obj) => "{ cube: '"+args[0]+"' , child: '" +obj+"'}"

 const sphere = (...args) => (obj) => "{ sphere: '"+args[0]+"' , child: '" +obj+"'}"

 const translate = (...args) => (obj) => "{ vector: '"+args[0]+"' , child: "+obj+"}"   
 	 
 const difference = (...args) => (obj) => args[0].reduce( ( result , line ) => result + "--" + line )    

 const compose = (...func) => (...args) => 
  func.reduce( ( value , f , i) =>  i === 1 ? f( args[i] )( value(args[0])() ) : f( args[i] )(value) )  
  
 //let res = compose ( difference )(  [
 //                                      compose( sphere , translate )( [5] , [1,2,3] ),
 //																			 compose( cube )( [7] ), 
 //																			 compose( cube )( [7] )	
 //                                   ] ) 

				/*
	walkClosure = chnk => rt => i => { 
				if ( i < chnk.length ) { 
					if ( Array.isArray( chnk[i]) ) { 
						walkClosure(chnk[i])(i)(0) 
					}
					else { 
						if ( chnk[i] !== false ) console.log( rt , i , chnk[i] ) 
					} 
					walkClosure(chnk)(rt)(i+1) 
				}			
			} 

Array.prototype.smap = function(callback) { 
				let stack = [] 
				let i = 0
				let loop = () => { 
					 let result = callback(this[i],i) 
					 if ( result[0]['index'] !== false ) i = result[0]['index'] 
					 if ( result[0]['value'] !== false ) stack.push( result[0]['value']) 
					 i++ 	
					 if ( i > -1 && i < this.length ) loop()
				}
				loop() 
				return stack
			} */ 


			//let tree = stream
			//		.reduce( (sum,value,index) => value === "{" ? 
			//			sum.concat( stream.slice(index,findPair("{")("}")(0)(0)(index)(stream))) : sum , [])

		
			//let end = findPair("{")("}")(0)(0)(3)(stream)
			//console.log( [ stream[3] , stream.slice(3,end) , "}" ]  ) 


		  //let tree = stream
			//	.reduce( ( sum , tkn , index ) => isToken(tkn) ||  isClosure(tkn) ? 
			//			sum.concat([ { 'token' : tkn , 'pos' : index , 'state' : isToken(tkn) , 'parent': -1 }])  
			//				: sum , [] )

			//tree = tree.reduce( (sum,value,index) => value.token === '{' && tree[index-1].token === '{' ? sum : sum.concat(value) , [] )  
											
			//const walk = i => state => iPar => { 
			//	if ( isToken(tree[i].token) && i !== 0 ) { 
			//		if ( !isClosure(tree[i-1].token) ) { 
			//			tree[i].parent = tree[i-1].pos 
			//		}
			//		else { 
			//			if ( tree[i-1].token !== "{" ) tree[i].parent = -2 
			////		}
			//	}
			//	if ( i > 0 ) walk(i-1)(state)(iPar)   
			//}	
	
			//walk(tree.length-1)(false)(tree.length-1)  


			//console.log( tree.filter( a => a.parent !== -1 ? true : false) ) 	
			

	// --------------------------------------------------------
	// Generate a hashed string
	// --------------------------------------------------------
	makeId = () => { 
		let i = 0 
		let text = "";
		let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for( i=0; i < 5; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}
	// --------------------------------------------------------
	// Is this token an operation 
	// --------------------------------------------------------
	isToken = tkn => 			
		tkn === "difference" || 
		tkn === "union" || 
		tkn === "rotate" || 
		tkn === "translate" || 
		tkn === "sphere" ||
		tkn === "cube" ||
		tkn === "circle" || 
		tkn === "if" ||
		tkn === "for" 
			? true : false 		
		
	// --------------------------------------------------------
	// Is this token closure / compound related
	// --------------------------------------------------------
	isClosure = tkn => 
		tkn === ";" ||
		tkn === "}" ||
		tkn === "{" 
			? true : false 		
		
	const smashPunks = stream => { 
		
		// --------------------------------------------------------
		// Strip unique id from token 		
		// --------------------------------------------------------
		getToken = tkn => ( tkn !== false && tkn !== true ) ? tkn.split("__||__")[1] : false 
		
		// --------------------------------------------------------
		// Strip token from unique id 		
		// --------------------------------------------------------
		getId = tkn => tkn.split("__||__")[0]

		Array.prototype.findId = function( id ) { 
			return this.reduce( (stack,tkn,index) => id === getId(tkn ) ? stack.concat(index) : stack , [] ) 
		}

		// --------------------------------------------------------
		// Tokens : find matching closure 
		// --------------------------------------------------------
		findPair = lft => rt => lftCount => rtCount => index => lst => { 
			getToken(lst[index]) === lft ? lftCount++ : lftCount  
			getToken(lst[index]) === rt ? rtCount++ : rtCount  
			return ( index > lst.length ) ? -1 
				: ( lftCount === 0 && rtCount === 0 ) ? -1 
				: ( lftCount === rtCount ) ? index 
				: findPair(lft)(rt)(lftCount)(rtCount)(index+1)(lst)
		}

		// --------------------------------------------------------
		// Consume stream picking out valid operations 
		// --------------------------------------------------------
		let consumeStream = index => root => stack => result => { 	 
			if ( index < table.length-1 ) { 	
				sTkn = getToken(table[index])
				if ( sTkn === ";" || sTkn === "{" )  {  
					if ( sTkn === ";" ) root = table[index] 
					result.push( stack.reverse() ) 
					stack = [] 
				}
		  	if ( isToken(sTkn) ) { stack.push( [table[index] , root] ) } 	
	    	consumeStream(index+1)(root)(stack)(result)   
			} 
		  return result
		}		

		// Update good clean closure back in to the original stream 
		updateRawIdStream = index => { 
			let rTab = rMap[index] 
			let stepBoom = i => { 				   
				if ( i < rTab.length-1 ) { 
					let start = getId(rTab[i][0])
					let startIndex = parseInt(rawIdStream.findId( start ))+1 
					let end =   getId(rTab[i][1]) 
					let sOff = findPair("(")(")")(0)(0)(startIndex)(rawIdStream) // you must get the argument that comes after an operation 
					rawIdStream[ sOff ] +="{"  // side effects bad 
					rawIdStream[ parseInt(rawIdStream.findId( end )) ] +="}" // side effects bad 
					stepBoom(i+1) 
				}
			}		
			stepBoom(0) 		 
			if ( index < rMap.length-1 ) updateRawIdStream(index+1) 
		}
		

		// add lookup id to each token 
		let rawIdStream = stream.map( tkn => makeId()+"__||__"+tkn )
 
		// set everything that is not closure or operations to false
		let idStream = rawIdStream.map( tkn => isToken(getToken(tkn)) || isClosure(getToken(tkn)) ? tkn : false )

		// filter out all false tokens and then reverse stream 
		let table = idStream.filter( j => j !== false ? true : false  ).reverse()

		// Consume tokens 
		let rMap = consumeStream(0)([])([])([])
								.reduce( (stack,tkn) => tkn.length > 1 ? stack.concat([tkn]) : stack , [])   
  	
		// Update raw stream with updated closure 
		updateRawIdStream(0) 

		console.log( rawIdStream.reduce( (stack,tkn) => stack + " " + getToken(tkn) , "" ) ) 

	}
 

let src = 'union ( ) { cube ( ) ; } difference ( ) { for ( x = [0:10:20] ) rotate ( [x,0,0,] ) { translate ( [5,0,0] ) { cylinder ( size=5 ) ; } translate ( [90,0,0] ) rotate ( [5,5,5] ) sphere ( r=5 ) ; } }'

	//let src = "start { a ( ) { b ( ) g ( ) { m ( ) j ( ) l ( ) ; } ; c ( ) ; } k ( ) }" 

	let res = smashPunks( src.split(" ") ) 

	//console.log( res ) 


/*
	// --------------------------------------------------------
		// Tokens : find matching closure 
		// --------------------------------------------------------
		findPair = lft => rt => lftCount => rtCount => index => lst => { 
			getToken(lst[index]) === lft ? lftCount++ : lftCount  
			getToken(lst[index]) === rt ? rtCount++ : rtCount  
			return ( index > lst.length ) ? -1 
				: ( lftCount === 0 && rtCount === 0 ) ? -1 
				: ( lftCount === rtCount ) ? index 
				: findPair(lft)(rt)(lftCount)(rtCount)(index+1)(lst)
		}
		
		// --------------------------------------------------------
		// nest all compound { } in to nested tree structure  
		// --------------------------------------------------------
		nestClosure = chnk => {
			let i = chnk.findIndex( element => getToken(element) === "{" ) 
			if ( i !== -1 ) {  				
				let end = findPair("{")("}")(0)(0)(i)(chnk) 
				return chnk.slice(0,i+1)
					.concat([nestClosure(chnk.slice(i+1,end))])
						.concat(nestClosure(chnk.slice(end,chnk.length)))
			}
			else { 
				return chnk
			} 
		}

		// --------------------------------------------------------
		// Remove all false statements from closure tree 
		// --------------------------------------------------------
		let deleteArguments = (stack,chnk,index) => {
			return ( Array.isArray(chnk)) ? 
				stack.concat(   [ { branch : chnk.reduce(deleteArguments,[]) } ] ) : ( getToken(chnk) !== false ) ? 
					stack.concat( [ { token : chnk } ] ) : stack  				 		
		}

		// --------------------------------------------------------
		// Remove valid closure leaving lazy closure behind 
		// --------------------------------------------------------
		let removeClosure = (stack,chnk,index) => { 
			if ( chnk.branch !== undefined ) { 
				return stack.concat( chnk.branch.reduce(removeClosure,[]) ) 
			}
			else { 
				if ( getToken(chnk.token) === "{" && isToken(getToken(stack[stack.length-1].token))) {
					stack[stack.length-1].token = false 
					chnk.token = false  
				}  
				if ( getToken(chnk.token) === "}" ) chnk.token = false 
				return stack.concat( chnk )  
			}
		}

		// repair our bad closure chains 
		let repairChains = (stack,tkn,index) => { 
			if ( index > 0 && isToken(getToken(stack[stack.length-1].token)) && isToken(getToken(tkn.token)) ) {
				stack[0].term++
				stack[0].result.push(getId(tkn.token)+"__||__"+"{")  
				return stack.concat(tkn)   
			} 
			else { 
				if ( getToken(tkn.token) === ";" ) { 
					let braces = "}".repeat(stack[0].term)  	
					stack[0].term = 0  
					stack[0].result.push( getId(tkn.token)+"__||__"+braces ) 
					return stack.concat(tkn)  
				}
				else { 
					return stack.concat(tkn) 
				}
			} 				
		}*/
	// nest the stream _.deleteeverything_set_to_false _.delete_all_good_closure 
		//let table = nestClosure(idStream)
		//						.reduce(deleteArguments,[])
		//							.reduce( removeClosure , [] )
		//								.filter( j => j.token !== false ? true : false )  



		//let d = table.reduce ( repairChains , [{term:0,result:[]}])[0].result   
 

	//let done = rawIdStream.map( tknA => {		
	//		let res = d.filter( tknB => getId(tknB) === getId(tknA) ? true : false )
	//		if ( res.length !== 0 ) { 
	//			return getToken(res[0])
	//		}
	//		else { 
	//			return tknA 
	//		}
	//})

//.reduce( (stack,tkn) => stack+" "+getToken(tkn) )  

