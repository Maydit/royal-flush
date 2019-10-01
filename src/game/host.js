var socket = io();

// Alerts the host that a new player has joined their room
socket.on('updatePlayers', function() {
    document.getElementById("players").innerHTML = document.getElementById("players").innerHTML + " 1";
});

// Moves to the game with the room name being transferred over
socket.on('startHost', function(room) {
    window.location.href = "host_game.html?room="+room;
});

const App = new Vue({
    el: '#app',
    data: {
        code: "",
        numPlayers: 1
    },
    methods: {
        incrementPlayers() {
            this.numPlayers += 1;
        },
        submit() {
            socket.emit('beginGame', this.code);
        }
    },
    beforeMount() {
        // Randomly generates a code
        for (var i = 0; i < 4; i++) {
            var rand = Math.floor(Math.random() * 26);
            var char = String.fromCharCode(65+rand);
            this.code += char;
        }

        console.log(this.code);
        socket.emit('createRoom', this.code);
    }
});
