var express = require("express");
var app = express();
var http = require('http').Server(app);

var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var sjcl = require('sjcl');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var async = require("async");

var poker = require('./game/pokerCalculations.js');

// Database connection requirements
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = "mongodb+srv://admin:adminpassword@cluster0-f0kkf.mongodb.net/test?retryWrites=true";
var db_name = "users";
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(url);

var nameSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    passHash: String,
    salt: String,
    hands: Array
});

var User = mongoose.model("User", nameSchema);

app.use(cookieParser());

////////////////////////////////////////////////////////////////////////////////
// Sessions

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
  key:'user_id',
  secret: 'randomwords',
  cookie:{
    expires: 700000000
  }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// app.use((req, res, next) => {
//     if (req.cookies.user_sid && !req.session.user) {
//         res.clearCookie('user_sid');
//     }
//     next();
// });

// middleware function to check for logged-in users
// not used
// var sessionChecker = (req, res, next) => {
//     if (req.session.user) {
//         res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
//     } else {
//         next();
//     }
// };

////////////////////////////////////////////////////////////////////////////////
// Login and signup

// Logging in
app.post('/login',(req, res) => {
    mongoose.connect(url, function(err, db) {
        //var myData = new User(req.body);
        var collection = db.collection(db_name);
        var cursor = collection.find({email:req.body.email});
        var count = 0;
        //todo: fix this
        cursor.forEach(function(item) {
            if(item!=null) {
                var pass = req.body.password;
                var saltBits = sjcl.codec.base64.toBits(item.salt);
                var derivedKey = sjcl.misc.pbkdf2(pass, saltBits, 100, 256);
                var hash = sjcl.codec.base64.fromBits(derivedKey);
                if( hash === item.passHash) {
                    count=1;
                    //This sets the cookie to user id
                    req.session.userId = item._id.toString();
                    req.session.userName = item.firstName + " " + item.lastName;
                    res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
                }
            }
        }, function(err) {
            if(count==0) {
               res.status(400).send("Account or password incorrect");
            }
        });
    });
});



// Creating account
app.post("/register", (req, res) => {
    //TODO
    //check if email unique?
    mongoose.connect(url, function(err, db) {
        var found = 0;
        var collection = db.collection(db_name);
        var cursor = collection.find({email:req.body.email});
        cursor.forEach(function(item) {
            if(item!=null) {
                //duplicate email
                res.end("Email already in use");
                found++;
            }
        });
        if(found > 0) throw "err";
    }).then(result => {
        //hash & salt
        var password = req.body.password;
        var saltBits = sjcl.random.randomWords(8);
        var derivedKey = sjcl.misc.pbkdf2(password, saltBits, 100, 256);
        var hash = sjcl.codec.base64.fromBits(derivedKey);
        var salt = sjcl.codec.base64.fromBits(saltBits);
        //to get back: var saltBits = sjcl.codec.base64.toBits(salt);
        var dict = {};
        dict["firstName"] = req.body.firstname;
        dict["lastName"] = req.body.lastname;
        dict["email"] = req.body.email;
        dict["salt"] = salt;
        dict["passHash"] = hash;
        dict["hands"] = [];
        var myData = new User(dict);
        myData.save()
            .then(() => {
                res.redirect(req.protocol + '://' + req.get('host'));
            })
            .catch(() => {
                res.status(400).send("Unable to save to database");
            });
    })
    new Promise(function(resolve, reject) {
        mongoose.connect(url, async function(err, db) {
            var collection = db.collection(db_name);
            const num = await collection.find({email:req.body.email}).count();
            if(num > 0) {
                resolve("Email already in use");
            } else {
                reject("Email unique");
            }
        });
    })
    .then(
        () => {
            res.end("Email already in use");
        })
    .catch(
        () => {
            send();
        }
    );
    //holy promise
});



app.post("/logout",(req,res) => {
    res.clearCookie('user_id');
    //res.redirect(req.protocol + '://' + req.get('host') + '/index.html');

    res.sendFile(__dirname + "/index.html");


});

////////////////////////////////////////////////////////////////////////////////
// Poker Calculation Classes

