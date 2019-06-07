/***********************************************************************************************************************

authors : Michel Blaze
date : 05/2019
description : the main code for scenario builder/classes etc..,

****************************************************************************************************************************/

var number_road = 0; // Variables to count road'number
var number_alphabot = 0; // Variables to count alphabot
var number_traffic_lights = 0; // Variables to count traffic lights
var Road = []; // Array to contain road object
var Traffics_Lights = [];
var Alphabot = []; // Array for alphabot objects
var allowBuilding = false; //Flags to allow or no creating of Building
var allowTrafficLight = false;
var scene_name = []; //Array to store
var number_scene = 0;
    var allowRoad = false;
	var boxCount = 0;
	var sphereCount;
    var currentBox;
	var currentSphere;
	var camera;
	var scene;
	var light;
	var fog_activate = false;
	var engine;
	var axis_activate = false;
    var firstClick = true; 
    var firstClickPos = null;
    var myWall = null;
	var Scene_Loaded = false;
	  //html elements
    var allCarsInformationPanel;
    var consoleLog;
    var startSimulationButton;
    var stopSimulationButton;
    var inner;
    var newAlphabotButton;
    var newRoadButton;
    var newTrafficLightButton;
    var mainPathBtn;//most outer button in tree hierarchy for Path
    var mainCarBtn;//most outer button in tree hierarchy for Car
    var mainActionBtn;//most outer button in tree hierarchy for Action
    var timelineSlider;
    var time;//time for timeline
    var codeArea;
    var PathInner, TrajectoryInner, ActionInner;//to dynamically add more elements
	
	
	function GUI(scene,canvas,engine)
	{
		/*
		 var advancedTexture1 = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI1");
    var road_gui = new BABYLON.GUI.TextBlock();
    road_gui.text = "Number Roads:"+number_road+"\n"+"Number Alphabots:"+number_alphabot+"\n"+"Number Traffic Lights :"+number_traffic_lights;
    road_gui.color = "white";
    road_gui.fontSize = 16;
    road_gui.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
	road_gui.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    advancedTexture1.addControl(road_gui);    
	*/
	}
	
	

	

	
	function expandTopHigherBtn(forTrajectory){
    if(forTrajectory && mainCarBtn){
        if(mainCarBtn.parentElement.querySelector(".nested") && !mainCarBtn.parentElement.querySelector(".nested").classList.contains("active")){
            mainCarBtn.parentElement.querySelector(".nested").classList.toggle("active");
            mainCarBtn.classList.toggle("check-box");
        }
    }else if(mainPathBtn){
        if(mainPathBtn.parentElement.querySelector(".nested") && !mainPathBtn.parentElement.querySelector(".nested").classList.contains("active")){
            mainPathBtn.parentElement.querySelector(".nested").classList.toggle("active");
            mainPathBtn.classList.toggle("check-box");
        }

    }
}
	          
				$(document).ready(function(){
                $("#submit_scene").click(function(){
              	Create_Ground(scene,canvas,engine);
                 modal.style.display = "none";   
                 });
                 });
			
				      $(document).ready(function(){
                $("#add_road").click(function(){
              	Creating_Paths(scene,canvas,engine);
                 });
                 });
				 
				 $(document).ready(function(){
                $("#submit_robot").click(function(){
              	Create_Alphabot();
                 });
                 });
				 
			


function resizable (el, factor) {
    var int = Number(factor) || 7.7;
    function resize() {el.style.width = ((el.value.length+1) * int) + 'px'}
    var e = 'keyup,keypress,focus,blur,change'.split(',');
    for (var i in e) el.addEventListener(e[i],resize,false);
    resize();
  }			
	
	function Activate_Fog(scene,canvas,engine)
	{
		if(fog_activate==false)
		{
		fog_activate = true;	
		scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
		scene.fogDensity = 0.03;
		}
		else if(fog_activate==true)
		{
			fog_activate=false;
			scene.fogDensity = 0;
		}
		
		
	}
	
	function Delete_Scene_From_Database() // This function allow to delete scene selected from database
	{
		for(var i=1; i<= number_scene;i++)
	{
		//if(document.getElementById('scene_name[i]').checked == true){
			
			alert(scene_name[i]);
		//}
	}	
        
	}
	

