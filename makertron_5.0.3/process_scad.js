	
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

	"use strict" 
	/*global require,console,__dirname,VERSION,SERVER_PORT,CLIENT_PORT*/
	/*jshint -W069 */
	/*jslint node: true */

	const lodash = require('lodash'); 
	const ref = require("ref");
	const ArrayType = require('ref-array');
	const StructType = require('ref-struct');
	const ffi = require("ffi");
	//const ffi = require("node-ffi")
	const fs = require('fs'); 

	const ProcessScad = function(result) { 
		
		let Out = Function(result); // Sturgeon Eval can be harmful 
		let out = new Out(); 

		out.stack = [[0]]; 	
		out.final_stack = []; 
		out.stack_index = 0; 
		out.actions_stack = []; 
		out.actions_stack_index = 0; 
		out.operations = []; 
			
		// conversion and truncation 
		out.deg2rad = function(deg) { return deg * (Math.PI/180); };
		out.rad2deg = function(rad) { return (rad * 180)/Math.PI; }; 
		out.truncate = function(num, places) { return num; };

		// trig functions
		out.cos =   function( rad   ) {  return this.truncate(Math.cos(this.deg2rad(rad)),4); };
		out.sin =   function( rad   ) {  return this.truncate(Math.sin(this.deg2rad(rad)),4); };
		out.atan2 = function( a , b ) {  return this.truncate(Math.atan2(a,b),4); }; 
		out.pow   = function( a , b ) {  return this.truncate(Math.pow(a,b),4);   };
		out.sqrt  = function( a     ) {  return this.truncate(Math.sqrt(a),4);    }; 
		out.max   = function( a , b ) {  return this.truncate(Math.max(a,b),4);   }; 
		out.min   = function( a , b ) {  return this.truncate(Math.min(a,b),4);   };	 

			// Brep implementation of primitives and actions 

			// =================================================================
			// Openscad translate
			// =================================================================
			out.create_translate = function() { 
				this.logger("Translate: ",arguments[0]);
				// Bit smarter management of arguments Remember first array wins and we reject anything else.   
				let i = 0; 
				let keys = Object.keys(arguments[0]);
  			let vector = []; 
  			for ( i = 0; i < keys.length; i++ ) {
  				let arg = arguments[0][keys[i]];
    			if ( arg instanceof Array) { vector = arg; break; } // Will always take first vector given to us  
  			}
				if ( vector.length === 0 ) this.logger("Invalid Arguments To Translate: ",arguments[0]);				
				let x   = parseFloat(vector[0]); 
				let y   = parseFloat(vector[1]); 
				let z   = parseFloat(vector[2]); 
				let obj = arguments[0]['obj'];
				let result = this.brep_lib.ffi_translate( x , y , z , obj ); 
				return result;
			};

			// =================================================================
			// Openscad scale
			// =================================================================
			out.create_scale = function() { 
				this.logger("Scale: ",arguments[0]);
				// Bit smarter management of arguments Remember first array wins and we reject anything else.   
				let keys = Object.keys(arguments[0]);
  			let vector = []; 
  			for ( let i = 0; i < keys.length; i++ ) {
  				let arg = arguments[0][keys[i]];
    			if ( arg instanceof Array) { vector = arg; break; } // Will always take first vector given to us  
  			}
				if ( vector.length === 0 ) this.logger("Invalid Arguments To Scale: ",arguments[0]);				
				let x   = parseFloat(vector[0]); 
				let y   = parseFloat(vector[1]); 
				let z   = parseFloat(vector[2]); 
				let obj = arguments[0]['obj'];
				let result = this.brep_lib.ffi_scale( x , y , z , obj ); 
				return result;
			};

			// ==================================================================
			// Openscad Rotate 
			// ==================================================================
			out.create_rotate = function() { 
				this.logger("Rotate: ",arguments[0]);
				let r = Math.PI / 180;
				// Bit smarter management of arguments Remember first array wins and we reject anything else.   
				let keys = Object.keys(arguments[0]);
  			let vector = []; 
  			for ( let i = 0; i < keys.length; i++ ) {
  				let arg = arguments[0][keys[i]];
    			if ( arg instanceof Array) { vector = arg; break; } // Will always take first vector given to us  
  			}
				if ( vector.length === 0 ) this.logger("Invalid Arguments To Rotate: ",arguments[0]);
				let x_rotate   = parseFloat(vector[0]) * r; 
				let y_rotate   = parseFloat(vector[1]) * r; 
				let z_rotate   = parseFloat(vector[2]) * r;
				let obj        = arguments[0]['obj'];
				let result = this.brep_lib.ffi_rotateX( x_rotate , obj    );
						result = this.brep_lib.ffi_rotateY( y_rotate , result );
						result = this.brep_lib.ffi_rotateZ( z_rotate , result );
				return result;
			};

			// Perform linear extrude 
			out.create_linear_extrude = function() {
				this.logger("Linear Extrude: ", arguments[0]); 
				let object = arguments[0]['object']; 
				let height = arguments[0]['height']; 
				return this.brep_lib.ffi_extrude(height,object); 
			};

			// =======================================================
			// Openscad radius convention 
			// Note that openscads calling convention for letious prims
			// is a bit of a mess and a bit ambiguous but we want our 
			// code to follow it as close as we can. This is transposed
			// from the c++ code in OpenScad 
			// ========================================================
			out.lookup_radius = function( diameter_let, radius_let) {
				if ( isNaN(diameter_let) === false ) {
					if (isNaN(radius_let) === false ) {
						this.logger("WARNING: Ignoring radius letiable " , radius_let , " as diameter ", diameter_let , " is defined too.");
					}
					return diameter_let / 2.0;
				} else if ( isNaN(radius_let) === false ) {			
					return radius_let;
				} else {
					return undefined;
				}
			};

			// =====================================================
			// Openscad Sphere 
			// =====================================================
			out.create_sphere = function() { 
				this.logger("Sphere");
				let r = undefined , d = undefined; 
				// Bit smarter management of arguments. Accept arrays. Each value overides a previous value but only one other argument will be size.    
				let keys = Object.keys(arguments[0]);
  			for ( let i = 0; i < keys.length; i++ ) {
  				let arg = arguments[0][keys[i]];
   				if ( typeof(arg) === "number" && keys[i] !== "r" && keys[i] !== "d" ) { 
						r = parseFloat(arg); 
						break; 
					}	
  			}			
				if ( arguments[0]['r'] !== undefined ) { r = parseFloat(arguments[0]['r']); }
				if ( arguments[0]['d'] !== undefined ) { d = parseFloat(arguments[0]['d']); }
				r = this.lookup_radius( d , r );
				if ( r === 0 || r === undefined ) { 
					r = 1;  
				}
				this.debug(["sphere",r,d]);  
				let obj = this.brep_lib.ffi_sphere(r,0.0,0.0,0.0);	 	
				return obj; 
			}; 

			// ===============================================================
			// Openscad Cube 
			// ===============================================================
			out.create_cube = function() {
				this.logger("Cube");
				let x = 0;
				let y = 0;
				let z = 0;
				let xs = 1; 
				let ys = 1; 
				let zs = 1; 
				let center = false; 
				// Bit smarter management of arguments. Accept arrays. Each value overides a previous value but only one other argument will be size.    
				let keys = Object.keys(arguments[0]);
  			for ( let i = 0; i < keys.length; i++ ) {
  				let arg = arguments[0][keys[i]];
    			if ( (arg instanceof Array)) { 
						xs = parseFloat(arg[0]);
						ys = parseFloat(arg[1]);
						zs = parseFloat(arg[2]);
					} 
					else if ( typeof(arg) === "number" ) { 
						xs = parseFloat(arg);
						ys = parseFloat(arg);
						zs = parseFloat(arg);
					}	
  			}			
				if ( typeof(arguments[0]['center']) === "boolean" ) {
					center = arguments[0]['center'];
				}
				if ( center === true ) { 
					x = -(xs / 2);
					y = -(ys / 2); 
					z = -(zs / 2); 
				}			
				this.debug(["cube",xs,ys,zs,center]);  
				let obj = this.brep_lib.ffi_cube(x,y,z,xs,ys,zs);	
				return obj; 
			}; 

			// ===============================================================
			// Openscad Cylinder 
			// ===============================================================
			out.create_cylinder = function cylinder() { 
				this.logger("Cylinder");  
				let obj;
				let r  = 1;
				let r1 = 1; 
				let r2 = 1; 
				let h  = 1;
				let y = 0; 
				let index = 0; 
				let center = false; 
				// Bit smarter management of arguments. Reject arrays. Each value overides a previous value.    
				let keys = Object.keys(arguments[0]);
  			for ( let i = 0; i < keys.length; i++ ) {
  				let arg = arguments[0][keys[i]];
    			if ( !(arg instanceof Array)) { // reject arrays 
						if ( keys[i] === "r" ) { 
							r1 = arg;
							r2 = arg;
						}
						if ( keys[i] === "r1" ) {	
							r1 = arg; 
						}
						if ( keys[i] === "r2" ) { 
							r2 = arg;
						}
						if ( keys[i] === "h"  ) { 
							h  = arg; 
						}
						if ( keys[i] !== "h" && keys[i] !== "r" && keys[i] !== "r1" && keys[i] !== "r2" )  { 
							if ( index === 0 ) { h = arg; }
							if ( index === 1 ) { r1 = arg; }
							if ( index === 2 ) { r2 = arg; }
							// any arg beyond this rejected  
							index++;  					
						}
					}  
  			}			
				this.debug(["cylinder",h,r,r1,r2]);  
				if ( typeof(arguments[0]['r1']) === "number"      ) { r1 = parseFloat(arguments[0]['r1']);         }
				if ( typeof(arguments[0]['r2']) === "number"      ) { r2 = parseFloat(arguments[0]['r2']);         }
				if ( typeof(arguments[0]['h'] ) === "number"      ) { h =  parseFloat(arguments[0]['h'] );         }
				if ( typeof(arguments[0]['center']) === "boolean" ) { center =        arguments[0]['center'];      }
				if ( center === true                              ) { y = -(h / 2);                                }			
				if ( r1 !== r2 ) { 
					obj = this.brep_lib.ffi_cone(r1,r2,h,y);
				}
				else { 
				 obj = this.brep_lib.ffi_cylinder(r1,h,y); 
				}
				return obj;  
			}; 

			// ===================================================================
			// Create a polyhedron openscad 
			// ===================================================================
			out.create_polyhedron = function() {
				let i = 0;
				let ii = 0;
				let faces = []; 
				let points = [];
				if ( arguments[0]['triangles'] !== undefined ) {
					this.logger("DEPRECATED: polyhedron(triangles=[]) will be removed in future releases. Use polyhedron(faces=[]) instead."); 
					arguments[0]['faces'] = arguments[0]['triangles'];
	 			}
				if ( arguments[0]['points'] === undefined ) { 
					this.logger("WARNING: PolySet has degenerate polygons");
					return false; 
				}
				// This sort of ambiguous behaviour in openscad bothers me deeply. If it doesn't exist -fail- don't be inventing things ...  		
				if ( arguments[0]['points'].length === 0 ) { 
					arguments[0]['points'] = [[0,0,0]]; 
				}
				// Really want a sanity check that makes sure that indexes in to point space actually return relevent points not just this 
				// trusting this create and fail principle. 
				let face_set = arguments[0]['faces'].reverse(); // reverse the face winding to be compatible with booleans 
				let point_set = arguments[0]['points'];  
				// let convexity = arguments[0]['convexity'] // disregarding convexity for now 
				// generate face lets with length as first index ( overhead but bit less work to get sizes in the c++ ) 
				let face_set_length = face_set.length;
				for ( i = 0; i < face_set_length; i++ ) { 
					let face = []; 
					let f_length = face_set[i].length;
					face.push( f_length+1 );  
					for ( ii = 0; ii < f_length; ii++ ) { 
						face.push( face_set[i][ii] );
					}		
					faces.push( face ); 
				}
				// Openscad if a component of the point is missing just adds it ... 
				for ( i in point_set ) { 
					if ( point_set[i][0] !== undefined ) { points.push( point_set[i][0] ); } else { points.push(0.0); }
					if ( point_set[i][1] !== undefined ) { points.push( point_set[i][1] ); } else { points.push(0.0); }
					if ( point_set[i][2] !== undefined ) { points.push( point_set[i][2] ); } else { points.push(0.0); }
				}
				return this.brep_lib.ffi_polyhedron(faces,points,faces.length);
			};

			// ===================================================================
			// Create a polgon openscad 
			// ===================================================================
			out.create_polygon = function() {
				this.logger("Polygon"); 
				let i = 0;
				let paths  = arguments[0]['paths']; 
				let points = arguments[0]['points']; 
				let a,b,c,d;
				for ( i = 0; i < points.length; i++ ) { points[i].push(0); } // add our z 
				if ( paths.length !== 1 ) { // if we contain multiple polys need a boolean iteration
					for ( i = 0; i < paths.length-1; i++ ) { 
						if ( i === 0 ) a = this.create_polyhedron({ faces:[paths[i]] , points:points } );
						b = this.create_polyhedron({ faces:[paths[i+1]] , points:points } );
						c = this.create_union( {a:a , b:b} ); 
						d = this.create_intersection( {a:a , b:b} ); 
						a = this.create_difference(   {a:c , b:d} ); 
					}
				}		
				else { // just return the single poly 
					// We close loops ourselves so we check to see if this is a closed shape. 
					// Really it must always be a closed shape ? ... 
					if ( paths[0][0] === paths[0][paths[0].length-1] ) { 
						paths[0] = paths[0].slice( 0 , paths[0].length-1 );  
					} 
					a = this.create_polyhedron({ faces:[paths[0]] , points:points } );
				}
				arguments[0]['obj'] = a;
				a = this.perform_actions(arguments[0]); 
				return a;
			};

			// ===================================================================
			// Create a circle 
			// ===================================================================
			out.create_circle = function() { 
				this.logger("Circle");
				let radius = arguments[0]['radius'];
		 		let obj = this.brep_lib.ffi_circle(radius); 
				arguments[0]['obj'] = obj; 
				obj = this.perform_actions(arguments[0]); 
				return obj; 
			};

			// Boolean union
			out.create_union = function() { 
				this.logger("Union");
				let children = arguments[0]['children'];  
				let obj = children[0];
		 		for ( let i =1; i < children.length; i++ ) {
					obj = this.brep_lib.ffi_union( obj , children[i] ); 
				}
				return obj; 
			};

			// Boolean difference
			out.create_difference = function() { 
				this.logger("Difference");
				let children = arguments[0]['children']; 
				let obj = children[0];
		 		for ( let i =1; i < children.length; i++ ) {
					obj = this.brep_lib.ffi_difference( obj , children[i] ); 
				}
				return obj;  
			};

			// Boolean intersection 
			out.create_intersection = function() { 
				this.logger("Intersection");
				let children = arguments[0]['children']; 
				let obj = children[0];
		 		for ( let i =1; i < children.length; i++ ) {
					obj = this.brep_lib.ffi_intersection( obj , children[i] ); 
				}
				return obj;  
			};
			
			// Minkowski
			out.create_minkowski = function() { 
				this.logger("Minkowski");
				let children = arguments[0]['children']; 
				let obj = children[0];
		 		for ( let i =1; i < children.length; i++ ) {
					obj = this.brep_lib.ffi_minkowski( obj , children[i] ); 
				}
				return obj;  
			};
	

			// booleans
		 	
			out.stack = []; 
			out.stack_index = 0; 
			out.quality = 0.1;

			// --------------------------------------------------------
			// Generate a hashed string
			// --------------------------------------------------------
			out.makeId = function() {
				let text = "";
				let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				for( let i=0; i < 5; i++ )
				text += possible.charAt(Math.floor(Math.random() * possible.length));
				return text;
			};

			out.stack_increment = function() { 
				this.stack_index++;
				this.stack.push([]); 
			};

			out.stack_decrement = function(count) {
				 this.stack_index-=count;
			};

			out.get_parent = function() {
				let parent = "root";
				let id = "root";
				if ( this.stack[this.stack_index-1] !== undefined ) {
					parent =  this.stack[this.stack_index-1][this.stack[this.stack_index-1].length-1]['operation'];  
					id =  this.stack[this.stack_index-1][this.stack[this.stack_index-1].length-1]['id'];  
				}
				return { parent: parent , id : id }; 
			};

			out.union = function() {  	
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 		
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'] , 
																						operation:"union" , 
																						id: this.makeId() , 
																						objects:[],
																						done: false 
																					});   
				this.stack_increment();
			};

			out.intersection = function() {  	
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 		
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'] , 
																						operation:"intersection" , 
																						id: this.makeId() , 
																						objects:[],
																						done: false 
																					});   
				this.stack_increment();
			};

			out.difference = function() {  		
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 		
				this.stack[this.stack_index].push({
																						parent: p['parent'] , 
																						parent_id: p['id'] , 
																						operation:"difference" , 
																						id: this.makeId() , 
																						objects: [] ,
																						done: false 
																					});   
				this.stack_increment();
			};

			out.minkowski = function() {  	
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 		
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'] , 
																						operation:"minkowski" , 
																						id: this.makeId() , 
																						objects:[],
																						done: false 
																					});   
				this.stack_increment();
			};

			out.union_end = function() {
				this.stack_decrement(1);	
			};

			out.intersection_end = function() {
				this.stack_decrement(1);	
			};

			out.difference_end = function() {
				this.stack_decrement(1);
			};

			out.minkowski_end = function() {
				this.stack_decrement(1);
			};

			out.end = function() {
				this.stack_decrement(1);
			};

			out.polygon = function() { 
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'], 
																						operation: "polygon" , 
																						objects: [this.create_polygon(arguments[0])] ,
																						done: true
																				 });      
			};

			out.polyhedron = function() { 
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'], 
																						operation: "polyhedron" , 
																						objects: [this.create_polyhedron(arguments[0])] ,
																						done: true
																				 });
					    
			};

			out.cube = function() { 		
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 
				this.stack[this.stack_index].push({ 
																						parent: p['parent'] , 
																						parent_id: p['id'], 
																						operation: "cube" , 
																						objects: [this.create_cube(arguments[0])],
																						done: true 
																					});  	  
			};

			out.sphere = function() { 
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'], 
																						operation: "sphere" , 
																						objects: [this.create_sphere(arguments[0])] ,
																						done: true
																				 });      
			};

			out.cylinder= function() { 
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'],  
																						operation: "cylinder" , 
																						objects: [this.create_cylinder(arguments[0])] ,
																						done: true 
																					});   
			};

			out.translate = function() { 
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'], 
																						operation: "translate" , 
																						arguments: arguments[0], 
																						id: this.makeId() ,
																						objects: [] , 
																						done: false 
																					});
		 
				this.stack_increment();
			};
	
			out.scale = function() { 
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'], 
																						operation: "scale" , 
																						arguments: arguments[0], 
																						id: this.makeId() ,
																						objects: [] , 
																						done: false 
																					});
		 
				this.stack_increment();
			};

			out.rotate = function() {
				let p = this.get_parent(); 
				if ( this.stack[this.stack_index] === undefined ) this.stack[this.stack_index] = []; 
				this.stack[this.stack_index].push({ parent: p['parent'] , 
																						parent_id: p['id'], 
																						operation: "rotate" , 
																						arguments: arguments[0], 
																						id: this.makeId() ,
																						objects: [] , 
																						done: false 
																					});  
				this.stack_increment();
			};

			// ------------------------------------------------------------
			// Check all of a nodes children to see if they are complete and
			// collect together all resultant prims  
			// ------------------------------------------------------------
			out.children_complete = function( operation , id ) { 
				let i,ii,objects = [] , state = true;  
				for ( i = 0; i < this.stack.length; i++ ) { 
					for ( ii = 0; ii < this.stack[i].length; ii++ ) { 
						if ( operation === this.stack[i][ii]['parent'] && id === this.stack[i][ii]['parent_id'] ) { 
							if ( this.stack[i][ii]['done'] === false ) {
								state = false;
							}
							else {
								objects.push( this.stack[i][ii]['objects'] );
							}
						}
					}
				}
				if ( state === false ) { 
					return false; 
				} else {
					return lodash.flatten(objects);
				}
			};

			// -------------------------------------------------------------
			// Walk and keep walking until no more incomplete nodes are left
			// Brute force style. Eventually we will hit every node. 
			// -------------------------------------------------------------
			out.walk = function() {  
				let i,ii,iii;
				for ( i = 0; i < this.stack.length; i++ ) { 
					for ( ii = 0; ii < this.stack[i].length; ii++ ) {
						if ( this.stack[i][ii]['done'] === false ) {  
							let objects = this.children_complete( this.stack[i][ii]['operation'] , this.stack[i][ii]['id'] ); 
							if ( objects !== false ) { 
							switch( this.stack[i][ii]['operation'] ) { 
									case "translate" : {  
										for ( iii = 0; iii < objects.length; iii++ ) {
											this.stack[i][ii]['arguments']['obj'] = objects[iii]; 		 
											objects[iii] = this.create_translate( this.stack[i][ii]['arguments'] ); 
											this.stack[i][ii]['arguments']['obj'] = []; 
										}
										this.stack[i][ii]['objects'] = ( objects );  
										this.stack[i][ii]['done'] = true; 	
										out.walk();
										break;
									}

									case "scale" : {  
										for ( iii = 0; iii < objects.length; iii++ ) {
											this.stack[i][ii]['arguments']['obj'] = objects[iii]; 		 
											objects[iii] = this.create_scale( this.stack[i][ii]['arguments'] ); 
											this.stack[i][ii]['arguments']['obj'] = []; 
										}
										this.stack[i][ii]['objects'] = ( objects );  
										this.stack[i][ii]['done'] = true; 	
										out.walk();
										break;
									}

									case "rotate" : {  
										for ( iii = 0; iii < objects.length; iii++ ) {
											this.stack[i][ii]['arguments']['obj'] = objects[iii]; 		 
											objects[iii] = this.create_rotate( this.stack[i][ii]['arguments'] ); 
											this.stack[i][ii]['arguments']['obj'] = []; 
										}
										this.stack[i][ii]['objects'] =  objects;   
										this.stack[i][ii]['done'] = true; 	
										out.walk();
										break;
									}

									case "union" : { 	
										objects = lodash.flatten(objects); 
										this.stack[i][ii]['objects'].push( this.create_union({children:objects}) );   
										this.stack[i][ii]['done'] = true;
										out.walk(); 
										break;	
									}

									case "intersection" : { 	
										objects = lodash.flatten(objects); 
										this.stack[i][ii]['objects'].push( this.create_intersection({children:objects}) );   
										this.stack[i][ii]['done'] = true;
										out.walk(); 	
										break;
									}

									case "difference" : { 	
										objects = lodash.flatten(objects); 
										this.stack[i][ii]['objects'].push( this.create_difference({children:objects}) );   
										this.stack[i][ii]['done'] = true;
										out.walk(); 	
										break;
									}

									case "minkowski" : { 	
										objects = lodash.flatten(objects); 
									 	this.stack[i][ii]['objects'].push( this.create_minkowski({children:objects}) );   
									 	this.stack[i][ii]['done'] = true;
										out.walk();
										break; 	
									}
								}
							}
						} 
					}
				}
			};

			// defaults for arguments for functions  
			out.default = (a,b) => { if ( a === undefined ) { return b; } return a; };

			// log output 
			out.echo = function()  {
				let str = ""; 
				for ( let i = 0; i < arguments.length; i++ ) { 
					str += arguments[i]; 
				}
				process.send(JSON.stringify({type:"echo",data:str}))
			};

			// send log results to client 	
			out.logger = function(str) {  
				process.send(JSON.stringify({type:"log",data: str }));
			};

			// send log results to client 	
			out.error = function(str) { 
				process.send(JSON.stringify({type:"error", data: str }));
			};

			out.debug = function(str) { 
				process.send(JSON.stringify({type:"debug", data: str}));
			};

			out.complete = function(objects) { 
				process.send(JSON.stringify({type:"objects", data: objects}));
				out.close();
			}

			out.close = function() { 
					process.send(JSON.stringify({type:"close",data:""}));	
			}

			// output result 
			out.run = function() {
				let i = 0; 
				let ii = 0;  		
				let objects = []; 
				let qLength = out.stack.length; 
					for ( let i = 0; i < qLength; i++ ) {
						let rLength = out.stack[i].length;
						for ( let ii = 0; ii < rLength; ii++ ) { 
							if  ( out.stack[i][ii]['parent'] === "root" ) {
								let sLength = out.stack[i][ii]['objects'].length 
								for ( let iii = 0; iii < sLength; iii++ ) { 
									objects.push(this.brep_lib.ffi_convert_brep_tostring(out.stack[i][ii]['objects'][iii],this.quality)); 
								} 
							}
						}  
					}
					return objects;		
			};

			let brep_path = ''; 
			if (fs.existsSync('./brep.so')) {
    		brep_path = './brep.so'; 
			}
			else { 		
				brep_path = '/usr/src/app/brep.so';
			}
			
			out.brep_lib = ffi.Library(brep_path, { 
											"ffi_cube":["int",["float","float","float","float","float","float"]],
											"ffi_sphere":["int",["float","float","float","float"]],
											"ffi_cone":["int",["float","float","float","float"]],
											"ffi_polyhedron":["int",[ArrayType(ArrayType('int')),ArrayType('float'),'int']],
											"ffi_difference":["int",["int","int"]],
											"ffi_minkowski":["int",["int","int"]],
											"ffi_union":["int",["int","int"]],
											"ffi_intersection":["int",["int","int"]],
											"ffi_convert_brep_tostring":["string",["int","float"]],
											"ffi_translate":["int",["float","float","float","int"]],
											"ffi_scale":["int",["float","float","float","int"]],
											"ffi_rotateX":["int",["float","int"]],
											"ffi_rotateY":["int",["float","int"]],
											"ffi_rotateZ":["int",["float","int"]],
											"ffi_circle":["int",["float"]],
											"ffi_extrude":["int",["float","int"]],
											"ffi_cylinder":["int",["float","float","float"]],
											"set_callback": [ "int", ["pointer"] ] 
										}); 

					// Callback from the native lib back into js
					out.callback = ffi.Callback('void', ['string'],  function (msg) { 
							out.logger(msg);  
					});
					// make an extra reference to callback to avoid GC.
					process.on('exit', function() { out.callback; });
					// set the callback in our instance of the brep library
					out.brep_lib.set_callback( out.callback);
			
					out.foo(); 
					out.walk(); 
					out.complete(out.run()) 				
	}

	process.on('message', (data) => {
		//data = JSON.parse(data); 
	  ProcessScad( data )
	});
	



	
