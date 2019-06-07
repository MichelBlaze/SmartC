var scene ;
var canvas ;
var engine ;
var UIRoot;
var zGUIIndex;   
var allCarsInformationPanel;
var TotalCars;
var NewCarButton;
var allCarsPanes;
var camera;
var LeftouterPanel, pane;
var ground;
var StartSimulation;
var StartWP; 
var currentCar = 0;
var cars = [];
window.sceneNS.allSimulation =
function allSimulation(carNumber){
    // i = waypoint Number
  
    var Xoffset;
    var Zoffset;
    var currentWayPoint = cars[carNumber].currentWayPoint;
    console.log("currentWP: "+ currentWayPoint + " : " + cars[carNumber].TotalWapoints);
    if(currentWayPoint +1 >= cars[carNumber].TotalWapoints){
        StartSimulation = false;
        return false;
    }
    if(cars[carNumber].Body.position.x - cars[carNumber].points[currentWayPoint + 1].x > .01 || cars[carNumber].Body.position.x - cars[carNumber].points[currentWayPoint + 1].x < -.01 ){
        Xoffset = 1;
        cars[carNumber].Body.position.x += GetXDirection(carNumber, currentWayPoint + 1);
    }else{
        Xoffset = 0;
    }
    if(cars[carNumber].Body.position.z - cars[carNumber].points[currentWayPoint + 1].z > .01 || cars[carNumber].Body.position.z - cars[carNumber].points[currentWayPoint + 1].z < -.01){
        cars[carNumber].Body.position.z += GetZDirection(carNumber, currentWayPoint + 1);
        Zoffset = 1;
    }else{
        Zoffset = 0;
    }
    cars[carNumber].wheelFI.rotation.y += .01;
    cars[carNumber].wheelFO.rotation.y += .01;
    cars[carNumber].wheelRI.rotation.y += .01;
    cars[carNumber].wheelRO.rotation.y += .01;

    if(Xoffset == 0 && Zoffset == 0){
        // reached a waypoint
        cars[carNumber].currentWayPoint +=1;
        RotateToward(carNumber,cars[carNumber].currentWayPoint);
        return true;
    }else{
        return false;
    }
    return false;
}

function createCar(){

    /*
    var loader = new BABYLON.AssetsManager(scene);
    //https://dl.dropbox.com/s/mtp1ik4w0ltl5vh/untitled.obj
    BABYLON.SceneLoader.ImportMesh(
        "",
        "https://dl.dropbox.com/s/mtp1ik4w0ltl5vh/",
        "untitled.obj",
        scene,
        function (meshes) {      
            cars[TotalCars-1] = meshes[0];
            meshes[0].position = new BABYLON.Vector3(10-8.65, 20,11);
            meshes[0].level = 2; //It is kind of z-index   
            meshes[0].scaling = new BABYLON.Vector3(100,100,100);
            meshes[0].rotation = new BABYLON.Vector4(-0.410,0.65,0.47,0.510);
        }
    );
*/
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
	cars[TotalCars-1] = new Car();
    cars[TotalCars - 1].points = [];
	//Create body and apply material
	cars[TotalCars-1].Body = BABYLON.MeshBuilder.ExtrudeShape("body", {shape: side, path: extrudePath, cap : BABYLON.Mesh.CAP_ALL}, scene);
	cars[TotalCars-1].Body.material = bodyMaterial;
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
	cars[TotalCars-1].wheelFI = BABYLON.MeshBuilder.CreateCylinder("wheelFI", {diameter: 3, height: 1, tessellation: 24, faceColors:faceColors, faceUV:faceUV}, scene);
  	cars[TotalCars-1].wheelFI.material = wheelMaterial;
	  
	//rotate wheel so tread in xz plane  
  	cars[TotalCars-1].wheelFI.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.WORLD);
	cars[TotalCars-1].wheelFI.parent = cars[TotalCars-1].Body;  
  /*-----------------------End Wheel------------------------------------------*/ 
    /*------------Create other Wheels as Instances, Parent and Position----------*/
    cars[TotalCars-1].wheelFO = cars[TotalCars-1].wheelFI.createInstance("FO");
    cars[TotalCars-1].wheelFO.parent = cars[TotalCars-1].Body;
    cars[TotalCars-1].wheelFO.position = new BABYLON.Vector3(-4.5, -2, 2.8);
    cars[TotalCars-1].wheelRI = cars[TotalCars-1].wheelFI.createInstance("RI");
    cars[TotalCars-1].wheelRI.parent = cars[TotalCars-1].Body;
    cars[TotalCars-1].wheelRI.position = new BABYLON.Vector3(2.5, -2, -2.8);
    cars[TotalCars-1].wheelRO = cars[TotalCars-1].wheelFI.createInstance("RO");
    cars[TotalCars-1].wheelRO.parent = cars[TotalCars-1].Body;
    cars[TotalCars-1].wheelRO.position = new BABYLON.Vector3(2.5, -2, 2.8);
    cars[TotalCars-1].wheelFI.position = new BABYLON.Vector3(-4.5, -2, -2.8);
    /*------------End Create other Wheels as Instances, Parent and Position----------*/
   // cars[TotalCars-1] = carBody;
    cars[TotalCars-1].Body.position.y = 1.8;
    cars[TotalCars-1].Body.scaling = new BABYLON.Vector3(.5,.5,.5);
}


