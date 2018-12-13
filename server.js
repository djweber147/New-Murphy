// Imports
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var url = require('url');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

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
app.use(express.static(__dirname + '/node_modules'));

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
					db.run("INSERT INTO people VALUES (?,?,?,?,?,NULL);", username, position, password, fname, lname, function(err) {
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
				db.get("SELECT * FROM sections WHERE crn = ?;", crn, function(err,row2) {
					 if(err) {
						console.log(err);
					 }
					 else{
						//console.log(registered_courses,"nnnnnn");
						registered_courses2 = row2.registered;
						var list2 = "";
						if(row2.registered !== "--"){
							list2 = registered_courses2.split(", ");
						}
						var add = 0;
						if(list2[0] === "--"){
							add = 1;
						}
						//console.log(list2.length,capacity);
						if (list2.length > capacity+add){ // Add to Waitlist in course
							registered_courses2 = row2.registered + ", W" + username;
							if(registered_courses !== null){
								registered_courses = row.registered_courses + ", W" + crn;
							}
							else{
								registered_courses = "W" + crn;
							}
						}
						else{
							registered_courses2 = row2.registered + ", " + username;
							if(registered_courses !== null){
								registered_courses = row.registered_courses + ", " + crn;
							}
							else{
								registered_courses = crn;
							}
						}
						//console.log(registered_courses,"nnnnnn2");
						db.run("UPDATE sections SET registered = ? WHERE crn = ?;", registered_courses2, crn, function(err) {
							 if(err) {
								console.log(err);
							 }
							 else{
								 res.end("done");
                                 io.sockets.emit('register', {crn, registered_courses2});
							 }
						 });
						 db.run("UPDATE people SET registered_courses = ? WHERE university_id = ?;", registered_courses, username, function(err) {
							 if(err) {
								console.log(err);
							 }
						 });
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
    //console.log(crn);
     // Could use more error checking along the way (values can't be '')
	 if (isNaN(username)){
		 res.end("err"); // Invalid field
	 }
	 else {
		 db.all("SELECT registered_courses, university_id FROM people;",function(err,rows){
			//console.log(rows);
			for(var i=0; i<rows.length;i++){
				if (rows[i].university_id.toString() === username.toString()){
					registered_courses = rows[i].registered_courses;
					//console.log(registered_courses,"registered_courses");
					break;
				}
			}
			if(err) {
				console.log(err);
			}
			else{
				db.get("SELECT registered FROM sections WHERE crn = ?;",crn,function(err,row2){
					registered_courses2 = row2.registered;
					//console.log(registered_courses2,"G",registered_courses,"GERRRRR");
					if(err) {
						console.log(err);
					}
					else{
						//console.log(userList);
						(function(){
						var userList = registered_courses.split(", ");
						var userListFinal = "";
						var list = registered_courses2.split(", ");
						var list2 = "";
						var x = true;
						var editedRowId = "";
						for(var i=0; i<list.length; i++){
							//console.log(list[i],username);
							if(list[i].toString() === username.toString()){
								// don't add
								//console.log(list[i],username);
								for(var j=0; j<userList.length; j++){
									//console.log(crn,userList[j],"HERE");
									if (crn.toString() === userList[j].toString())
									{
										userList[j] = ""; // DROPPING
										list[i] = "";
										//console.log(crn,userList[j],"HERE XXX");
									}
									if (crn.toString() === userList[j].toString().substring(1))
									{
										userList[j] = ""; // DROPPING
										list[i] = "";
									}
								}
								x = false;
							}
							else if(list[i].toString() === "W"+username.toString()){
								// don't add
								//console.log(list[i],username);
								for(var j=0; j<userList.length; j++){
									//console.log(crn,userList[j],"HERE W");
									if (crn.toString() === userList[j].toString())
									{
										userList[j] = ""; // DROPPING
										list[i] = "";
										//console.log(crn,userList[j],"HERE WXXX");
									}
									if (crn.toString() === userList[j].toString().substring(1))
									{
										userList[j] = ""; // DROPPING
										list[i] = "";
									}
								}
								x = false;
							}
							else if (list[i].toString().substring(0,1) === "W"){
								//console.log(list[i].substring(1),"BOB");
								for(var k=0; k<rows.length;k++){
									//console.log("BBBBBBB",rows[k].university_id.toString(),list[i].toString().substring(1));
									if (rows[k].university_id.toString() === list[i].toString().substring(1)){
										editedRowId = rows[k].university_id;
										var y = rows[k].registered_courses.split(", ");
										rows[k].registered_courses = "";
										for(var j=0; j<y.length; j++){
											//console.log("YYYY",y[j],crn);
											if (y[j].toString().substring(1) === crn.toString()){
												y[j] = crn;
											}
											rows[k].registered_courses += y[j];
											if(y[j] !== "" && j < rows.length -1){
												rows[k].registered_courses += ", ";
											}
										}
										break;
									}
								}
								list[i] = list[i].replace("W","");
								list2 += list[i];
								if(i !== list.length-1 && list[i] !== ""){
									list2 += ", ";
								}
								x = false;
							}
							else{
								list2 += list[i];
								if(i !== list.length-1 && list[i] !== ""){
									list2 += ", ";
								}
							}
						}
						
						//console.log(userList,"Problem");
						for(var j=0; j<userList.length; j++){
							//console.log(userList[j]);
							userListFinal += userList[j];
							if(j !== userList.length-1){
								userListFinal += ", ";
							}
						}
						//console.log(userListFinal,"Final");
						for(var i=0; i<rows.length;i++){
							//console.log(rows[i].university_id.toString(),username.toString());
							if (rows[i].university_id.toString() === username.toString()){
								rows[i].registered_courses = userListFinal;
								break;
							}
						}
						
						registered_courses2 = list2;
						//console.log(crn,registered_courses2,"00000000000");
						db.run("UPDATE sections SET registered = ? WHERE crn = ?;", registered_courses2, crn, function(err) {
							 if(err) {
								console.log(err);
							 }
							 else{
								res.end("done");
                                io.sockets.emit('drop', {crn, registered_courses2});
							 }
						 });
						 if(registered_courses === ""){
							registered_courses = null;
						}
						//console.log(username,registered_courses,"11111111111111");
						db.run("UPDATE people SET registered_courses = ? WHERE university_id = ?;", userListFinal, username, function(err) {
							 if(err) {
								console.log(err);
							 }
						});
						var temp = "";
						for(var i=0; i<rows.length; i++){
							//console.log(rows[i].university_id.toString(),editedRowId.toString());
							if (rows[i].university_id.toString() === editedRowId.toString()){
								temp = rows[i].registered_courses;
								//console.log("22222222222222",editedRowId,temp);
								db.run("UPDATE people SET registered_courses = ? WHERE university_id = ?;", temp, editedRowId, function(err) {
									 if(err) {
										console.log(err);
									 }
								});
								break;
							}
						}
						})();
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
            departments = departments.toString().replace(/,/g, "\" OR sections.subject = \"");
         }
     
        stmt = "SELECT sections.*, courses.credits, courses.description, courses.name FROM sections LEFT JOIN courses ON (sections.subject = courses.subject AND sections.course_number = courses.course_number) WHERE";
     
        // If CRN is provided
        if (crn != "") {
            stmt += " crn = ";
            stmt += crn;
            stmt += ";";
        }
        else if (coursenumber.trim() != "") {
             stmt += " sections.course_number = ";
             stmt += coursenumber;
             stmt += " AND (sections.subject = \"";
             stmt += departments;
             stmt += "\");";
        }
        else {
             stmt += " (sections.subject = \"";
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

// Get Class List
app.get('/roster', function(req, res) {
	var query = url.parse(req.url, true).query;
    var crn = query.crn;
	console.log("SELECT registered FROM sections WHERE crn = "+crn);
	db.get("SELECT registered FROM sections WHERE crn = ?;",crn,function(err,row){
		if(err) {
			console.log(err);
		}
		else{
			console.log(row);
			if (row !== null && row.registered !== "--" && row.registered !== ""){
				var list = row.registered.split(', ');
				var r = "";
				for(var i=0; i<list.length; i++){
					if (list[i][0] === "W"){
						if (list[i].substring(1) !== undefined && list[i].substring(1) !== null && list[i].substring(1) !== "undefined" && list[i].substring(1) !== ""){
							if (r === ""){
								r += "university_id = "+list[i].substring(1);
							}
							else{
								r += " OR university_id = "+list[i].substring(1);
							}
						}
					}
					else if (isNaN(list[i]) === false && list[i] !== undefined && list[i] !== null && list[i] !== "undefined" && list[i] !== ""){
						if (r === ""){
							r += "university_id = "+list[i];
						}
						else{
							r += " OR university_id = "+list[i];
						}
					}
				}
				console.log("SELECT * FROM people WHERE "+r+";");
				db.all("SELECT * FROM people WHERE "+r+";",function(err,rows){
					if(err) {
						console.log(err);
					}
					else{
						res.end(JSON.stringify(rows));
					}
				});
			}
			else{
				res.end(JSON.stringify(row));
			}
			
		}
	});  	
});

// Get User Data
app.get('/classes', function(req, res) {
	var query = url.parse(req.url, true).query;
    var university_id = query.university_id;
	console.log("HERE-CLASSES");
	db.get("SELECT * FROM people WHERE university_id = ?;",university_id,function(err,row){
		if(err) {
			console.log(err);
		}
		else{
			if (row !== null)
			{
				console.log(row.registered_courses,"REG");
				if(row.registered_courses !== null){
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
					console.log(r+";","STMT");
					if(r !== "")
					{
						db.all("SELECT * FROM sections WHERE "+r+";",function(err,rows){
							if(err) {
								console.log(err);
							}
							else{
								res.end(JSON.stringify(rows));
							}
						});
					}
					else{
						res.end(JSON.stringify({prob: 0}));
					}
				}
				else{
					res.end(JSON.stringify({prob: 0}));
				}
			}
		}
	});  	
});

io.on('connection', function(client) {
    console.log('Client connected...');

    client.on('messages', function(data) {
        client.emit('broad', data);
        client.broadcast.emit('broad',data);
    });
});

// Start Server
server.listen(8005, function() {
    console.log("Started on PORT 8005");
});
