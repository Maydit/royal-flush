var express = require("express");
var app = express();
var port = 3000;
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var url = "mongodb+srv://admin:adminpassword@cluster0-f0kkf.mongodb.net/test?retryWrites=true";

var db_name = "users";



var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(url);



var nameSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String

});

var User = mongoose.model("User", nameSchema);







app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});







//////////////////////////////////  SIGN IN  ///////////////////////////////////////



app.get("/login/login.html", (req, res) => {
    res.sendFile(__dirname + "/login/login.html");
});



app.post('/add_acc',(req, res) =>
{
    mongoose.connect(url, function(err, db) {

	   	var myData = new User(req.body);
	 	
	    var collection = db.collection(db_name);
	    var cursor = collection.find({email:myData.email});

	    var count = 0;

	    cursor.forEach(function(item)
	    {
	    	if(item!=null)
	    	{
		    	if( myData.password === item.password)
		    	{
		    		count=1;
		    		res.send("Logged in");
		    	}
	    	}

		},function(err)
			{
				if(count==0)
		    	{
		    		res.status(400).send("Account not found");
		    	}
			}


		);

        db.close();
    });
});



/////////////////////////////////////////////////////////////////////////////




















////////////////////////////////   LOGIN     //////////////////////////////////


app.get("/login/sign_in.html", (req, res) => {
    res.sendFile(__dirname + "/login/sign_in.html");
});

app.post("/valid", (req, res) => {
    var myData = new User(req.body);
    myData.save()
        .then(item => {
            res.send("Name saved to database");
        })
        .catch(err => {
            res.status(400).send("Unable to save to database");
        });
});



/////////////////////////////////////////////////////////////////////////////


app.listen(port, () => {
    console.log("Server listening on port " + port);
});






