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
            });
        },
		sortRows: function(col){
			
		},
		addRow: function(event) {
			var temp = document.getElementById(this.id);
			
		},
		checkProfile: function(x){
			if(app.profile.registed_courses === undefined){
				return false;
			}
			var list = app.profile.registed_courses.split(', ');
			for(var i = 0; i < app.profile.registed_courses.length; i++){
				if (list[i] === x){
					return true;
				}
			}
			return false;
		},
		registerClass: function(x){
			var username = app.profile.university_id;
			$.post("registerClass", {username: username}, function(data) {
				 console.log(data);
				 console.log($('#errormessage').text());
                 if (data === 'done') {
					 localStorage.setItem("user", username);
                     window.location.replace("search.html");
                 }
				 else if (data === "err") {
					 showLogIn();
					 $('#errormessage').text("Incorrect Password. Please Try Again.");
				 }
				 else if (data === "err2") {
					 showLogIn();
					 $('#errormessage').text("This University ID has not been registered. Please create a new user.");
				 }
             });
		},
		dropClass: function(x){
			
		}
		
    },
    // Load departments on page load
    mounted() {
        this.getDepartments();
	this.getUser();
    }
});
