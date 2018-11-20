// Select Year and Term
const year = 2019;
const term = 20; // 10 - Jterm, 20 - Spring, 30 - Summer, 40 - Fall


// Requires
var path = require('path');
var express = require('express');
const rp = require('request-promise');
const $ = require('cheerio');
const r = require('request');
const sqlite3 = require('sqlite3');

// Create Database
var db  = new sqlite3.Database(path.join(__dirname, 'db', 'newMurphy.sqlite3'), (err) => 
{
  if (err)
  {
    console.log('Error Opening Database');
  }
  else
  {
    console.log('Connected to Database');
    db.run("CREATE TABLE departments (subject TEXT PRIMARY KEY NULL, full_name TEXT NULL)");

    db.run("CREATE TABLE courses (subject TEXT, course_number INTEGER, credits INTEGER, name TEXT, description TEXT)");

    db.run("CREATE TABLE sections (crn INTEGER PRIMARY KEY NULL, subject TEXT NULL, course_number INTEGER NULL, section_number INTEGER NULL, building TEXT NULL, room TEXT NULL, professors TEXT NULL, times TEXT NULL, capacity INTEGER NULL, registered TEXT NULL)");

    db.run("CREATE TABLE people (university_id INTEGER PRIMARY KEY NULL, position TEXT NULL, password TEXT NULL, first_name TEXT NULL, last_name TEXT NULL, registered_courses TEXT NULL)");

    console.log("Created tables")
  }
});

// Get Subject List
var url = "https://classes.aws.stthomas.edu/index.htm?year=" + year + "&term=" + term + "&schoolCode=ALL&levelCode=ALL&selectedSubjects=";
console.log("Getting list of subjects...");
rp(url).then(function(html) {
             
    var subjects = new Array();
    var subjectList = $('select#displaySubjectCode > option', html);
    var tmpSubject;
             
    // Loop starts at 1 to avoid "All Subject" option
    for (var i=1; i < subjectList.length; i++) {
        tmpSubject = subjectList[i].children[0].data.split(": ");
        subjects.push(tmpSubject[0]);

        // Add to data base
        addSubject(tmpSubject[0], tmpSubject[1]);
    }
          
    // Once Subject list is complete, move to scraping each subject course list
    console.log("Subject list complete");
    scrapeSubjects(subjects);
    
    // Debug - Print Subject
    //for (var i = 0; i < subjects.length; i++) {
    //    console.log(subjects[i]);
    //}
             
}).catch(function(err) {
    console.log("Cannot find subjects: " + err);
});


// Scrape each subject
function scrapeSubjects(subjects) {
    
    var lastCourseAdded = "";
    var courseList;
    var subject;
    var course_number, section_number, name, times, building, room, capacity, professors, description, credits, crn;
    
    // Loop through every subject
    for (var i = 0; i < subjects.length; i++) {
        
        // Make request
        console.log("Getting " + subjects[i] + " course info...");
        rp(url+subjects[i]).then(function(html) {
                                 
             courseList = $('div.course', html);
                                 
             for (var j = 0; j < courseList.length; j++) {
                // Scrape info from page
                course_number = courseList[j].children[1].children[1].children[1].children[0].data.split("-")[0];
                section_number = courseList[j].children[1].children[1].children[1].children[0].data.split("-")[1];
                name = courseList[j].children[1].children[3].children[0].data.trim();
                times = courseList[j].children[1].children[5].children[0].data.trim();
                building = courseList[j].children[1].children[9].children[1].children[1].children[0].data.trim().split(" ")[0];
                room = courseList[j].children[1].children[9].children[1].children[1].children[0].data.trim().split(" ")[1];
                capacity = courseList[j].children[3].children[1].children[1].children[3].children[0].data.trim().split(": ")[1];
                professors = courseList[j].children[3].children[3].children[1].children[3].children[0].data.trim();
                description = courseList[j].children[3].children[3].children[3].children[0].data.trim();
                credits = courseList[j].children[3].children[3].children[5].children[0].data.trim().split(" ")[0];
                crn = courseList[j].children[3].children[1].children[5].children[0].data.trim().split(": ")[1];
                subject = courseList[j].children[3].children[1].children[11].children[4].data.trim().split(": ")[0];
                                 
                // Add course to database
                if (course_number != lastCourseAdded) {
                    addCourse(subject, course_number, credits, name, description);
                    lastCourseAdded = course_number;
                }
                
                // Add section to database
                if (times != "See Details") {
                // "See Detail" is the response for a full section, won't include in our fake database
                    addSection(crn, subject, course_number, section_number, building, room, professors, times, capacity);
                }
             }
                                 
            
        })
        .catch(function(err){
            //console.log("Cannot find course page for " + subjects[i] + ": " + err);
        });
        
    } // subject loop
} // scrapeSubjects


// Trim Function
// From http://www.codecodex.com/wiki/Trim_whitespace_(spaces)_from_a_string#JavaScript
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g,""); // remove leading and trailing whitespace
}


// Add to database functions
function addSubject(subject, full_name) {
    console.log("ADDED SUBJECT: " + subject + " - " + full_name);
    db.run("INSERT INTO departments (subject, full_name) VALUES (? , ?)", subject, full_name);
}

function addCourse(subject, course_number, credits, name, description) {
    console.log("ADDED COURSE: " + subject + course_number + ": " + name + " " + credits + " credits. ");//+ description);
    db.run("INSERT INTO courses (subject, course_number, credits, name, description) VALUES (? , ?, ?, ? ,?)", subject, course_number, credits, name, description);
}

function addSection(crn, subject, course_number, section_number, building, room, professors, times, capacity) {
    console.log("ADDED SECTION: " + crn + "-" + subject + course_number + "-" + section_number + ": " + building + room + " " + professors + " " + times + " " + capacity);
    // In addition to parameters, add "registered" field
    registered = "--";
    db.run("INSERT INTO sections (crn, subject, course_number, section_number, building, room, professors, times, capacity, registered) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", crn, subject, course_number, section_number, building, room, professors, times, capacity, registered)
}
