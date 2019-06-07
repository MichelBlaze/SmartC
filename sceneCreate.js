
/**
     * All of the scene creation is done in this file
*/
(function() {
   // 'use strict';
    // link to, or create, namespace
    window.sceneNS = window.sceneNS || {};
    // Global variables 

    //Babylon scene elements
    var scene;
    var canvas;
    var engine ;
    var camera;
    var light;
    var ground;
    var advancedTexture;

    //html elements
    var allCarsInformationPanel;
    var consoleLog;
    var startSimulationButton;
    var stopSimulationButton;
    var inner;
    var newCarButton;
    var newPathButton;
    var actionsButton;
    var testFileName; 
    var mainPathBtn;//most outer button in tree hierarchy for Path
    var mainCarBtn;//most outer button in tree hierarchy for Car
    var mainActionBtn;//most outer button in tree hierarchy for Action
    var timelineSlider;
    var time;//time for timeline
    var codeArea;

    var PathInner, CarsInner, ActionInner;//to dynamically add more elements


    //Constants
    //counters
    var zGUIIndex;  
    var TotalCars = 0;
    var TotalPaths = 0;
    var TotalActions = 0;

    var wps = 0;//individual waypoints counter
    var frustrum = 1;
    var timelineDelta = 0;
    var reachedcars = 0;

    //limits
    var cameraMaxRight = 62.5;
    var cameraMaxLeft = -62.5;
    var cameraMaxTop = 35;
    var cameraMaxBottom = -35;
    var cameraMinRight = 3;
    var cameraMinLeft = -3;
    var cameraMinTop = 1.69;
    var cameraMinBottom = -1.69;
    var cardefX ,cardefY ,cardefZ ;
    var arrowdefX ,arrowdefY ,arrowdefZ ;
    var wpdefX ,wpdefY ,wpdefZ;

   //Boalean flags
    var simulationProcessBegin = false;
    var creatingPath = false;
    var StartTrajectory = false; 
    var PathwasEdited = true;//by default true, as path creation for first time = pathwas edited
    var doubledtaptofinishWP = false;
    var linevalue = false;

    //Objects
    var allCars = [];//all cars objects in the scene
    var allPaths = [];//all path objects in the scene
    var allActions = [];//all actions in the scene
    var temporaryMeshes = [];

  //  var jsonDataToSave = [];//cannot save running cars to external json file..circular referrence error
    var allCollisions = [];
    var previousWPArrow = null;
    var previousImp = null;



    // scene creation function
    window.sceneNS.sceneCreate =
      function sceneCreate(p_canvas, engine) {
        // create scene object
         scene = new BABYLON.Scene(engine);
         // Enable Collisions
         scene.collisionsEnabled = true;
         canvas = p_canvas;
        // Create AstaGround
        createAstaGround();
        // Create the camera
        createCamera_Light();
          //defining function for all buttons in the html page
        htmlButtonsOnClicks();
        //============ Resizing Left panel ====================//
        var resizeObjects = [];
        window.setInterval(function() {
            for(var i=0; i<resizeObjects.length; i++) {
                var ro = resizeObjects[i];
                if(ro.element.parentNode == null) {
                    // node is not part of the DOM right now
                    continue;
                } else if(ro.element.offsetHeight != ro.height || ro.element.offsetWidth != ro.width) {
                    ro.height = ro.element.offsetHeight;
                    ro.width = ro.element.offsetWidth;
                    for(var j=0; j<ro.callbacks.length; j++) {
                        ro.callbacks[j].apply(ro.element);
                    }
                }
            }
        }, 100);
        HTMLElement.prototype.resize = function(callback) {
            if(arguments.length == 1 && typeof(callback) == "function") {
                // add a new callback function
                var obj = null;
                for(var i=0; i<resizeObjects.length; i++) {
                    if(resizeObjects[i].element == this) {
                        obj = resizeObjects[i];
                        break;
                    }
                }
                if(obj) {
                    obj.callbacks.push(callback);
                } else {
                    resizeObjects.push({
                        "element": this,
                        "callbacks": [callback],
                        "height": this.offsetHeight,
                        "width": this.offsetWidth
                    });
                }
            } else if(arguments.length == 0) {
                // trigger resize callback functions
                for(var i=0; i<resizeObjects.length; i++) {
                    var ro = resizeObjects[i];
                    if(ro.element == this) {
                        for(var j=0; j<ro.callbacks.length; j++) {
                            ro.callbacks[j].apply(this);
                        }
                        break;
                    }
                }
            }
        };

        document.getElementById("leftPanel").resize(function() {
           engine.resize();
           if(scene)
            scene.render();
        });
        defaultScenario();
      
//============ Resizing Left panel ====================//
        // GUI
        advancedTexture= BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui1");
         //Key press feature
        canvas.addEventListener("keyup", onKeyUp, false); 
        canvas.addEventListener("keydown", onKeyDown, false); 
       // document.getElementById('file-input').addEventListener('change', readSingleFile, false);
       //reading commit
       // readCommit();
        //When pointer down event is raised
        scene.onPointerDown = function (evt, pickResult) {
            // if the click hits the ground object, placing a sphere there for waypoint
            if (pickResult.hit) {
                var pickedPoint = getDummyObjectPosition(pickResult.pickedPoint);
                var impactPosition = new BABYLON.Vector3(parseFloat( pickedPoint.x.toFixed(2)), 0, parseFloat( pickedPoint.z.toFixed(2)));
                if(creatingPath){
                    //creating path
                    if(doubleclicked(pickedPoint)){
                        doubledtaptofinishWP = true;
                        donePathWaypoints();
                        return;
                    }
                    wps++;
                    //sphere to present a waypoint..
                    var impact = createWP(impactPosition,allPaths[TotalPaths - 1].myColor,TotalPaths - 1,"P_mesh_"+(TotalPaths - 1));
       
                    impact = assignWPToPath(impact,impactPosition,TotalPaths - 1, wps);
                    temporaryMeshes.push(impact); 
                    // html GUI
                    htmlForWaypoints(TotalPaths - 1, impact.position);
                    if(wps  > 1){
                        /*-----------------------Make Path between two impacts-------------------------*/
                        drawLineBtwTwo(previousImp.position,impact.position,TotalPaths - 1, wps - 2);
                        /*-----------------------End Path------------------------------------------*/
                    }
                    previousImp = impact;
                }
                else{
                    //not creating the path
                    //can drag waypoints to change the path or can zoom the camera
                    onPointerDown(pickResult,impactPosition);
                }
        }

            
};
        /*----------------Animation Loop---------------------------*/
        timelineDelta = 0;
        scene.registerAfterRender(function() {
            if(valuesChanged || PathwasEdited){//when path was edited or speed values etc were changed
              /*  if(replaySimulation || wasPaused){
                    //but was playing or paused the animation 
                        //stop replay immediatly so that user can start it again
                        replaySimulation = false;
                        wasPaused = false;
                        stopSimulation();
                        return;
                    }*/
                    return;
            } 
           if(replaySimulation){
               console.log("erplay...");
                timelineDelta += 1;
                if(timelineDelta >= parseInt(timelineSlider.max)){
                    enableSimulationPlayer();
                    replaySimulation = false;
                }
                for(var actN=0; actN < totalActionsInAnimation ; actN++){
                    if(timelineDelta < actionInAnimation[actN].myTimeLinePos.length && 
                        actionInAnimation[actN].myTimeLinePos[timelineDelta] != null){
                        
                            actionInAnimation[actN].Body.position =  actionInAnimation[actN].myTimeLinePos[timelineDelta];
                            actionInAnimation[actN].Body.rotation =  actionInAnimation[actN].myTimeLineRot[timelineDelta];
                    }
                }
                timelineSlider.value = ""+ timelineDelta;
             //   time.innerHTML = "Time: "+ Math.round((timelineDelta/60) * 100) / 100+" sec" ;
             time.innerHTML = "Time: "+ roundUp(timelineDelta/60,2) +" sec" ;
            }
            
        });
        canvas.addEventListener("pointerup", onPointerUp, false);
        canvas.addEventListener("pointermove", onPointerMove, false);

        /*----------------End Animation Loop---------------------------*/
        scene.onDispose = function() {
            canvas.removeEventListener("keyup", onKeyUp);
            canvas.removeEventListener("mousewheel");
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointermove", onPointerMove);

        }
        // return the scene object
        return scene;
    };
/**
 * functions against html buttons
 */
var panetitle;
var codeWindowResizeBtn;
var maxm = false;
function codeWindowResize(){
   
    if(!maxm){
        maxm = true;
       // leftP.style.display = "none";
       expandToLeftPAnel(true);
      
    }else{
        maxm = false;
          //minimize
          expandToLeftPAnel(false);
    }

}

function expandToLeftPAnel(expand){
    var codeDiv =  document.getElementById("codingArea");
    var wrapper= document.getElementById("wrapper");
    var consolePane = document.getElementById("consolePane");
    var middleP =  document.getElementById("middlePanel");
    if(expand){
        document.getElementById("leftPanel").style.display = "none";
        wrapper.insertBefore(codeDiv,middleP);
        codeDiv.style.width= "70%";
        codeDiv.style.height= "99.1%";
        codeDiv.style.marginRight= "8px";
        codeDiv.style.marginTop= "3px";
        codeDiv.style.marginLeft= "8px";
    
        codeDiv.style.overflow= "hidden";
        codeDiv.style.display= "block";
        codeDiv.style.backgroundColor = "#252e38";
        codeDiv.style.border= "1px solid #41454a";
        codeWindowResizeBtn.style.backgroundImage = minimizeWindowImage;
        consolePane.style.marginLeft= "0px";
        consolePane.style.width= "100%";
    }else{
        document.getElementById("leftPanel").style.display = "block";
        document.getElementById("bottomPane").insertBefore(codeDiv, consolePane);
        codeDiv.style.marginRight= "4px";
        codeDiv.style.marginBottom = "2px";
        codeDiv.style.marginLeft= "0px";
        codeDiv.style.marginTop= "0px";
      codeDiv.style.width = "70%";
      codeDiv.style.height = "100%";
      codeWindowResizeBtn.style.backgroundImage = maximizeWindowImage;

      consolePane.style.width= "30%";
      consolePane.style.height= "100%";
      consolePane.style.marginLeft= "4px";
      
    }
  
}

var OpenedGraphical  = true;
function changeView(evt, viewName){
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(viewName).style.display = "block";
    evt.currentTarget.className += " active";
    if(viewName == "codingDiv"){
        //fill in code area corresponding to graphical editor
        OpenedGraphical = false;
        fillCode();
    }else{
        //fill in graphical editor corresponding to changes in code
        OpenedGraphical = true;
    }

}

function htmlButtonsOnClicks(){
  
    testFileName = document.getElementById("testFileName");
    document.getElementById('newCarButton').onclick = instantiateCar;
    document.getElementById('newPathButton').onclick = newPathCreation;
    document.getElementById('actionsButton').onclick  = function() { performActions(false,""); };
    document.getElementById('viewCode').onclick = function(event){
        changeView(event,'codingDiv');
        //onclick="openView(event, 'codingDiv')"
    }
    document.getElementById('viewGraphicalEditor').onclick = function(event){
        changeView(event,'graphicalDiv');
        //onclick="openView(event, 'graphicalDiv')"
    }
    
    
  //  openView(event, 'graphicalDiv');
    //for code editor

    editorInitialization();
  
   // codeWindowResizeBtn = document.getElementById("windowResize");

  //  codeWindowResizeBtn.onclick = codeWindowResize;
    allCarsInformationPanel= document.getElementById("carinformationscroll");
    consoleLog = document.getElementById("consoleLogArea");

    startSimulationButton = document.getElementById('startSimulation');
    startSimulationButton.onclick = parseCodeFromCodeArea;//startSimulation;
    startSimulationButton.disabled = true;
    stopSimulationButton = document.getElementById('stopSimulation');
    stopSimulationButton.onclick = stopSimulation; 
    stopSimulationButton.disabled = true;

    timelineSlider= document.getElementById('timeline');
    timelineSlider.oninput  = timelineAnimation;
    timelineSlider.disabled = true;
    time= document.getElementById('time');

    let newTestScenarioBtn = document.getElementById('NewTest');
    newTestScenarioBtn.onclick = NewTestScenario;

    databaseNotificationTag = document.getElementById('databaseNotification');
//through database
   // handleClientLoad();//google drive authentication...
    document.getElementById('saveDatabase').onclick =SaveTestScenario_database;
    document.getElementById('saveLocal').onclick = SaveTestScenario_Json;

    loadAllTestsFromCloud();
     document.getElementById('loadAllTestsFromCloud').onclick = function(){
//just to refresh saved test files...
        loadAllTestsFromCloud();
        document.getElementById('myModal').style.display = "block";
         document.getElementById('LoadingTestScenarios').style.display = "block";
         panetitle.innerHTML = "Open Test Scenario";

     }
  
     panetitle = document.getElementById('LabelForPane');
    let loadTestScenarioBtn = document.getElementById('OpenTest');
    loadTestScenarioBtn.onchange = LoadTestScenario_Json;
    loadTestScenarioBtn.onclick = function () {
        this.value = null;
    };

    

   

    let lineNumberBtn = document.getElementById('lineNumbers');
    lineNumberBtn.onclick=togglelineNumbers;
}

function togglelineNumbers(){
    codeArea.setOption( "lineNumbers", !linevalue );
    linevalue = !linevalue;
}
/**
 * Creating New Car
 * in turn calls the function "createCarObject"
 */
function instantiateCar() {
    donePathWaypoints();
    //changes on html GUI: it should say Car {Car number}
    emptyCarObject(TotalCars,"");
    TotalCars += 1;
  //interface (html) detail of car
    initialCarDetail(false, null);
}

function defaultPathsNAction(){
    //if we want to load default apth from database
  //  getDataFromCloud("defaultPaths");
  //if we load from paths file...
    var alldata = JSON.parse(defaullPAth);
    window.sceneNS.allSavedData (alldata);
}
/**
 * Creating new Path
 */
function newPathCreation(){
    //if previously was making a path
    donePathWaypoints();
    emptyPathObject(TotalPaths,"");
    TotalPaths++;
    creatingPath = true;
    enableWayPointCursor();
    //interface (html) detail of path
    pathDetail(false, TotalPaths - 1);
    enableDisable(true);

}

window.sceneNS.addPath =
function addPath(path){
    path.myColor = individualColors(TotalPaths + 1);//color is assigned at runtime based on hierarchy
    emptyPathObject(TotalPaths,path.P_name,path.P_name);
    TotalPaths++;
    inner = PathInner;
    allPaths[TotalPaths - 1] = path;
     //interface (html) detail of path
     pathDetail(true, TotalPaths - 1);
     createPathLine(TotalPaths - 1,false);
}

window.sceneNS.addCar =
function addCar(car){
        //create this  car
       emptyCarObject(TotalCars,car.myName);
       TotalCars++;
      // copying by reference
      copyObject(allCars,TotalCars - 1,car);
       //interface (html) detail of path
       initialCarDetail(true, TotalCars - 1);
/*
    emptyCarObject(TotalCars,car.myName);
    TotalCars += 1;
  //interface (html) detail of car
    initialCarDetail(true);*/
}

window.sceneNS.addAction =
function addAction(name, vehName,pathName,startTime,speed,colorR,colorG,colorB,from,to){
        //create this  action
        var newAct = new Action();
        newAct.myName = name;
        var pInd = 0;
        allPaths .forEach(path => {
            if(path.P_name == pathName)
            {
                newAct.pathIndex = pInd;
            }
            pInd++;
        });
        if(newAct.pathIndex == null){
            //logical error: path choosen was not from one of the available path...
        }
        
        pInd = 0;
        allCars.forEach(car => {
            if(car.myName == vehName)
            {
                newAct.carIndex = pInd;
            }
            pInd++;
        });
        if(newAct.carIndex == null){
            //logical error: car choosen was not from one of the available cars...

        }
        newAct.mySpeed = speed;
        newAct.starttime =startTime;
        newAct.firstWaypointIndex = from;
        newAct.lastWaypointIndex = to;

        newAct.myColor = new BABYLON.Color3(colorR/255,colorG/255,colorB/255); //Each car will have different color
        TotalActions++;
        allActions[TotalActions - 1] = newAct;
        calculateCompleteActionPathDistance(TotalActions - 1,from,to);
        actionDetails(true,TotalActions - 1);
}


function enableDisable(value){
    //disable all buttons
  //  $(':button').prop('disabled', value);
    $(':input').prop('disabled', value);
    $(':hover').prop('disabled', value);
    if(value){
        $("a").addClass('disabled');
        $('#topMenu').fadeTo('slow',.6);
        $('#leftPanel').fadeTo('slow',.6);
        $('#simulationPane').fadeTo('slow',.6);
        $('#bottomPane').fadeTo('slow',.6);
    }else{
        $("a").removeClass('disabled');
        $('#topMenu').fadeTo('fast',1);
        $('#leftPanel').fadeTo('fast',1);
        $('#simulationPane').fadeTo('fast',1);
        $('#bottomPane').fadeTo('fast',1);
        var disable = true;
        allActions.forEach(act => {
            if(act.pathIndex != null && act.carIndex != null){
                disable = false;
            }
        });
       if(disable)
        {
            startSimulationButton.disabled = disable;
            stopSimulationButton.disabled = disable;
            timelineSlider.disabled = disable;
        }
    }

}

/**
 * creating new action
 */
function performActions(fillingDetails = false, actName = ""){
    donePathWaypoints();
    emptyAction(TotalActions,actName);
    TotalActions += 1;
     //interface (html) detail of action
    actionDetails(fillingDetails,TotalActions - 1);
}

/**
 * creating empty car object
 */
function emptyCarObject(index,nameOFCar = ""){
    // object of type car
    allCars[index] = new Car();

    if(nameOFCar == ""){
        nameOFCar = "Car "+ (index + 1);
    }
    allCars[index].myName = nameOFCar;
}

/**
 * creating empty path object
 */
function emptyPathObject(index,pathName = ""){
    // object of type car
    allPaths[index] = new Path();
    if(pathName = ""){
        pathName = "Path "+ (index + 1);
    }
    allPaths[index].P_name = pathName ;
    //a path's color is based on its index
    allPaths[index].myColor =  individualColors(index+1);
}

/**
 * creating Action
 */
function emptyAction(index, actName = ""){
    // object of type action
    allActions[index] = new Action();
    if(actName == ""){
        actName = "Action "+ (index + 1);
    }
   
    allActions[index].myName = actName;
}
var cmdKey = false;
var onKeyDown = function (e) {

    if(e.keyCode == 224 || e.keyCode == 17 || e.keyCode == 91 || e.keyCode == 93){
        //command key..
        cmdKey = true;
    }
    if(e.key == "Z" ||  e.key == "z"){
        if(cmdKey){
            e.preventDefault();
            UndoLastWaypoint();
        }
    }

   if(e.ctrlKey) {
        //command key..
        cmdKey = true;
   }   

}
var onKeyUp = function (e) {
    if(e.keyCode == 224 || e.keyCode == 17 || e.keyCode == 91 || e.keyCode == 93){
        //command key..
        cmdKey = false;
    }
    if(e.ctrlKey) {
        //command key..
        cmdKey = false;
   }

        switch (e.key) {
            case "Escape":
          //  donePathWaypoints();
          //  doneTrajectoryWaypoints();
           // disposeeditableText();
            break;
            case " ":
               // engine.resize();
            break;
            case "Enter":
            disposeeditableText();
            disposeHoverLabel();
            if(valuesChanged){
                    allPaths[indexNUMB].pathwaypoints[WPNUMB] = new BABYLON.Vector3(XVAL,YVAL,ZVAL);
                    scene.meshes.forEach(element => {
                            if(element.id ==  (WPNUMB + 1) && element.name == indexNUMB){
                                element.position = new BABYLON.Vector3(XVAL,YVAL,ZVAL);
                            }
                        });
                    pathDetail(true, indexNUMB);
                    editPathLine(indexNUMB,WPNUMB,new BABYLON.Vector3(XVAL,YVAL,ZVAL));
                    wps = 0;
                    var totalWP = allPaths[indexNUMB].pathwaypoints.length;
                    for(var pp = 0; pp<totalWP;pp++){
                       //each wp of each car
                       wps++;
                        // we always make waypoints of current car
                        //sphere to present a waypoint
                        var tmp = new BABYLON.Vector3(allPaths[indexNUMB].pathwaypoints[pp].x,
                          allPaths[indexNUMB].pathwaypoints[pp].y,allPaths[indexNUMB].pathwaypoints[pp].z);
                          allPaths[indexNUMB].pathwaypoints[pp] = tmp;
                            // html GUI
                            htmlForWaypoints(indexNUMB, tmp);
                    }
                    //if cars were following this path...they need to adapt..
            
                    for(var actC = 0;actC < allActions.length; actC ++){
                        if(allActions[actC].pathIndex == indexNUMB){
                            assignPathToCar(actC,indexNUMB);
                        }
                    }
                    valuesChanged = false;

           }
         break;
         
        }
    }

    function UndoLastWaypoint(){
        if(creatingPath){
            //only if creating path
            var totalch;
            if(wps == 1){
                totalch =2;
            }else{
                totalch =3;
            }
            wps--;
          
            for(var ee = 1; ee <= totalch;ee++){
                temporaryMeshes[ temporaryMeshes.length -  ee].dispose();
                temporaryMeshes[temporaryMeshes.length -  ee] = null;
            }
            temporaryMeshes.length -= totalch;
           
            inner.removeChild(inner.lastChild);
            if(wps == 0){
                //finished up whole path...
                donePathWaypoints();
                return;
            }
            var previmp = null;
            if(temporaryMeshes.length < totalch){
                totalch = temporaryMeshes.length;
            }
            for(var ll = 1;ll <= totalch; ll++){
                if(temporaryMeshes[temporaryMeshes.length - ll].name == (TotalPaths - 1) &&
                 temporaryMeshes[temporaryMeshes.length - ll].id == wps){
                    previmp =  temporaryMeshes[temporaryMeshes.length - ll];
                }
            }
            previousImp =  previmp;
          
            previousWPArrow = temporaryMeshes[temporaryMeshes.length - totalch];
            previousWPArrow.position = previousImp.position;
            previousWPArrow.scaling = new BABYLON.Vector3(0,0,0);
        }

    }
/**
 * Rotate car to face forward
 * @param {*} carNumber 
 */
function rotateCartoFaceForward(carNumber,direction,followingbody){
    var v1 = new BABYLON.Vector3(0, 0, 1);
    var v2 = direction;//actionInAnimation[carNumber].direction.normalize(); 
    // calculate the angle for the new direction
    var angle = Math.acos(BABYLON.Vector3.Dot(v1, v2));
    // decide if the angle has to be positive or negative
    if (direction.x < 0) angle *= -1;
    actionInAnimation[carNumber].Body.rotation.y = angle;
    followingbody[carNumber].rotation.y = angle;
}

/**
 * Filling in timeline of each car...
 * @param {*} carNumber 
 */
function updatePosNRotOLD(carNumber,timelineDelta){
    if(actionInAnimation[carNumber].myTimeLinePos.length == 0 && timelineDelta >1){
        
        //no previous value added into the timeline
        for(var ii = 0;ii<= timelineDelta;ii++){
            actionInAnimation[carNumber].myTimeLinePos[ii] = new BABYLON.Vector3 (actionInAnimation[carNumber].Body.position.x,actionInAnimation[carNumber].Body.position.y,actionInAnimation[carNumber].Body.position.z);
            actionInAnimation[carNumber].myTimeLineRot[ii] = actionInAnimation[carNumber].Body.rotation;
        }
    }
    var positionOfCar, rotationOfCar;
            //imp to divide into vector 3 as in babylonJS position is not of type vector3
    positionOfCar = new BABYLON.Vector3 (actionInAnimation[carNumber].Body.position.x,actionInAnimation[carNumber].Body.position.y,actionInAnimation[carNumber].Body.position.z);
    rotationOfCar = new BABYLON.Vector3 (actionInAnimation[carNumber].Body.rotation.x,actionInAnimation[carNumber].Body.rotation.y,actionInAnimation[carNumber].Body.rotation.z);
    actionInAnimation[carNumber].myTimeLinePos[timelineDelta-1] = positionOfCar;
    actionInAnimation[carNumber].myTimeLineRot[timelineDelta-1] = rotationOfCar;
}

function updatePosNRot(carNumber,timelineDelta, followingbody){
    if(actionInAnimation[carNumber].myTimeLinePos.length == 0 && timelineDelta >1){
        
        //no previous value added into the timeline
        for(var ii = 0;ii<= timelineDelta;ii++){
            actionInAnimation[carNumber].myTimeLinePos[ii] = new BABYLON.Vector3 (followingbody[carNumber].position.x,followingbody[carNumber].position.y,followingbody[carNumber].position.z);
            actionInAnimation[carNumber].myTimeLineRot[ii] = followingbody[carNumber].rotation;
        }
    }
    var positionOfCar, rotationOfCar;
            //imp to divide into vector 3 as in babylonJS position is not of type vector3
    positionOfCar = new BABYLON.Vector3 (followingbody[carNumber].position.x,followingbody[carNumber].position.y,followingbody[carNumber].position.z);
    rotationOfCar = new BABYLON.Vector3 (followingbody[carNumber].rotation.x,followingbody[carNumber].rotation.y,followingbody[carNumber].rotation.z);
    actionInAnimation[carNumber].myTimeLinePos[timelineDelta-1] = positionOfCar;
    actionInAnimation[carNumber].myTimeLineRot[timelineDelta-1] = rotationOfCar;
}


    /**
     * Drawing path line between two waypoints
     * @param {*previousImpposition} Vector3 previous waypoint's position
     * @param {*impactposition} this waypoint position
     * @param {*wpSpeed} speed of this waypoint
     * @param {*pathNumb} number of this path, one path between two waypoints
     * @param {carNum} car number for which path is being edited
     */
function  drawLineBtwTwo(previousImpposition,impactposition,index,wpIndex){
    var trackPs = [];
    trackPs.push(new BABYLON.Vector3( previousImpposition.x,0,previousImpposition.z));
    trackPs.push(new BABYLON.Vector3(impactposition.x,0,impactposition.z));
 
    var thiscolor;
   // if(wpSpeed == null){//only cars have speed
        thiscolor = allPaths[index].myColor;// individualColors(index+1);//colors start from 1 index
   /* }else{
        thiscolor = allActions[index].myColor;
    }*/
    var mtype;
   /* if(wpSpeed!=null){
        mtype = "T_mesh_"+index;
   
    }else{*/
        mtype = "P_mesh_"+index+"_"+wpIndex+"_"+(wpIndex+1) ;//"P_mesh_"+index;
   // }
  var line =  line2D({points: trackPs, color: thiscolor, type: mtype},null,scene);
 
   /* if(wpSpeed != null){
        //Also calculate distance per speed for this line path..
        calculateDist_WPs(previousImpposition,impactposition,index, wpIndex);
    }*/
}
var offset = 0.25;
var line2D = function( options, color,scene) {
    var mpath = options.points;
    var color = options.color;
    var mat = new BABYLON.StandardMaterial("wpMat", scene);
    mat.emissiveColor = color;
    var mtype = options.type;
    var thisDist =  BABYLON.Vector3.Distance(mpath[0],mpath[1]);

    var catmullRomSpline=  BABYLON.MeshBuilder.CreateBox("tube", {height: .1, width: thisDist , depth:1}, scene);
    catmullRomSpline.position = new BABYLON.Vector3((mpath[1].x + mpath[0].x )/2,0,(mpath[1].z + mpath[0].z )/2) ;
    temporaryMeshes.push(catmullRomSpline);
    var direction = mpath[1].subtract(mpath[0]); 
    var v1 ;
    if(mpath[1].z > mpath[0].z){
        if(mpath[1].x > mpath[0].x){
            v1 = new BABYLON.Vector3(-1,0,0);
        }else{
            v1 = new BABYLON.Vector3(1,0,0);
        }
    }else{
        if(mpath[1].x < mpath[0].x){
            v1 = new BABYLON.Vector3(-1,0,0);
        }else{
            v1 = new BABYLON.Vector3(1,0,0);
        }
    }
    var v2 =  direction.normalize(); 
    // calculate the angle for the new direction
    var angle = Math.acos(BABYLON.Vector3.Dot(v1, v2));
    if (direction.x < 0) angle *= -1;
    catmullRomSpline.rotation.y =  angle;

   wpdefX = 1;
    wpdefY = 1;
    wpdefZ = 1;

    catmullRomSpline.scaling = new BABYLON.Vector3(1,
    1,adjustsize(.4));

  //  var catmullRomSpline = BABYLON.MeshBuilder.CreateTube("tube", {path: mpath, radius:adjustsize(0.2), updatable:true}, scene);
    catmullRomSpline.id = mpath;
    catmullRomSpline.type = mtype;
    catmullRomSpline.parent = ground;
    catmullRomSpline.state = "zoomable";
    light.excludedMeshes.push(catmullRomSpline);
    catmullRomSpline.material = mat;
    catmullRomSpline.isPickable = false;
    return catmullRomSpline;

}

    /**
     * Drawing path line between dragging waypoint and its other linked waypoints
     * @param {*previousImpposition} Vector3 previous waypoint's position
     * @param {*impactposition} this waypoint position
     * @param {*wpSpeed} speed of this waypoint
     * @param {*pathNumb} number of this path, one path between two waypoints
     * @param {carNum} car number for which path is being edited
     */
    function  updatedraggingPathLine(previousImpposition = null,impactposition, nextPosition = null, carNumb){
        if(previousImpposition!=null){
        
            draggingpath(previousImpposition,impactposition,carNumb,false);
        }
       if(nextPosition != null){
        draggingpath(impactposition,nextPosition,carNumb,true);
       }
        
    }

/**
 * 
 * @param {*} previousImpposition 
 * @param {*} impactposition 
 * @param {*} wpSpeed 
 * @param {*} pathNumb 
 */
function calculateDist_WPs(previousImpposition,impactposition, index, wpIndex){
    var thisDist =  BABYLON.Vector3.Distance(previousImpposition,impactposition);
    allActions[index].DistanceToCoverPerWP[wpIndex] = thisDist;
    changespeedofThisWP(index,wpIndex,allActions[index].mySpeed,false);
}

function calculateDist_TraversedPath(index){
   //speedcalculation
   //WPNumb = 0 means distance between 0 - 1, WPNumb = 1 means dist btw 1-2
   var distPerSpeed = allActions[index].traversedPathLength/allActions[index].mySpeed;
   distPerSpeed *= 1000;
   //add new distance per speed.
   allActions[index].totaldistanceperSpeed = allActions[index].starttime +  distPerSpeed;
   console.log(">>>>"+allActions[index].traversedPathLength );
}


/**
 * Checking double click for final waypoint 
 * @param {Vector3} pickedPoint {double click means waypoints process should stop}
 */
function  doubleclicked (pickedPoint){
    if(creatingPath){//while creating a path.dble click stops the path making process
        if(previousImp != null &&  Math.trunc(pickedPoint.x) == Math.trunc(previousImp.position.x) &&
        Math.trunc(pickedPoint.z) == Math.trunc(previousImp.position.z)){
               //avoid two waypoints on double click..
               return true;
       }
       return false;
    }else{
        //not creating a path... can edit waypoint details on dble click

    }
    
 }

/**
 * creating 3D sphere to show waypoints
 * @param {Vector3} pickResult {pick position from screen}
 * @param {Car num} wPPath {waypoint path that contains information of this waypoint}
 */

function createWP(pickResult,color,pathInd,mtype)
{
    wpdefX = 1,wpdefY = 1,wpdefZ = 0.5;
    //create Sphere
    var impact= BABYLON.MeshBuilder.CreateSphere("WP", {diameterX: wpdefX, diameterY: wpdefY, diameterZ: wpdefZ}, scene);
    impact.rotation.x = Math.PI/2;
    impact.position = pickResult;
    impact.scaling =  new BABYLON.Vector3(adjustsize(wpdefX),adjustsize(wpdefY),wpdefZ);

    impact.type = mtype;
    impact.isPickable = true;
    impact.state = "zoomable";
    impact.parent = ground;
    light.excludedMeshes.push(impact); 
    var mat = new BABYLON.StandardMaterial("wpMat", scene);
    mat.emissiveColor = color;
    impact.material = mat;
    if(wps == 1){
        makeArrow(color,impact.position,pathInd,wps-1,mtype);
    }else if(wps == 2){
        if(previousWPArrow!= null){
            rotateArrow(previousWPArrow,previousWPArrow.position,impact.position);
        }
    }
    return impact;
}

/**
 * Directional Arrow between two waypoints...
 * @param {*} mat material for arrow object
 * @param {*} impactposition position of current waypoint
 * @param {*} mtype 
 */
function makeArrow(color,impactposition,pathInd,wpInd,mtype){
    //create Arrow for direction between waypoints 
    var mat = new BABYLON.StandardMaterial("dirArrow", scene);
    mat.useAlphaFromDiffuseTexture = true;
    
    var t = new BABYLON.Texture(dirarrowImage,scene);
    t.hasAlpha = true;
    mat.diffuseTexture = t;
    mat.diffuseTexture.hasAlpha = true;
    mat.diffuseColor = color;
    mat.emissiveColor = color;

    //create arrow plane
    var arrowImg = BABYLON.Mesh.CreatePlane("arrow",10, scene);
    arrowImg.id = "arrow_"+pathInd+"_"+wpInd;
    arrowImg.isPickable = false;
    arrowImg.type =  mtype;

    arrowImg.parent = ground;
    arrowImg.rotation.x = Math.PI / 2;
    arrowImg.scaling=  new BABYLON.Vector3(0, 0, 0);
    arrowImg.material = mat;
    arrowImg.position =  new BABYLON.Vector3(impactposition.x,0,impactposition.z);

    temporaryMeshes.push(arrowImg);
/*
    if(previousWPArrow!= null){
        rotateArrow(previousWPArrow,previousWPArrow.position,impactposition);
    }*/
    previousWPArrow = arrowImg;

}

function rotateArrow(targetArrow,previousWPposition,currentWPposition){
     // a directional vector from one object to the other one
     var direction = currentWPposition.subtract(previousWPposition);
     var v1 = new BABYLON.Vector3(0, 0, 1);
     var v2 = direction.normalize();
     // calculate the angle for the new direction
     var angle = Math.acos(BABYLON.Vector3.Dot(v1, v2));
     // decide if the angle has to be positive or negative
     if (direction.x < 0) angle *= -1;
     
     targetArrow.rotation.y = angle;
     arrowdefX = 0.2,arrowdefY = 0.2,arrowdefZ = 0;
     targetArrow.scaling=  new BABYLON.Vector3(adjustsize(arrowdefX),adjustsize(arrowdefX), arrowdefZ);
     targetArrow.position =  new BABYLON.Vector3((currentWPposition.x + previousWPposition.x)/2,
         0,(currentWPposition.z + previousWPposition.z)/2);
         targetArrow.state = "zoomable";
}

function assignWPToPath(impact,impactPosition,pathindex, waypointnumb){
    impact.name = pathindex;//name is path number..to be used in editing later on
    impact.id = waypointnumb;//id is waypoint number..to be used in editing later on
    //sphere to present a waypoint..
    impact.actionManager = new BABYLON.ActionManager(scene);	 
    allPaths[pathindex].pathwaypoints[waypointnumb - 1] = impactPosition;
    //when mouse will be over a waypoint object..any label can be edited
    impact.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            function(ev){
                if(!StartTrajectory && WPPosText == null){//cannot show other position if one is being edited
                    createLabel(impact.position,pathindex,waypointnumb,false,false).linkWithMesh(impact);
                    scene.hoverCursor = 'pointer';
                }
            }
        )
    );
    //when mouse will be out of waypoint object
    impact.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            onOutWP
        )
    );
    impact.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger:  BABYLON.ActionManager.OnDoublePickTrigger,
            },
            function(){
                editWPonDblClick(impact,pathindex,waypointnumb-1);
            }
        )
    );
    return impact;
  }

