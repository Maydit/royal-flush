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
            document.getElementById("action").innerHTML = "Action on " + this.roundInfo.names[this.roundInfo.action];
        },

        // Player actions
        check() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                // Check if 'check' is legal
                var canCheck;
                if (this.roundInfo.phase == 0) {
                    canCheck = noRaise(this.roundInfo.preflopBets);
                } else if (this.roundInfo.phase == 1) {
                    canCheck = noRaise(this.roundInfo.flopBets);
                } else if (this.roundInfo.phase == 2) {
                    canCheck = noRaise(this.roundInfo.turnBets);
                } else if (this.roundInfo.phase == 3) {
                    canCheck = noRaise(this.roundInfo.riverBets);
                }
                if (canCheck) {
                    socket.emit('check', this.code);
                } else {
                    console.log("can't check!");
                }
            } else {
                console.log("not your turn!");
            }
        },
        match() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                // Check if 'match' is legal
                var canMatch;
                if (this.roundInfo.phase == 0) {
                    canMatch = !(noRaise(this.roundInfo.preflopBets));
                } else if (this.roundInfo.phase == 1) {
                    canMatch = !(noRaise(this.roundInfo.flopBets));
                } else if (this.roundInfo.phase == 2) {
                    canMatch = !(noRaise(this.roundInfo.turnBets));
                } else if (this.roundInfo.phase == 3) {
                    canMatch = !(noRaise(this.roundInfo.riverBets));
                }
                if (canMatch) {
                    socket.emit('match', this.code);
                } else {
                    console.log("can't match!");
                }
            } else {
                console.log("not your turn!");
            }
        },
        raise() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                var raiseInt = parseInt(this.raiseAmount, 10);
                socket.emit('raise', this.code, raiseInt);
            } else {
                console.log("not your turn!");
            }
        },
        fold() {
            if (this.roundInfo.action == index(this.roundInfo.players, this.userId)) {
                socket.emit('fold', this.code);
            } else {
                console.log("not your turn!");
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

// Given an array of bets, determines if any of them are a raise
function noRaise(arr) {
    console.log("noraise()");
    console.log(arr);
    for (var i = 0; i < arr; i++) {
        if (arr[i].charAt(1) == "r") {
            return false;
        }
    }
    return true;
}
