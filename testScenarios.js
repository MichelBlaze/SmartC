/**
 * Test Scenarios saving and loading to/from external (json) files
 */
(function() {
    'use strict';
    // link to, or create, namespace
    window.sceneNS = window.sceneNS || {};
    // test scenario function
    window.sceneNS.savetestScenarios =
      function savetestScenarios(jsonDataToSave, fileName = "testscenario.json") {
        //saving test scenario
        if(fileName == ".json"){
          fileName = "testscenario.json";
        }
        var data = JSON.stringify(jsonDataToSave);
        var blob = new Blob([data], {type: "text/json;charset=utf-8"});
        // jQuery
        $.getScript('js/Plugins/FileSaver.js', function()
        {
            saveAs(blob, fileName);
        });
      }
      window.sceneNS.loadtestScenarios =  
      function loadtestScenarios(event){
        var input = event.target;
        var reader = new FileReader();
        reader.onload = function(){
            var text = reader.result;
            var alldata = JSON.parse(text);
            window.sceneNS.allSavedData (alldata);
           /* var loadedObjects = [];
            for(var cc = 0; cc<alldata.length;cc++){
              loadedObjects[cc] = alldata[cc];
            }//Endof cc
            
            window.sceneNS.allSavedData (loadedObjects);*/
        };
        reader.readAsText(input.files[0]);
      }

}());