class Card {
    constructor(cardStr) {
        var rank = cardStr.charAt(0);
        if (rank == '2' || rank == '3' || rank == '4' || rank == '5' ||
            rank == '6' || rank == '7' || rank == '8' || rank == '9') {
            this.rank = parseInt(rank);
        } else if (rank == 'T') {
            this.rank = 10;
        } else if (rank == 'J') {
            this.rank = 11;
        } else if (rank == 'Q') {
            this.rank = 12;
        } else if (rank == 'K') {
            this.rank = 13;
        } else if (rank == 'A') {
            this.rank = 14;
        }
        this.suit = cardStr.charAt(1);
    }

    // If card1 is greater than card2, returns 1. If less than, returns -1, and
    // if they are equal, returns 0.
    compareTo(card2) {
        if (this.rank > card2.rank) {
            return 1;
        } else if (this.rank < card2.rank) {
            return -1;
        } else {
            return 0;
        }
    }

    // Determine if the cards are the same
    equals(card2) {
        return (this.rank == card2.rank && this.suit == card2.suit);
    }
}

class Hand {
    /*
    this.strength:
        8 - straight flush
        7 - bomb
        6 - full house
        5 - flush
        4 - straight
        3 - 3 of a kind
        2 - 2 pair
        1 - pair
        0 - high card
    this.cards
    */

    // Given 5-7 cards, determine the best 5-card hand.
    constructor(cardsStr) {
        var cards = [];
        for (var i = 0; i < cardsStr.length; i+=2) {
            var newCard = new Card(cardsStr.substring(i, i+2));
            cards.push(newCard);
        }

        cards.sort(poker.cardSorter);

        // Check for hands in decreasing strength

        var straightFlushHand = poker.checkForStraightFlush(cards);
        if (straightFlushHand.length != 0) {
            this.strength = 8;
            this.cards = straightFlushHand;
            return;
        }
        var bombHand = poker.checkForBomb(cards);
        if (bombHand.length != 0) {
            this.strength = 7;
            this.cards = bombHand;
            return;
        }
        var houseHand = poker.checkForFullHouse(cards);
        if (houseHand.length != 0) {
            this.strength = 6;
            this.cards = houseHand;
            return;
        }
        var flushHand = poker.checkForFlush(cards);
        if (flushHand.length != 0) {
            // Must reduce to 5
            while (flushHand.length > 5) {
                flushHand.shift();
            }
            this.strength = 5;
            this.cards = flushHand;
            return;
        }
        var straightHand = poker.checkForStraight(cards);
        if (straightHand.length != 0) {
            this.strength = 4;
            this.cards = straightHand;
            return;
        }
        var tripArr = poker.checkforTrips(cards);
        if (tripArr.length != 0) {
            // If true, length MUST be 1.
            this.cards = [];
            for (var i = 0; i < cards.length; i++) {
                if (cards[i].rank == tripArr[0]) {
                    this.cards.push(cards[i]);
                    cards.splice(i,1);
                    i -= 1;
                }
            }
            this.cards.push(cards[cards.length-2]);
            this.cards.push(cards[cards.length-1]);
            this.strength = 3;
            return;
        }
        var pairArr = poker.checkForPairs(cards);
        if (pairArr.length != 0) {
            if (pairArr.length > 1) {
                // 2 pair
                this.cards = [];
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].rank == pairArr[pairArr.length-1] || cards[i].rank == pairArr[pairArr.length-2]) {
                        this.cards.push(cards[i]);
                        cards.splice(i,1);
                        i -= 1;
                    }
                }
                this.cards.push(cards[cards.length-1]);
                this.strength = 2;
                return;
            } else {
                // 1 pair
                this.cards = [];
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].rank == pairArr[0]) {
                        this.cards.push(cards[i]);
                        cards.splice(i,1);
                        i -= 1;
                    }
                }
                this.cards.push(cards[cards.length-3]);
                this.cards.push(cards[cards.length-2]);
                this.cards.push(cards[cards.length-1]);
                this.strength = 1;
                return;
            }
        }

        while (cards.length > 5) {
            cards.shift();
        }
        this.cards = cards;
        this.strength = 0;
    }

    equals(hand2) {
        for (var i = 0; i < this.cards.length; i++) {
            if (this.cards[i].equals(hand2.cards[i]) == false) {
                return false;
            }
        }
        return true;
    }
}




