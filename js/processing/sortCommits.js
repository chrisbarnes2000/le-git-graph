const sortCommits = async (branches, heads) => {
  var allBranchNames = [];
  var commitObjects = {};
  var commits = [];

  // The branches array contains the name of branch as well as
  // the commit history (latest 10 per branch) on the branch
  // This loop gets these commits and arranges it into a dictionary
  branches.forEach((branch) => {
    var branchName = branch.name;
    var commits = branch.target.history.edges;

    commits.forEach((commit) => {
      var storedBranches = commitObjects[commit.oid].branches;
      if (storedBranches != null && commit.oid in commitObjects) {
        storedBranches.push(branchName);
      } else {
        commitObjects[commit.oid] = commit;
        commit.branches = [branchName];
        commit.committedDate = parseDate(commit.committedDate);
      }
    });
  });

  // Generate an array that contains the commits
  Array.from(commitObjects).forEach((commitId) => commits.push(commitObjects[commitId]));
  commitObjects = commits;

  // Sort the commits based on the date they were committed
  commits.sort((a, b) => b.committedDate - a.committedDate);

  commits.forEach((commit) => {
    var branches = commit.branches;
    branches?.forEach((branch) => {
      if (!allBranchNames.includes(branch)) allBranchNames.push(branch);
    });
  });

  console.log("--COMMITS FOR THIS REPO ARE--", commitObjects.slice(0, 10));
  await showCommits(commits, commitObjects.slice(0, 10), allBranchNames, heads, pageNo);
  showLegend(heads);
};