function startAnimatingCar()
{
     for(var j=0; j < TotalCars ; j++){
        if(cars[j].TotalWapoints <= 1){
            //need at least 2 waypoints to travel.
            return;
        }
        //Draw the curve
        var track = BABYLON.MeshBuilder.CreateLines('track', {points: cars[j].points}, scene);
        track.color = new BABYLON.Color3(0, 0, 0);
        /*-----------------------End Path------------------------------------------*/
        StartSimulation = true;
        StartWP = false;
        /*----------------Position and Rotate Car at Start---------------------------*/
        cars[j].Body.position.x = cars[j].points[0].x;
        cars[j].Body.position.z = cars[j].points[0].z;
        var path3d = new BABYLON.Path3D(cars[j].points);
        cars[j].normals = path3d.getNormals();
        cars[j].currentWayPoint = 0;
        RotateToward(j, 0);
    /*----------------End Position and Rotate Car at Start---------------------*/
     }

   
}

function RotateToward(carNumber ,i){
    var nextWP;
    if(i+1 >= cars[carNumber].TotalWapoints){
        nextWP = 0;
        StartSimulation = false;
        //no next waypoint available
        return;
    }else{
        nextWP = i+1;
    }
    theta = Math.acos(BABYLON.Vector3.Dot(cars[carNumber].normals[i],cars[carNumber].normals[nextWP]));
    var dir = BABYLON.Vector3.Cross(cars[carNumber].normals[i],cars[carNumber].normals[nextWP]).y;
    var dir = dir/Math.abs(dir);
    cars[carNumber].Body.rotate(BABYLON.Axis.Y, dir * theta, BABYLON.Space.WORLD);
}
function GetXDirection(carNumber, i){
    var Xoffset;
    if(cars[carNumber].Body.position.x - cars[carNumber].points[i].x > 0){
        Xoffset = -0.01;
    }else{
        Xoffset = 0.01;
    }
return Xoffset;

}
function GetZDirection(carNumber, i){
    var Zoffset;
    if(cars[carNumber].Body.position.z - cars[carNumber].points[i].z > 0){
        Zoffset = -0.01;
    }else{
        Zoffset = 0.01;
    }
    return Zoffset;

}

