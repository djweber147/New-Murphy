var deptLoaded = false;

// Based on https://codeforgeek.com/2014/09/handle-get-post-request-express-4/
// Login or switch forms
$(document).ready(function() {
	if (deptLoaded === false)
	{
		$.post("searchdept",function(data){
			var result = JSON.parse(data);
			for(var i = 0; i < result.length; i++){
			var a = "<input type='checkbox' id='" + result[i].subject + "'>" + result[i].subject + "</input>";
			$("#department2").append(a);
			}
		});
		deptLoaded = true;
	}
     $("#submit").click(function() {
		 var username = $("#username").val();
		 var password = md5($("#password").val());
		 $.post("login", {username: username,password: password}, function(data) {
			 console.log(data);
			 console.log($('#errormessage').text());
			 if (data === 'done') {
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
     });
});
