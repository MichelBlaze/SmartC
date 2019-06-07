/**
 * Paths : saving and loading to/from external (json) files
 */
class Path{
    constructor(){
      this.pathwaypoints = [];
      this.P_name = "";
      this.pathColor = null;
     }
}


class Trajectory{
  constructor(){
    //referrence to the meshes assigned to this trajectory
    this.mesh_waypoint = [];
    this.mesh_lines = [];
    this.mesh_arrows = [];
   }
}

var defaullPAth  = '{"paths":[{"pathwaypoints":[{"x":15.24,"y":0,"z":19.8},'
+'{"x":10.2,"y":0,"z":18.83},{"x":4.98,"y":0,"z":18.35},'
+'{"x":0.0,"y":0,"z":17.72},'
+'{"x":-5.31,"y":0,"z":16.6},'
+'{"x":-11.71,"y":0,"z":14.64},'
+'{"x":-18.46,"y":0,"z":11.2},'
+'{"x":-23.69,"y":0,"z":7.8},'
+'{"x":-27.89,"y":0,"z":4.75},'
+'{"x":-32.30,"y":0,"z":1.78},'
+'{"x":-36.60,"y":0,"z":-0.7},'
+'{"x":-42.17,"y":0,"z":-2.94},'
+'{"x":-46.58,"y":0,"z":-4.63},'
+'{"x":-50.00,"y":0,"z":-6.75},'
+'{"x":-53.20,"y":0,"z":-10.87},'
+'{"x":-54.58,"y":0,"z":-14.89},'
+'{"x":-54.34,"y":0,"z":-18.87},'
+'{"x":-53.17,"y":0,"z":-22.87},'
+'{"x":-50.63,"y":0,"z":-26.95},'
+'{"x":-46.65,"y":0,"z":-30.3},'
+'{"x":-40.94,"y":0,"z":-32.19},'
+'{"x":-36.57,"y":0,"z":-32.3},'
+'{"x":-31.68,"y":0,"z":-31.32},'
+'{"x":-26.62,"y":0,"z":-28.69},'
+'{"x":-20.93,"y":0,"z":-25.33},'
+'{"x":-14.95,"y":0,"z":-21.53},'
+'{"x":-8.96,"y":0,"z":-18.01},'
+'{"x":-4.15,"y":0,"z":-15.07},'
+'{"x":1.38,"y":0,"z":-11.64},'
+'{"x":6.88,"y":0,"z":-10.02},'
+'{"x":11.31,"y":0,"z":-9.96},'
+'{"x":15.68,"y":0,"z":-10.9},'
+'{"x":20.54,"y":0,"z":-13.06},'
+'{"x":25.39,"y":0,"z":-15.44},'
+'{"x":28.99,"y":0,"z":-16.63},'
+'{"x":33.29,"y":0,"z":-17.03},'
+'{"x":38.46,"y":0,"z":-16.22},{'
  +'   "x":44.56,"y":0,"z":-13.65},'
  +' {"x":48.97,"y":0,"z":-9.59},'
  +' {"x":52.03,"y":0,"z":-4.94},'
  +'  {"x":53.78,"y":0,"z":0.74},'
  +'  {"x":54.33,"y":0,"z":5.95},'
  +'  {"x":54.36,"y":0,"z":11.50},'
  +'  {"x":53.61,"y":0,"z":15.96},'
  +'  {"x":51.41,"y":0,"z":20.24},'
  +' {"x":48.22,"y":0,"z":23.57},'
    +'   {"x":44.22,"y":0,"z":25.88},'
    +' {"x":39.64,"y":0,"z":26.71},'
    +' {"x":33.32,"y":0,"z":25.72},'
    +' {"x":26.19,"y":0,"z":23.39},'
    +' {"x":20.75,"y":0,"z":21.44},'
    +' {"x":15.43,"y":0,"z":19.87}],'
    +' "P_name":"Rural_Road_Inner_Lane","pathColor":null},'

    +' {"pathwaypoints":[{"x":-32.54,"y":0,"z":-5.85},'
    +' {"x":-30.95,"y":0,"z":-4.58},'
           +' {"x":-28.66,"y":0,"z":-2.93},'
           +' {"x":-26.06,"y":0,"z":-0.94},'
        +'   {"x":-23.56,"y":0,"z":0.94},'
        +'   {"x":-21.15,"y":0,"z":2.86},'
        +'{"x":-18.94,"y":0,"z":4.64},'
        +'    {"x":-16.65,"y":0,"z":6.46},'
        +'  {"x":-14.09,"y":0,"z":8.49},'
        +'    {"x":-11.79,"y":0,"z":10.33},'
        +' {"x":-9.48,"y":0,"z":12.22},'
        +'    {"x":-7.45,"y":0,"z":13.82},'
        +' {"x":-6.34,"y":0,"z":14.82},'
        +'{"x":-5.90,"y":0,"z":15.09},'
        +'    {"x":-5.41,"y":0,"z":14.81},'
        +' {"x":-5.43,"y":0,"z":14.14},'
        +' {"x":-7.41,"y":0,"z":12.53},'
        +' {"x":-10.93,"y":0,"z":9.61},'
        +' {"x":-13.39,"y":0,"z":7.71},'
        +' {"x":-15.94,"y":0,"z":5.66},'
        +' {"x":-18.58,"y":0,"z":3.42},'
        +' {"x":-21.47,"y":0,"z":1.28},'
        +' {"x":-24.20,"y":0,"z":-0.84},'
        +' {"x":-26.57,"y":0,"z":-2.66},'
        +' {"x":-28.11,"y":0,"z":-3.87},'
        +' {"x":-29.80,"y":0,"z":-5.25},'
        +' {"x":-31.45,"y":0,"z":-6.57},'
        +' {"x":-31.98,"y":0,"z":-6.84}],'
        +'"P_name":"Super Multilane_Lane_3","pathColor":null}'
        +'],"cars":[{"myName":"Car_1","maxSpeed":0,"maxAcceleration":0}],'
        +'"actions":[{"myName":"Action_1","carIndex":0,"Body":null,"myColor":{"r":1,"g":1,"b":1},"pathIndex":0,"firstWaypointIndex":0,"lastWaypointIndex":100,"starttime":0,"mySpeed":30,"TotalWapoints":0,"wayPointProgresser":1,"myTimeLinePos":[],"myTimeLineRot":[],"DistanceToCoverPerWP":[],"SpeedPerWP":[],"totaldistanceperSpeed":0,"traversedPathLength":38.450350904304386}],'
        +'"testName":"testscenario"}';