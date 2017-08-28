this.quality = 0.9; 

module flange(h=0,id=0,od=0,thickness=0,pipe_od=0,holes=0) { 
   cent = od-((od-pipe_od)/2);
   hole_size = ((od-pipe_od)/2)-1.5; 
   translate([0,0,h]){
   difference(){
    difference() { 
       cylinder( r = od , h = thickness  );
       cylinder( r = id , h = thickness  );
   }
   for ( i = [0:360/holes:360]) {
        rotate([0,0,i]){  
        translate([0,cent,0]){
            cylinder( r = hole_size , h = thickness+5 );
        }
      } 
   }
   }}
}


module test(pipe_od=0,pipe_id=0,pipe_length=0,
flange_thickness=0,flange_id=0,flange_od=0,holes=0
) { 
    translate([0,0,-pipe_length/2]) {
        difference(){
            cylinder( r = pipe_od , h = pipe_length ); 
            cylinder( r = pipe_id , h = pipe_length ); 
        }
    }
    flange(h=pipe_length/2,od=flange_od,id=flange_id,thickness=flange_thickness,pipe_od=pipe_od,holes=holes);
    flange(h=-pipe_length/2,od=flange_od,id=flange_id,thickness=flange_thickness,pipe_od=pipe_od,holes=holes);
    
    
}
test( pipe_od = 20,
    pipe_id = 15,
    pipe_length = 200,
    flange_thickness = 20, 
    flange_id = 15, 
    flange_od = 60,     
    holes = 6); 

minkowski() { 
	cube(size=50,center=true); 
	sphere(r=25); 
}
    
