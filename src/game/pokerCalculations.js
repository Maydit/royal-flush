class Card {
    constructor(cardStr) {
        var rank = cardStr.charAt(0);
        this.rank = "  23456789TJQKA".indexOf(rank);
        this.suit = cardStr.charAt(1);
    }

    // If card1 is greater than card2, returns 1. If less than, returns -1, and
    // if they are equal, returns 0.
    compareTo(card2) {
        if (this.rank > card2.rank) {
            return 1;
        } else if (this.rank < card2.rank) {
            return -1;
        } else {
            return 0;
        }
    }
}

function cardSorter(a, b) {
    return ((a.rank < b.rank) ? -1 : ((a.rank > b.rank) ? 1 : 0));
}

// Returns T or F based on whether there is a straight flush
function checkForStraightFlush(cards) {
    var flushHand = checkForFlush(cards);
    if (flushHand.length != 0) {
        const straightFlushHand = checkForStraight(flushHand);
        return straightFlushHand;
    }
    return flushHand;
}

// Returns C, D, H, or S depending on what suit the flush is. If there is no
// flush, will return the character F.
function checkForFlush(cards) {
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
        return extractFlush(cards, 'C');
    } else if (dCount >= 5) {
        return extractFlush(cards, 'D');
    } else if (hCount >= 5) {
        return extractFlush(cards, 'H');
    } else if (sCount >= 5) {
        return extractFlush(cards, 'S');
    } else {
        return [];
    }
}

