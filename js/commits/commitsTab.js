const openCommitsTab = async () => {
  // Listen For Click To The Commits Tab Button
  openCommitsTabEventListener();

  // Try to fetch stored authorization token
  var authorizationToken = getLocalToken();
  if (authorizationToken == null) {
    // Prompt the user to authorize with GitHub
    addAuthorizationPrompt("GitHub repo access is required to fetch the commits information.");
  } else {
    // Load the commits of all allBranches and show the default view
    console.log(`Authorization token found: ${authorizationToken}`);
    await fetchCommits();
  }

  // Copy the "Issues" tab button, and edit it to be new "Commits" button --> then select it
  // Do this so that the UI matches even if GitHub choose to change their base UI
  var navObject = document.querySelector('[data-pjax="#js-repo-pjax-container"]').children[0];
  // Deselect all the tabs except the "Commits" tab.
  Array.from(navObject.children).forEach((child) => {
    var button = child.children[0];
    if (button.id != "commits-tab") {
      button.removeAttribute("aria-current");
      button.classList.remove("selected");
    }
  });

  var newButton = navObject.children[1].children[0];
  newButton.setAttribute("aria-current", "page");
};

const openCommitsTabEventListener = () => {
  var commitsTabButton = document.getElementById("commits-tab");
  commitsTabButton.addEventListener("click", openCommitsTab);
};

const closeCommitsTab = () => {
  // TODO : Would be better handled if utilizing ${repoName}/commits rather than just mocking the button from issues tab
  // Deselect the commits tab: Navigation is handled automatically by GitHub.
  openCommitsTabEventListener();
  var newButton = document.getElementById("commits-tab");
  newButton.removeAttribute("data-selected-links");
  newButton.removeAttribute("aria-current");
};