/**
 * SECTION - Functions for Left pane: Test Scenario
 */

/**
 * New/default test Scenario
 */
function defaultScenario(){
    //has new path and new trajectory sub directory buttons
    removeDonebutton();
    allCarsInformationPanel = document.getElementById("myUL"); 

    //all paths in ascenario container
    mainPathBtn = listHierarchy("Path","Path Types", allCarsInformationPanel,null,false,true, "Path");
    PathInner = inner;
        //all cars in ascenario container
    mainCarBtn =  listHierarchy("Car","Vehicle Types", allCarsInformationPanel,null,true,true,"Car");
    CarsInner =  inner;    
    mainActionBtn =  listHierarchy("Action","Actions", allCarsInformationPanel,null,true,true,"Action");
    ActionInner =  inner;  
//with default path with 
    defaultPathsNAction();
    //without default path...
  //  instantiateCar();
   // performActions(false,"");
}

function  expandShrinkList(element){
    if(element.parentElement && element.parentElement.querySelector(".nested")){
        element.parentElement.querySelector(".nested").classList.toggle("active");
        element.classList.toggle("check-box");
    }
} 
   /**
    * make a button and a hierarchy parent to put child emelemtns inside it
    * @param {*} parent_li 
    * @param {*} innertext
    * @param {*} parent_li
    * @param {*} index
    * @param {*} forTrajectory
    */
   var zzInd = 20;