function Top_View(camera) // Allow to generate TopView
    {
     camera.position = new BABYLON.Vector3(30, 10, 0);
     camera.setTarget(BABYLON.Vector3.Zero());

     camera.rotation.x = Math.PI/2;
	 camera.position.y=1000;

   } // We start the first start of animation

	function Activate_Sky(scene,canvas,engine)
	{
		
		// Sky material
	var skyboxMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
	//skyboxMaterial._cachedDefines.FOG = true;

	// Sky mesh (box)
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
    skybox.material = skyboxMaterial;
	
	/*
	* Keys:
	* - 1: Day
	* - 2: Evening
	* - 3: Increase Luminance
	* - 4: Decrease Luminance
	* - 5: Increase Turbidity
	* - 6: Decrease Turbidity
    * - 7: Move horizon to -50
    * - 8: Restore horizon to 0
	*/
	var setSkyConfig = function (property, from, to) {
		var keys = [
            { frame: 0, value: from },
			{ frame: 100, value: to }
        ];
		
		var animation = new BABYLON.Animation("animation", property, 100, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
		animation.setKeys(keys);
		
		scene.stopAnimation(skybox);
		scene.beginDirectAnimation(skybox, [animation], 0, 100, false, 1);
	};
	
	window.addEventListener("keydown", function (evt) {
		switch (evt.keyCode) {
			case 49: setSkyConfig("material.inclination", skyboxMaterial.inclination, 0); break; // 1
			case 50: setSkyConfig("material.inclination", skyboxMaterial.inclination, -0.5); break; // 2

			case 51: setSkyConfig("material.luminance", skyboxMaterial.luminance, 0.1); break; // 3
			case 52: setSkyConfig("material.luminance", skyboxMaterial.luminance, 1.0); break; // 4
			
			case 53: setSkyConfig("material.turbidity", skyboxMaterial.turbidity, 40); break; // 5
			case 54: setSkyConfig("material.turbidity", skyboxMaterial.turbidity, 5); break; // 6
			
            case 55: setSkyConfig("material.cameraOffset.y", skyboxMaterial.cameraOffset.y, 50); break; // 7
            case 56: setSkyConfig("material.cameraOffset.y", skyboxMaterial.cameraOffset.y, 0); break;  // 8
			default: break;
		}
    });
	
	// Set to Day
	setSkyConfig("material.inclination", skyboxMaterial.inclination, 0);
		
		

		
	}	
		
			

 var showAxis = function(size) {
    var makeTextPlane = function(text, color, size) {
    var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
    var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
    plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
    plane.material.backFaceCulling = false;
    plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
    plane.material.diffuseTexture = dynamicTexture;
    return plane;
     };
    var axisX = BABYLON.Mesh.CreateLines("axisX", [ 
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0), 
      new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
      ], scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    var xChar = makeTextPlane("X", "red", size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
    var axisY = BABYLON.Mesh.CreateLines("axisY", [
        new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( -0.05 * size, size * 0.95, 0), 
        new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( 0.05 * size, size * 0.95, 0)
        ], scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    var yChar = makeTextPlane("Y", "green", size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
        new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0 , -0.05 * size, size * 0.95),
        new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0, 0.05 * size, size * 0.95)
        ], scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    var zChar = makeTextPlane("Z", "blue", size / 10);
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
  };
 
  
  function Display_Scene_From_Database() // this function allow to get scene from database and to display into the terminal
  {
	  
	  var ajax = new XMLHttpRequest(); // New ajax request
    ajax.open("GET", "http://192.168.43.44/vista/Source/src/php/display_scene.php", true);
    ajax.send();
	
	

      
	
    ajax.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            console.log(data);

            var html = "";
            for(var a = 0; a < data.length; a++) {   //<input type="checkbox" name="vehicle1" value="Bike"> I have a bike<br>
 
                var name = data[a].Name;
                var width = data[a].Width;
				var length = data[a].Length;
				var date_creating = data[a].date_creating;
				scene_name[a] = (name+'_scene');
				number_scene++;
			
				document.getElementById('display_scene').innerHTML += '<tr>';
				

				document.getElementById('display_scene').innerHTML += '<td><input type="checkbox"'+'id='+name+'_name'+' />'+name+'</td>'+'<td>'+width+'</td>'+'<td>'+length+'</td>'+'<td>'+date_creating+'</td>';
				
				
				document.getElementById('display_scene').innerHTML += '</tr>';

            }

        }
    };  
	  
  }


function Create_Alphabot()
{
	number_alphabot++; // We increase the number of robots
	var name = document.getElementById("alphabot_name").value; // We get the robot name
	var position_x_initial = document.getElementById("initial_position_x_robot").value; // The initial X position
	var position_z_initial = document.getElementById("initial_position_z_robot").value; // The initial Z position
	var ip_addr = document.getElementById("ip_addr").value; // The robot IP adress
	var port = document.getElementById("port_robot").value; // Its port
	Alphabot[number_alphabot] = new Alphabots(name,position_x_initial,position_z_initial,ip_addr,port);
     Alphabot[number_alphabot].display();

	
}

class Traffic_Lights {
	constructor(name,position_x,position_z,road_affiliation,delay,current_state)
	{
		this.save = false;
		this.name = name;
		this.position_x = position_x;
		this.position_z = position_z;
		this.road_affiliation = road_affiliation;
		this.delay = delay; // Time for traffic light switching
		this.current_state;	// Red or green, not for necessar to send in databse, this variable is just for animating
	}
	 send_to_database() {
		 
         $.ajax
      ({
        url: '/insert_traffic_light',
        type: 'POST',
                data: {
               'traffic_light_name': this.name,
	           'position_x': this.position_x,
	           'position_z': this.position_z,
			   'road_affiliation': this.road_affiliation,
			   'delay': this.delay,
			   'scene' : "test"	            },
	          dataType: "text",
                        success: function(strMessage) {
                            $("#consoleLogArea").html(strMessage);
                            $("#test")[0].reset();
                        }});
   }
   
       display()       
	 {
         document.getElementById('traffic_light_list').innerHTML += '<li id="'+this.name+'">';
		document.getElementById('traffic_light_list').innerHTML += '<span class="box check-box">';
		document.getElementById('traffic_light_list').innerHTML += ' <input class="names speedinformation" type="text" id="'+this.name+'" name="null" min="null" max="null" style="width: 300px;" value="'+this.name+'">';
		document.getElementById('traffic_light_list').innerHTML += '</span><ul class="nested active"></ul>';
		document.getElementById('traffic_light_list').innerHTML += '</li>';
	 }
   

}

