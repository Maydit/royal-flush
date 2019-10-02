var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 3000;
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var url = "mongodb+srv://admin:adminpassword@cluster0-f0kkf.mongodb.net/test?retryWrites=true";
var db_name = "users";
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(url);

var nameSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String
});

var User = mongoose.model("User", nameSchema);

////////////////////////////////////////////////////////////////////////////////

// Logging in
app.post('/add_acc',(req, res) => {
    mongoose.connect(url, function(err, db) {
	   	var myData = new User(req.body);

	    var collection = db.collection(db_name);
	    var cursor = collection.find({email:myData.email});

	    var count = 0;

	    cursor.forEach(function(item) {
	    	if(item!=null) {
		    	if( myData.password === item.password) {
		    		count=1;
                    res.redirect('http://localhost:3000/game/pick_action.html')
		    	}
	    	}
		},function(err) {
			if(count==0) {
		    	res.status(400).send("Account not found");
		    }
		});
        db.close();
    });
});

// Creating account
app.post("/valid", (req, res) => {
    var myData = new User(req.body);
    myData.save()
        .then(item => {
            res.send("Name saved to database");
        })
        .catch(err => {
            res.status(400).send("Unable to save to database");
        });
});

////////////////////////////////////////////////////////////////////////////////

var rooms = new Set();

// Socket code for host-client connection in game
io.on('connection', function(socket) {
    // Creates a room and joins it: invoked by the host
    socket.on('createRoom', function(code) {
        socket.room = code;
        socket.join(code);
        rooms.add(code);
        console.log("Created room " + code);
    });

    // Joins a room if the room exists: invoked by a player
    socket.on('joinRoom', function(code) {
        if (rooms.has(code)) {
            socket.room = code;
            socket.join(code);
            console.log("Joined room " + code);
            socket.broadcast.to(code).emit('updatePlayers');
            socket.emit('joinResult', 'Joined! Wait for the host to begin the game.');
        } else {
            socket.emit('joinResult', 'ERROR: Room doesn\'t exist');
        }
    });

    // Tells everyone in the room to start: invoked by the host
    socket.on('beginGame', function(code) {
        socket.broadcast.to(code).emit('startGame', code);
        socket.emit('startHost', code);
    });

    // Joins the room: invoked by everyone moving from the waiting room to
    // the game room
    socket.on('gameJoin', function(code) {
        socket.room = code;
        socket.join(code);
        console.log("In game: joined room " + code);
    });

});

////////////////////////////////////////////////////////////////////////////////

// Allows files to be loaded
app.get("/login/login.html", (req, res) => {
    res.sendFile(__dirname + "/login/login.html");
});

app.get("/login/sign_in.html", (req, res) => {
    res.sendFile(__dirname + "/login/sign_in.html");
});

app.get('/game/pick_action.html', function(req, res) {
    res.sendFile(__dirname + '/game/pick_action.html');
});

app.get('/game/player_game.js', function(req, res) {
    res.sendFile(__dirname + '/game/player_game.js');
});

app.get('/game/host_game.js', function(req, res) {
    res.sendFile(__dirname + '/game/host_game.js');
});

app.get('/game/player_game.html', function(req, res) {
    res.sendFile(__dirname + '/game/player_game.html');
});

app.get('/game/host_game.html', function(req, res) {
    res.sendFile(__dirname + '/game/host_game.html');
});

app.get('/game/host.js', function(req, res) {
    res.sendFile(__dirname + '/game/host.js');
});

app.get('/game/join.js', function(req, res) {
    res.sendFile(__dirname + '/game/join.js');
});

app.get('/game/host.html', function(req, res) {
    res.sendFile(__dirname + '/game/host.html');
});

app.get('/game/join.html', function(req, res) {
    res.sendFile(__dirname + '/game/join.html');
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

/////////////////////////////////////////////////////////////////////////////

// Puts it on a port
http.listen(3000, function(){
  console.log('Server up on 3000');
});