function listHierarchy(pathId,innertext, parent_li,index,forTrajectory, nestedAllowed = true,mtype){
    //all paths button
    var outer_li=  document.createElement('li');
    outer_li.id = pathId;
   // outer_li.style.zIndex = zzInd--;
    var Btn=  document.createElement('span');
    if(nestedAllowed){
        Btn.classList.add('box');
      //  if(index != null && (mtype.includes("Path") || mtype.includes("Car") || mtype.includes("Action"))){
      //  }else{
          if(creatingPath || !mtype.includes("Path")){//(innertext != "RuralRoad_InnerLane" && innertext != "Super Multilane_Lane 3"  ){
            Btn.classList.add('check-box');
        }
        //if most higher button in hierarchy is shrnked...cannot see further down the list
        expandTopHigherBtn(forTrajectory);
    
        Btn.addEventListener("click", function() {
            //by default each button shows nested items
            expandShrinkList(this);
        });
    }

    if(index == null){
        //outer button i.e. Paths or Cars
        Btn.innerHTML = innertext;
    }else{
        //Editable names for Car, Path and Actions
        if(mtype.includes("Car")){
            createInput(index,null,innertext,null,null, "Car",Btn,forTrajectory);
        }else  if(mtype.includes("Path")){
            createInput(index,null,innertext,null,null, "Path",Btn,forTrajectory);
        }else if(mtype.includes("Act")){
            createInput(index,null,innertext,null,null, "Action",Btn,forTrajectory);
        }
    }
    outer_li.appendChild(Btn);
    //nested is allowed if we have further nested list options
    if(nestedAllowed){
        //nested ul next out outer_li
        var nested_ul=  document.createElement('ul');
        nested_ul.classList.add('nested');
        //by default specific path/vehicle/action details are contracted,
     //   if(index != null && (mtype.includes("Path") || mtype.includes("Car") || mtype.includes("Action"))){
       // }else{
        if(creatingPath || !mtype.includes("Path")){
            nested_ul.classList.add('active');
        }
       // 
        nested_ul.name = innertext;
        nested_ul.style.overflow = "wrap";
        outer_li.appendChild(nested_ul);
        //this inner will further contain next elements
        inner =nested_ul;
    }

    //Editing the car or path or action from scene, results should reflect on html page 
    if(parent_li.contains(document.getElementById(pathId))){
        //insert new inner at right location
            parent_li.removeChild(document.getElementById(pathId));
            if(index != null && mtype.includes("Path")){
                //when editing the path
                if(index+1 < TotalPaths){
                    //there are more cars underneath this one...
                    parent_li.insertBefore(outer_li, document.getElementById("PathSection"+(index+1))); 
                } else{
                    parent_li.appendChild(outer_li);
                }
                return Btn;
            }
   }
    parent_li.appendChild(outer_li);
    return Btn;
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

/**
 * All cars available to perform action on...
 * @param {*} actIndex 
 * @param {*} parent_li 
 */
function carOptionForAction(fillingdetails = false, actIndex, parent_li){
    if(!fillingdetails && allActions[actIndex].carIndex == null){
        //Default Car for action, in case of new action
        //assign the very last/recent one
        allActions[actIndex].carIndex = TotalCars - 1;
    }
    var select = dropDownMenu(actIndex,parent_li, allCars[TotalCars - 1].myName,"Car");
    createOption(select,actIndex,parent_li,"Create new car","newCar","Car");
    refreshallCarOptions(actIndex,select,parent_li);
}

/**
 * Refresh available cars as cars are increasing in number
 * @param {*} carindex 
 * @param {*} select 
 */
function refreshallCarOptions(actIndex, select,parent_li){
    //cannot make two actions for same car..avoid Redundent values
    var prevLen = select.childElementCount - 1;
    //refresh drop down list
    for(var ind = 0;ind < allCars.length;ind++){
        if(prevLen > ind ){
            if(select.children[ind+1].children[0].id ==("Op"+ind))
                select.children[ind+1].children[0].innerHTML = allCars[ind].myName;
            continue;
        }
        createOption(select,actIndex,parent_li,allCars[ind].myName,ind,"Car");
    }
}

/**
 * 
 * @param 
 * { <li class="dropdown">
            <a class="dropbtn" >Help</a>
            <ul class="dropdown-content">
                <li><a id = "referenceManual" class="allbuttons saveLoadTestScenariosBtn" onclick="openReferenceMaual()">Reference Manual</a></li>
                <li><a id = "About" class="allbuttons saveLoadTestScenariosBtn" onclick="openAbout()">About</a></li>
                <li><a id = "Tips" class="allbuttons saveLoadTestScenariosBtn" onclick="openTips(); return false;">Tips</a></li>
                <li><a id = "License" class="allbuttons saveLoadTestScenariosBtn" onclick="openLicense()">License</a></li>
            </ul>
    </li>   
} 
 */

function dropDownMenu(actIndex,parent_li, defaultText = "drop down", object){
    //li
    var par = document.createElement('li');
    switch(object){
        case "Path":
            par.id = "Action"+actIndex+"_select"+2;
        break;
        case "Car":
            par.id = "Action"+actIndex+"_select"+1;
        break;
    }
    par.classList.add('dropdown');
    par.classList.add('dropdownoption');
    par.style.height = "17px";

    parent_li.style.display = "flex";
    parent_li.style.margin = "2px";
    par.style.padding =  "0px";
   //a
    var ch  = document.createElement('a');
    ch.style.padding = "2px";
    ch.innerHTML = " "+defaultText;

    //this div is important for exclusive dropdowns. for alignments
    var div = document.createElement('div');
    div.style.zIndex = zzInd--;
    div.style.marginLeft = "auto";
    div.style.marginRight = "0px";
    //ul
    var select = document.createElement('ul');
    select.classList.add('dropdown-content');

    par.appendChild(ch);
    par.appendChild(select);

    div.appendChild(par);
    parent_li.appendChild(div);

    par.onmouseover = function() {
        switch(object){
            case "Path":
              //refresh path options as we can create new paths at any time
                refreshallPathOptions(actIndex, select,parent_li);
            break;
            case "Car":
                refreshallCarOptions( actIndex,select,parent_li);
            break;
            case "WP":
                refreshallWPOptions(firstWP, actIndex,select);
            break;
        }
    }

    par.onclick = function() {
        switch(object){
            case "Path":
              //refresh path options as we can create new paths at any time
                refreshallPathOptions(actIndex, select,parent_li);
            break;
            case "Car":
                refreshallCarOptions( actIndex,select,parent_li);
            break;
            case "WP":
                refreshallWPOptions(firstWP, actIndex,select);
            break;
        }
          //open this dropdown if other is not open...
        $(this).find(".dropdown-content").slideToggle("fast");
    }
    return select;
}

/**
 * Available paths to perform action on
 * @param {*} actIndex 
 * @param {*} parent_li 
 */
function PathoptionsForCar(fillingDetails = false,actIndex, parent_li){
    var selectedOption = "Choose path";
    if(!fillingDetails && allActions[actIndex].pathIndex == null){
        //Default Car for action, in case of new action
        //assign the very last/recent one
        allActions[actIndex].pathIndex = TotalPaths - 1;
    }
   // if(fillingDetails && allActions[actIndex].pathIndex != null){
        selectedOption = allPaths[ allActions[actIndex].pathIndex ].P_name;
   // }
    var select = dropDownMenu(actIndex,parent_li, selectedOption,"Path");
    createOption(select,actIndex,parent_li,"Create new path","newPath","Path");
    refreshallPathOptions(actIndex, select,parent_li);
   // if(fillingDetails && allActions[actIndex].pathIndex != null){
        newPathSelected(fillingDetails,select,actIndex,allActions[actIndex].pathIndex ,parent_li);
   // }
}
/**
 * Creating options for dropdown list of cars/paths and waypoints...
 * @param {*} select 
 * @param {*} actIndex 
 * @param {*} parent_li 
 * @param {*} defaultText 
 * @param {*} selectedValue 
 * @param {*} newObject 
 */
function createOption(select,actIndex,parent_li, defaultText,selectedValue, newObject)
{
    var li = document.createElement('li');
    li.classList.add('dropdownoption');
    var option = document.createElement('a');
    option.value = selectedValue;
    option.id = "Op"+selectedValue;
    option.style.padding = "4px 2px";
    option.innerHTML =defaultText;
    option.onclick = function() {
        switch(newObject)
        {
            case "Path":
             //create new path
                newPathSelected(false,select,actIndex,selectedValue,parent_li);
                if(selectedValue != "newPath")
                    select.parentElement.children[0].innerHTML = allPaths[selectedValue].P_name;
            break;
            case "Car":
                newCarSelected(select,actIndex,selectedValue,parent_li);
                if(selectedValue != "newCar")
                    select.parentElement.children[0].innerHTML = allCars[selectedValue].myName;
            break;
            case "newWP":
            break;
        } 
    }
    li.appendChild(option);
    select.appendChild(li);
}

function newCarSelected(select,actIndex,selectvalue,parent_li)
{
    if(selectvalue == "newCar"){
        instantiateCar();
        createOption(select,actIndex,parent_li,allCars[TotalCars - 1].myName,TotalCars - 1,"Car");
        selectvalue = TotalCars - 1;
        select.parentNode.children[0].innerHTML = allCars[TotalCars - 1].myName;
    }

   /* if(allActions[actIndex].carIndex != null){
        //this action has alreadya a car assigned to it..
        allCars[allActions[actIndex].carIndex].actIndex = null;
    }*/
   var choosenCar = selectvalue;
   allActions[actIndex].carIndex = choosenCar;
  // allCars[choosenCar].actIndex = actIndex;
}

function newPathSelected(fillingDetails = false,select,actIndex,selectvalue,parent_li)
{
    if(selectvalue == "newPath"){
        creatingpathForAction = actIndex;
         //important: new path will be replaced..older must be null
         if(allActions[actIndex].pathIndex != null){
            var inneraction = document.getElementById("ActSection"+actIndex).children[1];
            while(inneraction.childElementCount > 2){
                inneraction.removeChild(inneraction.lastChild);
            }
         }
        allActions[actIndex].pathIndex = null;
        allActions[actIndex].lastWaypointIndex = null;//just to give new first and last waypoints...
        newPathCreation();
        createOption(select,actIndex,parent_li,allPaths[TotalPaths - 1].P_name,TotalPaths - 1,"Path");
        select.parentElement.children[0].innerHTML = allPaths[TotalPaths - 1].P_name;
        selectvalue = TotalPaths - 1;
       //this path will be assigned once user is done making path...
    }else if(!fillingDetails){
      allActions[actIndex].lastWaypointIndex = null;//just to give new first and last waypoints...
        assignPathToCar(actIndex,selectvalue);
    }
console.log("777");
    //start time
    var btn = listHierarchy(("Action"+actIndex+2) ,"at time (sec)",parent_li.parentNode.parentNode,null,true,false,"");
    btn.style.display = "flex";
    createInput(actIndex,null,allActions[actIndex].starttime/60,0,300, "at time ", btn, true);
    

    //speed of this car
    btn = listHierarchy(("Action"+actIndex+3) ,"with speed (km/h)",parent_li.parentNode.parentNode,null,true,false,"");
    btn.style.display = "flex";
    createInput(actIndex,0,allActions[actIndex].mySpeed,10,300, "with speed ", btn,true);
   

    //color picker for action
    btn = listHierarchy(("Action"+actIndex+6),"color ",parent_li.parentNode.parentNode,null,true,false,"");
    btn.style.display = "flex";
    btn.appendChild(makeColorPicker(fillingDetails,actIndex));
  


    if(allActions[actIndex].pathIndex != null){
        btn = listHierarchy(("Action"+actIndex+4)," ",parent_li.parentNode.parentNode,null,true,false,"");
       WaypointOptionForCar(fillingDetails, actIndex, btn,true);
       

   }

}

function makeColorPicker(fillingDetails,actIndex){
    var colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.id = "color"+actIndex;
   
    colorPicker.style.background = "transparent";
    colorPicker.style.outline = "none";
    colorPicker.style.border = "none";
    colorPicker.style.width = "176px";
    colorPicker.style.height = "30px";
    colorPicker.style.marginLeft = "auto";
    colorPicker.style.marginRight = "0px";

    if(fillingDetails && allActions[actIndex].myColor!= null){
        console.log(allActions[actIndex].myColor);
        colorPicker.value =  RgbToHex(allActions[actIndex].myColor);
    }else{
         //by default white color
        colorPicker.value = "#ffffff";
        allActions[actIndex].myColor = new BABYLON.Color3(1,1,1);
    }
    colorPicker.onchange = function() {
        var cc =  hexToRgb(colorPicker.value);
        var col = new BABYLON.Color3( cc.r/255, cc.g/255, cc.b/255);
        allActions[actIndex].myColor = col;
        if(allActions[actIndex].Body != null){
            allActions[actIndex].Body.material.diffuseColor = col;
        }
    }
    return colorPicker;
}
/**
 * convert hex value of color to rgb
 * @param {* hex value of color} hex 
 * returns RGB color
 */
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function RgbToHex(color) {
    return "#" + ((1 << 24) + ((color.r * 255) << 16) + ((color.g * 255) << 8) + (color.b * 255)).toString(16).slice(1);
}

/**
 * Refresh paths shown to the user to for an action as paths can increase in number
 * @param {*} actindex 
 * @param {*} select 
 */
function refreshallPathOptions(actIndex, select,parent_li){
  
    //refresh drop down list
    if(creatingPath){
        select.children[0].disabled = true;
    }else{
        select.children[0].disabled = false;
    }
    var prevLen = select.childElementCount - 1;
    for(var ind = 0;ind < allPaths.length;ind++){
        if(prevLen > ind){
            if(select.children[ind+1].children[0].id ==("Op"+ind)){
                     select.children[ind+1].children[0].innerHTML = allPaths[ind].P_name;
            }
           continue;
        }
     createOption(select,actIndex,parent_li,allPaths[ind].P_name,ind, "Path");
   
    }
}

/**
 * All cars available to perform action on...
 * @param {*} actIndex 
 * @param {*} parent_li 
 */
function WaypointOptionForCar(fillingDetails = false, actIndex, parent_li,firstWP = false){
   // <input type="text" id="amount" readonly style="border:0; color:#f6931f; font-weight:bold;">
    var inp = document.createElement('input');
    inp.type = "text";
    inp.style.width = "100%";
    inp.id = "amount"+actIndex;
    inp.readOnly = true;
    parent_li.appendChild(inp);

    var div = document.createElement('div');

    div.style.width = "95%";
    div.style.height = "20px";
    div.style.background = "#252e38";
    div.style.outlineColor = "#252e38";
    div.style.border = "1px solid #3d434b";
    div.style.borderRadius = "0px";
    div.id = "slider-range"+actIndex;

    var hand1 = document.createElement('div');
    hand1.classList.add("ui-slider-handle");
    hand1.classList.add("custom-handle");
    hand1.style.width = "25px";
    hand1.style.height = "23px";
    hand1.style.textAlign = "center";
    hand1.style.marginTop= ".2em";
    hand1.style.borderRadius = "0px";
    hand1.style.border = "1px solid #3d434b";
    hand1.id = "custom-handle_1"+actIndex;

    var hand2 = document.createElement('div');
    hand2.classList.add("custom-handle");
    hand2.classList.add("ui-slider-handle");
    hand2.style.width = "25px";
    hand2.style.height = "23px";
    hand2.style.textAlign = "center";
    hand2.style.borderRadius = "0px";
    hand2.style.marginTop= ".2em";
    hand2.style.border = "1px solid #3d434b";
    hand2.id = "custom-handle_2"+actIndex;


    div.appendChild(hand1);
    div.appendChild(hand2);

    parent_li.appendChild(div);

    var minVal = 0, maxval = 100;

    if(fillingDetails){
        var totaldist = completepathDistance(allActions[actIndex].pathIndex);
        minVal = (allActions[actIndex].firstWaypointIndex * 100) / totaldist;
        maxval = (allActions[actIndex].lastWaypointIndex * 100) / totaldist;
     
    }else{
      //  textForCodingArea += " drives from " + 0 + "% to" + 100;
    }
  
    $( "#slider-range"+actIndex ).slider({
        create: function( ) {
            var hand1 = $( "#custom-handle_1"+actIndex );
            var hand2 = $( "#custom-handle_2"+actIndex );
            hand1.text( $( "#slider-range"+actIndex ).slider( "values", 0 ));
            hand2.text( $( "#slider-range"+actIndex ).slider( "values", 1 ));
            $( "#slider-range"+actIndex ).find(".ui-slider-range").css({
               "background":"#464d56",
               "border-radius": "0px",
               "height":"inherit"
           });
        },
        range: true,
        min: 0,
        max: 100,
        values: [ minVal, maxval ],
        slide: function( event, ui ) {
          $( "#amount"+actIndex ).val("from " + ui.values[ 0 ] + "% to " + ui.values[ 1 ] + "%");
          var hand1 = $( "#custom-handle_1"+actIndex );
          var hand2 = $( "#custom-handle_2"+actIndex );
          hand1.text( ui.values[ 0 ] );
          hand2.text( ui.values[ 1 ] );
        calculateCompleteActionPathDistance(actIndex,ui.values[ 0 ],ui.values[ 1 ]);
        preCalculatePath(allActions[actIndex].pathIndex);
        timelineMaxDistance(true);
      //  PathwasEdited = true;
        },
        end: function( event, ui ) {
console.log("END");

        }
      });
      $( "#amount"+actIndex ).val("from " + $( "#slider-range"+actIndex ).slider( "values", 0 ) + "% to " +
        $( "#slider-range"+actIndex ).slider( "values", 1 ) + "%"); 
    return;
}

function completepathDistance(pathInd){

    var previouswp = allPaths[pathInd].pathwaypoints[0];
    var thisDist = 0;
    for(var wpIndex = 1; wpIndex < allPaths[pathInd].pathwaypoints.length ; wpIndex++){
        var wayp = allPaths[pathInd].pathwaypoints[wpIndex];
         thisDist +=  BABYLON.Vector3.Distance(previouswp,wayp);
        previouswp = wayp;
    }
    return thisDist;
}

/**
 * 
 * @param {*} actIndex : which action
 * @param {*} totaldist : total distance of path
 */
function   calculateCompleteActionPathDistance(actIndex,firstPerc,lastPerc){

    //pre calculate total path distance for less calculation at runtime
    var pathind = allActions[actIndex].pathIndex;
    var totaldist = completepathDistance(pathind);
    //percentage of path...
  var startP =  (totaldist * firstPerc) / 100; //starting distance of path from starting percentage
  var lastP =  (totaldist * lastPerc) / 100; //percentage of path to where end...
  //e.g. if path = 80km, & start from 10% to 30%, startP = 8, lastP = 24
  allActions[actIndex].firstWaypointIndex = startP;
  allActions[actIndex].lastWaypointIndex= lastP;

  allActions[actIndex].traversedPathLength = lastP - startP;
}
/**
 * Refresh waypoint options for first and last waypoint of car
 * @param {*} actindex 
 * @param {*} select 
 */
function refreshallWPOptions(first,actindex, select){
    //refresh drop down list
    for(var ind = 0;ind <  allPaths[allActions[actindex].pathIndex].pathwaypoints.length;ind++){
        if(ind < select.length && select[ind].id ==("WP"+ind)){
            //this waypoint was already drawn
            if(allActions[actindex].firstWaypointIndex == ind || 
                allActions[actindex].lastWaypointIndex == ind){
                //first or last waypoint both are diables
                select[ind].disabled = true;
            }else{
                select[ind].disabled = false;
            }
                if(first){
                    if(allActions[actindex].firstWaypointIndex == ind){
                        //first or last waypoint
                            select[ind].selected = true;
                    }else{
                        select[ind].selected = false;
                    }
                }else{
                    if(
                        allActions[actindex].lastWaypointIndex == ind){
                        //first or last waypoint
                            select[ind].selected = true;
                    }else{
                        select[ind].selected = false;
                    }
                }
           continue;
        } 

        var option=  document.createElement('option');
        option.value = ""+ind;
        option.id = "WP"+ind;
        option.innerHTML = (ind + 1) + " (" +
         (allPaths[allActions[actindex].pathIndex].pathwaypoints[ind].x).toFixed(2) + "," +
       // (allPaths[allActions[actindex].pathIndex].pathwaypoints[ind].y) + "," +
        (allPaths[allActions[actindex].pathIndex].pathwaypoints[ind].z).toFixed(2) + ")" ;

        if(allActions[actindex].firstWaypointIndex == ind || 
            allActions[actindex].lastWaypointIndex == ind){
            //first or last waypoint both are diables
            option.disabled = true;
        }else{
            option.disabled = false;
        }
        
        if(first){
            if(allActions[actindex].firstWaypointIndex == ind){
                //first waypoint selected
                option.selected = true;
            }else{
                option.selected = false;
            }
        }else{
            if(allActions[actindex].lastWaypointIndex == ind){
                //first or last waypoint
                option.selected = true;
            }else{
                option.selected = false;
            }
        }
        select.appendChild(option);
    }
}

/**
 * Assign path to car
 * @param {*} carindex {Car number for path allocation}
 * @param {*} pathindex {Which patht to assign. 0 = choose, 1= New Path}
 */
function assignPathToCar( actionindex, pathindex){
    if(replaySimulation){
        stopSimulation();
    }

    if(allActions[actionindex].Body != null){
        allActions[actionindex].Body.dispose();
        allActions[actionindex].Body = null;
    }
    allActions[actionindex].pathIndex = pathindex;

    disposeeditableText();
    wps = 0;
    StartTrajectory = false;
    allActions[actionindex].TotalWapoints = allPaths[pathindex].pathwaypoints.length;
    allActions[actionindex].path = allPaths[pathindex];

    var prevPos ;

    allPaths[pathindex].pathwaypoints.forEach(waypoint => {
        wps++;
        var newwp = new WayPoint();
        newwp.wpSpeed = 30;//default speed 30
        //new distances for new path
        if(wps > 1){
            calculateDist_WPs(prevPos,waypoint,actionindex, wps - 2);
        }
        prevPos = waypoint;
        
    });
    var first,last;
    if(allActions[actionindex].lastWaypointIndex == null){
        //by default each action has first waypoint of path as starting waypoint 
        //and last waypoint of path as last waypoint
        first = 0;
        last = 100;
    }else{
        first =  $( "#slider-range"+actionindex ).slider( "values", 0 );
        last = $( "#slider-range"+actionindex ).slider( "values", 1 );
    }
    calculateCompleteActionPathDistance(actionindex, first, last);
    PathwasEdited = true;//we changed the path...didnt we?
    //when assign a path..do enable play simulation button
    enableSimulationPlayer();
}


function enableWayPointCursor(){
    //change cursor for user to click and start making waypoints for the path
    ground.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){	 
        scene.hoverCursor = waypointCursor; 
    }));
}

