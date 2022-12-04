const addLoadMoreButton = (allCommits, commits, branchNames, heads, pageNo) => {
  var newerButton = document.getElementById("newerButton");
  var olderButton = document.getElementById("olderButton");
  if (commits.length >= 10) {
    olderButton.setAttribute("aria-disabled", "false");
    olderButton.addEventListener("click", () => {
      // fetchFurther(allCommits, commits, branchNames, heads, pageNo);
      fetchFurther(allCommits, commits.slice(-10), branchNames, heads, pageNo);
    });
  }
};
