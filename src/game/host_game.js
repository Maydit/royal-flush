var socket = io();

/*
Game flow:

beginPreflop:
    Get the positions from server
    Sets the small blind amountInPot to 5 and the big blind amountInPot to 10
    Sets the first better as the UTG player

perform actions until we reach the cycleEndsAt player
check:
    Can only do if the amountInPot is equal to previous player's
raise:
    Can always do, but must raise to get to a value higher than previous player's
    Update amountInPot
    Set current as cycleEndsAt
match:
    Can only do if the amountInPot of previous player's is higher than yours
    Update amountInPot
fold:
    Can always do
    Update folded array

For all:
    Add that data to the hand (server side)
    Move to next player
    Check if you reached end of cycle

beginFlop:
    Ask for the 3 new community cards
    Sets the first better as the small blind (or earliest that isn't folded)

Go through cycle again

beginTurn:
    Ask for the 1 new community card
    Sets the first better as the small blind (or earliest that isn't folded)

Go through cycle again

beginRiver:
    Ask for the 1 new community card
    Sets the first better as the small blind (or earliest that isn't folded)

Finished:
    Update positions
    Push all data
*/

const App = new Vue({
    el: '#app',
    data: {
        code: "",
        currentPlayer: "",
        // 0: preflop, 1: flop, 2: turn, 3: river
        phase: 0,
        index: 0,
        cycleEndsAt: 0,
        raiseAmount: "",
        positions: [],
        names: [],
        amountInPot: [],
        folded: []
    },
    methods: {
        beginPreflop() {
            this.setZeroPlayer();
            // 2 after big blind is the first one to bet pre flop; also set big
            // and small blind bets
            for (var i = 0; i < this.positions.length; i++) {
                this.amountInPot[i] = 0;
                this.folded[i] = false;
            }
            this.amountInPot[this.index] = 5;
            this.nextPlayer();
            this.amountInPot[this.index] = 10;
            this.nextPlayer();
            this.cycleEndsAt = this.index;
        },
        beginFlop() {
            this.setZeroPlayer();
            if (this.folded[this.index]) {
                this.nextPlayer();
                this.cycleEndsAt = this.index;
            }
        },
        beginTurn() {
            this.setZeroPlayer();
            if (this.folded[this.index]) {
                this.nextPlayer();
                this.cycleEndsAt = this.index;
            }
        },
        beginRiver() {
            this.setZeroPlayer();
            if (this.folded[this.index]) {
                this.nextPlayer();
                this.cycleEndsAt = this.index;
            }
        },
        setZeroPlayer() {
            for (var i = 0; i < this.positions.length; i++) {
                if (this.positions[i] == 0) {
                    this.currentPlayer = this.names[i];
                    document.getElementById("playerP").innerHTML = this.currentPlayer + "\'s turn";
                    this.index = i;
                    this.cycleEndsAt = i;
                    break;
                }
            }
        },
        nextPlayer() {
            while (true) {
                this.index += 1;
                if (this.index == this.names.length) {
                    this.index = 0;
                }

                if (this.folded[this.index] == false) {
                    break;
                }
            }
            this.currentPlayer = this.names[this.index];
            document.getElementById("playerP").innerHTML = this.currentPlayer + "\'s turn";
        },
        calcPrevAmountInPot() {
            // Returns the amount the previous player has in the pot
            var prevIndex = this.index;
            while (true) {
                prevIndex -= 1;
                if (prevIndex < 0) {
                    prevIndex = this.names.length - 1;
                }

                if (this.folded[prevIndex] == false) {
                    break;
                }
            }
            console.log("PREVINDEX: " + prevIndex);
            console.log("AMOUNT: " + this.amountInPot[prevIndex]);
            return this.amountInPot[prevIndex];
        },
        checkNextPhase() {
            var numActive = 0;
            for (var i = 0; i < this.folded.length; i++) {
                if (this.folded[i] == false) {
                    numActive += 1;
                }
            }
            var defaultWinner = (numActive == 1);
            if (defaultWinner) {
                this.phase = 0;
                this.$http.post('http://' + window.location.host + '/recordHand/' + this.code);
                this.positions.unshift(this.positions[this.positions.length - 1]);
                this.positions.pop();
                this.beginPreflop();
            } else if (this.index == this.cycleEndsAt) {
                console.log(this.phase);
                if (this.phase == 0) {
                    this.phase += 1;
                    this.beginFlop();
                } else if (this.phase == 1) {
                    this.phase += 1;
                    this.beginTurn();
                } else if (this.phase == 2) {
                    this.phase += 1;
                    this.beginRiver();
                } else if (this.phase == 3) {
                    this.phase = 0;
                    // Round done, send data
                    this.$http.post('http://' + window.location.host + '/recordHand/' + this.code);
                    this.positions.unshift(this.positions[this.positions.length - 1]);
                    this.positions.pop();
                    this.beginPreflop();
                }
            }
        },
        check() {
            // Check if the amountInPot is equal to previous player's
            var canDo = false;
            var prevAmountInPot = this.calcPrevAmountInPot();
            if (prevAmountInPot == this.amountInPot[this.index]) {
                canDo = true;
            }

            if (canDo) {
                var bet = this.positions[this.index].toString() + "c";
                this.actionSelected(bet, false);
            }

        },
        match() {
            var canDo = false;
            var prevAmountInPot = this.calcPrevAmountInPot();
            if (prevAmountInPot > this.amountInPot[this.index]) {
                canDo = true;
            }

            if (canDo) {
                this.amountInPot[this.index] = prevAmountInPot;
                var bet = this.positions[this.index].toString() + "m";
                this.actionSelected(bet, false);
            }
        },
        raise() {
            var canDo = false;
            var raiseInt = parseInt(this.raiseAmount, 10);
            var prevAmountInPot = this.calcPrevAmountInPot();
            if (prevAmountInPot < this.amountInPot[this.index] + raiseInt) {
                canDo = true;
            }

            if (canDo) {
                this.amountInPot[this.index] += raiseInt;
                var bet = this.positions[this.index].toString() + "r" + this.raiseAmount;
                this.cycleEndsAt = this.index;
                this.actionSelected(bet, false);
            }
        },
        fold() {
            this.folded[this.index] = true;
            // If cycle ends at this user, this is a special edge case.
            var foldedMarker = (this.cycleEndsAt == this.index);

            this.currentPlayer = this.names[this.index];
            var bet = this.positions[this.index].toString() + "f";
            this.actionSelected(bet, foldedMarker);
        },
        actionSelected(bet, foldedMarker) {
            for (var i = 0; i < this.amountInPot.length; i++) {
                console.log("amountInPot[" + i + "]: " + this.amountInPot[i]);
            }
            this.$http.post('http://' + window.location.host + '/addBet/' + this.code + '/' + bet + '/' + this.phase);
            this.nextPlayer();
            this.checkNextPhase();
            if (foldedMarker) {
                this.cycleEndsAt = this.index;
            }
        }
    },
    beforeMount() {
        // Obtains the code and joins that room
        var str = window.location.href;
        var code = str.substring(str.length-4, str.length);
        this.code = code;
        socket.emit('gameJoin', code);

        this.$http.get('http://' + window.location.host + '/getNames/' + this.code).then(response => {
            this.names = response.body;
            this.$http.get('http://' + window.location.host + '/getPositions/' + this.code).then(response => {
                this.positions = response.body;
                for (var i = 0; i < this.positions.length; i++) {
                    this.amountInPot.push(0);
                    this.folded.push(false);
                }
                this.beginPreflop();
            });
        });
    }
});
