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

// Regester for a class
app.post('/registerClass', function(req, res) {
    var username = req.body.username;
    var crn = req.body.crn;
	var registered_courses;
	var capacity = req.body.capacity;
     
     // Could use more error checking along the way (values can't be '')
	 if (isNaN(username)){
		 res.end("err"); // Invalid field
	 }
	 else {
		 db.get("SELECT registered_courses FROM people WHERE university_id = ?;",username,function(err,row){
			registered_courses = row.registered_courses;
			if(err) {
				console.log(err);
			}
			else{
				if(registered_courses !== null){
					var list = registered_courses.split(", ");
					if (list.length >= capacity){ // Add to Waitlist
						registered_courses = row.registered_courses + ", W" + crn;
					}
					else{
						registered_courses = row.registered_courses + ", " + crn;
					}
				}
				else{
					registered_courses = crn;
				}
				db.run("UPDATE people SET registered_courses = ? WHERE university_id = ?;", registered_courses, username, function(err) {
					 if(err) {
						console.log(err);
					 }
					 else{
						 res.end("done");
					 }
				 });
				}
		 });
	 }
});

// Drop a class
app.post('/dropClass', function(req, res) {
    var username = req.body.username;
    var crn = req.body.crn;
	var registered_courses;
     
     // Could use more error checking along the way (values can't be '')
	 if (isNaN(username)){
		 res.end("err"); // Invalid field
	 }
	 else {
		 db.get("SELECT registered_courses FROM people WHERE university_id = ?;",username,function(err,row){
			registered_courses = row.registered_courses;
			if(err) {
				console.log(err);
			}
			else{
				var w = registered_courses.indexOf("W"); 
				// Find if someone is waitlisted, if so, add them to the class
				if (w !== -1)
				{
					registered_courses = registered_courses.replace("W","")
				}
				registered_courses = registered_courses.replace(crn+", ","");
				registered_courses = registered_courses.replace(", "+crn,"");
				registered_courses = registered_courses.replace(crn,"");
				db.run("UPDATE people SET registered_courses = ? WHERE university_id = ?;", registered_courses, username, function(err) {
					 if(err) {
						console.log(err);
					 }
					 else{
						res.end("done");
					 }
				 });
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

// Get User Data
app.get('/userProfile', function(req, res) {
	var query = url.parse(req.url, true).query;
    var university_id = query.university_id;

	db.get("SELECT * FROM people WHERE university_id = ?;",university_id,function(err,row){
		if(err) {
			console.log(err);
		}
		else{
			res.end(JSON.stringify(row));
		}
	});  	
});

// Get User Data
app.get('/classes', function(req, res) {
	var query = url.parse(req.url, true).query;
    var university_id = query.university_id;
	console.log("HERE");
	db.get("SELECT * FROM people WHERE university_id = ?;",university_id,function(err,row){
		if(err) {
			console.log(err);
		}
		else{
			if (row !== null)
			{
				console.log(row.registered_courses);
				var list = row.registered_courses.split(', ');
				var r = "";
				for(var i=0; i<list.length; i++){
					if (isNaN(list[i]) === false && list[i] !== undefined && list[i] !== null && list[i] !== "undefined" && list[i] !== ""){
						if (r === ""){
							r += "crn = "+list[i];
						}
						else{
							r += " OR crn = "+list[i];
						}
					}
				}
				console.log(r+";");
				db.all("SELECT * FROM sections WHERE "+r+";",function(err,rows){
					if(err) {
						console.log(err);
					}
					else{
						res.end(JSON.stringify(rows));
					}
				});
			}
		}
	});  	
});

// Start Server
app.listen(8005, function() {
    console.log("Started on PORT 8005");
});