////////////////////////////////////////////////////////////////////////////////
// Game Stats

app.get("/getHandHistory", (req, res) => {
    mongoose.connect(url, function(err,db) {

        var user_db = db.collection("users");
        var hand_db = db.collection("hands");
        var user_id = req.session.userId;

        async.waterfall([
        function getUser(callback) {
            user_db.findOne({_id: new ObjectId(user_id.toString())},function (err,res) {
                    callback(null,res.hands)
                }
            );
        },
        function getHand(user, callback) {
            console.log(user);
            for (var x = 0; x < user.length; x++) {
                console.log(user[x]);
                hand_db.findOne({_id: new ObjectId(user[x].toString())},function (err,res) {
                    if (res) {
                        var players = res.players;
                        var cards = res.cards;
                        var pos = 0;

                        for (var x = 0; x < players.length; x++) {
                            if (players[x] == user_id) {
                                pos = x;
                                break;
                            }
                        }

                        console.log(cards[pos]);
                    } else {
                        console.log("No hands found")
                    }
                });
            }
        },
        ], function(err2, casts) {
            if(err2) {
                console.log("ERROR2!!")
            }
        });
    });
});

//getStats
app.get("/getStats", (req, res) => {
    mongoose.connect(url, function(err,db) {

        var user_db = db.collection("users");
        var hand_db = db.collection("hands");
        var user_id = req.session.userId;

        var pre_flop_fold = 0;
        var pre_flop_match = 0;
        var pre_flop_check = 0;
        var pre_flop_raise = 0;
        var pre_flop_total = 0;

        var total_raise = 0;
        var total_actions = 0;

        var total_sd = 0;
        var won_sd = 0;

        async.waterfall([
        function getUser(callback) {
            user_db.findOne({_id: new ObjectId(user_id.toString())},function (err, res) {
                callback(null,res.hands)
            });
        },
        function getHand(user,callback) {
            console.log(user);
            async.each(user, function(each_hand,eachCallback){
                hand_db.findOne({_id: new ObjectId(each_hand.toString())},function (err,res) {
                    if (res) {
                        var players = res.players;
                        var cards = res.cards;

                        var pre_flop = res.preflopBets;
                        var flop = res.flopBets;
                        var turn = res.turnBets;
                        var river = res.riverBets;

                        var pos = 0;
                        var order = 0;

                        var winner = res.winner;

                        for (var x = 0; x < players.length; x++) {
                            if(players[x] == user_id) {
                                pos = x;
                                break;
                            }
                        }

                        order = res.positions[pos];
                        console.log(cards[pos]);

                        //pre-flop action
                        for (var x = 0; x < pre_flop.length; x++) {
                            if (pre_flop[x][0] == order) {
                                if (pre_flop[x][1] == "m") {
                                    pre_flop_match += 1;
                                }
                                if (pre_flop[x][1] == "c") {
                                    pre_flop_check += 1;
                                }
                                if (pre_flop[x][1]=="r") {
                                    pre_flop_raise += 1;
                                    total_raise += 1;
                                }
                                if (pre_flop[x][1] == "f") {
                                    pre_flop_fold += 1;
                                }

                                pre_flop_total += 1;
                                total_actions += 1;
                            }
                        }

                        //flop action
                        for (var x = 0; x < flop.length; x++) {
                            if (flop[x][0] == order) {
                                if (flop[x][1] == "r") {
                                    total_raise += 1;
                                }
                                total_actions += 1;
                            }
                        }

                        //turn action
                        for(var x = 0; x < turn.length; x++) {
                            if (turn[x][0] == order) {
                                if (turn[x][1] == "r") {
                                    total_raise += 1;
                                }
                                total_actions += 1;
                            }
                        }

                        var sd_temp = 0;

                        //river action
                        for(var x = 0; x < river.length; x++) {
                            if (river[x][0] == order) {
                                if (river[x][1] != "f") {
                                    sd_temp += 1;
                                }

                                if (river[x][1] == "f") {
                                    sd_temp = 0;
                                }

                                if (river[x][1] == "r") {
                                    total_raise += 1;
                                }
                                total_actions += 1;
                            }
                        }

                        if (sd_temp > 0) {
                            total_sd += 1;
                            if (winner == pos) {
                                won_sd += 1;
                            }
                        }
                    } else {
                        console.log("No hands found");
                    }

                    eachCallback();
                });
            }, function(err,result) {
                callback(null);
            })
        },
        ], function(err2,casts) {
            if (err2) {
                console.log("ERROR2!!");
            } else {
                var returnStr = "";

                //VPIP
                returnStr += Math.round(((pre_flop_match + pre_flop_raise)/pre_flop_total) * 100);
                returnStr += ",";

                //PFR
                returnStr += Math.round((pre_flop_raise/pre_flop_total) * 100);
                returnStr += ",";

                //AGG
                returnStr += Math.round((total_raise/total_actions) * 100);
                returnStr += ",";

                //PSW
                returnStr += Math.round((won_sd/total_sd) * 100);

                res.send(returnStr);
            }
        });
    });
});


