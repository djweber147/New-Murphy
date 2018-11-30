var deptLoaded = false;

// Based on https://codeforgeek.com/2014/09/handle-get-post-request-express-4/
// Login or switch forms
$(document).ready(function() {
	if (deptLoaded === false)
	{
		$.post("searchdept",function(data){
			var result = JSON.parse(data);
			for(var i = 0; i < result.length; i++){
console.log(result[i].subject);
			var a = "<input type='checkbox' id='" + result[i].subject + "'> " + result[i].full_name + " </input>";
			$("#departments2").append(a);
			}
		});
		deptLoaded = true;	
	}
     $("#submit").click(function() {
         var crn = $("#crn").val() || null;
         var coursenumber = $("#coursenumber").val()|| null;
		 var departments = []; // Array of departments
		 $( "input" ).each(function(index){
			 if (this.type === 'checkbox' && this.checked === true){
				departments.push(this.id);
			 }
		 });
        $.post("courses", {crn: crn,coursenumber: coursenumber,departments: departments}, function(data) {
             console.log(data);
	     var result = JSON.parse(data);
			for(var i = 0; i < result.length; i++){
				var a = "<tr><td>"+result[i].subject +"</td><td>"+result[i].course_number+ "-" +result[i].section_number+"</td><td>"+result[i].building +result[i].room +"</td><td>"+result[i].crn +"</td> </tr>";
				$("#results").append(a);
				//$("#results").style.hidden = false;
			}
//             console.log($('#errormessage').text());
//             if (data === 'done') {
//				 window.location.replace("search.html");
//             }
//             else if (data === "err") {
//                 showLogIn();
//                 $('#errormessage').text("Incorrect Password. Please Try Again.");
//             }
//             else if (data === "err2") {
//                 showLogIn();
//                 $('#errormessage').text("This University ID has not been registered. Please create a new user.");
//             }
         });
     });
});
