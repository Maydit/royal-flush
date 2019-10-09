var socket = io();

const App = new Vue({
    el: '#app',
    data: {
        code: "",
        currentPlayer: ""
    },
    methods: {
        done() {
            this.$http.get('http://' + window.location.host + '/recordHand/' + this.code).then(response => {
                console.log(response);
                this.setCurrentPlayer();
            });
        },
        setCurrentPlayer() {
            this.$http.get('http://' + window.location.host + '/getCurrentPlayer/' + this.code).then(response => {
                this.currentPlayer = response.body;
            });
        }
    },
    beforeMount() {
        // Obtains the code and joins that room
        var str = window.location.href;
        var code = str.substring(str.length-4, str.length);
        this.code = code;
        socket.emit('gameJoin', code);

        this.setCurrentPlayer();
    }
});
