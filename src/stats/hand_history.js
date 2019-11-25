const App = new Vue({
    el: '#app',
    beforeMount() {
        this.$http.get('http://' + window.location.host + '/getHandHistory').then(response => {
            console.log(response);
        });
    }
});
