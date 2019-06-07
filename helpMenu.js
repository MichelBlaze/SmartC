
var modal,
 loadingTestScenarioPane ,
 savingTestScenarioPane ,
 TipsPane ,
 LicensePane ,
 AboutPane,
 title ;

window.addEventListener('DOMContentLoaded', function(){   
     modal = document.getElementById('myModal');
 loadingTestScenarioPane = document.getElementById('LoadingTestScenarios');
 savingTestScenarioPane = document.getElementById('SavingTestScenarios');
 TipsPane = document.getElementById('TipsPane');
 LicensePane = document.getElementById('LicensePane');
 AboutPane = document.getElementById('AboutPane');
 title = document.getElementById('LabelForPane');
 closeTestScenario();
});

function openReferenceMaual(){
    var win = window.open("referenceManual", "Reference Manual", "searchbar=no, toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=780,top=" + 0 + ",left=" + 0);
}

function openAbout(){
    title.innerHTML = "About";
    modal.style.display = "block";
    AboutPane.style.display = "block";
   
}

function openTips(){
    title.innerHTML = "Tips";
    modal.style.display = "block";
    TipsPane.style.display   = "block";
   
}

function openLicense(){
    title.innerHTML = "License";
    modal.style.display = "block";
    LicensePane.style.display   = "block";
   
}

function openTestScenario(){
    title.innerHTML = "Open Test Scenario";
    modal.style.display = "block";
    loadingTestScenarioPane.style.display = "block";

}

function saveTestScenario(){
    title.innerHTML = "Save Test Scenario";
    modal.style.display = "block";
    savingTestScenarioPane.style.display = "block";
    loadingTestScenarioPane.style.display = "none"; 
}

function closeTestScenario(){
    modal.style.display = "none";
    loadingTestScenarioPane.style.display = "none"; 
    savingTestScenarioPane.style.display = "none"; 
    TipsPane.style.display = "none"; 
    LicensePane.style.display = "none"; 
    AboutPane.style.display = "none"; 

}

function openSmartC(){
       var win = window.open("SmartC", "_self");
}