function enableZoomingCursor(){
    //change cursor for user to click and start making waypoints for the path
    ground.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function(ev){	 
        scene.hoverCursor = zoomingCursor; 
    }));
}


function removeDraggingtrackline(){
    if(track!= null){
        track.dispose(); 
        track = null;
    }
    if(secondTrack!= null){
        secondTrack.dispose(); 
        secondTrack = null;
    }
}
function removePathDataFromAction(actInd){
    var inneraction = document.getElementById("ActSection"+actInd).children[1];
    while(inneraction.childElementCount > 2){
        inneraction.removeChild(inneraction.lastChild);
    }
    inneraction = document.getElementById("Action"+ actInd+"_select2").childNodes[1];
    inneraction.removeChild(inneraction.lastChild);

    inneraction = document.getElementById("Action"+ actInd +"_select2").childNodes[0];
    inneraction.innerHTML = "Choose path";
}

function removePathDetails(){
    PathInner.removeChild(document.getElementById("PathSection"+(TotalPaths-1)));
    TotalPaths -=1;
    allPaths.length = TotalPaths;
}
var creatingpathForAction = null;
function donePathWaypoints(){
    //if there is any action for which no path is set yet..
    if(creatingPath)
    {
        if(creatingpathForAction != null){
            if(wps == 0){
                //didnt created even a single waypoint...it is not a path
                removePathDetails();
                removePathDataFromAction(TotalActions-1);
           }else{
               assignPathToCar(creatingpathForAction,TotalPaths - 1);
               var parent_li = document.getElementById("Action"+creatingpathForAction+1).parentNode;
               if(allActions[creatingpathForAction].pathIndex != null){
                   var btn = listHierarchy(("Action"+creatingpathForAction+4)," ",parent_li,null,true,false,"Action");
                   WaypointOptionForCar(false, creatingpathForAction, btn,true);
               }
           }
           creatingpathForAction = null;
        }else if(wps == 0){
            //didnt created even a single waypoint...it is not a path
            removePathDetails();
        }
//while creating path, this must be the last waypoint in the path..
        makeArrow(allPaths[TotalPaths - 1].myColor,allPaths[TotalPaths - 1].pathwaypoints[allPaths[TotalPaths - 1].pathwaypoints.length - 1],TotalPaths -1,wps-1,"P_mesh_"+(TotalPaths - 1));
        rotateArrow(previousWPArrow,allPaths[TotalPaths - 1].pathwaypoints[allPaths[TotalPaths - 1].pathwaypoints.length - 2],allPaths[TotalPaths - 1].pathwaypoints[allPaths[TotalPaths - 1].pathwaypoints.length - 1]);
        previousWPArrow = null;
    }
    removeDraggingtrackline();
    creatingPath = false;
    temporaryMeshes = [];
    //enable all buttons
    enableDisable(false);

    wps = 0;
    previousImp = null;
    previousWPArrow = null;
    //remove cursor hover icon now, as there wont be waypoints made on click
    ground.actionManager.actions.splice(0, 1);
  // enableZoomingCursor();
    removeDonebutton();

    if(TotalActions > 0 && allActions[0].carIndex != null && allActions[0].pathIndex != null){
        //there is atleast one action with one car and assigned path
        enableSimulationPlayer();
    }
}

function enableSimulationPlayer(){
    startSimulationButton.style.backgroundImage = playButtonImage;
    startSimulationButton.onclick = parseCodeFromCodeArea;//startSimulation;
    startSimulationButton.disabled = false;
}

function doneTrajectoryWaypoints(){
    if(allCars[TotalCars-1] == null && allCars[TotalCars-1].path == null){
        //didnt created even a single waypoint...it is not a trajectory
        CarsInner.removeChild(document.getElementById("TrajectorySection"+(TotalCars-1)));
        TotalCars -=1;
    }

    removeDraggingtrackline();
    scene.hoverCursor = 'pointer';
    StartTrajectory = false;
  
    //after done, this button should disapear"
    removeDonebutton();
    creatingPath = false;
    wps = 0;
    previousImp = null;
    previousWPArrow = null;
    //remove cursor hover icon now, as there wont be waypoints made on click
    ground.actionManager.actions.splice(0, 1);
  //  enableZoomingCursor();
}

/**
 * Instantiates a Visual car in the screen corresponding to each car type object 
 * @param  {Integer} index [index to the car object for which a visual body is being generated]
 */
function createVisualCarObject(index){

    //create car material
    var mat2 = new BABYLON.StandardMaterial("car", scene);
    mat2.useAlphaFromDiffuseTexture = true;
    var t = new BABYLON.Texture(carImage, scene);
    t.hasAlpha = true;
    mat2.diffuseTexture = t;
    mat2.diffuseTexture.hasAlpha = true;
    mat2.diffuseColor = new BABYLON.Color3(actionInAnimation[index].myColor.r,
        actionInAnimation[index].myColor.g,actionInAnimation[index].myColor.b) ;
    //create car plane                                                                                                               
    var carImg = BABYLON.Mesh.CreatePlane("aCar",10, scene);
    carImg.state = "zoomable";//this element is zoom-able
   carImg.checkCollisions = true;
    carImg.actionManager = new BABYLON.ActionManager(scene);

    //when mouse will be over a waypoint object..any label can be edited
    carImg.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            function(ev){
                createCarLabel(index).linkWithMesh(carImg);
                    scene.hoverCursor = 'pointer';
                }
        )
    );
                //when mouse will be out of waypoint object
    carImg.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            onOutWP
        )
    );

    if(index > 0){
        //interact with all cars in the scene except with itself. All the cars made before this one
        for(var cc = 0;cc < index ;cc++){
            carImg.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, 
                    parameter: { 
                        mesh: actionInAnimation[cc].Body
                    
                    }
                },
                function() {
                   var coll = new CollisionObject();
                   coll.object1 = actionInAnimation[cc];
                   coll.object2 = actionInAnimation[cc];
                     coll.pointOfCollision = actionInAnimation[cc].Body.position;
                     allCollisions.push(coll);
                    createCollisionDetail(coll);
                }
                )
            );
        }
   }
    carImg.material = mat2;
    carImg.rotation.x = Math.PI / 2;//top down
    cardefX = 0.18,cardefY = 0.25,cardefZ = 0.1;
    carImg.scaling=  new BABYLON.Vector3(adjustsize(.18),adjustsize(.25), .1);
    actionInAnimation[index].Body = carImg;
    actionInAnimation[index].Body.parent = ground;
  }

  //==========================================================================//
/**
 * SECTION - Simulation Player: Play/Pause/Stop/Resume Simulation player
 */
  //==========================================================================//
var ReplayTimerVal = 0;
var totalActionsInAnimation = 0;
/**
 * Start simulation on Start Simulation Button Click in the timeline
 */
function startSimulation()
{
    reportConsoleLog("Simulation begin");
    timelineSlider.disabled = false;
    startSimulationButton.style.backgroundImage = pauseButtonImage;
    startSimulationButton.onclick = pauseSimulation;
    stopSimulationButton.disabled = false;
    if(!PathwasEdited){
        //play button pressed without changing the path
            if(wasPaused ){
                //resuming if was paused.
                wasPaused = false;
                replaySimulation = true;
                return;
            }
    }
  
    resetAllSimulation();
    allanimatedcars();
    preCalculatePath();
    timelineMaxDistance();
    replayTimelineAnimation();

}

function allanimatedcars(){
    actionInAnimation = [];
    totalActionsInAnimation =0;
    for(var actNumber=0; actNumber < allActions.length ; actNumber++){
        allActions[actNumber].myTimeLinePos = [];
        allActions[actNumber].myTimeLineRot = [];
        if(allActions[actNumber].pathIndex != null){
            console.log("push...")
            actionInAnimation.push(allActions[actNumber]);
        }
    }
    
    totalActionsInAnimation = actionInAnimation.length;
    //All cars in the scene start animating upon button click
    for(var j=0; j < totalActionsInAnimation ; j++){
        //Atleast one waypoint is enough to instantiate a car object on screen, 
        //it will act as starting and only position for that car
        if(actionInAnimation[j].Body == null){
            //creating visual object for each car
           createVisualCarObject(j);
       }
        placeCarsAtStartingPoint(j);
     }
}

/**
 * Stop the simualtion/Animation
 */
var wasPaused = false;
function stopSimulation()
{
    if(TotalCars <= 0){
        return;
    }
    reportConsoleLog("Simulation stopped");
     //some flags to allow animation and stop path making process
    replaySimulation = false;
    enableSimulationPlayer();
    resetAllSimulation();
}

/**
 * Pause the simualtion/animation
 */
function pauseSimulation()
{
    if(TotalCars <= 0){
        return;
    }
    wasPaused = true;
    if(replaySimulation){
        ReplayTimerVal = timelineDelta;
        replaySimulation = false;
    }
    enableSimulationPlayer();
}

/**
 * all cars finish their whole path in one go to have pre calculated path.
 * 
 */
var actionInAnimation = [];

