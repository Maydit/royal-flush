function email_validate(email) {
  if(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    document.getElementById("email").style.color = "green";
    return true;
  } else {
    document.getElementById("email").style.color = "red";
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
  if(email_validate(document.getElementById("email").value) && checkPass() && nameValidate()) {
    //submit all into the database
    //Post request?
    console.log("final validation success, new account registered");
  }
}

function Login() {
  if(email_validate(document.getElementById("email").value)) {
    //check database for valid login and redirect
  } else {
    //??
  }
}