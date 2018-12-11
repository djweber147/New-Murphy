var app = new Vue({
    el: '#app',
    data: {
        clickedRow: -1,
        req_coursenumber: '',
        req_crn: '',
        req_departments: [],
        departments: [],
        courses: [],
		loaded: false,
		profile: null,
		showSchedule: false,
		classObjects: [],
		check: false,
		currentSort: 'coursenumber',
        currentSortDir: 'desc',
		view: false
    },
    methods: {
        rowClicked: function(index) {
                  if ($(this).attr("id") == "action") { console.log("f");}
            if (this.clickedRow == index) {
                this.clickedRow = -1;
            }
            else {
                this.clickedRow = index;
            }
        },
        getNumber: function(list) {
            var results = list.split(",");
            var count = 0;
                  for (var i=0; i < results.length; i++) {
                  if (results[i].trim() !== "" && results[i].trim() !== "--") count++;
                  }
            return count;
        },
        getDepartments: function() {
			showLoading();
            $.getJSON("searchdept",function(data) {
                app.departments = data;
				app.loaded = true;
				hideLoading();
            });
        },
        getCourses: function() {
			app.check = false;
            var req = "";
            req = req.concat("courses?crn=", app.req_crn, "&coursenumber= ", app.req_coursenumber, "&departments=", app.req_departments);
            showLoading();
			$.getJSON(req, function(data) {
                app.courses = data;
				hideLoading();
            });
        },
		getUser: function() {
            var req = "";
			var userName = localStorage.getItem("user");
            req = "userProfile?university_id=" + userName;
            $.getJSON(req, function(data) {
                app.profile = data;
				//console.log(app.profile, "Profile");
            });
			this.getClasses();
        },
        getCourseDescription: function() {
            
        },
		sortRows: function(s) {
            //if s == current sort, reverse
            if(s === this.currentSort) {
                this.currentSortDir = this.currentSortDir==='asc'?'desc':'asc';
            }
            this.currentSort = s;
        },
		addRow: function(event) {
			var temp = document.getElementById(this.id);
			
		},
		checkProfile: function(x){
			if (app.check == false){
				app.getUser();
				app.check = true;
			}
			var color1 = "#dcdcdc"; // Gray for unregistered
			var color2 = "#b91be5"; // light purple for registered
			var color3 = "#e5b91b"; // light yellow for waitlist
			var color4 = "#848484"; // dark gray for time conflict
			
			$("#"+x.crn).css("background-color",color1); // Set Color
			
			if(app.profile.registered_courses == null ){
				return "REG"; // You are not registered
			}
			for(var i = 0; i < app.classObjects.length; i++){
				if (app.classObjects[i].crn === x.crn){
					$("#"+x.crn).css("background-color",color2);
					
					return "DROP"; // You are registered
				}
				if (app.classObjects[i] !== undefined){
					if (app.classObjects[i].times === x.times){ // Time Conflict
						$("#"+x.crn).css("background-color",color4);
						return "TIME"; // You are waitlisted
					}
				}
			}
			if (app.profile !== null){
				var list = app.profile.registered_courses.split(", ");
				for(var i=0; i< list.length; i++){
					if (list[i].toString().substring(1) === x.crn.toString()){ // Wait listed
						$("#"+x.crn).css("background-color",color3);
						return "WAIT"; // You are waitlisted
					}
				}
			}
			return "REG"; // You are not registered
		},
		registerClass: function(crn,capacity){
			var username = app.profile.university_id;
            showLoading();
			$.post("registerClass", {username: username, crn: crn, capacity: capacity}, function(data) {
                 if (data === 'done') {
					 app.getUser();
                 }
				 else {
					 $('#errormessage').text("ERROR: Register Class");
				 }
                 hideLoading();
             });
		},
		dropClass: function(crn){
			var username = app.profile.university_id;
            showLoading();
			$.post("dropClass", {username: username, crn: crn}, function(data) {
				console.log(data, "DROP");
                 if (data === 'done') {
					 app.getUser();
                 }
				 else {
					 $('#errormessage').text("ERROR: Drop Class");
				 }
                 hideLoading();
             });
		},
		getSchedule: function(){
			var text = [];
			text["mon"] = "";
			text["tue"] = "";
			text["wed"] = "";
			text["thu"] = "";
			text["fri"] = "";
			for(var i=0; i<app.classObjects.length; i++)
			{
				var x = app.classObjects[i].times.indexOf(" ");
				if (app.classObjects[i].times.substring(0,x).indexOf("M") !== -1){
					text["mon"] += ('<div id="M'+app.classObjects[i].crn+'">'+app.classObjects[i].subject+app.classObjects[i].course_number+" "+app.classObjects[i].times+"<br><br>");
					text["mon"] += '<button onclick="app.btnClick('+app.classObjects[i].crn+',\''+app.classObjects[i].times.substring(0,x)+'\')">Drop</button></div>'
				}
				if (app.classObjects[i].times.substring(0,x).indexOf("T") !== -1){
					text["tue"] += ('<div id="T'+app.classObjects[i].crn+'">'+app.classObjects[i].subject+app.classObjects[i].course_number+" "+app.classObjects[i].times+"<br><br>");
					text["tue"] += '<button onclick="app.btnClick('+app.classObjects[i].crn+',\''+app.classObjects[i].times.substring(0,x)+'\')">Drop</button></div>';
				}
				if (app.classObjects[i].times.substring(0,x).indexOf("W") !== -1){
					text["wed"] += ('<div id="W'+app.classObjects[i].crn+'">'+app.classObjects[i].subject+app.classObjects[i].course_number+" "+app.classObjects[i].times+"<br><br>");
					text["wed"] += '<button onclick="app.btnClick('+app.classObjects[i].crn+',\''+app.classObjects[i].times.substring(0,x)+'\')">Drop</button></div>';
				}
				if (app.classObjects[i].times.substring(0,x).indexOf("R") !== -1){
					text["thu"] += ('<div id="R'+app.classObjects[i].crn+'">'+app.classObjects[i].subject+app.classObjects[i].course_number+" "+app.classObjects[i].times+"<br><br>");
					text["thu"] += '<button onclick="app.btnClick('+app.classObjects[i].crn+',\''+app.classObjects[i].times.substring(0,x)+'\')">Drop</button></div>';
				}
				if (app.classObjects[i].times.substring(0,x).indexOf("F") !== -1){
					text["fri"] += ('<div id="F'+app.classObjects[i].crn+'">'+app.classObjects[i].subject+app.classObjects[i].course_number+" "+app.classObjects[i].times+"<br><br>");
					text["fri"] += '<button onclick="app.btnClick('+app.classObjects[i].crn+',\''+app.classObjects[i].times.substring(0,x)+'\')">Drop</button></div>';
				}
			}
			
			$("#schedule").css("display","block");
			$("#mon").html(text["mon"]);
			$("#tue").html(text["tue"]);
			$("#wed").html(text["wed"]);
			$("#thu").html(text["thu"]);
			$("#fri").html(text["fri"]);
			app.showSchedule = true;
		},
		btnClick: function(crn,x){// Schedule Drop button
			app.dropClass(crn); 
			for(var i=0; i <x.length; i++){
				$("#"+x.charAt(i)+crn).css("display", "none");
			}
		},
		hideSchedule: function(){
			$("#schedule").css("display", "none");
			app.showSchedule = false;
		},
		getClasses: function(){
			var req = "";
			var userName = localStorage.getItem("user");
            req = "classes?university_id=" + userName;
            $.getJSON(req, function(data) {
				if(data != "{prob: 0}")
				{
					app.classObjects = data;
				}
				else{
					app.classObjects = [];
				}
            });
		},
		viewClass: function(crn,cap){ // Faculty get class
			var req = "";
			var obj = null;
            req = "roster?crn=" + crn;
            $.getJSON(req, function(data) {
                obj = data;
				var text = "";
				text += '<button onclick="app.hideClass(\''+crn+'\')">Hide Class</button><br>';
				var text2 = "";
				var x = false;
				for(var i=0; i<obj.length; i++){
					if(i >= cap && x == false)
					{
						x = true;
						text2 += "<b>Waitlist</b><br>"
					}
					text2 += obj[i].university_id + " " + obj[i].first_name + " " + obj[i].last_name + "<br>"; 
				}
				if (text2 === ""){
					$("#roster"+crn).html(text+"<i>No Students Registered</i>");
				}
				else{
					$("#roster"+crn).html(text+text2);
				}
            });
		},
		hideClass: function(crn){
			$("#roster"+crn).html('<button onclick="app.viewClass(\''+crn+'\')">View Class</button>');
		}
		
    },
	computed: {
        sortedCourses: function() {
            this.clickedRow = -1;
            return this.courses.sort((a,b) => {
                let modifier = 1;
                if (this.currentSortDir === 'desc') modifier = -1;
                if (a[this.currentSort] < b[this.currentSort]) return -1 * modifier;
                if (a[this.currentSort] > b[this.currentSort]) return 1 * modifier;
                return 0;
            });
        }
    },
    // Load departments on page load
    mounted() {
        this.getDepartments();
		this.getUser();
    }
});
function showLoading() { document.getElementById("loading").style.display = "block"; }
function hideLoading() { document.getElementById("loading").style.display = "none"; }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
