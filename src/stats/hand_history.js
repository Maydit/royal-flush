const App = new Vue({
    el: '#app',
    beforeMount() {
        this.$http.get('http://' + window.location.host + '/getHandHistory').then(response => {
            console.log(response);
            for (var i = 0; i < response.body.length; i++) {
                var card1 = convertToUni(response.body[i].substring(0, 2));
                var card2 = convertToUni(response.body[i].substring(2, 4));











                document.getElementById("table").innerHTML += "<tr><td>" + card1 + "</td><td>" + card2 + "</td><td>" + response.body[i].substring(5) +"</td></tr>";
            }
        });
    }
});
