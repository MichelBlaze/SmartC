/**
     * This class will represent each car in the scene
*/
class Car{
    constructor(){
        this.myName = "";
        this.maxSpeed = 30;
        this.maxAcceleration = 30;
    }

}

class WayPoint{
    constructor(){
        //each waypoint has its own speed
        this.wpSpeed = 0;
    }
}

class Action{
    constructor(){
        this.myName = "";
        this.carIndex = null;
        this.Body = null; //Body is visual presentation of the car object 
        this.myColor = new BABYLON.Color3(1,1,1); //Each car will have different color
        
        this.pathIndex = null;
        //first and last waypoint indexes from path make the whole path for the vehicle
        this.firstWaypointIndex = 0;
        this.lastWaypointIndex = 100;
        this.starttime = 0;//all cars do not start driving instantly
        this.mySpeed = 30; //Current Car speed. each car's speed on each waypoint is different
        this.TotalWapoints = 0;

        //this detail will not go to json object...as it is calculated at runtime
          //<0 if final waypoint index is smaller than first waypoint index and vise versa 
        this.wayPointProgresser = 1; 
        this.myTimeLinePos = [];
        this.myTimeLineRot = [];
        this.DistanceToCoverPerWP = [];//distance between two waypoints
        this.SpeedPerWP = [];//speed between two way points based on distance
        this.totaldistanceperSpeed = 0;
        this.traversedPathLength = 0;
    }
}


class CollisionObject{
    constructor(){
        // A collision is between two onbjects and there is a point of collision
        this.object1;
        this.object2;
        this.pointOfCollision;
     
    }
}

class AllJSONData{
    constructor(){
        // A collision is between two onbjects and there is a point of collision
        this.paths = [];//all paths
        this.cars = [];//all casr
        this.actions = [];//all actions
        this.testName = "testscenario";
     
    }
}