class Alphabots {
    constructor(name,position_x_initial,position_z_initial,ip_addr,port) {  
    this.save = false;
	this.name = name;
    this.position_x_initial = position_x_initial;
	this.position_z_initial = position_z_initial;
	this.ip_addr = ip_addr;
	this.port = port;
         }
        display(){ 
        document.getElementById('alphabot_list').innerHTML += '<li id="'+this.name+'">';
		document.getElementById('alphabot_list').innerHTML += '<span class="box check-box">';
		document.getElementById('alphabot_list').innerHTML += ' <input class="names speedinformation" type="text" id="'+this.name+'" name="null" min="null" max="null" style="width: 300px;" value="'+this.name+'  '+'IP Adress : '+this.ip_addr+':'+this.port+'">';
		document.getElementById('alphabot_list').innerHTML += '</span><ul class="nested active"></ul>';
		document.getElementById('alphabot_list').innerHTML += '</li>';
		
		}
		forward(){
			 $.ajax
                 ({
                 url: '/robot_connect',
                 type: 'POST',
                 data: {'instructions': "forward",'speed': this.speed,'ip_addr':this.ip_addr,'port':this.port},
                 dataType: "text",
                        success: function(strMessage) {
                            $("#test").text(strMessage);
                            $("#test")[0].reset();
                        }});
	     	}
			
			
		backward(){
			    $.ajax
                ({
                   url: '/robot_connect',
                   type: 'POST',
                   data: {'instructions': "backward",'speed': this.speed,'ip_addr':this.ip_addr,'port':this.port},
	               dataType: "text",
                        success: function(strMessage) {
                            $("#test").text(strMessage);
                            $("#test")[0].reset();
                        }});		
		}
		
		
			up(){
			    $.ajax
                ({
                   url: '/robot_connect',
                   type: 'POST',
                   data: {'instructions': "more",'speed': this.speed,'ip_addr':this.ip_addr,'port':this.port},
	               dataType: "text",
                        success: function(strMessage) {
                            $("#test").text(strMessage);
                            $("#test")[0].reset();
                        }});		
		}
		
			down(){
			    $.ajax
                ({
                   url: '/robot_connect',
                   type: 'POST',
                   data: {'instructions': "less",'speed': this.speed,'ip_addr':this.ip_addr,'port':this.port},
	               dataType: "text",
                        success: function(strMessage) {
                            $("#test").text(strMessage);
                            $("#test")[0].reset();
                        }});		
		}
		
		
		
		right(){
			
			
		        $.ajax
                ({
                   url: '/robot_connect',
                   type: 'POST',
                   data: {'instructions': "right",'speed': this.speed,'ip_addr':this.ip_addr,'port':this.port},
	               dataType: "text",
                    success: function(strMessage) {
                    $("#test").text(strMessage);
                    $("#test")[0].reset();
                     }});	
		}
		
		left(){
			
		          $.ajax
                  ({
                   url: '/robot_connect',
                   type: 'POST',
                   data: {'instructions': "left",'speed': this.speed,'ip_addr':this.ip_addr,'port':this.port},
	               dataType: "text",
                        success: function(strMessage) {
                            $("#test").text(strMessage);
                            $("#test")[0].reset();
                        }});	
		}

		stop(){
			
					    $.ajax
                    ({
                       url: '/robot_connect',
                       type: 'POST',
                        data: {'instructions': "stop",'speed': this.speed,'ip_addr':this.ip_addr,'port':this.port},
	                   dataType: "text",
                        success: function(strMessage) {
                            $("#test").text(strMessage);
                            $("#test")[0].reset();
                        }});	
		}
		
     send_to_database() {
		 
         $.ajax
      ({
        url: '/insert_alphabot',
        type: 'POST',
                data: {
               'alphabot_name': this.name,
	           'initial_position_x_robot': this.position_x,
	           'initial_position_z_robot': this.position_z,
			   'ip_addr': this.ip_addr,
			   'port_robot': this.port,
			   'scene': "test"
	            },
	          dataType: "text",
                        success: function(strMessage) {
                            $("#consoleLogArea").html(strMessage);
                            $("#test")[0].reset();
                        }});
   }
   
   Draw(){
	   
	   
	   /*-----------------------Car Body------------------------------------------*/ 
	
	//Car Body Material 
	var bodyMaterial = new BABYLON.StandardMaterial("body_mat", scene);
  	bodyMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.25, 0.25);
  	bodyMaterial.backFaceCulling = false;
	
	//Array of points for trapezium side of car.
	var side = [new BABYLON.Vector3(-4, 2, -2),
				new BABYLON.Vector3(4, 2, -2),
				new BABYLON.Vector3(5, -2, -2),
				new BABYLON.Vector3(-7, -2, -2)				
	];
	
	side.push(side[0]);	//close trapezium
	
