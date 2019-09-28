var socket = io();

socket.on('joinResult', function(message) {
    document.getElementById("confirmationMessage").innerHTML = message;
});

socket.on('startGame', function(room) {
    window.location.href = "player_game.html?room="+room;
});

const App = new Vue({
    el: '#app',
    methods: {
        join() {
            socket.emit('joinRoom', this.inputCode);
        }
    }
});
