
module plate() { 

    width = 90; 
    
    translate([-width/2,-80/2,0]) 
    cube([90,80,1.5]); 
    
    translate([ -90/2 , -80/2 , 0 ] ) 
    cylinder( d = 4 , h = 1.5 );
    
    translate([-41,30,0]) { 
        translate([2.5,-2.5,0])
        cylinder( height = 2 , d = 3 ); 
        
        translate([79.5,-2.5,0])
        cylinder( height = 2 , d = 3 ); 
        
        translate([16.5,-48,0])
        cylinder( height = 2 , d = 3 ); 
        
        translate([65.5,-48,0])
        cylinder( height = 2 , d = 3 );
    }

}

plate(); 