// When the window resizes, adjust the engine size
function onWindowResize() {
    engine.resize();
    //createOuterPanel(0.308,1);
    LeftouterPanel.width = 0.1;
    LeftouterPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    //createInnerPane(.3,.98);
    pane.width = 0.1;
    pane.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    // Update the width placement of 2D UI
    startUI.x = (window.innerWidth / 2) - (STARTX / 2);
    distanceCounterUI.x = (window.innerWidth / 2) - (DISTANCECOUNTERX / 2);
    gameOverUI.x = (window.innerWidth / 2) - (GAMEOVERX / 2);
    // Update the height placememnt of 2D UI
    startUI.y = (window.innerHeight / 2) - (STARTY / 2);
    distanceCounterUI.y = window.innerHeight - DISTANCECOUNTERY;
    gameOverUI.y = (window.innerHeight / 2) - (GAMEOVERY / 2);
}
        // Function to create a skybox
function createCamera_Light(){
    camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, 0, 75, new BABYLON.Vector3(-16, 0, -6.3), scene);
  /*  camera.lowerAlphaLimit = 0;
    camera.upperAlphaLimit =  -Math.PI/2;
    camera.lowerBetaLimit = 0;  
    camera.upperBetaLimit = 0;
    TotalCars = 0;
    function camerasBorderFunction () {   
        //Zoom      
        if (camera.radius > 75)
            camera.radius =75;       
        if (camera.radius < 2) 
            camera.radius = 2;
        //Panning  
        camera.panningDistanceLimit = 10;
        //Speed
        // camera.wheelPrecision = -50;
    };
    camera.inertia=0;
    scene.registerBeforeRender(camerasBorderFunction);
    */
    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);
    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.2;
    StartSimulation = false;
    StartWP = false;
}
    // Function to create a skybox
function createSkyBox(){
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 5000.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playtimefun.github.io/textures/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
}
    // Function to create a skybox
function createAstaGround(){
    ground = BABYLON.Mesh.CreateGround("Astaground", 80, 50, 50, scene);
    ground.background = true;
    //Play around values 25 25 25 to fit to size of scene
    var groundMaterial = new BABYLON.StandardMaterial("groundmat", scene);
    //https://cdn.jsdelivr.net/gh/sanam407/Simulator@7708b9f10036e6424067ae5d85425870c40479fa/AstaZero.png
    // groundMaterial.emissiveTexture = new BABYLON.Texture("https://cdn.jsdelivr.net/gh/effective/vista@416dae14e721991f73011de35378260b83d25041/AstaZero.png", scene);
    groundMaterial.emissiveTexture = new BABYLON.Texture("https://cdn.jsdelivr.net/gh/sanam407/Simulator@3e3d6ef3902c4faf2b894db6b4699e1edd4f0ca4/AstaZero.png", scene);
    //  groundMaterial.emissiveTexture = tex;	
    groundMaterial.emissiveTexture.uScale = 1; //you could try changin this and below value to see replicated image 
    groundMaterial.emissiveTexture.vScale = 1;
    groundMaterial.emissiveTexture.level = 1; //It is kind of z-index
    ground.material = groundMaterial;
    
}
function DrawGUI(){
    // GUI
    UIRoot = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", undefined, undefined, BABYLON.Texture.NEAREST_NEAREST);
    zGUIIndex = 0;
    TotalCars = 0;
    allCarsPanes = [];
}
// Title
function createText (fontSize,caption) {
    var text1 = new BABYLON.GUI.TextBlock();
    text1.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text1.text = caption;
    text1.color = "white";
    text1.background = "green";
    text1.fontSize = fontSize; 
    return text1;
}
function createOuterPanel (mywidth, myheight) {
    var rect1 = new BABYLON.GUI.Rectangle();
    rect1.width = mywidth;
    rect1.height = myheight;
    rect1.color = "#66e0ff";//"#1f2e2e";
    rect1.background = "#66e0ff";//"#1f2e2e";
    //outerpanel most backward background as well as is always child of UIRoot
    UIRoot.addControl(rect1);    
    return rect1;
}
function createInnerPane( mywidth, myheight ) {
    var rect1 = new BABYLON.GUI.Rectangle();
    rect1.width = mywidth;
    rect1.height = myheight;
    rect1.color = "#ccf5ff";
    rect1.background = "#99ebff";
    return rect1;
}
function createScrollView( mywidth, myheight,topOffset ) {
    // ScrollViewer for cars that are generated
    var sv = new BABYLON.GUI.ScrollViewer();
    sv.width = mywidth;//1;
    sv.height = myheight;//0.9;
    sv.top = topOffset;//60,
    sv.color= "#ccf5ff";
  //  sv.background = "#679898";
    sv.zIndex = zGUIIndex = zGUIIndex+1;
    return sv;
}
function createStackContainer( mywidth, myheight,topOffset ) {
    allCarsInformationPanel = new BABYLON.GUI.StackPanel();
    allCarsInformationPanel.adaptWidthToChildren = true;
    allCarsInformationPanel.top = topOffset;//3,
    allCarsInformationPanel.color = "#679898";
    allCarsInformationPanel.background = "#679898";
    allCarsInformationPanel.zIndex = zGUIIndex = zGUIIndex+1;
}

    //Function to Button
