function addNextPageButton(commits, branchNames, allCommits, heads, pageNo) {
  var newerButton = document.getElementById("newerButton");
  var olderButton = document.getElementById("olderButton");
  if (commits.length >= 10) {
    olderButton.setAttribute("aria-disabled", "false");
    olderButton.addEventListener("click", function () {
      // fetchFurther(commits, branchNames, allCommits, branches, heads, pageNo);
      fetchFurther(commits.slice(-10), allCommits, heads, pageNo, branchNames);
    });
  }
}
