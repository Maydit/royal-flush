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
var url = "mongodb+srv://admin:adminpassword@cluster0.f0kkf.mongodb.net/test?retryWrites=true&w=majority";
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

//Displays Hand History
app.get("/getHandHistory", (req, res) => {
    mongoose.connect(url, function(err,db) {
        var user_db = db.collection("users");
        var hand_db = db.collection("hands");
        var user_id = req.session.userId;

        var test = [];

        async.waterfall([
            function getUser(callback) {
                user_db.findOne({_id: new ObjectId(user_id.toString())},function (err,res) {
                    callback(null,res.hands)
                });
            },
            function getHand(user,callback) {
                async.each(user,function(each_hand,eachCallback) {
                    hand_db.findOne({_id: new ObjectId(each_hand.toString())},function (err,res) {
                        if (res) {
                            var players = res.players;
                            var cards = res.cards;
                            var pre_flop = res.preflopBets;
                            var pos = 0;
                            var played = 0;

                            for (var x = 0; x < players.length; x++) {
                                if (players[x] == user_id) {
                                    pos = x;
                                    break;
                                }
                            }
                            order = res.positions[pos];

                            for(var x = 0; x < pre_flop.length; x++) {
                                if (pre_flop[x][0] == order) {
                                    if (pre_flop[x][1] == "f") {
                                        played = 0;
                                    } else {
                                        played += 1;
                                    }
                                }
                            }

                            var msg;
                            if (played > 0) {
                                msg = "Yes";
                            } else {
                                msg = "No";
                            }

                            test.push(cards[pos] + " " + msg);
                        } else {
                            console.log("No hands found")
                        }

                        eachCallback();
                    });
                }, function(err,result) {
                    callback(null);
                });
            },
        ],
        function(err2,casts){
            if(err2) {
                console.log("ERROR2!!")
            } else {
                console.log("Worked!");
                res.send(test);
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
        ],
        function(err2,casts) {
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

var deck = ["2H", "2D", "2C", "2S", "3H", "3D", "3C", "3S", "4H", "4D", "4C", "4S", "5H", "5D", "5C", "5S", "6H", "6D", "6C", "6S", "7H", "7D", "7C", "7S", "8H", "8D", "8C", "8S", "9H", "9D", "9C", "9S", "TH", "TD", "TC", "TS", "JH", "JD", "JC", "JS", "QH", "QD", "QC", "QS", "KH", "KD", "KC", "KS", "AH", "AD", "AC", "AS"];

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

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
    if (rooms.has(code)) {
        var hand = rooms.get(code);
        res.send(hand.names);
    } else {
        var empty = [];
        res.send(empty);
    }
});



////////////////////////////////////////////////////////////////////////////////
// Room connections

var rooms = new Map();

// Socket code for host-client connection in game
io.on('connection', function(socket) {
    // Joins the room: invoked by entering in_game
    socket.on('gameJoin', function(code, name, id) {
        // Enter the room
        socket.room = code;
        socket.join(code);

        if (rooms.has(code)) {
            // Room exists
            socket.broadcast.to(code).emit('updatePlayers', name);
        } else {
            // Room doesn't exist: create it now
            var emptyRound = {
                players: [],
                names: [],
                playersLobby: [],
                namesLobby: [],
                stacks: [],
                cards: [],
                // Set of the positions that have folded
                folded: new Set(),
                positions: [],
                // Phase legend - 0: preflop, 1: flop, 2: turn, 3: river
                phase: 0,
                // Who's on action
                action: 0,
                // Who the round ends on: last person who raised, or the starter
                cycleEndsAt: 0,
                // Bet structure: _ _ _
                // Position (from this.positions)
                // Char indicating bet type: c, m, r, f
                // Integer indicating raise amount: only if 2nd is 'r'
                preflopBets: [],
                flopBets: [],
                turnBets: [],
                riverBets: [],
                amountInPot: [],
                commCards: "",
                winner: "",
                pot: 0
            };
            rooms.set(code, emptyRound);
        }

        var round = rooms.get(code);
        if (round.players.length < 2) {
            round.players.push(id);
            round.names.push(name);
            round.stacks.push(1000);
            round.positions.push(round.players.length - 1);
        } else {

            // CHANGE: no lobby, just if you enter you start as folded

            round.playersLobby.push(id);
            round.namesLobby.push(name);
        }

        if (round.players.length == 2) {
            beginRound(code);
        }
    });

    // Tells everyone in the room to start: invoked by the host
    socket.on('newRound', function(code) {
        beginRound(code);
    });

    function beginRound(code) {
        // First two people, start game
        shuffle(deck);

        // Sets up everything
        var round = rooms.get(code);
        var dealtCards = "";
        var i;
        for (i = 0; i < round.players.length; i++) {
            // Deal cards
            dealtCards += deck[i*2];
            dealtCards += deck[(i*2)+1];
            round.cards.push(dealtCards);
            dealtCards = "";

            // Set action (which is also where cycle ends)
            if (round.positions[i] == 0) {
                round.action = i;
                round.cycleEndsAt = i;
            }

            // Initialize pot
            // NOTE: Must set small and big blind here eventually
            round.amountInPot[i] = 0;
        }

        // Deals community cards
        var tempCommCards = "";
        for (var j = 1; j <= 5; j++) {
            tempCommCards += deck[i+j];
        }
        round.commCards = tempCommCards;

        console.log(round);

        io.sockets.to(code).emit('beginRound', round);
    }

    // Someone checked
    socket.on('check', function(code) {
        var round = rooms.get(code);
        var bet = round.positions[round.action].toString() + "c";
        addBet(bet, round);
        postBet(code, round, bet);
    });

    // Someone matched
    socket.on('match', function(code) {
        var round = rooms.get(code);
        var bet = round.positions[round.action].toString() + "m";
        if (round.phase == 0) {
            round.amountInPot[round.action] += getRecentRaiseAmount(round.preflopBets);
        } else if (round.phase == 1) {
            round.amountInPot[round.action] += getRecentRaiseAmount(round.flopBets);
        }  else if (round.phase == 2) {
            round.amountInPot[round.action] += getRecentRaiseAmount(round.turnBets);
        }  else if (round.phase == 3) {
            round.amountInPot[round.action] += getRecentRaiseAmount(round.riverBets);
        }
        addBet(bet, round);
        postBet(code, round, bet);
    });

    // Someone raised
    socket.on('raise', function(code, amount) {
        var round = rooms.get(code);
        var bet = round.positions[round.action].toString() + "r" + amount.toString();
        round.amountInPot[round.action] += amount;
        round.cycleEndsAt = round.action;
        addBet(bet, round);
        postBet(code, round, bet);
    });

    // Someone folded
    socket.on('fold', function(code) {
        var round = rooms.get(code);
        var bet = round.positions[round.action].toString() + "f";
        round.folded.add(round.positions[round.action]);
        addBet(bet, round);
        postBet(code, round, bet);
    });

    // Adds a bet to the round based on the current phase
    function addBet(bet, round) {
        if (round.phase == 0) {
            round.preflopBets.push(bet);
        } else if (round.phase == 1) {
            round.flopBets.push(bet);
        }  else if (round.phase == 2) {
            round.turnBets.push(bet);
        }  else if (round.phase == 3) {
            round.riverBets.push(bet);
        }
    }

    function getRecentRaiseAmount(bets) {
        for (var i = bets.length-1; i >= 0; i--) {
            if (bets[i].charAt(1) == "r") {
                return parseInt(bets[i].substring(2), 10);
            }
        }
    }

    function postBet(code, round, bet) {
        // Action moves to next player
        round.action += 1;
        if (round.action == round.players.length) {
            round.action = 0;
        }

        // Much else needs to be in here

        // Determine if moving to next phase
        if (round.folded.size == round.players.length - 1) {
            // Everyone except one folded
        }

        if (round.action == round.cycleEndsAt) {
            // Full cycle made, move to next phase
            round.phase += 1;

            if (round.phase == 4) {
                // Round finished, move on to next round
            }
        }

        io.sockets.to(code).emit('postBet', round, bet);
    }
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

app.get('/game/card_parser.js', function(req, res) {
    res.sendFile(__dirname + '/game/card_parser.js');
});

app.get('/game/pick_action.js', function(req, res) {
    res.sendFile(__dirname + '/game/pick_action.js');
});

app.get('/game/in_game.js', function(req, res) {
    res.sendFile(__dirname + '/game/in_game.js');
});

app.get('/game/in_game.css', function(req, res) {
    res.sendFile(__dirname + '/game/in_game.css');
});

app.get('/game/in_game.html', function(req, res) {
    if (req.session.userName != null) {
        res.sendFile(__dirname + '/game/in_game.html');
    } else {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/stats/personal_stats.js', function(req, res) {
    res.sendFile(__dirname + '/stats/personal_stats.js');
});

app.get('/stats/hand_history.js', function(req, res) {
    res.sendFile(__dirname + '/stats/hand_history.js');
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
