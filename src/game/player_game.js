var socket = io();

// Invoked by the submit button, tells the user their request went through
function displaySnack() {
    var x = document.getElementById("snackbar");
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

const App = new Vue({
    el: '#app',
    data: {
        code: "",
        userId: ""
    },
    methods: {
        sendCards() {
            var card1Select = document.getElementById("card1");
            var card1 = card1Select.options[card1Select.selectedIndex].value;
            var suit1Select = document.getElementById("suit1");
            var suit1 = suit1Select.options[suit1Select.selectedIndex].value;
            var card2Select = document.getElementById("card2");
            var card2 = card2Select.options[card2Select.selectedIndex].value;
            var suit2Select = document.getElementById("suit2");
            var suit2 = suit2Select.options[suit2Select.selectedIndex].value;
            var cardsStr = card1 + suit1 + card2 + suit2;
            this.$http.post('http://' + window.location.host + '/sendCards/' + this.code + "/" + cardsStr + "/" + this.userId);
        }
    },
    beforeMount() {
        // Obtains the code and joins that room
        var str = window.location.href;
        var code = str.substring(str.length-4, str.length);
        this.code = code;
        socket.emit('gameJoin', code);
        this.$http.get('http://' + window.location.host + '/getUserId').then(response => {
            this.userId = response.body;
        });
    }
});
