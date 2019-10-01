var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_URL = "mongodb+srv://admin:adminpassword@cluster0-f0kkf.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "rawData";

// Set of rooms: sets allow for quick finding and unique values
var rooms = new Set();

MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
    if (error) {
        throw error;
    }

    // Connect to the database within the cluster
    database = client.db(DATABASE_NAME);
    console.log("Connected to `" + DATABASE_NAME + "`!");

    // Socket code goes within here
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
});

// Loading local files
app.get('/player_game.js', function(req, res) {
    res.sendFile(__dirname + '/player_game.js');
});

app.get('/host_game.js', function(req, res) {
    res.sendFile(__dirname + '/host_game.js');
});

app.get('/player_game.html', function(req, res) {
    res.sendFile(__dirname + '/player_game.html');
});

app.get('/host_game.html', function(req, res) {
    res.sendFile(__dirname + '/host_game.html');
});

app.get('/host.js', function(req, res) {
    res.sendFile(__dirname + '/host.js');
});

app.get('/join.js', function(req, res) {
    res.sendFile(__dirname + '/join.js');
});

app.get('/host.html', function(req, res) {
    res.sendFile(__dirname + '/host.html');
});

app.get('/join.html', function(req, res) {
    res.sendFile(__dirname + '/join.html');
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/pick_action.html');
});

// Puts it on a port
http.listen(3000, function(){
  console.log('Server up on 3000');
});
