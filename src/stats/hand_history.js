const App = new Vue({
    el: '#app',
    beforeMount() {
        this.$http.get('http://' + window.location.host + '/getHandHistory').then(response => {
            console.log(response);
            for (var i = 0; i < response.body.length; i++) {
                document.getElementById("table").innerHTML += "<tr><td>" + response.body[i].substring(0, 2) + "</td><td>" + response.body[i].substring(2, 4) + "</td><td>" + response.body[i].substring(5) +"</td></tr>";
            }
        });
    }
});
