const App = new Vue({
    el: '#app',
    beforeMount() {
        this.$http.get('http://' + window.location.host + '/getStats').then(response => {
            var statsArr = response.body.split(",");
            document.getElementById("vpip").innerHTML = statsArr[0];

            // Formats the percentages
            if (statsArr[0].charAt(0) != 'N') {
                document.getElementById("vpip").innerHTML += "%";
            }
            document.getElementById("pfr").innerHTML = statsArr[1];
            if (statsArr[1].charAt(0) != 'N') {
                document.getElementById("pfr").innerHTML += "%";
            }
            document.getElementById("agg").innerHTML = statsArr[2];
            if (statsArr[2].charAt(0) != 'N') {
                document.getElementById("agg").innerHTML += "%";
            }
            document.getElementById("psw").innerHTML = statsArr[3];
            if (statsArr[3].charAt(0) != 'N') {
                document.getElementById("psw").innerHTML += "%";
            }
        });
    }
});
