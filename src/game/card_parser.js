function displayCC(id, targetId) {
    var value = document.getElementById(id).value.toUpperCase();
    document.getElementById(targetId).innerHTML = convertToUni(value);
}

// Converts a string to a unicode card
function convertToUni(value) {
    if (value == 'AS') {
        return "🂡";
    } else if (value == 'AH') {
        return "🂱";
    } else if (value == 'AD') {
        return "🃁";
    } else if (value == 'AC') {
        return "🃑";
    }


    else if (value == '2S') {
        return "🂢";
    } else if (value == '2H') {
        return "🂲";
    } else if (value == '2D') {
        return "🃂";
    } else if (value == '2C') {
        return "🃒";
    }


    else if (value == '3S') {
        return "🂣";
    } else if (value == '3H') {
        return "🂳";
    } else if (value == '3D') {
        return "🃃";
    } else if (value == '3C') {
        return "🃓";
    }


    else if (value == '4S') {
        return "🂤";
    } else if (value == '4H') {
        return "🂴";
    } else if (value == '4D') {
        return "🃄";
    } else if (value == '4C') {
        return "🃔";
    }


    else if (value == '5S') {
        return "🂥";
    } else if (value == '5H') {
        return "🂵";
    } else if (value == '5D') {
        return "🃅";
    } else if (value == '5C') {
        return "🃕";
    }


    else if (value == '6S') {
        return "🂦";
    } else if (value == '6H') {
        return "🂶";
    } else if (value == '6D') {
        return "🃆";
    } else if (value == '6C') {
        return "🃖";
    }


    else if (value == '7S') {
        return "🂧";
    } else if (value == '7H') {
        return "🂷";
    } else if (value == '7D') {
        return "🃇";
    } else if (value == '7C') {
        return "🃗";
    }


    else if (value == '8S') {
        return "🂨";
    } else if (value == '8H') {
        return "🂸";
    } else if (value == '8D') {
        return "🃈";
    } else if (value == '8C') {
        return "🃘";
    }


    else if (value == '9S') {
        return "🂩";
    } else if (value == '9H') {
        return "🂹";
    } else if (value == '9D') {
        return "🃉";
    } else if (value == '9C') {
        return "🃙";
    }


    else if (value == 'TS') {
        return "🂪";
    } else if (value == 'TH') {
        return "🂺";
    } else if (value == 'TD') {
        return "🃊";
    } else if (value == 'TC') {
        return "🃚";
    }


    else if (value == 'JS') {
        return "🂫";
    } else if (value == 'JH') {
        return "🂻";
    } else if (value == 'JD') {
        return "🃋";
    } else if (value == 'JC') {
        return "🃛";
    }


    else if (value == 'QS') {
        return "🂭";
    } else if (value == 'QH') {
        return "🂽";
    } else if (value == 'QD') {
        return "🃍";
    } else if (value == 'QC') {
        return "🃝";
    }


    else if (value == 'KS') {
        return "🂮";
    } else if (value == 'KH') {
        return "🂾";
    } else if (value == 'KD') {
        return "🃎";
    } else if (value == 'KC') {
        return "🃞";
    } else {
        return "";
    }
}
