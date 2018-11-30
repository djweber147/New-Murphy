var app = new Vue({
    el: '#app',
    data: {
        req_coursenumber: '',
        req_crn: '',
        req_departments: [],
        departments: [],
        courses: []
    },
    methods: {
        getDepartments: function() {
            $.getJSON("searchdept",function(data) {
                app.departments = data;
            });
        },
        getCourses: function() {
            var req = "";
            req = req.concat("courses?crn=", app.req_crn, "&coursenumber= ", app.req_coursenumber, "&departments=", app.req_departments);
            $.getJSON(req, function(data) {
                  app.courses = data;
            });
        }
                  
    },
    // Load departments on page load
    mounted() {
        this.getDepartments();
    }
});
