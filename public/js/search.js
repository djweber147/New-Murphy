var app = new Vue({
    el: '#app',
    data: {
        req_coursenumber: '',
        req_crn: '',
        req_departments: [],
        departments: [],
        courses: [],
		loaded: false,
		profile: null,
        currentSort: 'coursenumber',
        currentSortDir: 'desc'
    },
    methods: {
        getDepartments: function() {
            showLoading();
            $.getJSON("searchdept",function(data) {
                app.departments = data;
				app.loaded = true;
                hideLoading();
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
			if(app.profile.registered_courses === null){
				return false;
			}
			var list = app.profile.registered_courses.split(', ');
                  
            var numcourses;
            if (app.profile.registered_courses === null) { numcourses = 0; }
            else if (app.profile.registered_courses.match(/,/g) === null) { numcourses = 1; }
            else { numcourses = app.profile.registered_courses.match(/,/g).length+1; }

			for(var i = 0; i < numcourses; i++){
				//console.log(list[i],x);
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
    computed: {
        sortedCourses: function() {
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