function preCalculatePath(pathInd = null){
  //supporting arrays 
    var prevPos = [],
    traversedPath = [],
    startPoint = [],
    endPoint = [],
    direction = [],
    isreached = [],
    completedpath = [],
    currentWP = [],
    lastWP = [],
    timelineDelta = [],
    followingbodies = [];
    var totalcarthisPath = 0; 
    reachedcars = 0;

    for(var actNumber=0; actNumber < actionInAnimation.length ; actNumber++){
        var EB = createFollowingBody(new BABYLON.Vector3(allPaths[actionInAnimation[actNumber].pathIndex].pathwaypoints[0].x,0.2,allPaths[actionInAnimation[actNumber].pathIndex].pathwaypoints[0].z));
        followingbodies.push (EB);
        if((pathInd != null && actionInAnimation[actNumber].pathIndex == pathInd) || pathInd == null){
            //editing the path of this car...
            totalcarthisPath++;  
            //placeCarsAtStartingPoint(actNumber);
            followingbodies[actNumber].position.x = allPaths[actionInAnimation[actNumber].pathIndex].pathwaypoints[0].x;
            followingbodies[actNumber].position.y = 0.1;
            followingbodies[actNumber].position.z = allPaths[actionInAnimation[actNumber].pathIndex].pathwaypoints[0].z;
            allActions[actNumber].myTimeLinePos = [];
            allActions[actNumber].myTimeLineRot = [];
        }
        traversedPath.push(0);
        isreached.push(true);//by default : true
        completedpath.push(false);
        currentWP.push(0);
        timelineDelta.push(actionInAnimation[actNumber].starttime);
    }

   while(reachedcars < totalcarthisPath && actionInAnimation.length > 0){
   
       for(var actNumber=0; actNumber < actionInAnimation.length ; actNumber++){
            if(pathInd != null && actionInAnimation[actNumber].pathIndex != pathInd){
                continue;
            }
            var myPathInd = actionInAnimation[actNumber].pathIndex;
             if(traversedPath[actNumber] >=  actionInAnimation[actNumber].lastWaypointIndex ||
                 (currentWP[actNumber] + actionInAnimation[actNumber].wayPointProgresser) >= allPaths[myPathInd].pathwaypoints.length){
                     //this car has reached lastWaypointIndex
                     if(completedpath[actNumber]) continue;
                     completedpath[actNumber] = true;
                     reachedcars++;
                     continue;
             }
 
             if(isreached[actNumber]){//reached on waypoint...calculate for next...
                 startPoint[actNumber] =allPaths[myPathInd].pathwaypoints[currentWP[actNumber]];
                 endPoint[actNumber] = allPaths[myPathInd].pathwaypoints[currentWP[actNumber] + actionInAnimation[actNumber].wayPointProgresser];
                 
                 direction[actNumber] = endPoint[actNumber].subtract(startPoint[actNumber]); 
                 direction[actNumber].normalize();
                 isreached[actNumber] = false;
             }
             /**************Animation of Translation**********/
            // var prevDist = BABYLON.Vector3.Distance(actionInAnimation[actNumber].Body.position, endPoint[actNumber]);
           //  actionInAnimation[actNumber].Body.translate(direction[actNumber], actionInAnimation[actNumber].mySpeed/1000, BABYLON.Space.WORLD);
           //  actionInAnimation[actNumber].Body.position.y = 0.2;
           var prevDist = BABYLON.Vector3.Distance(followingbodies[actNumber].position, endPoint[actNumber]);
           followingbodies[actNumber].translate(direction[actNumber], actionInAnimation[actNumber].mySpeed/1000, BABYLON.Space.WORLD);
           followingbodies[actNumber].position.y = 0.2;
           var newDist = BABYLON.Vector3.Distance(followingbodies[actNumber].position,endPoint[actNumber]);
            
         //    var newDist = BABYLON.Vector3.Distance(actionInAnimation[actNumber].Body.position,endPoint[actNumber]);
             /**************Animation of Rotation**********/
             rotateCartoFaceForward(actNumber,direction[actNumber].normalize(),followingbodies);
             /**************Distance to next WP**********/
             if(prevDist <= newDist){
                 //approximatly on top of next wp
                 isreached[actNumber] = true;
                 currentWP[actNumber] += actionInAnimation[actNumber].wayPointProgresser;
             }
             if(prevPos[actNumber] != null){
                traversedPath[actNumber] += BABYLON.Vector3.Distance(prevPos[actNumber],followingbodies[actNumber].position);
               //  traversedPath[actNumber] += BABYLON.Vector3.Distance(prevPos[actNumber],actionInAnimation[actNumber].Body.position);
                 if(traversedPath[actNumber]>= actionInAnimation[actNumber].firstWaypointIndex && 
                     traversedPath[actNumber]<= actionInAnimation[actNumber].lastWaypointIndex){
                         timelineDelta[actNumber] += 1;
                         //limits of from-to, we start driving
                         updatePosNRot(actNumber, timelineDelta[actNumber],followingbodies);
                 }     
             }
             prevPos[actNumber] = followingbodies[actNumber].position;//actionInAnimation[actNumber].Body.position;
         }//EOF forloop
     
     }
     if(reachedcars >= totalActionsInAnimation){//if all cars reached their final waypoint
         wasPaused = false;
         reachedcars = 0;
         timelineDelta = [];
     }
 
     //now that we have traversed path..calculate speed etc
     for(var actNumber=0; actNumber < actionInAnimation.length ; actNumber++){
        if((pathInd != null && actionInAnimation[actNumber].pathIndex == pathInd) || pathInd == null){
             calculateDist_TraversedPath(actNumber);
            
        }
     }
}

function createFollowingBody(initialPosition){
    var EB = new BABYLON.Mesh("dummy");
    EB.parent = ground;
    EB.rotation.x = Math.PI / 2;
    EB.scaling=  new BABYLON.Vector3(adjustsize(.18),adjustsize(.25), .1);
    EB.position = initialPosition; 
    return EB;
}
/**
 * Replay the already recorded Simualtion
 * Whenever we play the animation this function plays as animation is prerecorded
 */
var replaySimulation = false;
function replayTimelineAnimation(){
    timelineDelta = ReplayTimerVal;
    replaySimulation = true;
    ReplayTimerVal = 0;
   
}

/**
 * Reset simulation process So that everything starts from initial point
 */
function resetAllSimulation(){
    wps = 0;
    reachedcars = 0;
    disposeeditableText();
    removeDraggingtrackline();
    previousWPArrow = null;
    previousImp = null;
    timelineSlider.value = "0";
    time.innerHTML = "Time: 0.00 sec";
    timelineDelta = 0;
    ReplayTimerVal = 0;
    //if was in process of making waypoints and pressed animation button
    wasPaused = false;
    PathwasEdited = false;
    replaySimulation = false;
    scene.hoverCursor = 'pointer';
    StartTrajectory = false;
    removeDonebutton();
    creatingPath = false;
    //remove cursor hover icon now, as there wont be waypoints made on click
   ground.actionManager.actions.splice(0, 1);
//enableZoomingCursor();
    //removing older bodies from the scene
    for(var j=0; j < totalActionsInAnimation ; j++){
        //Atleast one waypoint is enough to instantiate a car object on screen, 
        //it will act as starting and only position for that car
        if(actionInAnimation[j].Body != null){
            //creating visual object for each car
            actionInAnimation[j].Body.dispose();
            actionInAnimation[j].Body = null;
       }
     }

}
function roundUp(value,decimalPlaces){
 return parseFloat((value * 100) / 100).toFixed(decimalPlaces);
}
function timelineAnimation(){
    var tl_index = parseInt(timelineSlider.value);
    if(replaySimulation){
        //simulation was replaying and tried to move the slide
        timelineDelta = tl_index;
    } 
    for(var carN=0; carN < totalActionsInAnimation ; carN++){
        if(tl_index < actionInAnimation[carN].myTimeLinePos.length && 
            actionInAnimation[carN].myTimeLinePos[tl_index] != null){
                if(actionInAnimation[carN].Body == null){
                    createVisualCarObject(carN);
                }
                actionInAnimation[carN].Body.position =  actionInAnimation[carN].myTimeLinePos[tl_index];
                actionInAnimation[carN].Body.rotation =  actionInAnimation[carN].myTimeLineRot[tl_index];
        }
    }
   // time.innerHTML = "Time: "+ Math.round((tl_index/60) * 100) / 100+" sec" ;
   time.innerHTML = "Time: "+ roundUp(tl_index/60,2)  +" sec" ;
}

  //==========================================================================//

/**
 * MAximum timeline distance
 */
function timelineMaxDistance(recalculating = false){
    var maximumDistance = 0;
    for(var j=0; j < totalActionsInAnimation ; j++){
        console.log("totalActionsInAnimation", actionInAnimation[j].totaldistanceperSpeed);
        if(maximumDistance < actionInAnimation[j].totaldistanceperSpeed){
            maximumDistance = actionInAnimation[j].totaldistanceperSpeed;
        }
    }

    timelineSlider.max = ""+ Math.trunc(maximumDistance);
    console.log(maximumDistance);
    if(!recalculating){
        timelineDelta = 0;
        timelineSlider.value = 0;
    }
}
function placeCarsAtStartingPoint(index){
    /*----------------Position and Rotation of Car at Starting Waypoint-------------*/
    actionInAnimation[index].Body.position.x = allPaths[actionInAnimation[index].pathIndex].pathwaypoints[0].x;//allPaths[actionInAnimation[index].pathIndex].pathwaypoints[actionInAnimation[index].firstWaypointIndex].x;
    actionInAnimation[index].Body.position.y = 0.1;
    actionInAnimation[index].Body.position.z = allPaths[actionInAnimation[index].pathIndex].pathwaypoints[0].z;//allPaths[actionInAnimation[index].pathIndex].pathwaypoints[actionInAnimation[index].firstWaypointIndex].z;
    //actionInAnimation[index].mySpeed =  actionInAnimation[index].points[0].wpSpeed;
     //calculating path distance as vehicle will drive only portion of the path
     if(actionInAnimation[index].firstWaypointIndex >  actionInAnimation[index].lastWaypointIndex){
        //from higher index to lower in path array
        actionInAnimation[index].wayPointProgresser = -1;
    }else{
        actionInAnimation[index].wayPointProgresser = 1;
    }
    /*----------------End Position and Rotation of Car at Start---------------------*/
}

 //==========================================================================//
/**
 * SECTION - Coding Editor - styling and execution of code
 */
  //==========================================================================//

  function editorInitialization(){
   // document.getElementById("runcode").onclick = parseCodeFromCodeArea;

    CodeMirror.defineMode("codingMode", function() {
       
       return {
           startState: function() { 
           return {inSingleLineComment: false, inMultiLineComment: false } ; 
            },
           token: function(stream,state) {
               if(state.inSingleLineComment){
                    stream.skipToEnd();
                    state.inSingleLineComment = false; // Clear flag
                     return "mycomment";          // Token style
               }

               if(state.inMultiLineComment){
                    if(stream.skipTo('*/')){ // ending comment found on this line
                        stream.next();          // Skip quote
                        stream.next();          // Skip quote
                        state.inMultiLineComment = false; // Clear flag
                    }else{
                        stream.skipToEnd(); 
                    }
                  return "mycomment";          // Token style
               }
               //enable simulation button once user starts to write the code...
                if(startSimulationButton.disabled){
                    enableSimulationPlayer();
                }

               if (stream.match("path") || stream.match("vehicle") || stream.match("action")) {
                   return "mykeyword";
               } else if (stream.match("//")) {
                   state.inSingleLineComment = true;
                   return "mycomment";
               } else if ( stream.match("/*")) {
                    state.inMultiLineComment = true;
                    return "mycomment";
                } else if ( stream.match("=")) {
                    
                    return "specialcharacter";
                } else if ( stream.match("drives on") || stream.match("starting at time")  || stream.match("with speed") || stream.match("has color")
                 || stream.match("drives from") || stream.match("to")|| stream.match("sec")|| stream.match("km/h") || stream.match("speed") || stream.match("max acceleration") || stream.match("m/s^2")) {
                    
                    return "predefined";
                } 
               
               else if (stream.match("(") ||  stream.match(")") || stream.match("[") ||  stream.match("]")) {
                    return "mybrackets";
                }
                else {
                   stream.next();
                   return null;
               }
           }
       };
       
   });
   var minLines = 25;
var startingValue = '';
for (var i = 0; i < minLines; i++) {
    startingValue += '\n';
}

       codeArea = CodeMirror.fromTextArea(document.getElementById("myCodeArea"), {
           mode: "codingMode",
       lineNumbers: false,
       gutter: true
       });
       codeArea.setValue(startingValue);
}



  /**
   * parse the code written in coding area
   */
  function parseCodeFromCodeArea(){
    if(!PathwasEdited){
        //play button pressed without changing the path
            if(wasPaused ){
                startSimulation();
                return;
            }
    }
    
      if(OpenedGraphical){
        startSimulation();
        return;
      }else{
        

        var error = false;
        var text = codeArea.getValue().toString();
       
        try {
          PARSER.parse(text);
       } catch (err) {
          error = true;
          console.log(err);
          if (!err.hasOwnProperty('location')) throw(err);
          var startline = err.location.start.line;
          var startcol = err.location.start.column;
          var endline = err.location.end.line;
          var endcol =  err.location.end.column;
          reportConsoleLog(err.name +':\n Line ' + startline + ", column " + startcol + ": "+ err.message);
          console.log(codeArea.lineInfo({line: (startline - 1)}));
          codeArea.markText({line: (startline - 1), ch:(startcol - 1)}, {line: (endline), ch: 0} , {className: "error"});
   
        //  codeArea.markText({line: (startline - 1), ch:(startcol - 1)}, {line: err.location.end.line, ch: endcol},{className: "styled-background"});
        /*  reportConsoleLog('Error: ' + text.slice(err.location.start.offset-10,
              err.location.end.offset+10).replace(/\r/g, '\\r'));*/
       }
       //interprete if there is no error in parsing
      if(!error){
          DisposeOffOlderDatafromScene();
          var interpreter = new Interpreter(document.getElementById("consoleLogArea"));
          interpreter.evalExpression(
                  PARSER.parse(codeArea.getValue().toString())
              );
  
         
          startSimulation();
      }
      }
   

  }

  var textForCodingArea = "";
  function fillCode(){
      textForCodingArea = "";
    allPaths.forEach(element => {
        textForCodingArea += "path "+ element.P_name.replace(/\s/g,'') + " = [";
        element.pathwaypoints.forEach(wayps => {
           // textForCodingArea += "(" + ( wayps.x).toFixed(2) + "," + ( wayps.z ).toFixed(2)+ ")";
           textForCodingArea += "(" +  wayps.x + "," +  wayps.z + ")";
                });
                textForCodingArea += "]\n";
      });
    allCars.forEach(element => {
        textForCodingArea += "vehicle "+  element.myName.replace(/\s/g,'') + " = speed "+ element.maxSpeed  + "km/h max acceleration "+ element.maxAcceleration +"m/s\n";
    });

    allActions.forEach(element => {
      var  totalpathlength = completepathDistance(element.pathIndex);
        textForCodingArea += "action "+ element.myName.replace(/\s/g,'') + " = \n";
        if(element.carIndex != null){
            textForCodingArea +=  allCars[element.carIndex].myName.replace(/\s/g,'') ;
        }
        if(element.pathIndex != null){
            textForCodingArea += " drives on " + allPaths[element.pathIndex].P_name.replace(/\s/g,'') + "\n";
        
       
        textForCodingArea += " starting at time " + element.starttime/60 + "sec\n";
        textForCodingArea += " with speed " + element.mySpeed + "km/h\n";
        textForCodingArea += " has color (" + element.myColor.r * 255 + "," + element.myColor.r *255+ "," + element.myColor.b * 255 + ")\n";
        textForCodingArea += " drives from " + Math.trunc( (100 * element.firstWaypointIndex)/totalpathlength ) + "% to " + 
        Math.trunc(  (100 * element.lastWaypointIndex)/totalpathlength ) + "%";
        textForCodingArea += "\n";
        }
    });
    codeArea.setValue(textForCodingArea);
}


  //===============================================================================//

//===============================================================================//
/**
 * SECTION - GUI: Draw GUI on html page of application depending upon new changes
 */
//===============================================================================//

/**
 * On New Car Button click - Changes in html GUI
 */
function initialCarDetail(fillingDetails, carNumb = null){
    if(carNumb == null){
        carNumb = TotalCars -1; 
    }
    inner = CarsInner;
    var nameOfcar = "Car " + (carNumb + 1);
    if(fillingDetails){
        nameOfcar = allCars[carNumb].myName;
    }
    //putting car in the list
    listHierarchy("TrajectorySection"+carNumb,nameOfcar, inner,carNumb,true,true, "Car");

}


function actionDetails(fillingDetails,index){
    inner = ActionInner;
    var nameOfAct = "Action " + (index + 1);
    if(fillingDetails){
        nameOfAct = allActions[index].myName;
    }
    listHierarchy("ActSection"+index,nameOfAct, inner,TotalActions-1,true,true, "Action");


    //Action is always performed on a car.. So first we choose car
    var btn = listHierarchy(("Action"+index+0) ,"Vehicle ",inner,null,true,false,"");
    carOptionForAction(fillingDetails,index, btn);
  
    

    //Then we choose Path option
    btn = listHierarchy(("Action"+index+1),"drives on ",inner,null,true,false,"");

    PathoptionsForCar(fillingDetails,index,btn);
  
}

/**
 * On New path Button click - Changes in html GUI
 */
function pathDetail(fillingDetails,pathNumb = null){
    if(pathNumb == null){
      pathNumb = TotalPaths -1; 
    }
    var nameOfPath = "";
    if(fillingDetails){
        nameOfPath = allPaths[pathNumb].P_name;
    }else{
        nameOfPath = "Path " + (pathNumb +1);
        allPaths[pathNumb].P_name = nameOfPath;
    }
  
    inner = PathInner;
    listHierarchy("PathSection"+pathNumb,nameOfPath, inner,pathNumb,false,true, "Path");


    if(!fillingDetails){
        createDoneButton(PathInner);
    }
}