// Called only when a flush exists, grabs the cards of the input suit from the
// inputted cards
function extractFlush(cards, suit) {
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
function checkForStraight(originalCards) {
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
    for (i = cards.length - 5; i >= 0; i--) {
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
function checkForBomb(originalCards) {
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
function checkForFullHouse(originalCards) {
    // Remove duplicates to make our algorithm easier
    var cards = Array.from(originalCards);

    var houseHand = [];

    // All the ranks of the cards that have trips. Ordered.
    var tripArr = checkforTrips(cards);
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
        for (i = 0; i < cards.length; i++) {
            if (cards[i].rank == tripArr[0]) {
                houseHand.push(cards[i]);
                cards.splice(i,1);
                i -= 1;
            }
        }

        var pairArr = checkForPairs(cards);
        if (pairArr.length != 0) {
            for (i = 0; i < cards.length; i++) {
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
function checkforTrips(cards) {
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
function checkForPairs(cards) {
    var pairArr = [];
    for (var i = 0; i < cards.length-1; i++) {
        if (cards[i].rank == cards[i+1].rank) {
            pairArr.push(cards[i].rank);
        }
    }
    return pairArr;
}

class Hand {
    /*
    this.strength:
        8 - straight flush
        7 - bomb
        6 - full house
        5 - flush
        4 - straight
        3 - 3 of a kind
        2 - 2 pair
        1 - pair
        0 - high card
    this.cards
    */

    // Given 5-7 cards, determine the best 5-card hand.
    constructor(cardsStr) {
        var cards = [];
        for (var i = 0; i < cardsStr.length / 2; i+=2) {
            var newCard = new Card(cardsStr.substring(i, 2));
            cards.push(newCard);
        }

        cards.sort(cardSorter);

        // Check for hands in decreasing strength

        var straightFlushHand = checkForStraightFlush(cards);
        if (straightFlushHand.length != 0) {
            this.strength = 8;
            this.cards = straightFlushHand;
            return;
        }
        var bombHand = checkForBomb(cards);
        if (bombHand.length != 0) {
            this.strength = 7;
            this.cards = bombHand;
            return;
        }
        var houseHand = checkForFullHouse(cards);
        if (houseHand.length != 0) {
            this.strength = 6;
            this.cards = houseHand;
            return;
        }
        var flushHand = checkForFlush(cards);
        if (flushHand.length != 0) {
            // Must reduce to 5
            while (flushHand.length > 5) {
                flushHand.shift();
            }
            this.strength = 5;
            this.cards = flushHand;
            return;
        }
        var straightHand = checkForStraight(cards);
        if (straightHand.length != 0) {
            this.strength = 4;
            this.cards = straightHand;
            return;
        }
        var tripArr = checkforTrips(cards);
        if (tripArr.length != 0) {
            // If true, length MUST be 1.
            this.cards = [];
            for (var i = 0; i < cards.length; i++) {
                if (cards[i].rank == tripArr[0]) {
                    this.cards.push(cards[i]);
                    cards.splice(i,1);
                    i -= 1;
                }
            }
            this.cards.push(cards[cards.length-2]);
            this.cards.push(cards[cards.length-1]);
            this.strength = 3;
            return;
        }
        var pairArr = checkForPairs(cards);
        if (pairArr.length != 0) {
            if (pairArr.length > 1) {
                // 2 pair
                this.cards = [];
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].rank == pairArr[pairArr.length-1] || cards[i].rank == pairArr[pairArr.length-2]) {
                        this.cards.push(cards[i]);
                        cards.splice(i,1);
                        i -= 1;
                    }
                }
                this.cards.push(cards[cards.length-1]);
                this.strength = 2;
                return;
            } else {
                // 1 pair
                this.cards = [];
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].rank == pairArr[0]) {
                        this.cards.push(cards[i]);
                        cards.splice(i,1);
                        i -= 1;
                    }
                }
                this.cards.push(cards[cards.length-3]);
                this.cards.push(cards[cards.length-2]);
                this.cards.push(cards[cards.length-1]);
                this.strength = 1;
                return;
            }
        }

        while (cards.length > 5) {
            cards.shift();
        }
        this.cards = cards;
        this.strength = 0;
    }

    // If hand1 is greater than hand2, returns 1. If less than, returns -1, and
    // if they are equal, returns 0.
    compareTo(hand2) {
        if (this.strength > hand2.strength) {
            return 1;
        } else if (this.strength < hand2.strength) {
            return -1;
        } else {
            // same kind of hand, need to see which is better
            if (this.strength == 8 || this.strength == 5 || this.strength == 4 || this.strength == 0) {
                // For these hands, just check who has the higher cards
                for (var i = 4; i >= 0; i--) {
                    if (this.cards[i].compareTo(hand2.cards[i]) == 1) {
                        return 1;
                    } else if (this.cards[i].compareTo(hand2.cards[i]) == -1) {
                        return -1;
                    }
                }
                return 0;
            }

            if (this.strength == 7 || this.strength == 6) {
                // For these hands, check the first card and then the last card.
                if (this.cards[0].compareTo(hand2.cards[0]) == 1) {
                    return 1;
                } else if (this.cards[0].compareTo(hand2.cards[0]) == -1) {
                    return -1;
                }
                if (this.cards[4].compareTo(hand2.cards[4]) == 1) {
                    return 1;
                } else if (this.cards[4].compareTo(hand2.cards[4]) == -1) {
                    return -1;
                }
                return 0;
            }

            if (this.strength == 3 || this.strength == 1) {
                // Check 1st, then 5th and 4th.
                if (this.cards[0].compareTo(hand2.cards[0]) == 1) {
                    return 1;
                } else if (this.cards[0].compareTo(hand2.cards[0]) == -1) {
                    return -1;
                }
                if (this.cards[4].compareTo(hand2.cards[4]) == 1) {
                    return 1;
                } else if (this.cards[4].compareTo(hand2.cards[4]) == -1) {
                    return -1;
                }
                if (this.cards[3].compareTo(hand2.cards[3]) == 1) {
                    return 1;
                } else if (this.cards[3].compareTo(hand2.cards[3]) == -1) {
                    return -1;
                }

                if (this.strength == 3) {
                    return 0;
                } else {
                    // One more round for pairs instead of 3 of a kind
                    if (this.cards[2].compareTo(hand2.cards[2]) == 1) {
                        return 1;
                    } else if (this.cards[2].compareTo(hand2.cards[2]) == -1) {
                        return -1;
                    }
                    return 0;
                }
            }

            // this is for 2 pairs, check 3rd, 1st, last.
            if (this.cards[2].compareTo(hand2.cards[2]) == 1) {
                return 1;
            } else if (this.cards[2].compareTo(hand2.cards[2]) == -1) {
                return -1;
            }
            if (this.cards[0].compareTo(hand2.cards[0]) == 1) {
                return 1;
            } else if (this.cards[0].compareTo(hand2.cards[0]) == -1) {
                return -1;
            }
            if (this.cards[4].compareTo(hand2.cards[4]) == 1) {
                return 1;
            } else if (this.cards[4].compareTo(hand2.cards[4]) == -1) {
                return -1;
            }
            return 0;
        }
    }
}
