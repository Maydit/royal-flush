var socket = io();

// New person joined the game
socket.on('updatePlayers', function(round) {
    App.updatePlayers(round);
});

// New round starting
socket.on('beginRound', function(round, winner) {
    App.updatePlayers(round);
    App.beginRound(round, winner);
});

// Someone bet
socket.on('postBet', function(round, bet) {
    App.updatePlayers(round);
    App.postBet(round, bet);
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
        // Updates all players and their stacks
        updatePlayers(round) {
            this.roundInfo = round;
            document.getElementById("players").innerHTML = "";
            for (var i = 0; i < this.roundInfo.names.length; i++) {
                document.getElementById("players").innerHTML = document.getElementById("players").innerHTML + this.roundInfo.stacks[i] + " " + this.roundInfo.names[i];
                if (this.roundInfo.players[i] == this.userId) {
                    document.getElementById("players").innerHTML = document.getElementById("players").innerHTML + " (you)";
                }
                document.getElementById("players").innerHTML = document.getElementById("players").innerHTML + "<br>";
            }
        },
        // New round is initiated
        beginRound(round, winner) {
            this.roundInfo = round;
            console.log(this.roundInfo);
            if (winner.length > 0) {
                addToLog(winner + " won the hand!");
            }
            addToLog("Cards dealt!");
            // NOTE: action will eventually be on 2 + small blind
            document.getElementById("action").innerHTML = "Action on " + this.roundInfo.names[this.roundInfo.action];
            document.getElementById("currentHand").innerHTML = "Hand: " + this.roundInfo.cards[index(this.roundInfo.players, this.userId)];
            document.getElementById("commCards").innerHTML = "Cards on Table:";
        },
        // Activated after someone makes a bet
        postBet(round, bet) {
            this.roundInfo = round;
            console.log(this.roundInfo);
            interpretBet(bet, this.roundInfo);
            if (this.roundInfo.phase == 1 && this.roundInfo.flopBets.length == 0) {
                // Flop just came out
                document.getElementById("commCards").innerHTML = "Cards on Table: " + this.roundInfo.commCards.substring(0, 6);
                addToLog("Flop is out.");
            } else if (this.roundInfo.phase == 2 && this.roundInfo.turnBets.length == 0) {
                // Turn just came out
                document.getElementById("commCards").innerHTML = "Cards on Table: " + this.roundInfo.commCards.substring(0, 8);
                addToLog("Turn is out.");
            } else if (this.roundInfo.phase == 3 && this.roundInfo.riverBets.length == 0) {
                // Turn just came out
                document.getElementById("commCards").innerHTML = "Cards on Table: " + this.roundInfo.commCards;
                addToLog("River is out.");
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
                    addToLog("Can't check!");
                }
            } else {
                addToLog("Not your turn!");
            }
        },
        match() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                // Check if 'match' is legal
                var lastRaise = findLastRaise(this.roundInfo);
                if (lastRaise != 0) {
                    socket.emit('match', this.code);
                } else {
                    addToLog("Can't match!");
                }
            } else {
                addToLog("Not your turn!");
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
                if (raiseInt > this.roundInfo.stacks[index(this.roundInfo.players, this.userId)]) {
                    addToLog("You don't have enough money to raise that much!");
                    return;
                }
                var lastRaise = findLastRaise(this.roundInfo);
                if (raiseInt <= lastRaise) {
                    addToLog("Raise amount must be greater than last raise");
                    return;
                }
                socket.emit('raise', this.code, raiseInt);
            } else {
                addToLog("Not your turn!");
            }
        },
        fold() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                socket.emit('fold', this.code);
            } else {
                addToLog("Not your turn!");
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

                socket.emit('gameJoin', this.code, this.username, this.userId);
			});
		});
    }
});

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

// Given a bet structure, turns it into a readable string and adds it to the log
function interpretBet(bet, roundInfo) {
    var player = parseInt(bet.substring(0, 1), 10);
    var playerIndex = index(roundInfo.positions, player);
    var playerName = roundInfo.names[playerIndex];

    var action;
    var amount = ".";
    if (bet.charAt(1) == "c") {
        action = " checked";
    } else if (bet.charAt(1) == "m") {
        action = " matched";
    } else if (bet.charAt(1) == "f") {
        action = " folded";
    } else if (bet.charAt(1) == "r") {
        amount = " " + bet.substring(2) + ".";
        action = " raised";
    }

    addToLog(playerName + action + amount);
}

// Given an array and an element, finds the index of the string in the array
function index(arr, element) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == element) {
            return i;
        }
    }
}

// Adds a string to the in game log
function addToLog(str) {
    document.getElementById("gameLog").innerHTML = str + "<br>" + document.getElementById("gameLog").innerHTML;
}