////////////////////////////////////////////////////////////////////////////////
// Game backend

function deepCopyArray(oldArr, newArr) {
    for (i = 0; i < oldArr.length; i++) {
        newArr.push(oldArr[i]);
    }
}

// Gets name of the logged in user
app.get("/getName", (req, res) => {
    res.send(req.session.userName);
});

// Gets id of the logged in user
app.get("/getUserId", (req, res) => {
    res.send(req.session.userId);
});

// Returns all positions to the frontend
app.get("/getPositions/:code", (req, res) => {
    var code = req.params.code;
    var hand = rooms.get(code);
    res.send(hand.positions);
});

// Returns all names to the frontend
app.get("/getNames/:code", (req, res) => {
    var code = req.params.code;
    var hand = rooms.get(code);
    res.send(hand.names);
});

// Players invoke this when they submit cards
app.post("/sendCards/:code/:cardsStr/:userId", (req, res) => {
    // Parse inputs
    var code = req.params.code;
    var cardsStr = req.params.cardsStr;
    var userId = req.params.userId;

    // Store in hand
    var hand = rooms.get(code);
    for (var i = 0; i < hand.players.length; i++) {
        if (hand.players[i] == userId) {
            hand.cards[i] = cardsStr;
            break;
        }
    }
    res.send(true);
});

// Add a bet to the hand
app.post("/addBet/:code/:bet/:phase", (req, res) => {
    // Phase legend:
    //      0: preflop
    //      1: flop
    //      2: turn
    //      3: river

    // Parse inputs
    var code = req.params.code;
    var bet = req.params.bet;
    var phase = parseInt(req.params.phase, 10);

    var hand = rooms.get(code);
    if (phase == 0) {
        hand.preflopBets.push(bet);
    } else if (phase == 1) {
        hand.flopBets.push(bet);
    } else if (phase == 2) {
        hand.turnBets.push(bet);
    } else {
        hand.riverBets.push(bet);
    }
    res.send(true);
});

