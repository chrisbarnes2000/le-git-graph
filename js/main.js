// The first thing that the extension should do is add a 'commits' button.
// Everything else happens only if the user clicks on it.

// Hence every other function/service is called only if the user clicks on the button.

// The commits button is to be added on all repositories.
// Trying to filter out github's reserved pages, like login. (Incomplete: Github has many more URLs.)

var pathsToExclude = ["login", "oauth", "authorize"];
var currentPath = new URL(window.location.href).pathname.split("/")[1];
if (pathsToExclude.includes(currentPath) == false) addCommitsButton();