	//Array of points for the extrusion path
	var extrudePath = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 4)];
	
	//Create body and apply material
	var carBody = BABYLON.MeshBuilder.ExtrudeShape("body", {shape: side, path: extrudePath, cap : BABYLON.Mesh.CAP_ALL}, scene);
	carBody.material = bodyMatserial;
	/*-----------------------End Car Body------------------------------------------*/
	
	/*-----------------------Wheel------------------------------------------*/ 
	
	//Wheel Material 
	var wheelMaterial = new BABYLON.StandardMaterial("wheel_mat", scene);
  	var wheelTexture = new BABYLON.Texture("http://i.imgur.com/ZUWbT6L.png", scene);
	wheelMaterial.diffuseTexture = wheelTexture;
	
	//Set color for wheel tread as black
	var faceColors=[];
	faceColors[1] = new BABYLON.Color3(0,0,0);
	
	//set texture for flat face of wheel 
	var faceUV =[];
	faceUV[0] = new BABYLON.Vector4(0,0,1,1);
	faceUV[2] = new BABYLON.Vector4(0,0,1,1);
	
	//create wheel front inside and apply material
	var wheelFI = BABYLON.MeshBuilder.CreateCylinder("wheelFI", {diameter: 3, height: 1, tessellation: 24, faceColors:faceColors, faceUV:faceUV}, scene);
  	wheelFI.material = wheelMaterial;
	  
	//rotate wheel so tread in xz plane  
  	wheelFI.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.WORLD);
	wheelFI.parent = carBody;  
	//
	
  /*-----------------------End Wheel------------------------------------------*/ 
  
  /*------------Create other Wheels as Instances, Parent and Position----------*/
  var wheelFO = wheelFI.createInstance("FO");
  wheelFO.parent = carBody;
  wheelFO.position = new BABYLON.Vector3(-4.5, -2, 2.8);
  
  var wheelRI = wheelFI.createInstance("RI");
  wheelRI.parent = carBody;
  wheelRI.position = new BABYLON.Vector3(2.5, -2, -2.8);
  
  var wheelRO = wheelFI.createInstance("RO");
  wheelRO.parent = carBody;
  wheelRO.position = new BABYLON.Vector3(2.5, -2, 2.8);
  
  wheelFI.position = new BABYLON.Vector3(-4.5, -2, -2.8);
  
  /*------------End Create other Wheels as Instances, Parent and Position----------*/
	   

   }

         
}

class Camera {
    constructor(name,position_x,position_y,position_z) {  
    this.name = name;
    this.position_x = position_x;
	this.position_y = position_y;
	this.posirion_z = position_z;
         }

     send_to_database() {
         $.ajax
      ({
        url: '/undefined',
        type: 'POST',
                data: {
               'name': this.name,
	           'position_x': this.position_x,
	           'position_z': this.position_z
	            },
	          dataType: "text",
                        success: function(strMessage) {
                            $("#test").text(strMessage);
                            $("#test")[0].reset();
                        }});
   }		 
}


class Roads { // To create a new car object
  constructor(name,width,initial_position_x,initial_position_z,final_position_x,final_position_z) {  // Receive in parameter the vector coordinate

    this.save = false; // Flag to indicate if object saved in database
	this.name = name;
	this.width = width; // And the positions..(x,y,z)
    this.initial_position_x = initial_position_x;
    this.initial_position_z = initial_position_z; 
	this.final_position_x = final_position_x;
	this.final_position_z = final_position_z;
    this.distance = Math.sqrt(
        				Math.pow(this.final_position_x - this.final_position_x, 2) +
        				Math.pow(this.final_position_z - this.initial_position_z, 2)
        			);}	
  
  display() { // Function to sent attribute
  
        document.getElementById('road_list').innerHTML += '<li id="'+this.name+'">';
		document.getElementById('road_list').innerHTML += '<span class="box check-box">';
		document.getElementById('road_list').innerHTML += ' <input class="names speedinformation" type="text" id="'+this.name+'" name="null" min="null" max="null" style="width: 300px;" value="'+this.name+'  '+'Length: '+this.distance+'">';
		document.getElementById('road_list').innerHTML += '</span><ul class="nested active"></ul>';
		document.getElementById('road_list').innerHTML += '</li>';
		
  
  
   }
   
     send_to_database() {
		 var previous_text = document.getElementById("consoleLogArea");

         $.ajax
      ({
        url: '/insert_road',
        type: 'POST',
                data: {
               'width': this.width,
			   'road_name' : this.name,
			   'scene' : "test",
	           'initial_position_x': this.initial_position_x,
	           'initial_position_z': this.initial_position_z,
	           'final_position_x': this.final_position_x,
	           'final_position_z': this.final_position_z,
	            },
	          dataType: "text",
                        success: function(strMessage) {
                            $("#consoleLogArea").html(strMessage);

                        }
    });

   }
   
        Draw(canvas,scene,engine)
   {
	   
		var road = BABYLON.Mesh.CreateBox(this.name, 1, scene);

        			   road.position.x = this.initial_position_x;        			
        			   road.position.z = this.initial_position_z;
        			   road.scaling.x = this.width;
        			   road.scaling.y = this.width;
        			   road.scaling.z = 0.1;
					   road.rotation.x = Math.PI/2;
        			
			
        			
        			var middlePos = new BABYLON.Vector2(
        				(this.final_position_x - this.initial_position_x) /2 + this.initial_position_x,
        				(this.final_position_z - this.initial_position_z) /2 + this.initial_position_z
        			);

        			road.position.x = middlePos.x;
        			road.position.z = middlePos.y;
					road.position.y=0.001;

        			var distance = Math.sqrt(
        				Math.pow(this.final_position_x - this.initial_position_x, 2) +
        				Math.pow(this.final_position_z - this.initial_position_z, 2)
        			);
        			road.scaling.x = distance;
		
			      	
						var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
                        groundMaterial.diffuseTexture = new BABYLON.Texture(Road_Texture, scene);
                        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
                        groundMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
	                 	groundMaterial.diffuseTexture.uScale = distance/3;
	                    road.material = groundMaterial;
        			    road.scaling.x = distance;
        			road.rotation.y = Math.atan2(
        				this.final_position_x - this.initial_position_x,
        				this.final_position_z - this.initial_position_z
        			) - Math.PI/2;
	   
	   
	   
   }
   
    
   

}   





