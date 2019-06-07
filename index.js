const express = require("express")
const bodyParser = require('body-parser')
const app = express()
const session = require('express-session')
const db = require('./queries') 
const smartCdb = require('./smartC_db') 
const port = process.env.PORT || 3000
const net = require('net'); // Use for TCP socket


app.set('views', __dirname + '/views/');
app.use(express.static(__dirname + '/public/'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
app.use(session({
  secret: 'ssssssssssshhhhhhhhhhhh',
  name: 'SmartCity',
  proxy: true,
  resave: true,
  saveUninitialized: true
}));

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  req.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.get('/', (request, response) => {
  response.render('connexion.html');
})

app.get('/devVersion', (request, response) => {
  sess = request.session;
  if(sess.type == "developper") { // If session opened
   // response.render('index.html');
    response.render('DevVersion/devindex.html');
  }
  else {
    response.redirect('/');
 }

  
})



app.get('/vista', (request, response) => {
  sess = request.session;
  if(sess.type == "Asta") { // If session opened
    response.render('index.html');
  }
  else {
    response.redirect('/');
 }
})


app.get('/referenceManual', (request, response) => {
  response.render('referenceManual.html');
})

app.post('/user_login', smartCdb.login_user) // To open session

app.get('/logout', smartCdb.logout) // to destroy session
app.get('/SmartC', smartCdb.SmartC) //to load SmartC
app.get("/load_ground",smartCdb.loadGround)
app.get("/load_road",smartCdb.loadRoad)
app.get("/logout",smartCdb.logout)
app.get("/load_alphabots",smartCdb.loadalphabot)
app.get("/load_traffic_lights",smartCdb.loadtrafficlight)
app.post('/robot_connect', smartCdb.connection_robot)
app.post('/insert_road', smartCdb.send_roads_to_database) 
app.post('/insert_traffic_light', smartCdb.send_traffic_light_to_database)
app.post('/insert_alphabot', smartCdb.send_alphabots_to_database )



app.post('/saveTestScenario', db.saveTestScenario)
app.post('/loadTestScenario', db.loadTestScenario)
//app.post('/uploadTestScenarioGit', db.uploadToGit)
app.get('/getallTestScenarios', db.getAllTestScenarios)

app.get("/connectdb",smartCdb.connectdb)
app.get("/load_ground",smartCdb.loadGround)

//you will add your APIs here
//app.get('/loadscene', db.loadScene)

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})


/*
var connection = mysql.createConnection({ // To create connection with mysql-server
  host     : 'localhost',
  user     : 'michel',
  password : 'kno3ago3kno3',
  database : 'SmartCity'
});

connection.connect(function(err){
if(!err) { // If succeed
	console.log("Attempting to connect to mysql-server...");

    console.log("Database is connected ...");    
} else {
    console.log("Error connecting database ... nn");    
}
});

app.get("/load_ground",function(req,res){ // Callback function to load grounds from database
	var data = [];
connection.query(load_ground, function(err, rows, fields) {
    if (err) throw err;
 
    for (var i in rows) {
		data.push(rows[i]);
		console.log(rows[i]);
		
		
    }
	res.send(data);

});
});


*/