function createButton  ( mywidth, myheight ,caption, topOffset,leftOffset) {
    var button1 = BABYLON.GUI.Button.CreateSimpleButton("but1", caption);
    button1.width = mywidth;
    button1.height = myheight;
    button1.thickness = 0;
    button1.color = "white";
    button1.fontSize = 22;
    button1.background = "#33d6ff";
    button1.zIndex  = zGUIIndex = zGUIIndex+1;
    button1.top =topOffset; 
    button1.left =leftOffset; 
    return button1;
}
function createWayPointDetail(isWaypoint,topOffset,leftOffset, Xposition, Yposition,Zposition){
    //container will define which button is adding the way point
    //and buttons represent each car in scene
     var mytext;
    if(!isWaypoint){
        allCarsPanes[TotalCars-1] = createInnerPane(.999,"50px");
        //container.adaptHeightToChildren(true);
        allCarsPanes[TotalCars-1].color = "#ccf5ff";
        allCarsPanes[TotalCars-1].background = "#99ebff";
        allCarsInformationPanel.addControl(allCarsPanes[TotalCars-1]);
        mytext =  createText(20,"Car "+TotalCars+ " Information");
        mytext.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        mytext.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        //mytext.top = -28;
        mytext.left = 2;
        mytext.zIndex= zGUIIndex = zGUIIndex+1;
        allCarsPanes[TotalCars-1].addControl(mytext);
        mytext =  createText(20,"Starts at ("+Math.floor(Xposition)+ ","+ Math.floor(Yposition)+"," + Math.floor(Zposition) + ") with speed ");
        topOffset = 20;
    }else{
        allCarsPanes[TotalCars-1].height = (topOffset + 50) +"px";
        mytext =  createText(20,"Moves toward ("+Math.floor(Xposition)+","+Math.floor( Yposition) + ","+Math.floor(Zposition) + ") with speed ");
        topOffset += 22;
    }
    mytext.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    mytext.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    mytext.top = topOffset;
    mytext.left = leftOffset;
    mytext.textWrapping = true;
    var input = new BABYLON.GUI.InputText();
    input.width = 0.2;
    input.maxWidth = 0.2;
    input.height = "20px";
    input.top = topOffset;
    input.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    //input.left = mytext.widthInPixels;
    input.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    input.text = "";
    input.fontSize = 20;
    input.zIndex  = zGUIIndex = zGUIIndex+1;
    input.thickness = 0.2;
    input.color = "white";
    input.background = "#33d6ff"; 
    input.onBeforeKeyAddObservable.add((input) =>{
        let key = input.currentKey;
        if(isNaN(parseInt(key))){
            input.addKey = false;
        }
    });
    allCarsPanes[TotalCars-1].addControl(input);    
    allCarsPanes[TotalCars-1].addControl(mytext);
    return allCarsPanes[TotalCars-1];
}