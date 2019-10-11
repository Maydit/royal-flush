function email_validate(email) {
  if(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    document.getElementById("email").style.color = "green";
    return true;
  } else {
    document.getElementById("email").style.color = "red";
    return false;
  }
}
function Validate(username, registering) {
  if(username.value.length >= 6) {
    //check db for matching username
    if(registering) {
      //post request?
      if(true) {
        document.getElementById("usernameText").innerHTML = "Username already exists";
        document.getElementById("usernameText").style.color = "red";
      } else {
        document.getElementById("usernameText").innerHTML = "";
      }
    }
    document.getElementById("username").style.color = "green";
    return true;
  } else {
    document.getElementById("username").style.color = "red";
    return false;
  }
}
function checkPass() {
  if(document.getElementById("pass1").value === document.getElementById("pass2").value) {
    document.getElementById("confirmMessage").innerHTML = "";
    return true;
  } else {
    document.getElementById("confirmMessage").innerHTML = "Passwords do not match";
    document.getElementById("confirmMessage").style.color = "red";
    return false;
  }
}

function nameValidate() {
  if(document.getElementById("firstname").value.length > 0) {
    document.getElementById("firstname").style.color = "green";
  }
  if(document.getElementById("lastname").value.length > 0) {
    document.getElementById("lastname").style.color = "green";
  }
  return document.getElementById("firstname").value.length > 0 && document.getElementById("lastname").value.length > 0;
}

function finalValidate() {
  if(email_validate(document.getElementById("email").value) && Validate(document.getElementById("username"), true) && checkPass() && nameValidate()) {
    //submit all into the database
    //Post request?
    console.log("final validation success, new account registered");
  }
}

function Login() {
  if(email_validate(document.getElementById("email").value) && Validate(document.getElementById("username", false))) {
    //check database for valid login and redirect
  } else {
    //??
  }
}