function createAstaGround(scene,canvas,engine){ // For AstraSmoker project

     alert('test');
   var ground = BABYLON.Mesh.CreateGround("Astaground", 2858, 1106, 0, scene,false,false);

    ground.position = new BABYLON.Vector3(0,0,0);//new BABYLON.Vector3(0,0,-4);
   
	
	
	
	var mapMaterial = new BABYLON.StandardMaterial("map", scene);
                        mapMaterial.diffuseTexture = new BABYLON.Texture(AstaGroundTrack, scene);
                        mapMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
                        mapMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
	               
	                    ground.material = mapMaterial;
	
	
    
    
}

function Create_Ground(scene,canvas,engine) // Function that allow to create ground
{
    
		var width = document.getElementById("width").value;
        var length = document.getElementById("length").value;		
        var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: width, height: length}, scene); // Taille de la table de test
  

	
}




 function All_Send_To_Database() // This function allow to save all the new modifications
 {
	 
	    
	 	for(var i = 1; i <= number_road; i++) {	 // Saving of Roads object
             if(!Road[i].save)
			 {
					 Road[i].send_to_database();
					 Road[i].save=true;
					 
			 }
         	}
			
			for(var i = 1; i <= number_traffic_lights; i++) {	 // Saving of traffic lights object
             if(!Traffics_Lights[i].save)
			 {
					 Traffics_Lights[i].send_to_database();
					 Traffics_Lights[i].save=true;
					 
			 }
			} 
		
 for(var i = 1; i <= number_alphabot; i++) {	 // Saving of Roads object
             if(!Alphabot[i].save)
			 {
					 Alphabot[i].send_to_database();
					 Alphabot[i].save=true;
					 
			 }
         	}
			
			
	
 }
 
 
   function Load_Scene_From_Database(scene,canvas,engine) {
	   
	   
	  if(!Scene_Loaded) // We check if Scene is not already loaded
	  {		  
  
  
	 Scene_Loaded = true; // We change the status
	 createAstaGround(scene,canvas,engine);
	 
	 /*
    var ajax = new XMLHttpRequest(); // Ajax syntax for GET request
    ajax.open("GET", "/load_ground", true);
    ajax.send();

    ajax.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            console.log(data);

            var html = "";
            for(var a = 0; a < data.length; a++) {

                var width = data[a].Width;
                var length = data[a].Length;
				alert(width);
				alert(length);
                 
            }
				  var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: width, height: length}, scene); // Taille de la table de test
		          ground.material = new BABYLON.StandardMaterial("", scene);
		          ground.material.diffuseColor = new BABYLON.Color3(0,0.5,0);

        }
    };  
	*/
	
	   var ajax = new XMLHttpRequest();
    ajax.open("GET", "/load_road", true);
    ajax.send();

    ajax.onreadystatechange = function() { //Chargement des routes
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            console.log(data);

            var html = "";
            for(var a = 0; a < data.length; a++) {
				number_road++;
                var id = data[a].id;
				var road_name = data[a].road_name;
                var width = data[a].width;
                var initial_position_x = data[a].initial_position_x;
				var initial_position_z = data[a].initial_position_z;
				var final_position_x = data[a].final_position_x;
				var final_position_z = data[a].final_position_z;
				Road[a] = new Roads(road_name,width,initial_position_x,initial_position_z,final_position_x,final_position_z);
				Road[a].Draw(canvas,scene,engine);
				Road[a].display();
				Road[a].save=true; // This line allow to know if the Object is saved or no...
				
            }

        }
      };  
	 
	  
	  
	     var ajax = new XMLHttpRequest(); // Chargement des robots
    ajax.open("GET", "/load_alphabots", true);
    ajax.send();

    ajax.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            console.log(data);

            var html = "";
            for(var a = 0; a < data.length; a++) {
                number_alphabot++;
                var alphabot_name = data[a].alphabot_name;
                var initial_position_x = data[a].position_x_initial;
				var initial_position_z = data[a].position_z_initial;
                var IP_address = data[a].ip_addr;
				var port = data[a].port;
				Alphabot[a] = new Alphabots(alphabot_name,initial_position_x,initial_position_z,IP_address,port);
				Alphabot[a].display();
				Alphabot[a].save=true;
				
            }

        }
      };  
	  
	  
	    var ajax = new XMLHttpRequest(); // Chargement des robots
    ajax.open("GET", "/load_traffic_lights", true);
    ajax.send();

    ajax.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            console.log(data);

            var html = "";
            for(var a = 0; a < data.length; a++) {
				number_traffic_lights++;
  
                var traffic_light_name = data[a].traffic_light_name;
                var position_x = data[a].position_x;
				var position_z = data[a].position_z;
                var road_affiliation = data[a].road_affiliation;
				var delay = data[a].delay;
				Traffics_Lights[a] = new Traffic_Lights(traffic_light_name,position_x,position_z,road_affiliation,delay);
				Traffics_Lights[a].display();
				Traffics_Lights[a].save=true;
				 var currentSphere = BABYLON.MeshBuilder.CreateIcoSphere("icosphere"+(number_traffic_lights), {radius:2, subdivisions: 16}, scene);
				 currentSphere.position.z=Traffics_Lights[a].position_z;
				 currentSphere.position.x=Traffics_Lights[a].position_x;
				 currentSphere.position.y=0;
				
            }

        }
      };  
	  
	  GUI(scene,canvas,engine); // On affiche sur la simulation
	  
	  
	  
	  
	  
	 
   }
   
    else alert('Scene already loaded');
   }
   function TopView(camera) // Allow to generate TopView
	{
     camera.position = new BABYLON.Vector3(30, 10, 0);
	  camera.setTarget(BABYLON.Vector3.Zero());
   
	 camera.rotation.x = Math.PI/2;
    function anim() { // Recursive function
     camera.position.y=camera.position.y+1;
    if (camera.position.y < 300) {
        setTimeout(anim, 1); // La fonction anim() fait appel à elle-même si elle n'a pas terminé son travail
      }
   anim(); // We start the first start of animation

    }
    }
	
