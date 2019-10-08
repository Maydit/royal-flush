var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 3000;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
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


app.use(cookieParser());

////////////////////////////////////////////////////////////////////////////////

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
  secret: 'randomwords',
  cookie:{
    expires: 700000000
  }

}));



// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});

// middleware function to check for logged-in users
// not used
var sessionChecker = (req, res, next) => {
    if (req.session.user) {
        res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
    } else {
        next();
    }
};





// Logging in
app
    .post('/add_acc',(req, res) =>
    {
        mongoose.connect(url, function(err, db) {
	         var myData = new User(req.body);
           var collection = db.collection(db_name);
	         var cursor = collection.find({email:myData.email});

	         var count = 0;

    	     cursor.forEach(function(item)
           {
             if(item!=null) {
    		    	     if( myData.password === item.password) {
    		    		         count=1;
                         //This sets the cookie to user id
                         req.session.userId = item._id.toString();
                         req.session.userName = item.firstName + " " + item.lastName;
                         res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
    		    	     }
             }
           },function(err)
           {
    			      if(count==0)
                {
    		    	       res.status(400).send("Account not found");
    		       }
    		   }
         );

     });
});

// Creating account
app.post("/valid", (req, res) => {
    var myData = new User(req.body);
    myData.save()
        .then(item => {
            //res.send("Name saved to database");
            res.redirect(req.protocol + '://' + req.get('host'));
        })
        .catch(err => {
            res.status(400).send("Unable to save to database");
        });
});

app.get("/getName", (req, res) => {
    res.send(req.session.userName);
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
    socket.on('joinRoom', function(code, newName) {
        if (rooms.has(code)) {
            socket.room = code;
            socket.join(code);
            console.log("Joined room " + code);
            socket.broadcast.to(code).emit('updatePlayers', newName);
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


app.get("/login/test.html", (req, res) => {
    res.sendFile(__dirname + "/login/test.html");
});

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
