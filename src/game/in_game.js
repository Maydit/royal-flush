var socket = io();

// New person joined the game
socket.on('updatePlayers', function(newPlayer) {
    document.getElementById("players").innerHTML = document.getElementById("players").innerHTML + "<br>" + newPlayer;
    App.addPlayer(newPlayer);
});

// New person joined the game
socket.on('beginRound', function(round) {
    App.beginRound(round);
});

// Someone bet
socket.on('postBet', function(round) {
    App.postBet(round);
});

const App = new Vue({
    el: '#app',
    data: {
        code: "",
		username: "",
        userId: "",
        roundInfo: {}
    },
    methods: {
        addPlayer(player) {
            this.names.push(player);
        },
        beginRound(round) {
            this.roundInfo = round;
            console.log(this.roundInfo);
            // NOTE: action will eventually be on 2 + small blind
            document.getElementById("action").innerHTML = "Action on " + this.roundInfo.names[this.roundInfo.action];
            document.getElementById("currentHand").innerHTML = "Hand: " + this.roundInfo.cards[index(this.roundInfo.players, this.userId)];
        },
        postBet(round) {
            this.roundInfo = round;
            console.log(this.roundInfo);
            if (this.roundInfo.phase == 1 && this.roundInfo.flopBets.length == 0) {
                // Flop just came out
                document.getElementById("commCards").innerHTML = "Cards on Table: " + this.roundInfo.commCards.substring(0, 6);
                addToLog("Flop is out");
            } else if (this.roundInfo.phase == 2 && this.roundInfo.turnBets.length == 0) {
                // Turn just came out
                document.getElementById("commCards").innerHTML = "Cards on Table: " + this.roundInfo.commCards.substring(0, 8);
                addToLog("Turn is out");
            } else if (this.roundInfo.phase == 3 && this.roundInfo.riverBets.length == 0) {
                // Turn just came out
                document.getElementById("commCards").innerHTML = "Cards on Table: " + this.roundInfo.commCards;
                addToLog("River is out");
            }
            document.getElementById("action").innerHTML = "Action on " + this.roundInfo.names[this.roundInfo.action];
        },

        // Player actions
        check() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                // Check if 'check' is legal
                var lastRaise = findLastRaise(this.roundInfo);
                if (lastRaise == 0) {
                    socket.emit('check', this.code);
                } else {
                    addToLog("can't check!");
                }
            } else {
                addToLog("not your turn!");
            }
        },
        match() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                // Check if 'match' is legal
                var lastRaise = findLastRaise(this.roundInfo);
                if (lastRaise != 0) {
                    socket.emit('match', this.code);
                } else {
                    addToLog("can't match!");
                }
            } else {
                addToLog("not your turn!");
            }
        },
        raise() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                if (!(/^\d+$/.test(this.raiseAmount))) {
                    addToLog("Invalid raise amount!");
                    return;
                }
                var raiseInt = parseInt(this.raiseAmount, 10);
                if (raiseInt <= 0) {
                    addToLog("Raise amount must be greater than 0!");
                    return;
                }
                var lastRaise = findLastRaise(this.roundInfo);
                if (raiseInt <= lastRaise) {
                    addToLog("Raise amount must be greater than last raise");
                    return;
                }
                socket.emit('raise', this.code, raiseInt);
            } else {
                addToLog("not your turn!");
            }
        },
        fold() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                socket.emit('fold', this.code);
            } else {
                addToLog("not your turn!");
            }
        }
    },
    beforeMount() {
        // Obtains the code and joins that room
        var url = window.location.href;
        this.code = url.substring(url.length-4, url.length);
        document.getElementById("code").innerHTML = "CODE: " + this.code;

		// Sets the variable username
		this.$http.get('http://' + window.location.host + '/getName').then(response => {
			this.username = response.body;

			// Grabs the userID from the database
			this.$http.get('http://' + window.location.host + '/getUserId').then(response => {
				this.userId = response.body;

                this.$http.get('http://' + window.location.host + '/getNames/' + this.code).then(response => {
                    this.names = response.body;
                    for (var i = 0; i < this.names.length; i++) {
                        document.getElementById("players").innerHTML = document.getElementById("players").innerHTML + "<br>" + this.names[i];
                    }
                    this.position = this.names.length;
                    document.getElementById("players").innerHTML = document.getElementById("players").innerHTML + "<br>" + this.username + " (you)";

                    socket.emit('gameJoin', this.code, this.username, this.userId);
                });

			});
		});
    }
});

// Given an array and a string, finds the index of the string in the array
function index(arr, str) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == str) {
            return i;
        }
    }
}

// Given an array of bets, determines the most recent raise. Returns 0 if there
// was no raise.
function findLastRaiseHelper(arr) {
    for (var i = arr.length-1; i >= 0; i--) {
        if (arr[i].charAt(1) == "r") {
            return parseInt(arr[i].substring(2), 10);
        }
    }
    return 0;
}

// Given a round, determines the most recent raise based on the phase.
function findLastRaise(roundInfo) {
    var lastRaise;
    if (roundInfo.phase == 0) {
        lastRaise = findLastRaiseHelper(roundInfo.preflopBets);
    } else if (roundInfo.phase == 1) {
        lastRaise = findLastRaiseHelper(roundInfo.flopBets);
    } else if (roundInfo.phase == 2) {
        lastRaise = findLastRaiseHelper(roundInfo.turnBets);
    } else if (roundInfo.phase == 3) {
        lastRaise = findLastRaiseHelper(roundInfo.riverBets);
    }
    return lastRaise;
}


// Adds a string to the in game log
function addToLog(str) {
    document.getElementById("gameLog").innerHTML = str + "<br>" + document.getElementById("gameLog").innerHTML;
}