function removeDonebutton(){
    if(document.getElementById('Done')){
        var doneBtn = document.getElementById('Done');
        doneBtn.parentNode.removeChild(doneBtn);
    }
}
/**
 * done button for path or trajectory
 * @param {*} respectiveInner 
 */
function createDoneButton(respectiveInner){
    //remove previous done button
    removeDonebutton();

    var doneBtn=  document.createElement('button');
    doneBtn.classList.add('allbuttons');
    doneBtn.classList.add('doneWPButton');
    
    doneBtn.id = "Done";
    doneBtn.innerText = "Done";

    if(respectiveInner === PathInner){
        doneBtn.onclick = donePathWaypoints;
    }/*else{
        doneBtn.onclick = doneTrajectoryWaypoints;
    }*/
    respectiveInner.appendChild(doneBtn);

}
function createDoneNewTrajectoryBtns(fillingDetails){
   removeDonebutton();
    if(!fillingDetails){//when we read data from testscenario.json
        var doneBtn=  document.createElement('button');
        doneBtn.classList.add('allbuttons');
        doneBtn.classList.add('doneWPButton');
        
        doneBtn.id = "Done";
        doneBtn.innerText = "Done";
      //  doneBtn.onclick = doneWithWaypoints;
        allCarsInformationPanel.appendChild(doneBtn);
    }
    //append new car button below...
    if(allCarsInformationPanel.contains(doneWPButton)){
        allCarsInformationPanel.removeChild(doneWPButton);
    }
    allCarsInformationPanel.appendChild(doneWPButton);
}
/**
 * @param {*int} index {which car or path to create details for}
 * @param {*bool} isStartingWaypoint {first way point has different information}
 * @param {*float} Xposition {Xposition of waypoint}
 * @param {*float} Yposition {Yposition of waypoint}
 * @param {*float} Zposition {Zposition of waypoint}
 */
function createWayPointDetail(index, isStartingWaypoint, Xposition, Yposition,Zposition){
    //container will define which button is adding the way point
    //and buttons represent each car in scene
    var newContent2 = document.createElement("Label");
    var carInfo=  document.createElement("p");
    carInfo.classList.add("wpinformation");
    newContent2.classList.add("wpinformation");
    var contentToAdd = "";
    if(isStartingWaypoint){
        contentToAdd = "starts at (";
    }else{
        contentToAdd = "moves toward (";
    }
  /*  if(forTrajectory){
        contentToAdd +=  Math.trunc(Xposition) + "," + Math.trunc(Yposition) + "," +Math.trunc(Zposition) +")";
    }*/
    newContent2.innerHTML = contentToAdd;
    carInfo.appendChild(newContent2);
    //only path has editable waypoints
    createInput(index,(wps - 1),Math.trunc(Xposition),cameraMaxLeft,cameraMaxRight, "X",carInfo,false);
    // createInput(index,(wps - 1),Math.trunc(Yposition),0,0, "Y",carInfo,false);
    createInput(index,(wps - 1),Math.trunc(Zposition),cameraMaxBottom,cameraMaxTop, "Z",carInfo,false);
    inner.appendChild(carInfo);
}


function createCollisionDetail(collision){
    //container will define which button is adding the way point
    //and buttons represent each car in scene
   var pointOfCollision = collision.pointOfCollision;
    var carInfo=  document.createElement("p");
    carInfo.classList.add("wpinformation");

    var newContent2  = document.createElement("Label");
    newContent2.innerHTML ="Collision detected:\n";
    newContent2.classList.add("wpinformation");
    carInfo.appendChild(newContent2);

    newContent2  = document.createElement("Label");
    newContent2.innerHTML ="at point ("+ Math.trunc(pointOfCollision.x)+","+  Math.trunc(pointOfCollision.z)+")" +
   // Math.trunc(pointOfCollision.y )+ ","+  Math.trunc(pointOfCollision.z)+")" +
    "\n, at time: "+ Math.round((timelineSlider.value/60) * 100) / 100+" sec";
 newContent2.classList.add("wpinformation");

    carInfo.appendChild(newContent2);
    consoleLog.appendChild(carInfo);
}
/**
 * Simple text log to shoe in console
 * @param {*Text} logInfo 
 */
function reportConsoleLog(logInfo){

   var carInfo=  document.createElement("p");
    carInfo.classList.add("consoleinformation");

    var newContent2  = document.createElement("span");
    newContent2.innerText =logInfo;
  //  newContent2.classList.add("wpinformation");
    carInfo.appendChild(newContent2);


    consoleLog.appendChild(carInfo);
}

/**
 * creating whole path line along with new waypoints
 * @param {*} cc 
 * @param {*} pathadjusted 
 */
function createPathLine(cc,pathadjusted = false){
    PathwasEdited = pathadjusted;
    restartWayPointsforPath(cc);
    var totalWP = allPaths[cc].pathwaypoints.length;
    for(var pp = 0; pp<totalWP;pp++){
       //each wp of each car
       wps++;
        // we always make waypoints of current car
        //sphere to present a waypoint
        var tmp = new BABYLON.Vector3(allPaths[cc].pathwaypoints[pp].x,
          allPaths[cc].pathwaypoints[pp].y,allPaths[cc].pathwaypoints[pp].z);
          allPaths[cc].pathwaypoints[pp] = tmp;
          //sphere to present a waypoint..
          var impact = createWP(tmp,individualColors(cc+1),cc,"P_mesh_"+cc);
          impact = assignWPToPath(impact,tmp,cc,pp+1);
          impact.type = "P_mesh_"+cc;
          //sphere to present a waypoint..
          if(!pathadjusted || valuesChanged){
            // html GUI
            htmlForWaypoints(cc, tmp);
           
          }
        if(wps > 1){
                /*-----------------------Make Path between two impacts-------------------------*/
             drawLineBtwTwo(previousImp.position,impact.position,cc,wps - 2);

            /*-----------------------End Path------------------------------------------*/
        }
        previousImp = impact;
    }//Endof pp

   
  }
  function editPathLine(pathInd, wpInd,currentWPPosition){
    PathwasEdited = true;
       var prevWP = null;
       var nextWP = null;
       if(wpInd > 0){
            prevWP = wpInd - 1;
       }
       if(wpInd < allPaths[pathInd].pathwaypoints.length - 1){
            nextWP = wpInd + 1;
       }
    var allmeshes = [];
    var prevArr, nextArr;
    scene.meshes.forEach(element => {
        if(prevWP != null){
            if(element.type ==  ("P_mesh_"+pathInd+"_"+prevWP+"_"+wpInd)){
                allmeshes.push(element);
            }
            if(element.id == "arrow_"+pathInd+"_"+prevWP){
                prevArr = element;
            }
        }
        if(nextWP != null){
            if(element.type ==  ("P_mesh_"+pathInd+"_"+wpInd+"_"+nextWP)){
                allmeshes.push(element);
            }
            if(element.id == "arrow_"+pathInd+"_"+wpInd){
                nextArr = element;
            }
        }
       
    });
    for(var ee = 0;ee< allmeshes.length;ee++){
        allmeshes[ee].dispose();
    }

    if(prevWP != null){
        drawLineBtwTwo(allPaths[pathInd].pathwaypoints[prevWP],currentWPPosition,pathInd,wpInd - 1);
     //   rotateArrow(prevArr,allPaths[pathInd].pathwaypoints[prevWP],currentWPPosition);
    }
    if(nextWP != null){
        drawLineBtwTwo(currentWPPosition,allPaths[pathInd].pathwaypoints[nextWP],pathInd,wpInd);
     //   rotateArrow(nextArr,currentWPPosition,allPaths[pathInd].pathwaypoints[nextWP]);
    }

  }

function resizable (el, factor) {
    var int = Number(factor) || 7.7;
    function resize() {el.style.width = ((el.value.length+1) * int) + 'px'}
    var e = 'keyup,keypress,focus,blur,change'.split(',');
    for (var i in e) el.addEventListener(e[i],resize,false);
    resize();
  }
function createInput(id, name, currentval, minval,maxval,labelCaption, parent,isTrajectory){
    //input...
    if(currentval == "Paths" || currentval == "Cars"){
        return;
    }
    var input = document.createElement("input");
    if(labelCaption == "Path" || labelCaption == "Car" || labelCaption == "Action"){
       input.classList.add("names");
       input.type = "text";
    }else{
        input.type = "number";
        if(labelCaption == "at time " || labelCaption == "with speed "){
           // input.style.position = "absolute";
            input.style.minWidth = "170px";
            input.style.maxWidth = "170px";
            input.style.minHeight = "17px";
            input.style.maxHeight = "17px";
            input.style.marginLeft = "auto";
            input.style.marginRight = "2px";
            input.style.border= ".5px solid #3d434b";
        }else{
            input.classList.add("speedVal");
        }
    }
    input.classList.add("speedinformation"); // set the CSS class
    //Id of each input is = actnumber (important to change speed of wp later on)
    input.id = id;
    input.name = name;
    input.min = minval;
    input.max = maxval;
    input.value = currentval;
    //Allow editing
    input.addEventListener('change', function(evt) {
        if(input.type == "number"){
            this.value = Math.min(this.value,maxval);
            this.value = Math.max(this.value,minval);
        }
        editfromInputBoxes(this.id,this.name,this.value,labelCaption, minval,maxval, isTrajectory);
    });
    resizable(input,7);
    //helping lable
  /*  if(labelCaption == "Path" || labelCaption == "Car" || labelCaption == "Action"){
    }
    else if (labelCaption != "X" && labelCaption != "Y" &&  labelCaption != "Z"){
        var newlabel = document.createElement("Label");
        newlabel.classList.add("wpinformation");
        newlabel.setAttribute("for","speedVal");
        newlabel.innerHTML = labelCaption;
        parent.appendChild(newlabel);
    }

    if (labelCaption == "at time " || labelCaption == "with speed "){
        var newlabel = document.createElement("Label");
        newlabel.classList.add("wpinformation");
        newlabel.setAttribute("for","speedVal");
        newlabel.innerHTML = labelCaption;
        parent.appendChild(newlabel);
     
    }*/
  parent.appendChild(input);
  if (labelCaption == "X" || labelCaption == "Y" ||  labelCaption == "Z"){
    var newlabel = document.createElement("Label");
        newlabel.classList.add("wpinformation");
        newlabel.setAttribute("for","speedVal");
        if(labelCaption == "Z"){
            newlabel.innerHTML = ")";
        }else if (labelCaption == "X" ||labelCaption == "Y"){
            newlabel.innerHTML = ",";
        }
        parent.appendChild(newlabel);
    }
  return input;
}

function editfromInputBoxes(id,name,value,labelCaption, minval,maxval, isTrajectory){
    var index = parseInt(id);
    var WPNumb =parseInt(name);
    if(labelCaption == "Path")
    {
        allPaths[index].P_name = value;
        for(var acts = 0;acts < allActions.length; acts++){
            if(allActions[acts].pathIndex == index){
                 //all actions that have this car instance assigned...update new information abt car
                 document.getElementById("Action"+acts+"_select"+2).children[0].innerHTML = value;
            }
         }
        return;
    }
    if(labelCaption == "Car")
    {
        allCars[index].myName = value;
        for(var acts = 0;acts < allActions.length; acts++){
           if(allActions[acts].carIndex == index){
                //all actions that have this car instance assigned...update new information abt car
                document.getElementById("Action"+acts+"_select"+1).children[0].innerHTML = value;

           }
        }
        return;
    }
    if(labelCaption == "Action")
    {
        allActions[index].myName = value;
        return;
    }

    var num = parseInt(value, 10),
    min = minval,
    max = maxval;
    if (!integerCheckSum(num)) {
        this.value = "";
        return;
    }
    value = valueLimits(num,min,max);
    PathwasEdited = true;
    if(!isTrajectory){
        //position edited for path
        if(labelCaption == "X"){
            allPaths[index].pathwaypoints[WPNumb].x = parseInt(value);
        }
        if(labelCaption == "Y"){
            allPaths[index].pathwaypoints[WPNumb].y = parseInt(value);
        }
        if(labelCaption == "Z"){
            allPaths[index].pathwaypoints[WPNumb].z = parseInt(value);
        }
        //create new path line
       // createPathLine(index,true);
       editPathLine(index,WPNumb,allPaths[index].pathwaypoints[WPNumb]);
       scene.meshes.forEach(element => {
        if(element.id ==  (WPNumb + 1) && element.name == index){
            element.position = allPaths[index].pathwaypoints[WPNumb];
        }
    });

        //all actions in which cars are following this path need to adjust their distance calculation
        for(var actC = 0;actC < allActions.length; actC ++){
            if(allActions[actC].pathIndex == index){
                assignPathToCar(actC,index);
            }
        }

        return;
    }

    //Editing for trajectory
   if(labelCaption == "at time "){
        //subract this waypoint's speed as new one will be edited...
        allActions[index].totaldistanceperSpeed -= allActions[index].starttime;
        var newstartTime = parseInt(value) * 60;//convert in seconds
        allActions[index].starttime = newstartTime;
        //add new start time
        allActions[index].totaldistanceperSpeed +=(newstartTime);
        timelineMaxDistance();
        return;
   }
   if(labelCaption == "with speed ")
    {
        allActions[index].mySpeed =  parseInt(value);
      /*  for(var w =0;w<allCars[index].points.length - 1;w++){
            changespeedofThisWP(index,w,parseInt(value),true);
        }*/
    }
}

/**
 * Change speed of car Index at waypoint WPNumb with speed value "value"
 * 
 * @param {*} index 
 * @param {*} WPNumb 
 * @param {*} value 
 * @param {*} changeSpeed {true if we changed the speed, false when first time value}
 */
function changespeedofThisWP(index,WPNumb,value, changeSpeed){
    //speedcalculation
    allActions[index].mySpeed = value;
    //WPNumb = 0 means distance between 0 - 1, WPNumb = 1 means dist btw 1-2
    var distPerSpeed = allActions[index].DistanceToCoverPerWP[WPNumb]/value;
    distPerSpeed *= 1000;
    if(changeSpeed){
        //subract this waypoint's older speed because speed is changed
        allActions[index].totaldistanceperSpeed -=  allActions[index].SpeedPerWP[WPNumb];
    }

    allActions[index].SpeedPerWP[WPNumb] = distPerSpeed;
    //add new distance per speed.
    allActions[index].totaldistanceperSpeed +=distPerSpeed;
}
/**
 * Creating Camera and lights
 */
function createCamera_Light(){
    camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, 0), scene);
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA; 
    camera.setTarget(ground.position);
    defaultcameraViewFrustrum();
    //imp: camera is upside down by default...
    camera.rotation.z = Math.PI;

    camera.inertia = 0;
   camera.angularSensibility = 100000000;//stop rotating the camera
   camera.panningSensibility = 0;

  /* 
   $(window).bind('mousewheel DOMMouseScroll wheel MozMousePixelScroll', function(e){
    e.preventDefault()
    e.stopPropagation();
    if(lethargy.check(e) !== false) {
        // Do something with the scroll event
       
        console.log("inertial scroll");
    }else{
        console.log("manual scroll");
    }
});*/


  canvas.addEventListener("mousewheel", function (e) {
    e.preventDefault();
    e.stopPropagation();

    frustrum = e.wheelDelta < 0 ? -0.4 : 0.4;
    ComputeCameraView();
   // if(lethargy.check(e) != false) {
      
  //  }
        return false; 
    }, false);

    // This attaches the camera to the canvas
    camera.attachControl(canvas, false,false);

    //Initialyy false values
    StartTrajectory = false;

    //Light direction is directly down
    light = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -10, 0), scene);
    light.diffuse =  new BABYLON.Color3.White();
    light.specular = new BABYLON.Color3(0,0,0);
    light.groundColor = new BABYLON.Color3.White();
    light.intensity = 1;
    light.excludedMeshes.push(ground);

}

