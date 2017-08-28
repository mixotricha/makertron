var primary_width   = '95vw'  
var secondary_width = '94vw'    
var	canvas_width    = '93.2vw'  
var editor_height   = '75vh' 

module.exports = { 	

	primary_color        : "#392b8c" ,  
	light_primary_color  : "#C5CAE9" , 
	text_icons_color     : "#FFFFFF" , 
	accent_color         : "#448AFF" ,
	primary_text_color   : "#212121" , 
	secondary_text_color : "#727272" , 
	divider_color        : "#B6B6B6" ,
	dark_primary_color   : "#303F9F" , 

	primary_width   :  primary_width  , 
	secondary_width :  secondary_width,   
	canvas_width    :  canvas_width   ,

	whole_page :  {
	  				'bordeRadius'                 : '3px',
						'borderStyle'                  : 'solid',
						'padding'                       : '4px', 
						'margin'                        : 'auto', 
						'backgroundColor'              : '#303F9F',
						'borderColor'                  : '#FFFFFF',
						'borderWidth'                  : '1px' ,
						'width'                         : primary_width,
            'height'                        : '95vh',
						'position'                      : 'relative'
         } ,

	small :  {
	  				'borderRadius'                 : '3px',
						'borderStyle'                  : 'solid',
						'padding'                       : '4px', 
						'marginLeft'                   : '4px', 
						'marginRight'                  : '4px', 
						'marginBottom'                 : '0px', 
						'backgroundColor'              : '#303F9F',
						'borderColor'                  : '#FFFFFF',
						'borderWidth'                  : '1px' ,
						'width'                         : secondary_width ,
            'height'                        : '5vh',
						'position'                      : 'relative'
         } , 

	small_no_margin :  {
	  				'borderRadius'                 : '3px',
						'borderStyle'                  : 'solid',
						'padding'                       : '0px', 
						'margin'                       : '4px' , 	
						'backgroundColor'              : '#303F9F',
						'borderColor'                  : '#FFFFFF',
						'borderWidth'                  : '1px' ,
						'width'                         : secondary_width ,
            'height'                        : '5vh',
						'position'                      : 'relative'
         } , 

	logo : { 
					'padding': '18px' ,
					'margin' : '0px' ,  
					'fontFamily': "din1451alt",
					'fontSize' : '30px' ,
					'fontWeight' : 'Bold' , 
					'color' : '#303F9F',
					'textAlign' : 'center' , 
					 'verticalAlign': 'middle',			 
				 	'width' : '15vw',
					'backgroundColor': 'white'
			
	}, 

	about : { 
					'padding': '0px' ,
					'margin' : '0px' ,  
					'fontFamily': "din1451alt",
					'fontSize' : '30px' ,
					'fontWeight' : 'Bold' , 
					'color' : '#303F9F',
					'textAlign' : 'right'  
					
				
	}, 


	main :  {
	  				'borderRadius'                 : '3px',
						'borderStyle'                  : 'solid',
						'padding'                       : '4px', 
						'marginLeft'                   : '4px', 
						'marginRight'                  : '4px', 
						'marginRight'                  : '0px', 
						'marginBottom'                 : '4px', 
						'backgroundColor'              : '#303F9F',
						'borderColor'                  : '#FFFFFF',
						'borderWidth'                  : '1px' ,
						'width'                         : secondary_width,
            'height'                        : '81vh'
         } , 

	scroller :  {
						
         } , 

	editor :  {
	  				'bordeRadius'                 : '3px',
						'borderStyle'                  : 'solid',
						'padding'                       : '4px', 
						'marginLeft'                   : '4px', 
						'marginRight'                  : '4px', 
						'marginRight'                  : '0px', 
						'marginBottom'                 : '4px', 
						'backgroundColor'              : '#303F9F',
						'borderColor'                  : '#FFFFFF',
						'borderWidth'                  : '1px' ,
						'width'                        : secondary_width , 
						'height'                       : '100%',
						'position'                     : 'relative' 
         } , 

		console :  {
	  				'bordeRadius'                 : '3px',
						'borderStyle'                  : 'solid',
						'padding'                       : '4px', 
						'marginLeft'                   : '4px', 
						'marginRight'                  : '4px', 
						'marginRight'                  : '0px', 
						'marginBottom'                 : '4px', 
						'backgroundColor'              : '#303F9F',
						'borderColor'                  : '#FFFFFF',
						'borderWidth'                  : '1px' ,
						'width'                         : secondary_width,
            'height'                        : '50vh'
         } , 

	button :  {
						'fontFamily': "din1451alt",
						'fontSize' : '20px' , 
						'fontWeight' : 'Bold' , 
					'color' : '#303F9F',
	  				'borderRadius'                 : '3px',
						'borderStyle'                  : 'solid',
						'padding'                      : '6px', 
						'margin'                       : '4px' , 
						'backgroundColor'              : '#303F9F',
						'borderColor'                  : '#FFFFFF',
						'borderWidth'                  : '1px' ,
				    'height'                        : '4vh',
						'position'                      : 'relative',
						'backgroundColor': 'rgba(255, 255, 255, 0.6)'
         },

	ace_editor : {
								'height':'80%',
								'position':'absolute',
								'backgroundColor': 'rgba(245, 245, 245, 0.6)'
							} ,

	ace_console : {
								'height':'85%',
								'position':'absolute',
								'backgroundColor': 'rgba(245, 245, 245, 0.6)',
								
							}, 

	gears : { 
		'position':'absolute',
		'opacity' : '0' 
	},

	viewport : { 
		'position':'absolute'
	}

}



