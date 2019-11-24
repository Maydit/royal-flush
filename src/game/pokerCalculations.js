exports.cardSorter = function(a, b) {
    return ((a.rank < b.rank) ? -1 : ((a.rank > b.rank) ? 1 : 0));
}

// Returns T or F based on whether there is a straight flush
exports.checkForStraightFlush = function(cards) {
    var flushHand = this.checkForFlush(cards);
    if (flushHand.length != 0) {
        straightFlushHand = this.checkForStraight(flushHand);
        return straightFlushHand;
    }
    return flushHand;
}

// Returns C, D, H, or S depending on what suit the flush is. If there is no
// flush, will return the character F.
exports.checkForFlush = function(cards) {
    var cCount = 0;
    var dCount = 0;
    var hCount = 0;
    var sCount = 0;
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].suit == 'C') {
            cCount++;
        } else if (cards[i].suit == 'D') {
            dCount++;
        } else if (cards[i].suit == 'H') {
            hCount++;
        } else {
            sCount++;
        }
    }
    if (cCount >= 5) {
        return this.extractFlush(cards, 'C');
    } else if (dCount >= 5) {
        return this.extractFlush(cards, 'D');
    } else if (hCount >= 5) {
        return this.extractFlush(cards, 'H');
    } else if (sCount >= 5) {
        return this.extractFlush(cards, 'S');
    } else {
        return [];
    }
}

// Called only when a flush exists, grabs the cards of the input suit from the
// inputted cards
exports.extractFlush = function(cards, suit) {
    var flushHand = [];
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].suit == suit) {
            flushHand.push(cards[i]);
        }
    }
    return flushHand;
}

// Takes a SORTED array of cards and returns an array if there is a straight. If
// there is no straight, an empty array is returned.
exports.checkForStraight = function(originalCards) {
    // Remove duplicates to make our algorithm easier
    var cards = Array.from(originalCards);
    var prev = cards[0].rank;
    for (var i = 1; i < cards.length; i++) {
        if (cards[i].rank == prev) {
            cards.splice(i, 1);
            i--;
        } else {
            prev = cards[i].rank;
        }
    }

    var straightHand = [];
    for (var i = cards.length - 5; i >= 0; i--) {
        if (cards[i].rank == cards[i+4].rank - 4) {
            for (var j = i; j < i+5; j++) {
                straightHand.push(cards[j]);
            }
            return straightHand;
        }
    }
    // Edge case for A-5
    if (cards[0].rank == 2 && cards[3].rank == 5 && cards[cards.length-1].rank == 14) {
        straightHand.push(cards[0]);
        straightHand.push(cards[1]);
        straightHand.push(cards[2]);
        straightHand.push(cards[3]);
        straightHand.push(cards[cards.length-1]);
    }
    return straightHand;
}

// Looks for 4 of a kind, returns the bomb + high card or an empty array if no
// bomb is present.
exports.checkForBomb = function(originalCards) {
    // Remove duplicates to make our algorithm easier
    var cards = Array.from(originalCards);

    var bombHand = [];
    for (var i = 0; i < cards.length-3; i++) {
        if (cards[i].rank == cards[i+3].rank) {
            // Bomb exists
            for (var j = i; j < i+4; j++) {
                bombHand.push(cards[i]);
                cards.splice(i, 1);
            }
            bombHand.push(cards[cards.length-1]);
        }
    }
    return bombHand;
}

// Looks for a full house, returns the full house or an empty array if no full
// house is present.
exports.checkForFullHouse = function(originalCards) {
    // Remove duplicates to make our algorithm easier
    var cards = Array.from(originalCards);

    var houseHand = [];

    // All the ranks of the cards that have trips. Ordered.
    var tripArr = this.checkforTrips(cards);
    if (tripArr.length == 2) {
        // Full house exists, there are 2 trips.
        var smallerCount = 0;
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].rank == tripArr[1]) {
                houseHand.push(cards[i]);
            } else if (cards[i].rank == tripArr[0] && smallerCount != 2) {
                smallerCount += 1;
                houseHand.push(cards[i]);
            }
        }
    } else if (tripArr.length == 1) {
        // Remove the triplets from the cards to check for pairs
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].rank == tripArr[0]) {
                houseHand.push(cards[i]);
                cards.splice(i,1);
                i -= 1;
            }
        }

        var pairArr = this.checkForPairs(cards);
        if (pairArr.length != 0) {
            for (var i = 0; i < cards.length; i++) {
                if (cards[i].rank == pairArr[pairArr.length - 1]) {
                    houseHand.push(cards[i]);
                }
            }
        } else {
            return [];
        }
    }
    return houseHand;
}

// Looks for 3 of a kind: under the assumption that there are NO bombs. Returns
// an array with all the ranks that have trips. Max length 2
exports.checkforTrips = function(cards) {
    var tripArr = [];
    for (var i = 0; i < cards.length-2; i++) {
        if (cards[i].rank == cards[i+2].rank) {
            tripArr.push(cards[i].rank);
        }
    }
    return tripArr;
}

// Looks for pairs: under the assumption that there are NO trips. Returns an
// array with all the ranks that have pairs
exports.checkForPairs = function(cards) {
    var pairArr = [];
    for (var i = 0; i < cards.length-1; i++) {
        if (cards[i].rank == cards[i+1].rank) {
            pairArr.push(cards[i].rank);
        }
    }
    return pairArr;
}