// For pushing the hand to the database
app.get("/recordHand/:code/:commCardsStr/:notFolded/:totalPotAmount", (req, res) => {
    var code = req.params.code;
    var hand = rooms.get(code);
    var notFoldedStr = req.params.notFolded;
    //console.log("DONE!");

    // Add community cards to the hand
    hand.commCards = req.params.commCardsStr;
    hand.pot = req.params.totalPotAmount;

    // Check who won
    var allHands = [];
    for (var i = 0; i < notFoldedStr.length; i++) {
        var playerPos = parseInt(notFoldedStr.charAt(i));
        var currentHand = new Hand(hand.cards[playerPos] + hand.commCards);
        allHands.push(currentHand);
    }
    var sortedHands = Array.from(allHands);
    sortedHands.sort(poker.handSorter);
    for (i = 0; i < notFoldedStr.length; i++) {
        if (sortedHands[sortedHands.length-1].equals(allHands[i])) {
            hand.winner = parseInt(notFoldedStr.charAt(i));
        }
    }
    console.log(hand);

    var dupHand = {
        players: [],
        names: [],
        stacks: [],
        cards: [],
        positions: [],
        preflopBets: [],
        flopBets: [],
        turnBets: [],
        riverBets: [],
        commCards: "",
        winner: "",
        pot: 0
    };

    // Create a deep copy of the current hand
    deepCopyArray(hand.players, dupHand.players);
    deepCopyArray(hand.names, dupHand.names);
    deepCopyArray(hand.stacks, dupHand.stacks);
    deepCopyArray(hand.cards, dupHand.cards);
    deepCopyArray(hand.positions, dupHand.positions);
    deepCopyArray(hand.preflopBets, dupHand.preflopBets);
    deepCopyArray(hand.flopBets, dupHand.flopBets);
    deepCopyArray(hand.turnBets, dupHand.turnBets);
    deepCopyArray(hand.riverBets, dupHand.riverBets);
    dupHand.commCards = hand.commCards;
    dupHand.winner = hand.winner;
    dupHand.pot = hand.pot;

    // Send to database
    MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        var hand_id;
        var database = client.db("test");
        database.collection("hands").insertOne(dupHand, function(err, res) {
            if (err) {
                throw err;
            } else {
                hand_id = res.insertedId;

                var user_db = client.db("test");
                for (i = 0; i < hand.players.length; i++) {
                    var query =  {_id : new ObjectId(hand.players[i].toString()) };
                    var new_val = {$push: {hands:hand_id}};

                    user_db.collection("users").updateOne(query, new_val, function(err, res) {
                        if (err) throw err;
                    });
                }
            }
        });
    });

    // Switch positions
    hand.positions.unshift(hand.positions[hand.positions.length - 1]);
    hand.positions.pop();

    // Reset variables
    for (i = 0; i < hand.players.length; i++) {
        hand.cards[i] = "";
    }
    hand.preflopBets = [];
    hand.flopBets = [];
    hand.turnBets = [];
    hand.riverBets = [];
    hand.commCards = "";

    // Send the winner name, so that the frontend can update stacks
    res.send(hand.winner.toString());
});

// Subtracts an amount from a person's stack
app.post("/updateStacks/:code/:pos/:amount", (req, res) => {
    var code = req.params.code;
    var hand = rooms.get(code);
    var pos = parseInt(req.params.pos);
    var amount = parseInt(req.params.amount);

    hand.stacks[pos] -= amount;
    res.send(true);
});

////////////////////////////////////////////////////////////////////////////////
// Room connections

var rooms = new Map();

// Socket code for host-client connection in game
io.on('connection', function(socket) {
    // Creates a room and joins it: invoked by the host
    socket.on('createRoom', function(code) {
        socket.room = code;
        socket.join(code);
        var emptyHand = {
            players: [],
            names: [],
            stacks: [],
            cards: [],
            positions: [],
            preflopBets: [],
            flopBets: [],
            turnBets: [],
            riverBets: [],
            commCards: "",
            winner: "",
            pot: 0
        };
        rooms.set(code, emptyHand);
        //console.log("Created room " + code);
    });

    // Joins a room if the room exists: invoked by a player
    socket.on('joinRoom', function(code, newName, newId, startStack) {
        if (rooms.has(code)) {
            socket.room = code;
            socket.join(code);
            //console.log("Joined room " + code);

            // Adds player info to the room
            var hand = rooms.get(code);
            hand.players.push(newId);
            hand.names.push(newName);
            hand.stacks.push(startStack);

            // Sends into to the host and confirmation back to player
            socket.broadcast.to(code).emit('updatePlayers', newName);
            socket.emit('joinResult', 'Joined! Wait for the host to begin the game.');
        } else {
            socket.emit('joinResult', 'ERROR: Room doesn\'t exist');
        }
    });

    // Tells everyone in the room to start: invoked by the host
    socket.on('beginGame', function(code) {
        // Sets up postitioning
        var hand = rooms.get(code);
        for (var i = 0; i < hand.players.length; i++) {
            hand.positions.push(i);
            hand.cards.push("");
        }

        socket.broadcast.to(code).emit('startGame', code);
        socket.emit('startHost', code);
    });

    // Joins the room: invoked by everyone moving from the waiting room to
    // the game room
    socket.on('gameJoin', function(code) {
        socket.room = code;
        socket.join(code);
    });
});

////////////////////////////////////////////////////////////////////////////////

// Allows files to be loaded

app.get("/game/pokerCalculations.js", (req, res) => {
    res.sendFile(__dirname + "/game/pokerCalculations.js");
});

