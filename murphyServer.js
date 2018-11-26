var fs = require('fs');
var path = require('path');
var http = require('http');
var url = require('url');
var path = require('path');
var express = require('express');
var sqlite3 = require('sqlite3');

var app = express();

// Downloaded Node JS modules
var mime = require('mime-types');
var multiparty = require('multiparty');

var port = 8005;
var public_dir = path.join(__dirname, 'public');
//var public_dir = path.join(__dirname, 'clem0051.github.io');

var server = http.createServer(function(req, res){


                var req_url = url.parse(req.url);
                var filename = req_url.pathname.substring(1);
                if (filename === "") {
                        filename = "index.html";
                }
                console.log(filename);
                if (req.method === "GET")
                {
                        fs.readFile(path.join(public_dir, filename), (err, data) => {
                        if (err){
                                res.writeHead(404,{'Content-Type':'text/plain'});
                                res.write('No Find');
                                res.end();
                        }
                        else{
                                var mime_type = mime.lookup(filename) || 'text/plain';
                                res.writeHead(200, {'Content-Type': mime_type});
                                res.write(data);
                                res.end();
                        }
                        });
                //res.writeHead(200, {'Content-Type' :'text/plain'});
                //res.write("Hello World!!");
                //res.end();
        }
        else
        {
                if (filename ==="upload")
                {
                        var form = new multiparty.Form();
                        form.parse(req, (err, fields, files) => {
                                console.log(fields);
                                console.log(files);
                                fs.copyFile(files.img_file[0].path,
                                files.img_file[0].originalFilename,
                                (err) => {
                                        if (err) {
                                                console.log('Could not copy file')
                                        }
                                });
                                res.writeHead(200, {'Content-Type':'text/plain'});
                                res.write("New Stufff");

                        else{
                                var mime_type = mime.lookup(filename) || 'text/plain';
                                res.writeHead(200, {'Content-Type': mime_type});
                                res.write(data);
                                res.end();
                        }
                        });
                //res.writeHead(200, {'Content-Type' :'text/plain'});
                //res.write("Hello World!!");
                //res.end();
        }
        else
        {
                if (filename ==="upload")
                {
                        var form = new multiparty.Form();
                        form.parse(req, (err, fields, files) => {
                                console.log(fields);
                                console.log(files);
                                fs.copyFile(files.img_file[0].path,
                                files.img_file[0].originalFilename,
                                (err) => {
                                        if (err) {
                                                console.log('Could not copy file')
                                        }
                                });
                                res.writeHead(200, {'Content-Type':'text/plain'});
                                res.write("New Stufff");
                                res.end();
                        });
                }
                else
                {
                res.writeHead(500, {'Content-Type':'text/plain'});
                res.write("Error");
                res.end();
                }
        }
});
console.log("Now listening on Port " + port);
server.listen(port, '0.0.0.0');

var path = require('path');
var express = require('express');
var sqlite3 = require('sqlite3');

var app = express();
var port = 8026;

var imdb_db = new sqlite3.Database(path.join(__dirname, 'db', 'imdb.sqlite3'), (err) => {
    if (err) {
        console.log('Error opening imdb.sqlite3 database');
    }
    else {
        console.log('Now connected to imdb.sqlite3 database!');
    }
});

app.get('/people/:nconst', (req, res) => {
    console.log('person:', req.params);
    imdb_db.all('SELECT * FROM Names WHERE nconst == ?', [req.params.nconst], (err, rows) => {
        if (err) {
            console.log('Error running query');
        }
        else {
            console.log(rows);
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write(rows[0].primary_name + ' (' + rows[0].birth_year + '-' + rows[0].death_year + ')');
            res.end();
        }
    });
});

app.get('/title/:tconst', (req, res) => {
    console.log('title', req.params);
    imdb_db.all('SELECT * FROM Titles WHERE tconst == ?', [req.params.tconst], (err, rows) => {
        if (err) {
            console.log('Error running query');
        }
        else {
            console.log(rows);
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write(rows[0].primary_title + ' (' + rows[0].start_year + ') [' + rows[0].title_type + ']');
            res.end();
        }
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
