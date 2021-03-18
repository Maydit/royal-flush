var socket = io();

// New person joined the game
socket.on('updatePlayers', function(newPlayer) {
    document.getElementById("players").innerHTML = document.getElementById("players").innerHTML + "<br>" + newPlayer;
    this.names.push(newPlayer);
});

// New person joined the game
socket.on('dealAndStart', function(deck) {
    App.dealCards(deck);
    App.beginRound();
});

const App = new Vue({
    el: '#app',
    data: {
        code: "",
        currentHand: "",
        smallBlind: 0,
        action: 0,
		username: "",
		names: [],
        position: 0,
        numPlayers: 1
    },
    methods: {
        dealCards(deck) {
            this.currentHand = deck[this.position*2] + " " + deck[(this.position*2)+1];
            document.getElementById("currentHand").innerHTML = "Hand: " + this.currentHand;
        },
        beginRound() {
            // NOTE: action will eventually be on 2 + small blind
            document.getElementById("action").innerHTML = "Action on " + this.names[this.smallBlind];
            this.action = this.smallBlind;
        },

        // Player actions
        check() {
            socket.emit('check');
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
