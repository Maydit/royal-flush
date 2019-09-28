var socket = io();

const App = new Vue({
    el: '#app',
    data: {
    },
    methods: {
    },
    beforeMount() {
        // Obtains the code and joins that room
        var str = window.location.href;
        var code = str.substring(str.length-4, str.length);
        socket.emit('gameJoin', code);
    }
});
