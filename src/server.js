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

////////////////////////////////////////////////////////////////////////////////
// Poker Calculation Classes

class Card {
    constructor(cardStr) {
        var rank = cardStr.charAt(0);
        this.rank = "  23456789TJQKA".indexOf(rank);
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

function cardSorter(a, b) {
    return ((a.rank < b.rank) ? -1 : ((a.rank > b.rank) ? 1 : 0));
}

// Returns T or F based on whether there is a straight flush
function checkForStraightFlush(cards) {
    var flushHand = checkForFlush(cards);
    if (flushHand.length != 0) {
        const straightFlushHand = checkForStraight(flushHand);
        return straightFlushHand;
    }
    return flushHand;
}

// Returns C, D, H, or S depending on what suit the flush is. If there is no
// flush, will return the character F.
function checkForFlush(cards) {
    var cCount = 0;
    var dCount = 0;
    var hCount = 0;
    var sCount = 0;
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].suit == 'C') {
            cCount++;
        } else if (cards[i].suit == 'D') {
            dCount++;
        } else if (cards[i].suit == 'H') {
            hCount++;
        } else {
            sCount++;
        }
    }
    if (cCount >= 5) {
        return extractFlush(cards, 'C');
    } else if (dCount >= 5) {
        return extractFlush(cards, 'D');
    } else if (hCount >= 5) {
        return extractFlush(cards, 'H');
    } else if (sCount >= 5) {
        return extractFlush(cards, 'S');
    } else {
        return [];
    }
}

// Called only when a flush exists, grabs the cards of the input suit from the
// inputted cards
function extractFlush(cards, suit) {
    var flushHand = [];
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].suit == suit) {
            flushHand.push(cards[i]);
        }
    }
    return flushHand;
}

// Takes a SORTED array of cards and returns an array if there is a straight. If
// there is no straight, an empty array is returned.
function checkForStraight(originalCards) {
    // Remove duplicates to make our algorithm easier
    var cards = Array.from(originalCards);
    var prev = cards[0].rank;
    for (var i = 1; i < cards.length; i++) {
        if (cards[i].rank == prev) {
            cards.splice(i, 1);
            i--;
        } else {
            prev = cards[i].rank;
        }
    }

    var straightHand = [];
    for (i = cards.length - 5; i >= 0; i--) {
        if (cards[i].rank == cards[i+4].rank - 4) {
            for (var j = i; j < i+5; j++) {
                straightHand.push(cards[j]);
            }
            return straightHand;
        }
    }
    // Edge case for A-5
    if (cards[0].rank == 2 && cards[3].rank == 5 && cards[cards.length-1].rank == 14) {
        straightHand.push(cards[0]);
        straightHand.push(cards[1]);
        straightHand.push(cards[2]);
        straightHand.push(cards[3]);
        straightHand.push(cards[cards.length-1]);
    }
    return straightHand;
}

// Looks for 4 of a kind, returns the bomb + high card or an empty array if no
// bomb is present.
function checkForBomb(originalCards) {
    // Remove duplicates to make our algorithm easier
    var cards = Array.from(originalCards);

    var bombHand = [];
    for (var i = 0; i < cards.length-3; i++) {
        if (cards[i].rank == cards[i+3].rank) {
            // Bomb exists
            for (var j = i; j < i+4; j++) {
                bombHand.push(cards[i]);
                cards.splice(i, 1);
            }
            bombHand.push(cards[cards.length-1]);
        }
    }
    return bombHand;
}

// Looks for a full house, returns the full house or an empty array if no full
// house is present.
function checkForFullHouse(originalCards) {
    // Remove duplicates to make our algorithm easier
    var cards = Array.from(originalCards);

    var houseHand = [];

    // All the ranks of the cards that have trips. Ordered.
    var tripArr = checkforTrips(cards);
    if (tripArr.length == 2) {
        // Full house exists, there are 2 trips.
        var smallerCount = 0;
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].rank == tripArr[1]) {
                houseHand.push(cards[i]);
            } else if (cards[i].rank == tripArr[0] && smallerCount != 2) {
                smallerCount += 1;
                houseHand.push(cards[i]);
            }
        }
    } else if (tripArr.length == 1) {
        // Remove the triplets from the cards to check for pairs
        for (i = 0; i < cards.length; i++) {
            if (cards[i].rank == tripArr[0]) {
                houseHand.push(cards[i]);
                cards.splice(i,1);
                i -= 1;
            }
        }

        var pairArr = checkForPairs(cards);
        if (pairArr.length != 0) {
            for (i = 0; i < cards.length; i++) {
                if (cards[i].rank == pairArr[pairArr.length - 1]) {
                    houseHand.push(cards[i]);
                }
            }
        } else {
            return [];
        }
    }
    return houseHand;
}

