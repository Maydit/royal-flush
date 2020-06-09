//true if valid email, false else
function email_validate() {
    return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(document.getElementById("email").value));
}

//updates the email field based on if valid or not
function email_warn(bool) {
    if(bool) {
        document.getElementById("email").style.color = "green";
    } else {
        document.getElementById("email").style.color = "red";
    }
}

//returns if the passwords match
function pass_validate() {
    return document.getElementById("pass1").value === document.getElementById("pass2").value;
}

//warns user if the passwords don't match
function pass_warn(bool) {
    if(bool) {
        document.getElementById("confirmMessage").innerHTML = "";
    } else {
        document.getElementById("confirmMessage").innerHTML = "Passwords do not match";
        document.getElementById("confirmMessage").style.color = "red";
    }
}

//returns if the names are nonempty
function name_validate() {
    return document.getElementById("firstname").value.length > 0 && document.getElementById("lastname").value.length > 0;
}

//warns user if the names are invalid
function name_warn() {
    if(document.getElementById("firstname").value.length > 0) {
        document.getElementById("firstname").style.color = "green";
        document.getElementById("errFirst").innerHTML = "";
    } else {
        document.getElementById("errFirst").innerHTML = "Name must not be empty";
        document.getElementById("errFirst").style.color = "red";
    }
    if(document.getElementById("lastname").value.length > 0) {
        document.getElementById("lastname").style.color = "green";
        document.getElementById("errLast").innerHTML = "";
    } else {
        document.getElementById("errLast").innerHTML = "Name must not be empty";
        document.getElementById("errLast").style.color = "red";
    }
}

//called on email change for register screen, runs the warnings
function email_check() {
    email_warn(email_validate());
    final_validate();
}

//called on email change for login screen, runs the warnings
function email_check_login() {
    email_warn(email_validate());
    document.getElementById("submit_reg").disabled = !email_validate();
}

//called on name change, runs the warnings
function name_check() {
    name_warn();
    final_validate();
}

//called on password change, runs the warnings
function pass_check() {
    pass_warn(pass_validate());
    final_validate();
}

//disables submit button if any field is not valid
function final_validate() {
    if(email_validate() && pass_validate() && name_validate()) {
        document.getElementById("submit_reg").disabled = false;
    } else {
        document.getElementById("submit_reg").disabled = true;
    }
}