var Dragging = false;
var lastPX,LastPZ;
var meshUnderDrag;
var startingPoint = null;
function onPointerDown(pickresult,impactposition){

    disposeHoverLabel();
    if (!pickresult.pickedMesh.isPickable || pickresult.pickedMesh.name == "aCar"){
        return;
    }
    //take zoom in position
    ZoomingPosition = impactposition;
    // two dragg-able events: ground & waypoints
    if(pickresult.pickedMesh === ground){
        // Dragging the ground...
        Dragging = true;
        var P = scene.pick(scene.pointerX,scene.pointerY).pickedPoint;
        lastPX = P.x;
        LastPZ = P.z;
    }else{
        //dragging the waypoints
        meshUnderDrag = pickresult.pickedMesh;
        startingPoint = pickresult.pickedPoint;
        disposeeditableText();
    }
}
function onPointerUp(){
    disposeHoverLabel();
   // removeDraggingtrackline();
    //draging ground
    if (Dragging) {
        //stop dragging the ground
        Dragging = false;
    }
    //dragging the waypoint
    if(startingPoint && indexNUMB != null && WPNUMB != null){
    //stop dragging the waypoint
        startingPoint = null;
        allPaths[indexNUMB].pathwaypoints[WPNUMB] = new BABYLON.Vector3(XVAL,YVAL,ZVAL);
        pathDetail(true, indexNUMB);
      //  editPathLine(indexNUMB,WPNUMB,new BABYLON.Vector3(XVAL,YVAL,ZVAL));
        wps = 0;
        var totalWP = allPaths[indexNUMB].pathwaypoints.length;
        for(var pp = 0; pp<totalWP;pp++){
            //each wp of each car
            wps++;
            // we always make waypoints of current car
            //sphere to present a waypoint
            var tmp = new BABYLON.Vector3(allPaths[indexNUMB].pathwaypoints[pp].x,
                allPaths[indexNUMB].pathwaypoints[pp].y,allPaths[indexNUMB].pathwaypoints[pp].z);
                allPaths[indexNUMB].pathwaypoints[pp] = tmp;
                // html GUI
                htmlForWaypoints(indexNUMB, tmp);
        }
      //  createPathLine(indexNUMB,true);
        //this path is edited now.. 
        //if cars were following this path...they need to adapt..

        for(var actC = 0;actC < allActions.length; actC ++){
            if(allActions[actC].pathIndex == indexNUMB){
                wps = 0;
                var prevPos;
                allPaths[indexNUMB].pathwaypoints.forEach(waypoint => {
                    wps++;
                    var newwp = new WayPoint();
                    newwp.wpSpeed = 30;//default speed 30
                    //new distances for new pathx
                    if(wps > 1){
                        calculateDist_WPs(prevPos,waypoint,actC, wps - 2);
                    }
                    prevPos = waypoint;
                    
                });
                var first,last;
                if(allActions[actC].lastWaypointIndex == null){
                    //by default each action has first waypoint of path as starting waypoint 
                    //and last waypoint of path as last waypoint
                    first = 0;
                    last = 100;
                }else{
                    first =  $( "#slider-range"+actC ).slider( "values", 0 );
                    last = $( "#slider-range"+actC ).slider( "values", 1 );
                }
                calculateCompleteActionPathDistance(actC, first, last);
            }
        }
        preCalculatePath(indexNUMB);
        timelineMaxDistance(true);
        valuesChanged = false;
        PathwasEdited = false;
    }
}

function onPointerMove(){

    //dragging the ground
    if(Dragging){
        //dragging the ground
        if(scene.pick(scene.pointerX,scene.pointerY).pickedPoint != null){
            var current = scene.pick(scene.pointerX,scene.pointerY).pickedPoint;
            var diff = current.subtract(new BABYLON.Vector3(lastPX,0,LastPZ));
            ground.moveWithCollisions(diff);
            ground.position.y = 0;
            lastPX = current.x;
            LastPZ = current.z;
            var rest =  cameraBoundaryRestriction();
            if(rest){
                scene.defaultCursor = 'none';
            }
        }else{
            Dragging = false;
        }
        return;
    }else{
        scene.defaultCursor = '';
    }

//dragging the waypoint
    if (!startingPoint) {
        return;
    }
  
      var current = scene.pick(scene.pointerX,scene.pointerY).pickedPoint;

      if (!meshUnderDrag || current == null) {
        return;
      }

      var diff = current.subtract(startingPoint);
      meshUnderDrag.moveWithCollisions(diff);
      meshUnderDrag.position.y = 0;
      //arrange path now based on new waypoint position...
        valuesChanged = true;
        var xVal = valueLimits(meshUnderDrag.position.x,cameraMaxLeft,cameraMaxRight);
        var yVal= 0;
        yVal = valueLimits(yVal,0,0);
        var zVal = valueLimits(meshUnderDrag.position.z,cameraMaxBottom,cameraMaxTop);
        XVAL = parseFloat( xVal.toFixed(2));
        YVAL = 0;//yVal.toFixed(2); 
        ZVAL = parseFloat(zVal.toFixed(2));
        startingPoint = current;
        indexNUMB = parseInt(meshUnderDrag.name);
        WPNUMB = parseInt(meshUnderDrag.id) - 1;
       
        editPathLine(indexNUMB,WPNUMB,new BABYLON.Vector3(XVAL,YVAL,ZVAL));
    

            //waypoint belongs to the path
            /*
            if(WPNUMB > 0){
                if(WPNUMB < (allPaths[indexNUMB].pathwaypoints.length -1)){
                    //need two draggind paths
                    updatedraggingPathLine(allPaths[indexNUMB].pathwaypoints[WPNUMB -1], meshUnderDrag.position ,allPaths[indexNUMB].pathwaypoints[WPNUMB +1],indexNUMB);
                }else{
                    updatedraggingPathLine(allPaths[indexNUMB].pathwaypoints[WPNUMB -1],meshUnderDrag.position, null,indexNUMB);
                }
            }else if(allPaths[indexNUMB].pathwaypoints.length > 1){
                updatedraggingPathLine(meshUnderDrag.position,allPaths[indexNUMB].pathwaypoints[WPNUMB + 1],null,indexNUMB);
            }*/
}

// Compute camera view
function ComputeCameraView () {
    var ratio = (cameraMaxRight + (0-cameraMaxLeft))/(cameraMaxTop + (0 - cameraMaxBottom));
    camera.orthoLeft += ratio * frustrum / 2;
    camera.orthoRight -= ratio * frustrum / 2;
    camera.orthoTop -= frustrum / 2;
    camera.orthoBottom += frustrum / 2;
   
    if(camera.orthoLeft >= cameraMinLeft  || camera.orthoRight <= cameraMinRight || camera.orthoBottom >= cameraMinBottom || camera.orthoTop <= cameraMinTop){
       //no more zooming in
       minimumcameraViewFrustrum();
    }
    if(camera.orthoLeft < cameraMaxLeft|| camera.orthoRight > cameraMaxRight  || camera.orthoBottom < cameraMaxBottom || camera.orthoTop > cameraMaxTop){
        //no more zooming out
        defaultcameraViewFrustrum();
     }
     zoomWhereMouseis();
     
    //background should always fit in camera view. imp when zoom out and bg was moved to the corner
  // cameraBoundaryRestriction();
    resizing3delements();
}
function zoomWhereMouseis(){
    if(ZoomingPosition == null){
        return;
    }

    if( ZoomingPosition.x > 0){
        if(ZoomingPosition.x + camera.orthoRight > cameraMaxRight){
            ground.position.x =   camera.orthoRight - cameraMaxRight;
        }
   }

   if(ZoomingPosition.x < 0){
        if(ZoomingPosition.x + camera.orthoLeft < cameraMaxLeft){
            ground.position.x =   camera.orthoLeft - cameraMaxLeft;
        }
    }

   if(ZoomingPosition.z >0){
        if(ZoomingPosition.z + camera.orthoTop > cameraMaxTop){
            ground.position.z =  camera.orthoTop - cameraMaxTop;
        }
    }

    if( ZoomingPosition.z < 0){
        if(ZoomingPosition.z + camera.orthoBottom < cameraMaxBottom){
            ground.position.z =  camera.orthoBottom - cameraMaxBottom;
        }
    }
}
/**
 * Resizing 3D elements in scene w.r.t camera zoom in/out
 */
function resizing3delements(){
    scene.meshes.forEach(element => {
        // if(element.id != "Astaground" ){
            var nn = ""+element.name;
         if(element.state == "zoomable" ){
             var defX = 1,defY = 1,defZ = 1;
             if(nn.includes("aCar")){
                 defX = cardefX;
                 defY = cardefY;
                 defZ = cardefZ;
             }
             else if(nn.includes("arrow")){
                 defX = arrowdefX;
                 defY = arrowdefY;
                 defZ = arrowdefZ;
             }else if(nn.includes("tube")){
              //   console.log(adjustsize(0.2));
          //     BABYLON.MeshBuilder.CreateTube("tube", {path: element.id , radius: adjustsize(0.2),instance: element});     
          element.scaling = new BABYLON.Vector3(1,
            1,adjustsize(.4)); 
          return;
            }
             else{
                 defX = wpdefX;
                 defY = wpdefY;
                 defZ = wpdefZ;
                // BABYLON.MeshBuilder.CreateDisc("WP", {radius: adjustsize(0.8), arc: 1, tessellation: 12, instance: element});
                }
 
            element.scaling = new BABYLON.Vector3(adjustsize(defX),
            adjustsize(defY),0.1);
         }
     });
}

function minimumcameraViewFrustrum(){
    camera.orthoTop = cameraMinTop;
    camera.orthoBottom = cameraMinBottom;
    camera.orthoLeft = cameraMinLeft;
    camera.orthoRight = cameraMinRight;
}

function defaultcameraViewFrustrum(){
    camera.orthoTop = cameraMaxTop;
    camera.orthoBottom = cameraMaxBottom;
    camera.orthoLeft = cameraMaxLeft;
    camera.orthoRight = cameraMaxRight;
}
/**
 * Create AstaZero Map background
 */
function createAstaGround(){
    ground = BABYLON.Mesh.CreateGround("Astaground", 125, 71, 0, scene,false,false);
    ground.background = true;
    ground.isPickable = true; 
    ground.position = new BABYLON.Vector3(0,0,0);//new BABYLON.Vector3(0,0,-4);
    //Play around values 25 25 25 to fit to size of scene
    var groundMaterial = new BABYLON.StandardMaterial("groundmat", scene);
    groundMaterial.emissiveTexture = new BABYLON.Texture(AstaGroundTrack, scene);
    groundMaterial.emissiveTexture.uScale = 1; //you could try changin this and below value to see replicated image 
    groundMaterial.emissiveTexture.vScale = 1;
    groundMaterial.emissiveTexture.level = 1;
    ground.material = groundMaterial;
    ground.actionManager  = new BABYLON.ActionManager(scene);	 
    ground.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger:  BABYLON.ActionManager.OnPickDownTrigger,
            },
            function(){
                if(!creatingPath){
                    Dragging = true;
                    var P = scene.pick(scene.pointerX,scene.pointerY).pickedPoint;
                    lastPX = P.x;
                    LastPZ = P.z;
                }
            }
        )
    );
   
    enableZoomingCursor();
}

function cameraBoundaryRestriction(){
//when camera is not zoomed in at all, no dragging is allowed
var ristricting = false;
    if(camera.orthoRight == 125/2){
      //  camera.position.x = 0;
       // camera.position.z = 0.001;
        ground.position.x = 0;
        ground.position.z =0;
        return true;
    }

    if( ground.position.x + camera.orthoRight > cameraMaxRight){
        //restrict
        ground.position.x = (cameraMaxRight - camera.orthoRight);
        ristricting = true;
    }
    else if(ground.position.x + camera.orthoLeft < cameraMaxLeft){
        //restrict
        ground.position.x = (cameraMaxLeft + (0 - camera.orthoLeft));
        ristricting = true;
    }
    if( ground.position.z + camera.orthoTop > cameraMaxTop){
        //restrict
        ground.position.z = (cameraMaxTop - camera.orthoTop);
        ristricting = true;
    }
    else if( ground.position.z + camera.orthoBottom < cameraMaxBottom){
        //restrict
        ground.position.z = (cameraMaxBottom + (0 - camera.orthoBottom));
        ristricting = true;
    }
    return ristricting;
}


/**
 * Individual color for each car and its waypoints
 */
function individualColors(index = null)
{
   
    var newcolor;
    if(index == null){
        index = TotalCars;
    }
    switch(index){
        case 1:
            newcolor = new  BABYLON.Color3.Red();  
        break;
        case 2:
            newcolor = new  BABYLON.Color3.Blue();
        break;
        case 3:
            newcolor = new  BABYLON.Color3.Green();
        break;
        case 4:
            newcolor = new  BABYLON.Color3.Yellow();
        break;
        case 5:
            newcolor = new  BABYLON.Color3.Magenta();
        break;
        case 6:
            newcolor = new  BABYLON.Color3.Teal();
        break;
        case 7:
            newcolor = new  BABYLON.Color3.Purple();
        break;
        default:
            newcolor = new  BABYLON.Color3.Random();
    }
    return newcolor;
   
}

/**
 * When the window resizes, adjust the engine size
 */
function onWindowResize() {
    engine.resize();
}

/**
 * create skybox in background. We may need this when we convert to 3D
 */
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
//===============================================================================//
/**
 * SECTION - SAVING/LOADING TEST SCENARIOS: Locally and Remotly
 */
//===============================================================================//

/**
 * Gets called from index.html on button "Save Test Scenario" click 
 */
function SaveTestScenario() {
    //just in case we were in middle of making waypoints
    donePathWaypoints();
    var jsonDataToSave = new AllJSONData();
    var cc = 0;
    allPaths.forEach(path => {
        copyDataToJSON(jsonDataToSave,cc++, path,"Path");
    });
    cc= 0;
    allCars.forEach(car => {
        copyDataToJSON(jsonDataToSave,cc++, car,"Car");
       
    });
    cc = 0;
    allActions.forEach(action => {
        copyDataToJSON(jsonDataToSave,cc++, action,"Action");

    });
 
    reportConsoleLog("Saved test scenario");
    return jsonDataToSave;
}

function SaveTestScenario_Json(jsonDataToSave){
    // saving scenario
    var jsonDataToSave = SaveTestScenario();
    testFileName.innerText = document.getElementById("TestName").value;
     window.sceneNS.savetestScenarios(jsonDataToSave, document.getElementById("TestName").value + ".json");
}
/**
 * Gets called from index.html on button "Save Test Scenario" click 
 */
function SaveTestScenario_database() {
    var jsonDataToSave =SaveTestScenario();
    var nameOfFile = document.getElementById("TestName").value;
    testFileName.innerText = document.getElementById("TestName").value;
    if(nameOfFile == ""){
        nameOfFile = "testscenario";
    }
    if(fileAlreadyExist(nameOfFile)){
        nameOfFile = uniqueName(nameOfFile);
    }
    jsonDataToSave.testName = nameOfFile;
    var Jdata = JSON.stringify(jsonDataToSave);
   saveDataToCloud(Jdata);//amazon
}

function saveDataToCloud(Jdata)
{
    var request = new XMLHttpRequest();
    // POST to httpbin which returns the POST data as JSON
    //http://localhost:3000/saveTestScenario
    request.open('POST', 'https://testingsimulation.herokuapp.com/saveTestScenario', /* async = */ true);
  // request.open('POST', 'https://testingsimulation.herokuapp.com/uploadTestScenario', /* async = */ true);
    
  //request.open('POST', 'http://localhost:3000/uploadTestScenario', /* async = */ true);
    
    request.setRequestHeader("Content-Type", "application/json");

    request.onreadystatechange = function() { // Call a function when the state changes.
        if (request.readyState === 4){   //if complete
            if(this.readyState === XMLHttpRequest.DONE && this.status === 200){  //check if "OK" (200)
                //success//data from saved test scenario
            } else {
                databaseConnectivityError(true); //otherwise, some other code was returned
            }
        }
    }
    request.send(Jdata);
}

/**
 * when user press on filename that is on cloud to load the data
 */
function getDataFromCloud(targetfileName)
{
    //getallTestScenarios
    var request = new XMLHttpRequest();
    // POST to http, which returns the POST data as JSON
    //
    request.open('POST', 'https://testingsimulation.herokuapp.com/loadTestScenario', /* async = */ true);
    request.setRequestHeader("Content-Type", "application/json");

    request.onreadystatechange = function() { // Call a function when the state changes.
        if (request.readyState === 4){   //if complete
            if(this.readyState === XMLHttpRequest.DONE && this.status === 200){  //check if "OK" (200)
                //success//data from saved test scenario
                var alldata = JSON.parse(this.response);
               window.sceneNS.allSavedData (alldata);
                databaseNotificationTag.innerHTML = "";
            } else {
                databaseConnectivityError(); //otherwise, some other code was returned
            }
        } 
    }
    var appState = {
        fileName: targetfileName//"testscenario"
      };
      var jData = JSON.stringify(appState);
      request.send(jData);
}
var allFilesOnCloud = [];
function listOfFiles(allFiles){
   
    var parentdiv = document.getElementById("listOfFiles");
    allFiles.forEach(element => {
        if(!fileAlreadyExist(element.split('.json')[0])){
            var p = document.createElement('p');
            p.classList.add('speedinformation');
            p.classList.add('filesOnserver');
            p.innerText = element.split('.json')[0];
            p.onclick = function () {
                var modal = document.getElementById('myModal');
                modal.style.display = "none";
                //load this test scenario
                getDataFromCloud(element.split('.json')[0]);
            
            };
            parentdiv.appendChild(p);
            allFilesOnCloud.push(element.split('.json')[0]);
    }
    });
}
function fileAlreadyExist(fName){
    var containeFile = false;
    allFilesOnCloud.forEach(thisfile => {
        if(thisfile == fName){
            //we have this file in list already
            containeFile = true;
        }
    });
    return containeFile;
}

function uniqueName(fName){
    var numberOfSameNames = 0;
    allFilesOnCloud.forEach(thisfile => {
        if(thisfile.includes(fName)){
            //we have this file in list already
            numberOfSameNames ++;
        }
    });
    var UName = fName;
    if(numberOfSameNames > 0){
        UName += " (" + numberOfSameNames + ")";
    }
    return UName;
}
var databaseNotificationTag;
function databaseConnectivityError(alertMe = false){
    if(alertMe){
        alert("Database connectivity error. Could not save file!");
    }else{
        databaseNotificationTag.innerHTML = "Database connectivity error!";
    }
}
/**
 * Gets called from index.html on button "Load Test Scenario" click 
 */
