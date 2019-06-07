const mysql = require('mysql')
const express = require("express")
const setCookie = require('set-cookie')
const cookieParser = require('cookie-parser')
const qs = require("querystring");
const app = express()
const net = require('net'); // Use for TCP socket
var body = "";
var sess; // Variable used for Session system


app.use(cookieParser());



var connection = mysql.createConnection({ // To create connection with mysql-server
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'smartcity'
});

const connectdb = async (req, res) => { // To connect at Database
    connection.connect(function(err){
    if(!err) { // If succeed
        console.log("Attempting to connect to mysql-server...");

        console.log("Database is connected ...");    
    } else {
        console.log("Error connecting database ... nn");    
    }
    });
}

const SmartC = async (req, res) => { //
	sess = req.session;
    if(sess.type == "smartC") { // If session opened
       
		res.render('SmartC.html');
		
    }
    else {
      res.redirect('/');
   }
}


const loadGround = async (req, res) => {
//app.get("/load_ground",function(req,res){ // Callback function to load grounds from database
	var data = [];
    connection.query(load_ground, function(err, rows, fields) {
        if (err) throw err;
    
        for (var i in rows) {
            data.push(rows[i]);
            console.log(rows[i]);
        }
        res.send(data);

    });
//});
}

const loadtrafficlight = async (req, res) => {
var data = [];
connection.query(load_traffic_lights, function(err, rows, fields) {
    if (err) throw err;
 
    for (var i in rows) {
		data.push(rows[i]);
		console.log(rows[i]);		
    }
	res.send(data);

});
}


const loadRoad = async (req, res) => {
		var data = [];
         connection.query(load_road, function(err, rows, fields) {
        if (err) throw err;
 
    for (var i in rows) {
		data.push(rows[i]);
		console.log(rows[i]);		
    }
	res.send(data);

});
}



const login_user = async (request, response) => { 
console.log("Content request : "+request.session)
   var type = request.body.type;
   sess = request.session;
   sess.type = type;
    response.send(type);
    console.log("New " + type +" user just opened a session");    

};


const send_alphabots_to_database = async (request, response) => { // Function to opened session
   var alphabot_name = request.body.alphabot_name;
   var initial_position_x_robot = request.body.initial_position_x_robot;
   var initial_position_z_robot = request.body.initial_position_z_robot;
   var ip_addr = request.body.ip_addr;
   var port_robot = request.body.port_robot;
   var scene = request.body.scene;
   console.log('->>>>>>>>>>>>INSERTION NEW Alphabots : Initial postion x robot = '+initial_position_x_robot+' initial_position_z_robot= '+initial_position_z_robot+' scene = '+scene+' IP Addr = '+ip_addr+' Listening port = '+port_robot);
var insert_robot = "INSERT INTO alphabot (scene_name,alphabot_name,position_x_initial,position_z_initial,ip_addr,port) VALUES ('"+scene+"''"+alphabot_name+"','"+initial_position_x_robot+"','"+initial_position_z_robot+"','"+ip_addr+"','"+port_robot+"')";
connection.query(insert_robot, function(err,result) {
	  if(err) throw err
  });

};



const send_roads_to_database = async (request, response) => { // Function to opened session
   var width = request.body.width;
   var road_name = request.body.road_name;
   var scene = request.body.scene;
   var initial_position_x = request.body.initial_position_x;
   var initial_position_z = request.body.initial_position_z;
   var final_position_x = request.body.final_position_x;
   var final_position_z = request.body.final_position_z;
   console.log('->>>>>>>>>>>>INSERTION NEW Roads : Width = '+width+' road_name= '+ road_name +' scene = '+scene+' initial_position_x= '+initial_position_x+' initial_position_z= '+initial_position_z+' final_position_x= '+final_position_x+' final_position_z= '+final_position_z);
var insert_road = "INSERT INTO road (width,road_name,scene_name,initial_position_x,initial_position_z,final_position_x,final_position_z) VALUES ('"+width+"','"+road_name+"','"+scene+"','"+initial_position_x+"','"+initial_position_z+"','"+final_position_x+"','"+final_position_z+"')"; //'width','road_name','scene','initial_position_x','initial_position_z','final_position_x','final_position_z'
connection.query(insert_road, function(err,result) {
	  if(err) throw err
  });

};

const send_traffic_light_to_database = async (request, response) => { // Function to opened session
   var name = request.body.traffic_light_name;
   var position_x = request.body.position_x;
   var position_z = request.body.position_z;
   var scene = request.body.scene;
   var road_affiliation = request.body.road_affiliation;
   var delay = request.body.delay;
 
console.log('->>>>>>>>>>INSERTION NEW Traffic_Light Name = '+name+' position_x= '+position_x+' position_z = '+position_z+' road affiliation= '+road_affiliation+'  delay = '+delay);
var insert_traffic_light = "INSERT INTO Traffic_Lights (scene_name,traffic_light_name,position_x,position_z,road_affiliation,delay) VALUES ('"+scene+"','"+name+"','"+position_x+"','"+position_z+"','"+road_affiliation+"','"+delay+"')";
connection.query(insert_traffic_light, function(err,result) {
	  if(err) throw err
  });

};

const connection_robot = async (request, response) => {  // This function allow to communicate with alphabots
 var host = request.body.ip_addr;
 var port = request.body.port;
 var instruction = request.body.instructions;
console.log('Trying to connect at ' + host + ':' + port);

var client = new net.Socket();
client.connect(port, host, function() {
    console.log('Connection established with ' + host + ':' + port + ' Instruction = '+instruction);
    client.write(instruction);
	client.destroy();

});



 

};



const loadalphabot = async (request, response) => { // Function to opened session
   var data = [];
connection.query(load_robot, function(err, rows, fields) {
    if (err) throw err;
 
    for (var i in rows) {
		data.push(rows[i]);
		console.log(rows[i]);		
    }
	response.send(data);

});
};




const logout = async (req, res) => { // Function to destroy session

	 req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/');
    });

};

/*****************SQL Request for load Scene on Client API,**********************************************/
var load_ground = 'SELECT * FROM scene WHERE Name="test"'; // Query to get ground size
var load_road = 'SELECT * FROM road  WHERE scene_name="test"'; //Load road
var load_traffic_lights = 'SELECT * FROM traffic_lights WHERE scene_name="test"';
var load_robot = 'SELECT * FROM alphabot  WHERE scene_name="test"';

/*****************SQL Request for send object from client API on database********************************/
var delete_scene = '(DELETE FROM Road WHERE scene_name=$name) AND (DELETE FROM Alphabot WHERE scene_name=$name) AND (DELETE FROM Traffic_Lights WHERE scene_name=$name)';
var insert_ground = 'INSERT INTO Scene (Name,Width,Length)VALUES ("$name","$width","$length")';
var insert_robot = 'INSERT INTO Alphabot (scene_name,alphabot_name,position_x_initial,position_z_initial,ip_addr,port)VALUES("$scene_name","$alphabot_name","$position_x_initial","$position_z_initial","$ip_addr","$port")';

module.exports = {
    loadGround,
    connectdb,
	login_user,
	SmartC,
	loadalphabot,
	logout,
	loadRoad,
	loadtrafficlight,
	connection_robot,
    send_roads_to_database,
	send_traffic_light_to_database,
	send_alphabots_to_database 
  }