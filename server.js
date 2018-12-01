// Imports
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var url = require('url');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

// Set up POST processing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Database
var db = new sqlite3.Database(path.join(__dirname, 'db', 'newMurphy.sqlite3'), (err) => {
    if (err) {
        console.log('Error opening newMurphy.sqlite3 database');
    }
    else {
        console.log('Now connected to newMurphy.sqlite3 database!');
    }
});

// Set up public directory
app.use(express.static('public'));

// Set index.html default page
app.get('/', function(req,res) {
    res.sendFile("index.html");
});

// Process Login
app.post('/login', function(req, res) {
    var username = req.body.username; // University ID
    var password = req.body.password;
    console.log("User name = " + username + ", password is " + password);
	var go = false;
	db.get("SELECT password FROM people WHERE university_id = ?;",username,function(err,row){
		if(err){
			console.log(err);
			res.end("err2"); 
		}
		else{
			console.log(row);
			if(row !== undefined){
				if(row.password === password){
					res.end("done"); // Sucsess
				}
				else{
					res.end("err"); // Problem
				}
			}
			else{
				res.end("err2"); // If university_id does not exist, return err2
			}
		}
	});
});

// Process New User
app.post('/newuser', function(req, res) {
     var username = req.body.username;
     var password = req.body.password;
     var position = req.body.position;
     var fname = req.body.fname;
     var lname = req.body.lname;
     
     // Could use more error checking along the way (values can't be '')
	 if (isNaN(username) || password === '' || fname === '' || lname === ''){
		 res.end("err"); // Invalid field
	 }
	 else {
		 db.get("SELECT university_id FROM people WHERE university_id = ?;",username,function(err,row){
			if(err) {
				console.log(err);
			}
			else{
				if(row === undefined){ // If there does not exist a university_id with this number...
					db.run("INSERT INTO people VALUES (?,?,?,?,?,NULL,NULL);", username, position, password, fname, lname, function(err) {
						 if(err) {
							console.log(err);
						 }
						 else{
							 res.end("done");
						 }
					 });
				}
				else {
					res.end("err2"); // University_id already exists
				}
			}
		 });
	 }
});

// Process departments
app.get('/searchdept', function(req, res) {
	console.log("SEARCH-DEPT");
	var data = '';
	db.all("SELECT * FROM departments ORDER BY full_name;",function(err,rows){
		if(err) {
			console.log(err);
		}
		else{
			res.end(JSON.stringify(rows));
		}
	});  	
});

// Process courses
app.get('/courses', function(req, res) {
    
    // Get GET parameters
    var query = url.parse(req.url, true).query;

    var crn = query.crn;
    var coursenumber = query.coursenumber;
    var departments = query.departments;
    var stmt;

    // Departments or CRN is required
    if (departments === undefined && crn == "") {
         res.end("err");
    }
    else {
         
        // Prepare statement (susceptible to sql injection)
        if (departments !== undefined) {
            departments = departments.toString().replace(/,/g, "\" OR subject = \"");
         }
     
        stmt = "SELECT * FROM sections WHERE";
     
        // If CRN is provided
        if (crn != "") {
            stmt += " crn = ";
            stmt += crn;
            stmt += ";";
        }
        else if (coursenumber.trim() != "") {
             stmt += " course_number = ";
             stmt += coursenumber;
             stmt += " AND (subject = \"";
             stmt += departments;
             stmt += "\");";
        }
        else {
             stmt += " (subject = \"";
             stmt += departments;
             stmt += "\");";
        }

        console.log(stmt);
    }
         
    db.all(stmt, function(err, rows) {
        if (err) {
            res.end("err");
            console.log(err);
        }
        else {
            res.end(JSON.stringify(rows));;
        }
    });
});

// Start Server
app.listen(8005, function() {
    console.log("Started on PORT 8005");
});


