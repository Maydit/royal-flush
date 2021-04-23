function displayCC(id, targetId) {
    var value = document.getElementById(id).value.toUpperCase();
    document.getElementById(targetId).innerHTML = convertToUni(value);
}

// Converts a string to a unicode card
function convertToUni(value) {
    if (value == 'AS') {
        return '<img src="/assets/playing_cards/ace_of_spades.png" alt="ace of spades"></img>';
    } else if (value == 'AH') {
        return '<img src="/assets/playing_cards/ace_of_hearts.png" alt="ace of hearts"></img>';
    } else if (value == 'AD') {
        return '<img src="/assets/playing_cards/ace_of_diamonds.png" alt="ace of diamonds"></img>';
    } else if (value == 'AC') {
        return '<img src="/assets/playing_cards/ace_of_clubs.png" alt="ace of clubs"></img>';
    }


    else if (value == '2S') {
        return '<img src="/assets/playing_cards/2_of_spades.png" alt="2 of spades"></img>';
    } else if (value == '2H') {
        return '<img src="/assets/playing_cards/2_of_hearts.png" alt="2 of hearts"></img>';
    } else if (value == '2D') {
        return '<img src="/assets/playing_cards/2_of_diamonds.png" alt="2 of diamonds"></img>';
    } else if (value == '2C') {
        return '<img src="/assets/playing_cards/2_of_clubs.png" alt="2 of clubs"></img>';
    }


    else if (value == '3S') {
        return '<img src="/assets/playing_cards/3_of_spades.png" alt="3 of spades"></img>';
    } else if (value == '3H') {
        return '<img src="/assets/playing_cards/3_of_hearts.png" alt="3 of hearts"></img>';
    } else if (value == '3D') {
        return '<img src="/assets/playing_cards/3_of_diamonds.png" alt="3 of diamonds"></img>';
    } else if (value == '3C') {
        return '<img src="/assets/playing_cards/3_of_clubs.png" alt="3 of clubs"></img>';
    }


    else if (value == '4S') {
        return '<img src="/assets/playing_cards/4_of_spades.png" alt="4 of spades"></img>';
    } else if (value == '4H') {
        return '<img src="/assets/playing_cards/4_of_hearts.png" alt="4 of hearts"></img>';
    } else if (value == '4D') {
        return '<img src="/assets/playing_cards/4_of_diamonds.png" alt="4 of diamonds"></img>';
    } else if (value == '4C') {
        return '<img src="/assets/playing_cards/4_of_clubs.png" alt="4 of clubs"></img>';
    }


    else if (value == '5S') {
        return '<img src="/assets/playing_cards/5_of_spades.png" alt="5 of spades"></img>';
    } else if (value == '5H') {
        return '<img src="/assets/playing_cards/5_of_hearts.png" alt="5 of hearts"></img>';
    } else if (value == '5D') {
        return '<img src="/assets/playing_cards/5_of_diamonds.png" alt="5 of diamonds"></img>';
    } else if (value == '5C') {
        return '<img src="/assets/playing_cards/5_of_clubs.png" alt="5 of clubs"></img>';
    }


    else if (value == '6S') {
        return '<img src="/assets/playing_cards/6_of_spades.png" alt="6 of spades"></img>';
    } else if (value == '6H') {
        return '<img src="/assets/playing_cards/6_of_hearts.png" alt="6 of hearts"></img>';
    } else if (value == '6D') {
        return '<img src="/assets/playing_cards/6_of_diamonds.png" alt="6 of diamonds"></img>';
    } else if (value == '6C') {
        return '<img src="/assets/playing_cards/6_of_clubs.png" alt="6 of clubs"></img>';
    }


    else if (value == '7S') {
        return '<img src="/assets/playing_cards/7_of_spades.png" alt="7 of spades"></img>';
    } else if (value == '7H') {
        return '<img src="/assets/playing_cards/7_of_hearts.png" alt="7 of hearts"></img>';
    } else if (value == '7D') {
        return '<img src="/assets/playing_cards/7_of_diamonds.png" alt="7 of diamonds"></img>';
    } else if (value == '7C') {
        return '<img src="/assets/playing_cards/7_of_clubs.png" alt="7 of clubs"></img>';
    }


    else if (value == '8S') {
        return '<img src="/assets/playing_cards/8_of_spades.png" alt="8 of spades"></img>';
    } else if (value == '8H') {
        return '<img src="/assets/playing_cards/8_of_hearts.png" alt="8 of hearts"></img>';
    } else if (value == '8D') {
        return '<img src="/assets/playing_cards/8_of_diamonds.png" alt="8 of diamonds"></img>';
    } else if (value == '8C') {
        return '<img src="/assets/playing_cards/8_of_clubs.png" alt="8 of clubs"></img>';
    }


    else if (value == '9S') {
        return '<img src="/assets/playing_cards/9_of_spades.png" alt="9 of spades"></img>';
    } else if (value == '9H') {
        return '<img src="/assets/playing_cards/9_of_hearts.png" alt="9 of hearts"></img>';
    } else if (value == '9D') {
        return '<img src="/assets/playing_cards/9_of_diamonds.png" alt="9 of diamonds"></img>';
    } else if (value == '9C') {
        return '<img src="/assets/playing_cards/9_of_clubs.png" alt="9 of clubs"></img>';
    }


    else if (value == 'TS') {
        return '<img src="/assets/playing_cards/10_of_spades.png" alt="10 of spades"></img>';
    } else if (value == 'TH') {
        return '<img src="/assets/playing_cards/10_of_hearts.png" alt="10 of hearts"></img>';
    } else if (value == 'TD') {
        return '<img src="/assets/playing_cards/10_of_diamonds.png" alt="10 of diamonds"></img>';
    } else if (value == 'TC') {
        return '<img src="/assets/playing_cards/10_of_clubs.png" alt="10 of clubs"></img>';
    }


    else if (value == 'JS') {
        return '<img src="/assets/playing_cards/jack_of_spades2.png" alt="jack of spades"></img>';
    } else if (value == 'JH') {
        return '<img src="/assets/playing_cards/jack_of_hearts2.png" alt="jack of hearts"></img>';
    } else if (value == 'JD') {
        return '<img src="/assets/playing_cards/jack_of_diamonds2.png" alt="jack of diamonds"></img>';
    } else if (value == 'JC') {
        return '<img src="/assets/playing_cards/jack_of_clubs2.png" alt="jack of clubs"></img>';
    }


    else if (value == 'QS') {
        return '<img src="/assets/playing_cards/queen_of_spades2.png" alt="queen of spades"></img>';
    } else if (value == 'QH') {
        return '<img src="/assets/playing_cards/queen_of_hearts2.png" alt="queen of hearts"></img>';
    } else if (value == 'QD') {
        return '<img src="/assets/playing_cards/queen_of_diamonds2.png" alt="queen of diamonds"></img>';
    } else if (value == 'QC') {
        return '<img src="/assets/playing_cards/queen_of_clubs2.png" alt="queen of clubs"></img>';
    }


    else if (value == 'KS') {
        return '<img src="/assets/playing_cards/king_of_spades2.png" alt="king of spades"></img>';
    } else if (value == 'KH') {
        return '<img src="/assets/playing_cards/king_of_hearts2.png" alt="king of hearts"></img>';
    } else if (value == 'KD') {
        return '<img src="/assets/playing_cards/king_of_diamonds2.png" alt="king of diamonds"></img>';
    } else if (value == 'KC') {
        return '<img src="/assets/playing_cards/king_of_clubs2.png" alt="king of clubs"></img>';
    } else {
        return "";
    }
}
