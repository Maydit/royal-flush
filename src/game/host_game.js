var socket = io();

const App = new Vue({
    el: '#app',
    data: {
        code: ""
    },
    methods: {
        done() {
            this.$http.get('http://' + window.location.host + '/recordHand/' + this.code).then(response => {
                console.log(response);
            });
        }
    },
    beforeMount() {
        // Obtains the code and joins that room
        var str = window.location.href;
        var code = str.substring(str.length-4, str.length);
        this.code = code;
        socket.emit('gameJoin', code);
    }
});
