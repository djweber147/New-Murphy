var app = new Vue({
    el: '#app',
    data: {
        req_coursenumber: '',
        req_crn: '',
        req_departments: [],
        departments: [],
        courses: [],
		loaded: false,
		profile: null
    },
    methods: {
        getDepartments: function() {
            $.getJSON("searchdept",function(data) {
                app.departments = data;
				app.loaded = true;
            });
        },
        getCourses: function() {
            var req = "";
            req = req.concat("courses?crn=", app.req_crn, "&coursenumber= ", app.req_coursenumber, "&departments=", app.req_departments);
            $.getJSON(req, function(data) {
                app.courses = data;
            });
        },
		getUser: function() {
            var req = "";
			var userName = localStorage.getItem("user");
            req = "userProfile?university_id=" + userName;
            $.getJSON(req, function(data) {
                app.profile = data;
				console.log(data,"REG");
            });
        },
		sortRows: function(col){
			
		},
		addRow: function(event) {
			var temp = document.getElementById(this.id);
			
		},
		checkProfile: function(x){
			if(app.profile.registered_courses === undefined){
				return false;
			}
			var list = app.profile.registered_courses.split(', ');
			console.log(list);
			for(var i = 0; i < app.profile.registered_courses.length; i++){
				console.log(list[i],x);
				if (list[i] === x.toString()){
					return true;
				}
			}
			return false;
		},
		registerClass: function(x){
			var username = app.profile.university_id;
			$.post("registerClass", {username: username, crn: x}, function(data) {
                 if (data === 'done') {
					 app.getUser();
                 }
				 else {
					 $('#errormessage').text("ERROR: Register Class");
				 }
             });
		},
		dropClass: function(x){
			var username = app.profile.university_id;
			$.post("dropClass", {username: username, crn: x}, function(data) {
                 if (data === 'done') {
					 app.getUser();
                 }
				 else {
					 $('#errormessage').text("ERROR: Drop Class");
				 }
             });
		}
		
    },
    // Load departments on page load
    mounted() {
        this.getDepartments();
	this.getUser();
    }
});