app.get("/index.css", (req, res) => {
    res.sendFile(__dirname + "/index.css");
});

app.get("/login/login.html", (req, res) => {
    if (req.session.userName) {
        res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
    } else {
        res.sendFile(__dirname + "/login/login.html");
    }
});

app.get("/login/login.js", (req, res) => {
    res.sendFile(__dirname + "/login/login.js");
});

app.get("/login/login.css", (req, res) => {
    res.sendFile(__dirname + "/login/login.css");
});

app.get("/assets/cards.webp", (req, res) => {
    res.sendFile(__dirname + "/assets/cards.webp");
});

app.get("/login/sign_in.html", (req, res) => {
    if (req.session.userName) {
        res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
    } else {
        res.sendFile(__dirname + "/login/sign_in.html");
    }
});

app.get("/login/sign_in.css", (req, res) => {
    res.sendFile(__dirname + "/login/sign_in.css");
});

app.get('/game/pick_action.html', function(req, res) {
    if (req.session.userName != null) {
        res.sendFile(__dirname + '/game/pick_action.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/game/pick_action.css', function(req, res) {
    res.sendFile(__dirname + '/game/pick_action.css');
});

app.get('/game/player_game.js', function(req, res) {
    res.sendFile(__dirname + '/game/player_game.js');
});

app.get('/game/host_game.js', function(req, res) {
    res.sendFile(__dirname + '/game/host_game.js');
});

app.get('/game/card_parser.js', function(req, res) {
    res.sendFile(__dirname + '/game/card_parser.js');
});

app.get('/game/player_game.html', function(req, res) {
    if(req.session.userName != null) {
        res.sendFile(__dirname + '/game/player_game.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/game/player_game.css', function(req, res) {
    res.sendFile(__dirname + '/game/player_game.css');
});

app.get('/game/host_game.html', function(req, res) {
    if (req.session.userName != null) {
        res.sendFile(__dirname + '/game/host_game.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/game/host_game.css', function(req, res) {
    res.sendFile(__dirname + '/game/host_game.css');
});

app.get('/game/host.js', function(req, res) {
    res.sendFile(__dirname + '/game/host.js');
});

app.get('/game/join.js', function(req, res) {
    res.sendFile(__dirname + '/game/join.js');
});

app.get('/game/host.html', function(req, res) {
    if (req.session.userName != null) {
        res.sendFile(__dirname + '/game/host.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/game/host.css', function(req, res) {
    res.sendFile(__dirname + '/game/host.css');
});

app.get('/game/join.html', function(req, res) {
    if (req.session.userName != null) {
        res.sendFile(__dirname + '/game/join.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/game/join.css', function(req, res) {
    res.sendFile(__dirname + '/game/join.css');
});

app.get('/stats/personal_stats.js', function(req, res) {
    res.sendFile(__dirname + '/stats/personal_stats.js');
});

app.get('/stats/stats_home.html', function(req, res) {
    if (req.session.userName != null) {
        res.sendFile(__dirname + '/stats/stats_home.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/stats/stats_home.css', function(req, res) {
    res.sendFile(__dirname + '/stats/stats_home.css');
});

app.get('/stats/hand_history.html', function(req, res) {
    if (req.session.userName != null) {
        res.sendFile(__dirname + '/stats/hand_history.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/stats/hand_history.css', function(req, res) {
    res.sendFile(__dirname + '/stats/hand_history.css');
});

app.get('/stats/personal_stats.html', function(req, res) {
    if (req.session.userName != null) {
        res.sendFile(__dirname + '/stats/personal_stats.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/stats/personal_stats.css', function(req, res) {
    res.sendFile(__dirname + '/stats/personal_stats.css');
});

app.get('/stats/global_stats.html', function(req, res) {
    if (req.session.userName != null) {
        res.sendFile(__dirname + '/stats/global_stats.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/stats/global_stats.css', function(req, res) {
    res.sendFile(__dirname + '/stats/global_stats.css');
});

app.get("/", (req, res) => {
    if (req.session.userName) {
        res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
    } else {
        res.sendFile(__dirname + "/index.html");
    }
});

/////////////////////////////////////////////////////////////////////////////

// Puts it on a port
http.listen(process.env.PORT || 3000, function(){
  //console.log('Server up on 3000');
});