// Looks for 3 of a kind: under the assumption that there are NO bombs. Returns
// an array with all the ranks that have trips. Max length 2
function checkforTrips(cards) {
    var tripArr = [];
    for (var i = 0; i < cards.length-2; i++) {
        if (cards[i].rank == cards[i+2].rank) {
            tripArr.push(cards[i].rank);
        }
    }
    return tripArr;
}

// Looks for pairs: under the assumption that there are NO trips. Returns an
// array with all the ranks that have pairs
function checkForPairs(cards) {
    var pairArr = [];
    for (var i = 0; i < cards.length-1; i++) {
        if (cards[i].rank == cards[i+1].rank) {
            pairArr.push(cards[i].rank);
        }
    }
    return pairArr;
}

function handSorter(hand1, hand2) {
    if (hand1.strength > hand2.strength) {
        return 1;
    } else if (hand1.strength < hand2.strength) {
        return -1;
    } else {
        // same kind of hand, need to see which is better
        if (hand1.strength == 8 || hand1.strength == 5 || hand1.strength == 4 || hand1.strength == 0) {
            // For these hands, just check who has the higher cards
            for (var i = 4; i >= 0; i--) {
                if (hand1.cards[i].compareTo(hand2.cards[i]) == 1) {
                    return 1;
                } else if (hand1.cards[i].compareTo(hand2.cards[i]) == -1) {
                    return -1;
                }
            }
            return 0;
        }

        if (hand1.strength == 7 || this.strength == 6) {
            // For these hands, check the first card and then the last card.
            if (hand1.cards[0].compareTo(hand2.cards[0]) == 1) {
                return 1;
            } else if (hand1.cards[0].compareTo(hand2.cards[0]) == -1) {
                return -1;
            }
            if (hand1.cards[4].compareTo(hand2.cards[4]) == 1) {
                return 1;
            } else if (hand1.cards[4].compareTo(hand2.cards[4]) == -1) {
                return -1;
            }
            return 0;
        }

        if (hand1.strength == 3 || hand1.strength == 1) {
            // Check 1st, then 5th and 4th.
            if (hand1.cards[0].compareTo(hand2.cards[0]) == 1) {
                return 1;
            } else if (hand1.cards[0].compareTo(hand2.cards[0]) == -1) {
                return -1;
            }
            if (hand1.cards[4].compareTo(hand2.cards[4]) == 1) {
                return 1;
            } else if (hand1.cards[4].compareTo(hand2.cards[4]) == -1) {
                return -1;
            }
            if (hand1.cards[3].compareTo(hand2.cards[3]) == 1) {
                return 1;
            } else if (hand1.cards[3].compareTo(hand2.cards[3]) == -1) {
                return -1;
            }

            if (hand1.strength == 3) {
                return 0;
            } else {
                // One more round for pairs instead of 3 of a kind
                if (hand1.cards[2].compareTo(hand2.cards[2]) == 1) {
                    return 1;
                } else if (hand1.cards[2].compareTo(hand2.cards[2]) == -1) {
                    return -1;
                }
                return 0;
            }
        }

        // this is for 2 pairs, check 3rd, 1st, last.
        if (hand1.cards[2].compareTo(hand2.cards[2]) == 1) {
            return 1;
        } else if (hand1.cards[2].compareTo(hand2.cards[2]) == -1) {
            return -1;
        }
        if (hand1.cards[0].compareTo(hand2.cards[0]) == 1) {
            return 1;
        } else if (hand1.cards[0].compareTo(hand2.cards[0]) == -1) {
            return -1;
        }
        if (hand1.cards[4].compareTo(hand2.cards[4]) == 1) {
            return 1;
        } else if (hand1.cards[4].compareTo(hand2.cards[4]) == -1) {
            return -1;
        }
        return 0;
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

        cards.sort(cardSorter);

        // Check for hands in decreasing strength

        var straightFlushHand = checkForStraightFlush(cards);
        if (straightFlushHand.length != 0) {
            this.strength = 8;
            this.cards = straightFlushHand;
            return;
        }
        var bombHand = checkForBomb(cards);
        if (bombHand.length != 0) {
            this.strength = 7;
            this.cards = bombHand;
            return;
        }
        var houseHand = checkForFullHouse(cards);
        if (houseHand.length != 0) {
            this.strength = 6;
            this.cards = houseHand;
            return;
        }
        var flushHand = checkForFlush(cards);
        if (flushHand.length != 0) {
            // Must reduce to 5
            while (flushHand.length > 5) {
                flushHand.shift();
            }
            this.strength = 5;
            this.cards = flushHand;
            return;
        }
        var straightHand = checkForStraight(cards);
        if (straightHand.length != 0) {
            this.strength = 4;
            this.cards = straightHand;
            return;
        }
        var tripArr = checkforTrips(cards);
        if (tripArr.length != 0) {
            // If true, length MUST be 1.
            this.cards = [];
            for (i = 0; i < cards.length; i++) {
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
        var pairArr = checkForPairs(cards);
        if (pairArr.length != 0) {
            if (pairArr.length > 1) {
                // 2 pair
                this.cards = [];
                for (i = 0; i < cards.length; i++) {
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
                for (i = 0; i < cards.length; i++) {
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
// Game backend

app.get("/getName", (req, res) => {
    res.send(req.session.userName);
});

app.get("/getUserId", (req, res) => {
    res.send(req.session.userId);
});

app.get("/getCurrentPlayer/:code", (req, res) => {
    var code = req.params.code;

    var hand = rooms.get(code);
    for (var i = 0; i < hand.players.length; i++) {
        if (hand.positions[i] == 0) {
            res.send(hand.names[i]);
        }
    }
});

app.get("/getPositions/:code", (req, res) => {
    var code = req.params.code;
    var hand = rooms.get(code);
    res.send(hand.positions);
});

app.get("/getNames/:code", (req, res) => {
    var code = req.params.code;
    var hand = rooms.get(code);
    res.send(hand.names);
});

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
    //console.log(hand);
    res.send(true);
});

app.get("/recordHand/:code/:commCardsStr/:notFolded", (req, res) => {
    var code = req.params.code;
    var hand = rooms.get(code);
    var notFoldedStr = req.params.notFolded;
    //console.log("DONE!");

    // Add community cards to the hand
    hand.commCards = req.params.commCardsStr;

    // Check who won
    var allHands = [];
    for (var i = 0; i < notFoldedStr.length; i++) {
        var playerPos = parseInt(notFoldedStr.charAt(i));
        var currentHand = new Hand(hand.cards[playerPos] + hand.commCards);
        allHands.push(currentHand);
    }
    var sortedHands = Array.from(allHands);
    sortedHands.sort(handSorter);
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

    for (i = 0; i < hand.players.length; i++) {
        dupHand.players.push(hand.players[i]);
    }
    for (i = 0; i < hand.names.length; i++) {
        dupHand.names.push(hand.names[i]);
    }
    for (i = 0; i < hand.stacks.length; i++) {
        dupHand.stacks.push(hand.stacks[i]);
    }
    for (i = 0; i < hand.cards.length; i++) {
        dupHand.cards.push(hand.cards[i]);
    }
    for (i = 0; i < hand.positions.length; i++) {
        dupHand.positions.push(hand.positions[i]);
    }
    for (i = 0; i < hand.preflopBets.length; i++) {
        dupHand.preflopBets.push(hand.preflopBets[i]);
    }
    for (i = 0; i < hand.flopBets.length; i++) {
        dupHand.flopBets.push(hand.flopBets[i]);
    }
    for (i = 0; i < hand.turnBets.length; i++) {
        dupHand.turnBets.push(hand.turnBets[i]);
    }
    for (i = 0; i < hand.riverBets.length; i++) {
        dupHand.riverBets.push(hand.riverBets[i]);
    }
    dupHand.commCards = hand.commCards;
    dupHand.winner = hand.winner;
    dupHand.pot = hand.pot;


    MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        var hand_id;
        var database = client.db("rawData");
        database.collection("hands").insertOne(dupHand, function(err, res) {
            if (err) {
                throw err;
            } else {

                hand_id = res.insertedId;

                var user_db = client.db("test");
                for (i = 0; i<hand.players.length ;i++)
                {
                    var query =  {_id : new ObjectId(hand.players[i].toString()) };
                    var new_val = {$push: {hands:hand_id}};



                     user_db.collection("users").updateOne(query, new_val, function(err, res)
                     {
                         if (err) throw err;

                     });
                }
            }
        });
    });

    // Switch positions
    hand.positions.unshift(hand.positions[hand.positions.length - 1]);
    hand.positions.pop();
    //console.log(hand.positions);

    // Reset variables
    for (i = 0; i < hand.players.length; i++) {
        hand.cards[i] = "";
    }
    hand.preflopBets = [];
    hand.flopBets = [];
    hand.turnBets = [];
    hand.riverBets = [];
    hand.commCards = "";

    res.send(hand.winner.toString());
});

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
        //console.log("In game: joined room " + code);
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

    if(req.session.userName)
    {
        res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
    }
    else
    {
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

    if(req.session.userName)
    {
        res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
    }
    else
    {
        res.sendFile(__dirname + "/login/sign_in.html");
    }
});

app.get("/login/sign_in.css", (req, res) => {
    res.sendFile(__dirname + "/login/sign_in.css");
});

app.get('/game/pick_action.html', function(req, res) {

    if(req.session.userName != null)
    {
        res.sendFile(__dirname + '/game/pick_action.html');
    }
    else
    {
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

app.get('/game/player_game.html', function(req, res) {

    if(req.session.userName != null)
    {
        res.sendFile(__dirname + '/game/player_game.html');
    }
    else
    {
        res.redirect(req.protocol + '://' + req.get('host'));
    }

});

app.get('/game/player_game.css', function(req, res) {
    res.sendFile(__dirname + '/game/player_game.css');
});

app.get('/game/host_game.html', function(req, res) {

    if(req.session.userName != null)
    {
        res.sendFile(__dirname + '/game/host_game.html');
    }
    else
    {
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

    if(req.session.userName != null)
    {
        res.sendFile(__dirname + '/game/host.html');
    }
    else
    {
        res.redirect(req.protocol + '://' + req.get('host'));
    }

});

app.get('/game/host.css', function(req, res) {
    res.sendFile(__dirname + '/game/host.css');
});

app.get('/game/join.html', function(req, res) {

    if(req.session.userName != null)
    {
        res.sendFile(__dirname + '/game/join.html');
    }
    else
    {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/game/join.css', function(req, res) {
    res.sendFile(__dirname + '/game/join.css');
});

app.get('/stats/stats_home.html', function(req, res) {


    if(req.session.userName != null)
    {
        res.sendFile(__dirname + '/stats/stats_home.html');
    }
    else
    {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/stats/stats_home.css', function(req, res) {
    res.sendFile(__dirname + '/stats/stats_home.css');
});

app.get('/stats/hand_history.html', function(req, res) {

    if(req.session.userName != null)
    {
        res.sendFile(__dirname + '/stats/hand_history.html');
    }
    else
    {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/stats/hand_history.css', function(req, res) {
    res.sendFile(__dirname + '/stats/hand_history.css');
});

app.get('/stats/personal_stats.html', function(req, res) {



    if(req.session.userName != null)
    {
        res.sendFile(__dirname + '/stats/personal_stats.html');
    }
    else
    {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/stats/personal_stats.css', function(req, res) {
    res.sendFile(__dirname + '/stats/personal_stats.css');
});

app.get('/stats/global_stats.html', function(req, res) {



    if(req.session.userName != null)
    {
        res.sendFile(__dirname + '/stats/global_stats.html');
    }
    else
    {
        res.redirect(req.protocol + '://' + req.get('host'));
    }
});

app.get('/stats/global_stats.css', function(req, res) {
    res.sendFile(__dirname + '/stats/global_stats.css');
});




app.get("/", (req, res) => {
    if(req.session.userName)
    {
        res.redirect(req.protocol + '://' + req.get('host') + '/game/pick_action.html');
    }
    else
    {
        res.sendFile(__dirname + "/index.html");
    }

});

/////////////////////////////////////////////////////////////////////////////

// Puts it on a port
http.listen(3000, function(){
  //console.log('Server up on 3000');
});