function Building_Creation(scene,canvas, engine) { // That function allow user to create building	
     MakeBuilding(); //If click on this button we call MakeBuilding() function
	scene.onPointerDown = function(evt, pickResult){ 
		if(pickResult.hit && allowBuilding){
			var pickPosition = pickResult.pickedPoint;
			console.log('Position: ',pickPosition); 
		    var pickinfo = scene.pick(scene.pointerX, scene.pointerY, null, null);
			 var currentBox = BABYLON.MeshBuilder.CreateBox("myBox"+ (boxCount++), {height: 5, width: 10, depth: 10}, scene);
			 currentBox.position = pickinfo.pickedPoint;
			var onPointerMove = function (evt) {
            if(!allowBuilding) { return; }
            scene.getMeshByName("myBox" + (boxCount - 1)).position.x = scene.pick(scene.pointerX, scene.pointerY, null, null).pickedPoint.x;
            scene.getMeshByName("myBox" + (boxCount - 1)).position.z = scene.pick(scene.pointerX, scene.pointerY, null, null).pickedPoint.z;
			scene.getMeshByName("myBox" + (boxCount - 1)).position.y = 0;
        }         
        var onPointerUp = function () {
            clicked = false;        
        }
    
    canvas.addEventListener("pointerup", onPointerUp, false);
    canvas.addEventListener("pointermove", onPointerMove, false);
		}
	};       
}



function Traffic_Light_Creating(scene,canvas, engine) { // That function allow user to create building	
    Make_Traffic_Light(); //If click on this button we call MakeBuilding() function
	scene.onPointerDown = function(evt, pickResult){ 
		if(pickResult.hit && allowTrafficLight){  
		number_traffic_lights++; // We increment the number of traffic lights
		Traffics_Lights[number_traffic_lights] = new Traffic_Lights("Traffic_Light"+(number_traffic_lights),"0","0","undefined","30","undefined");
			var pickPosition = pickResult.pickedPoint;
			console.log('Position: ',pickPosition); 
		    var pickinfo = scene.pick(scene.pointerX, scene.pointerY, null, null);
             var currentSphere = BABYLON.MeshBuilder.CreateIcoSphere("icosphere"+(sphereCount++), {radius:2, subdivisions: 16}, scene);
			 currentSphere.position = pickinfo.pickedPoint;
			var onPointerMove = function (evt) {
            if(!allowTrafficLight) { return; }
            scene.getMeshByName("icosphere" + (sphereCount - 1)).position.x = scene.pick(scene.pointerX, scene.pointerY, null, null).pickedPoint.x;
            scene.getMeshByName("icosphere" + (sphereCount - 1)).position.z = scene.pick(scene.pointerX, scene.pointerY, null, null).pickedPoint.z;
			scene.getMeshByName("icosphere" + (sphereCount - 1)).position.y = 0; // On force la position de l'objet à 0
			Traffics_Lights[number_traffic_lights].position_x = scene.pick(scene.pointerX, scene.pointerY, null, null).pickedPoint.x; // Attribute picked position to current positions
			Traffics_Lights[number_traffic_lights].position_z = scene.pick(scene.pointerX, scene.pointerY, null, null).pickedPoint.z;
        }         
        var onPointerUp = function () {
            clicked = false;        
        }
    
    canvas.addEventListener("pointerup", onPointerUp, false);
    canvas.addEventListener("pointermove", onPointerMove, false);
		}
	};       
}


