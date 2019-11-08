var socket = io();

function addToLog(message) {
    document.getElementById("log").innerHTML = message + "<br>" + document.getElementById("log").innerHTML;
}

function switchActiveButtons() {
    var btnList = document.getElementsByTagName("button");
    for (var i = 0; i < btnList.length; i++) {
        if (btnList[i].disabled) {
            btnList[i].disabled = false;
        } else {
            btnList[i].disabled = true;
        }
    }
}

const App = new Vue({
    el: '#app',
    data: {
        code: "",
        currentPlayer: "",
        // 0: preflop, 1: flop, 2: turn, 3: river
        phase: 0,
        index: 0,
        // Player in which the round is set to end at
        cycleEndsAt: 0,
        raiseAmount: "",
        // Integers determining game position, mapped to the names
        positions: [],
        names: [],
        // How much each player has bet
        amountInPot: [],
        // Boolean array whether each player has folded
        folded: [],
        commCard1: "",
        commCard2: "",
        commCard3: "",
        commCard4: "",
        commCard5: ""
    },
    methods: {
        // Begins the betting rounnd prior to the flop
        beginPreflop() {
            this.setZeroPlayer();
            // Reset how amountInPot and folded arrays
            for (var i = 0; i < this.positions.length; i++) {
                this.amountInPot[i] = 0;
                this.folded[i] = false;
            }

            // 2 after big blind is the first one to bet pre flop; also set big
            // and small blind bets
            this.amountInPot[this.index] = 5;
            this.nextPlayer();
            this.amountInPot[this.index] = 10;
            this.nextPlayer();
            this.cycleEndsAt = this.index;
        },

        beginFlop() {
            addToLog("Flop is out.");
            this.setZeroPlayer();
            if (this.folded[this.index]) {
                this.nextPlayer();
                this.cycleEndsAt = this.index;
            }
        },

        beginTurn() {
            addToLog("Turn is out.");
            this.setZeroPlayer();
            if (this.folded[this.index]) {
                this.nextPlayer();
                this.cycleEndsAt = this.index;
            }
        },

        beginRiver() {
            addToLog("River is out.");
            this.setZeroPlayer();
            if (this.folded[this.index]) {
                this.nextPlayer();
                this.cycleEndsAt = this.index;
            }
        },

        // Assigns the current player and index as the position 0. Also sets the
        // cycle to end at this player, as this method is invoked at the start
        // of a betting round.
        setZeroPlayer() {
            for (var i = 0; i < this.positions.length; i++) {
                if (this.positions[i] == 0) {
                    this.currentPlayer = this.names[i];
                    document.getElementById("playerP").innerHTML = this.currentPlayer + "'s turn";
                    this.index = i;
                    this.cycleEndsAt = i;
                    break;
                }
            }
        },

        // Assigns current player and index as the next non-folded player
        nextPlayer() {
            while (true) {
                this.index += 1;
                // For looping past the last element
                if (this.index == this.names.length) {
                    this.index = 0;
                }

                if (this.folded[this.index] == false) {
                    break;
                }
            }
            this.currentPlayer = this.names[this.index];
            document.getElementById("playerP").innerHTML = this.currentPlayer + "'s turn";
        },

        // Returns how much the previous non folded player has in the pot
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
            return this.amountInPot[prevIndex];
        },

        // Determines whether we can move to the next round of betting: 2
        // conditions are everyone folded or end of round
        checkNextPhase() {
            // Determines if everyone folded
            var active = "";
            for (var i = 0; i < this.folded.length; i++) {
                if (this.folded[i] == false) {
                    active += i.toString();
                }
            }
            // True if everyone folded
            var defaultWinner = (active.length == 1);

            if (defaultWinner) {
                // Round done, send data
                var commCardsStr = '/' + this.commCard1 + this.commCard2 + this.commCard3 + this.commCard4 + this.commCard5 + '/';
                // Based on phase, determine how many community cards there should be
                if (this.phase == 0 && commCardsStr.length != 2) {
                    switchActiveButtons();
                    addToLog("ERROR: There shouldn't be any community cards.");
                } else if (this.phase == 1 && commCardsStr.length != 8) {
                    switchActiveButtons();
                    addToLog("ERROR: There must be 3 correctly named cards.");
                } else if (this.phase == 2 && commCardsStr.length != 10) {
                    switchActiveButtons();
                    addToLog("ERROR: There must be 4 correctly named cards.");
                } else if (this.phase == 3 && commCardsStr.length != 12) {
                    switchActiveButtons();
                    addToLog("ERROR: There must be 5 correctly named cards.");
                } else {
                    this.recordAndReset(commCardsStr, active);
                }

            } else if (this.index == this.cycleEndsAt) {
                // Change phase
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
                    // Round done, send data
                    commCardsStr = '/' + this.commCard1 + this.commCard2 + this.commCard3 + this.commCard4 + this.commCard5 + '/';
                    // There MUST be 5 cards
                    if (commCardsStr.length != 12) {
                        switchActiveButtons();
                        addToLog("ERROR: There must be 5 correctly named cards.");

                    } else {
                        this.recordAndReset(commCardsStr, active);
                    }
                }

            }
        },

        // Invoked once a winner has been chosen.
        recordAndReset(commCardsStr, active) {
            addToLog("Hand inserted to the database. Starting next round.");
            this.phase = 0;
            this.resetInputs();
            this.$http.get('http://' + window.location.host + '/recordHand/' + this.code + commCardsStr + active).then(response => {
                var winnerIndex = parseInt(response.body);
                for (var i = 0; i < this.amountInPot.length; i++) {
                    this.$http.post('http://' + window.location.host + '/updateStacks/' + this.code + '/' + i + '/' + this.amountInPot[i]);
                    if (winnerIndex == i) {
                        var totalPot = 0;
                        for (var j = 0; j < this.amountInPot.length; j++) {
                            totalPot -= this.amountInPot[j];
                        }
                        this.$http.post('http://' + window.location.host + '/updateStacks/' + this.code + '/' + i + '/' + totalPot);
                    }
                }
                this.positions.unshift(this.positions[this.positions.length - 1]);
                this.positions.pop();
                this.beginPreflop();
            });
        },

        check() {
            // Can only be done if amountInPot is equal to previous player's
            var canDo = false;
            var prevAmountInPot = this.calcPrevAmountInPot();
            if (prevAmountInPot == this.amountInPot[this.index]) {
                canDo = true;
            }

            if (canDo) {
                addToLog(this.names[this.index] + " checked.");
                var bet = this.positions[this.index].toString() + "c";
                this.actionSelected(bet, false);
            } else {
                addToLog("ERROR: Can't check.");
            }

        },
        match() {
            // Can only be done if amountInPot is less than previous player's
            var canDo = false;
            var prevAmountInPot = this.calcPrevAmountInPot();
            if (prevAmountInPot > this.amountInPot[this.index]) {
                canDo = true;
            }

            if (canDo) {
                addToLog(this.names[this.index] + " matched.");
                this.amountInPot[this.index] = prevAmountInPot;
                var bet = this.positions[this.index].toString() + "m";
                this.actionSelected(bet, false);
            } else {
                addToLog("ERROR: Nothing to match.");
            }
        },
        raise() {
            // Can only be done if raise puts the amountInPot to higher than
            // previous player's
            var canDo = false;
            var raiseInt = parseInt(this.raiseAmount, 10);
            var prevAmountInPot = this.calcPrevAmountInPot();
            if (prevAmountInPot < this.amountInPot[this.index] + raiseInt) {
                canDo = true;
            }

            if (canDo) {
                addToLog(this.names[this.index] + " raised " + raiseInt + ".");
                this.amountInPot[this.index] += raiseInt;
                var bet = this.positions[this.index].toString() + "r" + this.raiseAmount;
                this.cycleEndsAt = this.index;
                this.actionSelected(bet, false);
            } else {
                addToLog("ERROR: Raise amount not high enough.");
            }
        },
        fold() {
            addToLog(this.names[this.index] + " folded.");
            this.folded[this.index] = true;
            // If cycle ends at this user, this is a special edge case.
            var foldedMarker = (this.cycleEndsAt == this.index);

            this.currentPlayer = this.names[this.index];
            var bet = this.positions[this.index].toString() + "f";
            this.actionSelected(bet, foldedMarker);
        },

        // Invoked at the end of each betting function
        actionSelected(bet, foldedMarker) {
            for (var i = 0; i < this.amountInPot.length; i++) {
                //console.log("amountInPot[" + i + "]: " + this.amountInPot[i]);
            }
            this.$http.post('http://' + window.location.host + '/addBet/' + this.code + '/' + bet + '/' + this.phase);
            this.nextPlayer();
            this.checkNextPhase();

            // Special edge case, where cycle ends at this user
            if (foldedMarker) {
                this.cycleEndsAt = this.index;
            }
        },

        resubmit() {
            // At this point, we know we are pushing

            // Determines if everyone folded
            var active = "";
            for (var i = 0; i < this.folded.length; i++) {
                if (this.folded[i] == false) {
                    active += i.toString();
                }
            }
            // True if everyone folded
            //var defaultWinner = (active.length == 1);

            var commCardsStr = '/' + this.commCard1 + this.commCard2 + this.commCard3 + this.commCard4 + this.commCard5 + '/';
            if (this.phase == 0 && commCardsStr.length != 2) {
                addToLog("ERROR: There shouldn't be any community cards.");
            } else if (this.phase == 1 && commCardsStr.length != 8) {
                addToLog("ERROR: There must be 3 correctly named cards.");
            } else if (this.phase == 2 && commCardsStr.length != 10) {
                addToLog("ERROR: There must be 4 correctly named cards.");
            } else if (this.phase == 3 && commCardsStr.length != 12) {
                addToLog("ERROR: There must be 5 correctly named cards.");
            } else {
                switchActiveButtons();
                this.recordAndReset(commCardsStr, active);
            }
        },

        resetInputs() {
            this.commCard1 = "";
            this.commCard2 = "";
            this.commCard3 = "";
            this.commCard4 = "";
            this.commCard5 = "";
        }
    },
    beforeMount() {
        // Obtains the code and joins that room
        var str = window.location.href;
        var code = str.substring(str.length-4, str.length);
        this.code = code;
        socket.emit('gameJoin', code);

        // Obtains the names of all players. Only needs to be called once
        this.$http.get('http://' + window.location.host + '/getNames/' + this.code).then(response => {
            this.names = response.body;
            // Obtains all the initial positions. Also only needs to be called
            // once, as we update them on the front end
            this.$http.get('http://' + window.location.host + '/getPositions/' + this.code).then(response => {
                this.positions = response.body;
                // Initialize arrays
                for (var i = 0; i < this.positions.length; i++) {
                    this.amountInPot.push(0);
                    this.folded.push(false);
                }
                this.beginPreflop();
            });
        });
    }
});
