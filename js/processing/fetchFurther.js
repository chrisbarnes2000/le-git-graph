// This function fetches sufficient commits from the API so that the order can be assured to be maintained.
// The idea is to fetch the last 20 commits in the history of each of the last 10 commits that are displayed.

// This function calls drawGraph() which will clear the existing graph and redraw it.
// Commits array just contains the last 10 commits, so their are 10 levels of history that can be fetched.
const fetchFurther = async (allCommits, commits, branchNames, heads, pageNo) => {
  if (commits.length < 10) return false;

  var lastTenCommits = commits.slice(commits.length - 20, commits.length);
  var [repoOwner, repoName] = getRepo();
  var commitObjects = {};
  pageNo += 1;

  // Add the loader to the UI
  await showCommitsLoading((elem = document.getElementById("commitsOl")));

  var queryContent = `query {
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
    repository(owner:"${repoOwner}", name: "${repoName}") {`;

  for (var i = 0; i < lastTenCommits.length; i++) {
    queryContent += `commit${i}: object(oid: "${lastTenCommits[i].oid}") {
      ... on Commit{
        history(first: 20) {
          edges {
            node {
              ... on Commit {
                oid
                messageHeadlineHTML
                committedDate
              }
            }
          }
        }
      }
    }`;
  }

  queryContent += ` } } `;

  var data = await handleResponse(queryContent);

  try {
    var newlyFetchedCommits = data.data.repository;
    newlyFetchedCommits.forEach((commit) => {
      commit.history.edges.forEach((index) => {
        commit = index.node;
        commit.committedDate = parseDate(commit.committedDate);
        allCommits.push(commit);
      });
    });
  } catch (error) {
    console.log("--ERROR FETCHING COMMITS--", { error });
    addAuthorizationPrompt("Failed to fetch commits. Please Try Again.");
  }

  // The main fetchFurther algorithm fetches 20 commits before each of the 10 displayed commits.
  // As there could be many overlap between the history of different branches,
  // many of the commits would be duplicates. This algorithm removes duplicates, while keeping the
  // details of commits previously fetched from API. [If already fetched]
  allCommits.forEach((commit) => {
    !commitObjects[commit.oid]
      ? (commitObjects[commit.oid] = commit)
      : commit.forEach((parameter) => (commitObjects[commit.oid][parameter] = commit[parameter]));
  });

  allCommits = [];
  commitObjects.forEach((commit) => allCommits.push(commitObjects[commit]));

  allCommits.sort((a, b) => b.committedDate - a.committedDate);

  var commitsToShow = allCommits.slice(0, 10 * pageNo);
  await showCommits(commitsToShow, branchNames, allCommits, heads, pageNo);
  showLegend(heads);
};
