var socket = io();

// Tells the player whether or not they were able ot join
socket.on('joinResult', function(message) {
    document.getElementById("confirmationMessage").innerHTML = message;
});

// Moves to the game with the room name being transferred over
socket.on('startGame', function(room) {
    window.location.href = "player_game.html?room="+room;
});

const App = new Vue({
    el: '#app',
    data: {
        inputCode: "asdf"
    },
    methods: {
        join() {
            socket.emit('joinRoom', this.inputCode);
        }
    }
});