function Creating_Paths(scene,canvas,engine) { // That function allow user to Add road
		
    
    var road_width = 25;
	MakeRoad();

scene.onPointerDown = function (evt, pickResult) {
            	if (pickResult.hit && allowRoad) {
	
        		
					
        		   if(firstClick) {
					   

        			   firstClick = false;
					    number_road = number_road+1;
                        Road[number_road] = new Roads("Road"+number_road,road_width,0,0,0,0);
		                Road[number_road].display();

				
        	   			firstClickPos = new BABYLON.Vector2(
        					pickResult.pickedPoint.x,
        					pickResult.pickedPoint.z
        				);
						   Road[number_road].initial_position_x = pickResult.pickedPoint.x;
						   Road[number_road].initial_position_z = pickResult.pickedPoint.z;
						

						
        			   road = BABYLON.Mesh.CreateBox("road", 1, scene);

        			   road.position.x = firstClickPos.x;        			
        			   road.position.z = firstClickPos.y;
        			   road.scaling.x = road_width;
        			   road.scaling.y = road_width;
        			   road.scaling.z = 0.1;
					   road.rotation.x = Math.PI/2;
					   road.position.y=0.001;
        		   }
        		   else {
        			   firstClick = true;
        		   }
            	}
            };  
			
				var that = this;
        	scene.registerBeforeRender(function() {
        		
        		if(!firstClick) {
        			var pickResult = scene.pick(scene.pointerX, scene.pointerY);
        				
        			var secondClickPos = new BABYLON.Vector2(
        				pickResult.pickedPoint.x,
        				pickResult.pickedPoint.z
        			);
						   Road[number_road].final_position_x = pickResult.pickedPoint.x;
						   Road[number_road].final_position_z = pickResult.pickedPoint.z;
						 
        			
        			var middlePos = new BABYLON.Vector2(
        				(secondClickPos.x - firstClickPos.x) /2 + firstClickPos.x,
        				(secondClickPos.y - firstClickPos.y) /2 + firstClickPos.y
        			);

        			
        			road.position.x = middlePos.x;
        			road.position.z = middlePos.y;
        			
        			var distance = Math.sqrt(
        				Math.pow(secondClickPos.x - firstClickPos.x, 2) +
        				Math.pow(secondClickPos.y - firstClickPos.y, 2)
        			);
					
		    var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
            groundMaterial.diffuseTexture = new BABYLON.Texture(Road_Texture, scene);
            groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            groundMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            
		groundMaterial.diffuseTexture.uScale = distance/3;
	           road.material = groundMaterial;
				  
					console.log(distance);
        			road.scaling.x = distance;
        			
        			road.rotation.y = Math.atan2(
        				secondClickPos.x - firstClickPos.x,
        				secondClickPos.y - firstClickPos.y
        			) - Math.PI/2;
		
			       
                 
        		}

        	});
}


function MakeRoad(){

	//here you want to allow user to put building on canvas
	 if (allowRoad == true)
	 {
		 allowRoad = false;
	     		
			
		 
	 }
	 else if (allowRoad == false)
	 {
       
		allowRoad = true;
		
				
	
	 }
}


function Make_Traffic_Light(){

	//here you want to allow user to put building on canvas
	 if (allowTrafficLight == true)
	 {
      allowTrafficLight = false;
	 }
	 else if (allowTrafficLight == false)
	 {
		allowTrafficLight = true;				
	  }
}


function MakeBuilding(){

	//here you want to allow user to put building on canvas
	 if (allowBuilding == true)
	 {
      allowBuilding = false;
	
	 }
	 else if (allowBuilding == false)
	 {
		allowBuilding = true;				

	  }
}

