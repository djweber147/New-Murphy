// Imports
var express = require("express");
var bodyParser = require("body-parser");
var app = express();

// Set up POST processing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up public directory
app.use(express.static('public'));

// Set index.html default page
app.get('/', function(req,res) {
    res.sendFile("index.html");
});

// Process Login
app.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log("User name = " + username + ", password is " + password);
    // Check Login and send back "done"
    res.end("done");
});

app.listen(8005, function() {
    console.log("Started on PORT 8005");
});