function loadAllTestsFromCloud(){
    clearOldData();
     var request = new XMLHttpRequest();
     // POST to httpbin which returns the POST data as JSON
     //http://localhost:3000/getallTestScenarios
     request.open('GET', 'https://testingsimulation.herokuapp.com/getallTestScenarios', /* async = */ true);
     request.setRequestHeader("Content-Type", "application/json");
 
     request.onreadystatechange = function() { // Call a function when the state changes.
        if (request.readyState === 4){   //if complete
            if(this.readyState === XMLHttpRequest.DONE && this.status === 200){  //check if "OK" (200)
                //success//data from saved test scenario
                listOfFiles(JSON.parse(this.response));
                databaseNotificationTag.innerHTML = "";
            } else {
                databaseConnectivityError(); //otherwise, some other code was returned
            }
        }
     }
       request.send();
}

/**
 * Gets called from index.html on button "Load Test Scenario" click 
 */
function LoadTestScenario_Json(event) { 
    document.getElementById('myModal').style.display = "none";
    clearOldData();
    window.sceneNS.loadtestScenarios(event);
}

/**
 * Gets called from index.html on button "Load Test Scenario" click 
 */
function clearOldData() { 
    //just in case we were in middle of making waypoints
    donePathWaypoints();
    //disposing older values in scene in order to load new data...
    DisposeOffOlderDatafromScene();
}


window.sceneNS.allSavedData = 
function allSavedData(alldata) {
    reportConsoleLog("Imported test scenario");
   
    var importedjsonData = new AllJSONData();
    importedjsonData = alldata;
    testFileName.innerText = importedjsonData.testName;
    var importedpaths = importedjsonData.paths;
    var importedcars = importedjsonData.cars;
    var importedactions = importedjsonData.actions;

    TotalPaths = 0;
    importedpaths.forEach(path => {
       //create this  path
       window.sceneNS.addPath (path);
    });
    inner = CarsInner;
    TotalCars = 0;
    importedcars.forEach(car => {
        //create this  car
       emptyCarObject(TotalCars,car.myName);
       TotalCars++;
      // copying by reference
      copyObject(allCars,TotalCars - 1,car);
       //interface (html) detail of path
       initialCarDetail(true, TotalCars - 1);
     });
   var allowSim = false;
     importedactions.forEach(action => {
        //create this  action
        TotalActions++;
        allActions[TotalActions - 1] = action;
        actionDetails(true,TotalActions - 1);
        if(action.carIndex != null && action.pathIndex != null){
            allowSim = true;
        }
     });
     //enable simulation only if any action has path and car assigned...

   if(allowSim){
    enableSimulationPlayer();
   }

}

function  copyObject(thisObject,index,targetObject,foraction = false){
    if(foraction){
        thisObject[index] = new Action();
        thisObject[index].myName = targetObject.myName;
        thisObject[index].carIndex = targetObject.carIndex;
        thisObject[index].pathIndex = targetObject.pathIndex;
        thisObject[index].mySpeed = targetObject.mySpeed;
        thisObject[index].TotalWapoints = targetObject.TotalWapoints;
        thisObject[index].starttime = targetObject.starttime;
        thisObject[index].firstWaypointIndex = targetObject.firstWaypointIndex;
        thisObject[index].lastWaypointIndex = targetObject.lastWaypointIndex;
        thisObject[index].myColor = targetObject.myColor; //Each car will have different color
        thisObject[index].traversedPathLength = targetObject.traversedPathLength;
    }else{
        thisObject[index] = new Car();
        thisObject[index].myName = targetObject.myName;
    }
}

function copyDataToJSON(jsonDataToSave,index, targetObject,mtype){
    switch(mtype){
        case "Path":
        jsonDataToSave.paths[index] = new Path();
        jsonDataToSave.paths[index].P_name = targetObject.P_name;
        jsonDataToSave.paths[index].pathwaypoints = targetObject.pathwaypoints;
        break;
        case "Car":
          //copying by reference
        copyObject(jsonDataToSave.cars,index,targetObject);
        break;
        case "Action":
        //copying by reference
        copyObject(jsonDataToSave.actions,index,targetObject,true);
        break;

    }
}
//===============  SECTION END - SAVING/LOADING TEST SCENARIOS   =========================//

/**
 * 
 */
function  htmlForWaypoints(index, posVector){
    if(wps == 1){
        createWayPointDetail(index,true,posVector.x,posVector.y,posVector.z);
    }else{
        createWayPointDetail(index,false,posVector.x,posVector.y,posVector.z);
    }
}
/**
 * File Menu > New Test Scenrio
 */
function NewTestScenario(){ 
    window.location.reload();
}
/**
 * Removing html element from scene
 */
function DisposeOffOlderDatafromScene(){
   
    replaySimulation=false;
    timelineDelta = 0;
    ReplayTimerVal = 0;
    timelineSlider.value = "0";
    time.innerHTML ="Time: 0.00 sec";
    StartTrajectory = false;
    totalActionsInAnimation = 0;
    reachedcars = 0;
    disposeeditableText();
    timelineSlider.disabled = true;
    restartTrajectoryWayPoints();
    //from left panel..
     for(var ch = 0; ch< TotalPaths;ch++){
        PathInner.removeChild(document.getElementById("PathSection"+ch));
    }
     for(var ch = 0; ch< TotalCars;ch++){
        CarsInner.removeChild(document.getElementById("TrajectorySection"+ch));
     }
     for(var ch = 0; ch< TotalActions;ch++){
        ActionInner.removeChild(document.getElementById("ActSection"+ch));
    }
    for(var ii = 0;ii< TotalCars;ii++)
    {
        delete  allCars[ii];
    }

    for(var ii = 0;ii< TotalActions;ii++)
    {
        delete  allActions[ii];
    }

    for(var ii = 0;ii< TotalPaths;ii++)
    {
        delete  allPaths[ii];
    }

    allCars = [];
    allActions = [];
    allPaths = [];
    TotalCars = 0;
    TotalPaths = 0;
    TotalActions = 0;

    actionInAnimation = [];
    var allmeshes = [];
    scene.meshes.forEach(element => {
        if(element.name == "Astaground" ){
        } else{
            allmeshes.push(element);
        }
    });
    var totalch = allmeshes.length;
    for(var ee = 0;ee< totalch;ee++){
        allmeshes[ee].dispose();
        allmeshes[ee] = null;
    }
}

/**
 * Resetting variables to start making waypoints for each trajectory/Path
 */
function restartTrajectoryWayPoints(cc = null){
    wps = 0;
    previousWPArrow = null;
    previousImp = null;
    if(cc == null){
        return;
    }
    allActions[cc].totaldistanceperSpeed = allActions[cc].starttime;
    var allmeshes = [];
    scene.meshes.forEach(element => {
        if(element.type ==  ("T_mesh_"+cc)){
            allmeshes.push(element);
        }
    });

    for(var ee = 0;ee< allmeshes.length;ee++){
        allmeshes[ee].dispose();
    }
}

/**
 * Resetting variables to start making waypoints for each path 
 */
function restartWayPointsforPath(cc = null){
    wps = 0;
    previousWPArrow = null;
    previousImp = null;
    if(cc == null){
        return;
    }
    var allmeshes = [];
    scene.meshes.forEach(element => {
        if(element.type ==  ("P_mesh_"+cc)){
            allmeshes.push(element);
        }
    });
    for(var ee = 0;ee< allmeshes.length;ee++){
        allmeshes[ee].dispose();
    }
}

/**
 * dragging line behind mouse while making the waypoints.
 */
var track = null;
var secondTrack = null; //when two dragging paths are needed
var ZoomingPosition = new BABYLON.Vector3(0,0,0);
window.addEventListener("mousemove", function () {
    if(scene == null){
        return;
    }
    var pointerPosition = scene.pick(scene.pointerX, scene.pointerY).pickedPoint;
    var impactposition = getDummyObjectPosition(pointerPosition);
    if(creatingPath && previousImp != null){
        draggingpath(previousImp.position,impactposition,TotalPaths - 1);
        return;

    }
    if(StartTrajectory && wps >= 1){//if we are placing the waypoints
        draggingpath(previousImp.position,impactposition,TotalCars - 1);
    }
});

/**
 * dragging line behind mouse while making the waypoints.
 * @param {*} previousImpposition  
 * @param {*} impactposition 
 * @param {*} index 
 * @param {*} twotracks 
 */
function draggingpath(previousImpposition,impactposition, index, twotracks = false){
       // pointerPosition.y = -10;
        if(scene.pick(scene.pointerX, scene.pointerY).pickedPoint == null){
            console.log("Cursor is outside the scene");
            return;
        }
        //Draw the line between previous impact and cursor position
        /*-----------------------Start Path------------------------------------------*/
        var trackPs = [];
        trackPs.push(previousImpposition);
        trackPs.push(impactposition);
        if(twotracks){
            if(secondTrack != null){
                // updates the existing instance of lines : no need for the parameter scene here
                secondTrack = BABYLON.MeshBuilder.CreateDashedLines("lines", {points: trackPs ,instance: secondTrack, dashNb:20});          
           }else{
              //creates lines
              secondTrack = BABYLON.MeshBuilder.CreateDashedLines("lines", {points: trackPs , updatable: true , dashNb:20}, scene);
            }
            secondTrack.color = allPaths[index].myColor;//individualColors(index + 1);
            secondTrack.parent = ground;
        }else{
            if(track != null){
                // updates the existing instance of lines : no need for the parameter scene here
                //dashed lines look more cool when updating the path     
            track = BABYLON.MeshBuilder.CreateDashedLines("lines", {points: trackPs ,instance: track,  dashNb:20});       
           }else{
              //creates lines
           track = BABYLON.MeshBuilder.CreateDashedLines("lines", {points: trackPs , updatable: true , dashNb:20}, scene);
          }
        track.color = allPaths[index].myColor; //individualColors(index + 1);
          track.parent = ground;
       
        }
        /*-----------------------End Path------------------------------------------*/

}
/**
 * for absolute position of pointer we need to place dummy object there
 * @param {*} pointerPosition position of mouse pointer on screen
 */
function getDummyObjectPosition(pointerPosition){
    var impact = new BABYLON.Mesh("dummy");
    impact.parent = ground;
    impact.setAbsolutePosition(pointerPosition);
    var positionToSend = impact.position;
    impact.dispose();
    return positionToSend;
}

var onOutWP =(meshEvent)=>{
    disposeHoverLabel();
};
function disposeHoverLabel(){
    if(WPPosLabel!= null){
        WPPosLabel.dispose();
        WPPosLabel = null;
    } 
}

function disposeeditableText(){
    if(WPPosText!= null){
        WPPosText.dispose();
        WPPosText = null;
    }
  
}

var createCarLabel = function(index) {
 disposeeditableText();
    disposeHoverLabel();
    //I can show any info needed here
    var label = rectangleForInfo("Car Detials");
    label.height = "60px";
    label.width = "130px";
    var text1 = new BABYLON.GUI.TextBlock();
    WPPosLabel = label;
  
    text1.text =allCars[actionInAnimation[index].carIndex].myName + "\n Position ("+ (actionInAnimation[index].Body.position.x).toFixed(2) +","+ (actionInAnimation[index].Body.position.z ).toFixed(2)+") "+
    // + Math.trunc(actionInAnimation[index].Body.position.y)+ ","+ Math.trunc(actionInAnimation[index].Body.position.z )+") "+
    "\n Speed "+ actionInAnimation[index].mySpeed;
    text1.color = "white";
    text1.resizeToFit = true;
    text1.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text1.fontSize = "14px";

  //  label.width = "180px";
    label.addControl(text1);  
    return label;
}

var WPPosLabel = null;
var WPPosText = null;
var valuesChanged = false;
var XVAL,YVAL,ZVAL, SPEEDVAL, indexNUMB,WPNUMB;
/**
 * 
 * @param {*} caption Text to be shown e.g. position:speed
 * @param {*} carNumb 
 * @param {*} wpNumb 
 * @param {*} editable is editable or not
 */
var createLabel = function(caption,carNumb,wpNumb,editable,forTrajectory) {
    var xVal= Math.trunc(caption.x) ;
    var yVal= Math.trunc(caption.y) ;
    var zVal= Math.trunc(caption.z) ;
    var label = rectangleForInfo("Waypoint Details");
    var text1 ;
    disposeHoverLabel();
    disposeeditableText();
    if(editable){
        text1 = new BABYLON.GUI.InputText();
        WPPosText = label;
       text1.onTextChangedObservable.add(function() { 
           valuesChanged = true;
            var newvals = text1.text;
            var coords = newvals.split(",");
            xVal= parseInt(coords[0]);
            if(!integerCheckSum(xVal)){
                valuesChanged = false;
                return;
            }
            xVal = valueLimits(xVal,cameraMaxLeft,cameraMaxRight);
            yVal= parseInt(coords[1]);
            if(!integerCheckSum(yVal)){
                valuesChanged = false;
                return;
            }
            yVal = valueLimits(yVal,0,0);
            if(forTrajectory){
                var zVals = coords[2].split(":");
                if(zVals.length != 2){
                    valuesChanged = false;
                    return;
                }
                zVal = parseInt(zVals[0]);
                var nextval = parseInt(zVals[1]);
                if(!integerCheckSum(nextval)){//if value is not integer 
                    valuesChanged = false;
                    return;
                }
                nextval = valueLimits(nextval,0,300);
                SPEEDVAL = Math.trunc(nextval);
                
            }else{
                zVal = parseInt(coords[2]);
                SPEEDVAL = null;
            }
            if(!integerCheckSum(zVal)){
                valuesChanged = false;
                return;
            }
            zVal = valueLimits(zVal,cameraMaxBottom,cameraMaxTop);
            XVAL = Math.trunc(xVal);
            YVAL = Math.trunc(yVal);
            ZVAL = Math.trunc(zVal);
           
            indexNUMB = carNumb;
            WPNUMB = wpNumb;
        }); //make
    }else{
        text1 = new BABYLON.GUI.TextBlock();
        WPPosLabel = label;
    }
    if(forTrajectory){
        if(wpNumb > 0){
      //      text1.text =xVal + ","+ yVal +","+ zVal + ":" + actionInAnimation[carNumb].points[wpNumb - 1].wpSpeed; 
      text1.text =xVal +","+ zVal + ":" + actionInAnimation[carNumb].points[wpNumb - 1].wpSpeed; 
        }else{
        //    text1.text =xVal + ","+ yVal +","+ zVal + ":" + actionInAnimation[carNumb].starttime/60; //wapPath = starting time
        text1.text =xVal +","+ zVal + ":" + actionInAnimation[carNumb].starttime/60; //wapPath = starting time
        }
    }else{
       // text1.text = xVal + ","+ yVal +","+ zVal;
       text1.text = xVal +","+ zVal;
    }
    
    text1.color = "white";
    text1.fontSize = "12px";
    label.addControl(text1);  

    return label;
}  
/**
 * check for integral values
 * @param {*} value 
 */
function integerCheckSum(value){
    if(isNaN(value)){
        return false;
    }
    return true;
}
/**
 * For minimum to maximum allowed values
 * @param {*} value 
 * @param {*} min 
 * @param {*} max 
 */
function valueLimits(value, min,max){
    var newVal = value;
    if(newVal < 0){
        if(newVal < min){
            newVal = min; 
        }
        if(newVal > max){
            newVal = max; 
        }
    }else{
        newVal = Math.max(value, min);
        newVal = Math.min(value, max);
    }
    return newVal;
}
function rectangleForInfo(){
    var label = new BABYLON.GUI.Rectangle("label for ");
    label.background = "#131c25";

    label.height = "40px";
    label.alpha = 0.5;
    label.width = "60px";
    label.border = "1px solid #41454a";

    label.thickness = 1;
    label.linkOffsetY = 30;
    label.textWrapping = true;
    advancedTexture.addControl(label); 

    return label;
}

/**
 * reduce size of items when zoom in
 * @param {*} defaultsize 
 */
function adjustsize(defaultsize){
    var offset = cameraMaxRight - camera.orthoRight;
    offset *= 1.5;
    var size = defaultsize;
    if(offset > 0){
        //we have zoomed in..
       size -= (defaultsize * offset)/100;
    }
  return size;
}  

/**
 * When double clicked on waypints/cars etc
 * @param {*} e 
 */
var editWPonDblClick = function(currentMesh,pathindex,waypointnumb){//e
   
   // var currentMesh = this;
	   /* var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { 
            return (mesh != ground) 
        });*/
       if(doubledtaptofinishWP){
            doubledtaptofinishWP = false;
            return;
        }
        //no dragging the waypoint while editing...
        meshUnderDrag = null;
        startingPoint = null;
	/*	if (pickinfo.hit) {
	        currentMesh = pickinfo.pickedMesh;
		}*/
      //  if (!currentMesh) return;
       
       /* if(!currentMesh.isPickable || currentMesh.name == "aCar"){
            //only pickable mesh are waypoints....
           return;
        }*/
       // var type = ""+currentMesh.type;
       // var index = parseInt(currentMesh.name);
      //  var wpNum = parseInt(currentMesh.id)-1;
      
       /* if(type.includes("T_mesh")){
            //a trajectory waypoint mesh
            createLabel(allActions[index].pathpoints[wpNum],index,wpNum, true,true).linkWithMesh(currentMesh);
        }else if(type.includes("P_mesh")){*/
            //a path waypoint mesh
            createLabel(allPaths[pathindex].pathwaypoints[waypointnumb],pathindex,waypointnumb, true,false).linkWithMesh(currentMesh);

           // createLabel(allPaths[index].pathwaypoints[wpNum],index,wpNum, true,false).linkWithMesh(currentMesh);
       // }
	//	return false;
}

//=============== END OF FILE ===============//
}());