var line2D = function(name, options, scene) {
	
		//Arrays for vertex positions and indices
		var positions = [];
		var indices = [];
        var normals = [];

        var width = options.width || 1;
        var path = options.path;
		var closed = options.closed || false;
		if(options.standardUV === undefined) {
			standardUV = true;
		}
		else {
			standardUV = options.standardUV;
		}
	
		var interiorIndex;
		
		//Arrays to hold wall corner data 
		var innerBaseCorners = [];
		var outerBaseCorners = [];
		
		var outerData = [];
        var innerData = [];
		var angle = 0;
		
		var nbPoints = path.length;
		var line = BABYLON.Vector3.Zero();
		var nextLine = BABYLON.Vector3.Zero();
		path[1].subtractToRef(path[0], line);

		if(nbPoints > 2 && closed) {	
			path[2].subtractToRef(path[1], nextLine);    
			for(var p = 0; p < nbPoints; p++) {    
				angle = Math.PI - Math.acos(BABYLON.Vector3.Dot(line, nextLine)/(line.length() * nextLine.length()));            
				direction = BABYLON.Vector3.Cross(line, nextLine).normalize().y;                
				lineNormal = new BABYLON.Vector3(-line.z, 0, 1 * line.x).normalize();
				line.normalize();
				innerData[(p + 1) % nbPoints] = path[(p + 1) % nbPoints];
				outerData[(p + 1) % nbPoints] = path[(p + 1) % nbPoints].add(lineNormal.scale(width)).add(line.scale(direction * width/Math.tan(angle/2)));        
                line = nextLine.clone();        
				path[(p + 3) % nbPoints].subtractToRef(path[(p + 2) % nbPoints], nextLine);    
			}
		}
		else {
			lineNormal = new BABYLON.Vector3(-line.z, 0, 1 * line.x).normalize();
			line.normalize();		
			innerData[0] = path[0];
			outerData[0] = path[0].add(lineNormal.scale(width));
		
			for(var p = 0; p < nbPoints - 2; p++) {	
				path[p + 2].subtractToRef(path[p + 1], nextLine);
				angle = Math.PI - Math.acos(BABYLON.Vector3.Dot(line, nextLine)/(line.length() * nextLine.length())); // Calculate angle		
				direction = BABYLON.Vector3.Cross(line, nextLine).normalize().y;			
				lineNormal = new BABYLON.Vector3(-line.z, 0, 1 * line.x).normalize();
				line.normalize();
				innerData[p + 1] = path[p + 1];
				outerData[p + 1] = path[p + 1].add(lineNormal.scale(width)).add(line.scale(direction * width/Math.tan(angle/2)));		
				line = nextLine.clone();			
			}
			if(nbPoints > 2) {
				path[nbPoints - 1].subtractToRef(path[nbPoints - 2], line);
				lineNormal = new BABYLON.Vector3(-line.z, 0, 1 * line.x).normalize();
				line.normalize();		
				innerData[nbPoints - 1] = path[nbPoints - 1];
				outerData[nbPoints - 1] = path[nbPoints - 1].add(lineNormal.scale(width));
			}
			else{
				innerData[1] = path[1]
				outerData[1] = path[1].add(lineNormal.scale(width));
			}
		}
     
		var maxX = Number.MIN_VALUE;
		var minX = Number.MAX_VALUE;
		var maxZ = Number.MIN_VALUE;
		var minZ = Number.MAX_VALUE;
		
		for(var p = 0; p < nbPoints; p++) {
			positions.push(innerData[p].x, innerData[p].y, innerData[p].z);
			maxX = Math.max(innerData[p].x, maxX);
			minX = Math.min(innerData[p].x, minX);
			maxZ = Math.max(innerData[p].z, maxZ);
			minZ = Math.min(innerData[p].z, minZ);
		}

		for(var p = 0; p < nbPoints; p++) {
			positions.push(outerData[p].x, outerData[p].y, outerData[p].z);
			maxX = Math.max(innerData[p].x, maxX);
			minX = Math.min(innerData[p].x, minX);
			maxZ = Math.max(innerData[p].z, maxZ);
			minZ = Math.min(innerData[p].z, minZ);
		}

        for(var i = 0; i < nbPoints - 1; i++) {
            indices.push(i, i + 1, nbPoints + i + 1);
            indices.push(i, nbPoints + i + 1, nbPoints + i)
        }
		
		if(nbPoints > 2 && closed) {
			indices.push(nbPoints - 1, 0, nbPoints);
            indices.push(nbPoints - 1, nbPoints, 2 * nbPoints - 1)
		}

		var normals = [];
        var uvs =[];

		if(standardUV) {
			for(var p = 0; p < positions.length; p += 3) {
				uvs.push((positions[p] - minX)/(maxX - minX), (positions[p + 2] - minZ)/(maxZ - minZ));                
			}
		}
		else {
			var flip = 0;
			var p1 = 0;
			var p2 = 0;
			var p3 = 0;
			var v0 = innerData[0];
			var v1 = innerData[1].subtract(v0);
			var v2 = outerData[0].subtract(v0);
			var v3 = outerData[1].subtract(v0);
			var axis = v1.clone();
			axis.normalize();

			p1 = BABYLON.Vector3.Dot(axis,v1);
			p2 = BABYLON.Vector3.Dot(axis,v2);
			p3 = BABYLON.Vector3.Dot(axis,v3);
			var minX = Math.min(0, p1, p2, p3);
			var maxX = Math.max(0, p1, p2, p3);
			
			uvs[2 * indices[0]] = -minX/(maxX - minX);
			uvs[2 * indices[0] + 1] = 1;
			uvs[2 * indices[5]] = (p2 - minX)/(maxX - minX);
			uvs[2 * indices[5] + 1] = 0;
			
			uvs[2 * indices[1]] = (p1 - minX)/(maxX - minX);
			uvs[2 * indices[1] + 1] = 1;
			uvs[2 * indices[4]] = (p3 - minX)/(maxX - minX);
			uvs[2 * indices[4] + 1] = 0;
		
			for(var i = 6; i < indices.length; i +=6) {
			
				flip = (flip + 1) % 2;
				v0 = innerData[0];
				v1 = innerData[1].subtract(v0);
				v2 = outerData[0].subtract(v0);
				v3 = outerData[1].subtract(v0);
				axis = v1.clone();
				axis.normalize();

				p1 = BABYLON.Vector3.Dot(axis,v1);
				p2 = BABYLON.Vector3.Dot(axis,v2);
				p3 = BABYLON.Vector3.Dot(axis,v3);
				var minX = Math.min(0, p1, p2, p3);
				var maxX = Math.max(0, p1, p2, p3);
			
				uvs[2 * indices[i + 1]] = flip + Math.cos(flip * Math.PI) * (p1 - minX)/(maxX - minX);
				uvs[2 * indices[i + 1] + 1] = 1;
				uvs[2 * indices[i + 4]] = flip + Math.cos(flip * Math.PI) * (p3 - minX)/(maxX - minX);
				uvs[2 * indices[i + 4] + 1] = 0;
			}
		}
		
		BABYLON.VertexData.ComputeNormals(positions, indices, normals);
		BABYLON.VertexData._ComputeSides(BABYLON.Mesh.DOUBLESIDE, positions, indices, normals, uvs);  	
		console.log(uvs)		
		//Create a custom mesh  
		var customMesh = new BABYLON.Mesh("custom", scene);

		//Create a vertexData object
		var vertexData = new BABYLON.VertexData();

		//Assign positions and indices to vertexData
		vertexData.positions = positions;
		vertexData.indices = indices;
		vertexData.normals = normals;
		vertexData.uvs = uvs;

		//Apply vertexData to custom mesh
		vertexData.applyToMesh(customMesh);
		
		return customMesh;
		
	}	
