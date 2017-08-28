function nigel ( x, y, z ) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
	this.s = true; 
	console.log("weee!")
};

THREE.Vector3 = nigel

/*THREE.Vector3.prototype.cloneS = function () {
		return new this.constructor( this.x, this.y, this.z , this.s );
};

THREE.Vector3.prototype.copy = function ( v ) {
		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		this.s = v.s; 
		return this;
};

THREE.Face3 = function ( a, b, c, normal, color, materialIndex ) {
	this.a = a;
	this.b = b;
	this.c = c;
	this.normal = normal instanceof THREE.Vector3 ? normal : new THREE.Vector3();
	this.vertexNormals = Array.isArray( normal ) ? normal : [];
	this.color = color instanceof THREE.Color ? color : new THREE.Color();
	this.vertexColors = Array.isArray( color ) ? color : [];
	this.materialIndex = materialIndex !== undefined ? materialIndex : 0;
	this.split_a = []; 
	this.split_b = []; 
	this.split_c = []; 
};

THREE.Object3D.prototype.toDamien = function ( meta ) { 		
	var objects = []; 
	this.updateMatrixWorld();
	var position = new THREE.Vector3();
	var quaternion = new THREE.Quaternion();
	var scale = new THREE.Vector3();
	this.matrixWorld.decompose( position, quaternion, scale );
	if ( this.color === undefined ) this.color = [ 1 , 0, 0 ]; 
	objects.push([JSON.stringify(new THREE.BufferGeometry().fromGeometry(this.geometry)) , position.toArray() , quaternion.toArray() , this.color ]); 
	if ( this.children != undefined ) { 			
		var i = 0;
		var child_length = this.children.length; 
		for ( i = 0; i < child_length; i++ ) { 
			objects = objects.concat( this.children[i].toDamien() );
		}
	}
	return objects; 
};

THREE.Face3.prototype.copy = function ( source ) {
	this.a = source.a;
	this.b = source.b;
	this.c = source.c;
	this.split_a = source.split_a; 
	this.split_b = source.split_b; 
	this.split_c = source.split_c; 
	this.normal.copy( source.normal );
	this.color.copy( source.color );
	this.materialIndex = source.materialIndex;
	for ( var i = 0, il = source.vertexNormals.length; i < il; i ++ ) {
		this.vertexNormals[ i ] = source.vertexNormals[ i ].clone();
	}
	for ( var i = 0, il = source.vertexColors.length; i < il; i ++ ) {
		this.vertexColors[ i ] = source.vertexColors[ i ].clone();
	}
	return this;
}

THREE.BufferGeometry.prototype.fromDamien = function(o) { 
	var obj = JSON.parse(o); 
	if ( obj.data.attributes.position !== undefined ) {
		this.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( obj.data.attributes.position.array ), 3 ) );
	}
	else { console.log("Object with no position buffer!"); }
	if ( obj.data.attributes.color !== undefined ) { 
		this.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( obj.data.attributes.color.array ), 3 ) );
	}
	if ( obj.data.attributes.normal !== undefined ) { 
		this.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( obj.data.attributes.normal.array ), 3 ) );
	}
	if ( obj.data.attributes.uv !== undefined ) {
			this.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( obj.data.attributes.uv.array ), 2 ) );
	}
}*/



