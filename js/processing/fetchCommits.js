const fetchCommits = async () => {
  // Recursively call this function until all the branches are fetched
  // (GitHub API has a limit of 100 branches per request)
  var [repoOwner, repoName] = getRepo();
  var branches = [];
  var APIcost = 0;
  var heads = [];

  // Add the loader to the UI
  await showCommitsLoading((elem = document.getElementsByClassName("clearfix")[0]));

  // fetchCommitsPage returns true only if the fetch was successful
  if (fetchCommitsPage(repoOwner, repoName, "NONE", branches, APIcost)) {
    console.log(`--FETCHED BRANCHES   COST: ${APIcost}--`);
    branches = branches.map((branch) => {
      heads.push({
        name: branch.name,
        oid: branch.target.history.edges[0].node.oid,
      });
      branch.target.history.edges[0].node.isHead = true;
      return branch;
    });
    await sortCommits(branches, heads);
  }
};

// The cost depends on the complexity of query that GitHub will have to do
// First, fetch the commits with just the time, so that top ones to show can be found
// Then request the rest of the details (like parents) of commits in another request.
// NOTE : Return true if the request is successful, false otherwise
const fetchCommitsPage = async (repoOwner, repoName, lastFetched, branches, APIcost) => {
  if (lastFetched == "NONE") {
    console.log("--STARTED FETCHING--");
    var initialQuery = `{
      rateLimit {
        limit
        cost
        remaining
        resetAt
      }
      repository(owner: "${repoOwner}", name: "${repoName}") {
        refs(refPrefix: "refs/heads/", orderBy: {direction: DESC, field: TAG_COMMIT_DATE}, first:100) {
          edges {
            cursor
            node {
              ... on Ref {
              name
              target {
                ... on Commit {
                  history(first: 10) {
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
                }
              }
            }
          }
        }
      }
    }`;
  } else {
    console.log("--STILL FETCHING... TOO MANY COMMITS--");
    var initialQuery = `{
      rateLimit {
        limit
        cost
        remaining
        resetAt
      }
      repository(owner: "${repoOwner}", name: "${repoName}") {
        refs(refPrefix: "refs/heads/", orderBy: {direction: DESC, field: TAG_COMMIT_DATE}, first:100, after: "${lastFetched}") {
          edges {
            cursor
            node {
              ... on Ref {
                name
                target {
                  ... on Commit {
                    history(first: 10) {
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
                }
              }
            }
          }
        }
      }
    }`;
  }

  var data = await handleResponse((queryContent = initialQuery));

  try {
    var fetchedBranches = data.data.repository.refs.edges;
    fetchedBranches.forEach((branch) => branches.push(branch.node));
    if (fetchedBranches.length >= 100) {
      var lastFetchedCursor = fetchedBranches[fetchedBranches.length - 1].cursor;
      if ((await fetchCommitsPage(repoOwner, repoName, lastFetchedCursor, branches, APIcost)) == false) return false;
    }
    APIcost += data.data.rateLimit.cost;
    return true;
  } catch (error) {
    console.log("--ERROR FETCHING BRANCHES--", { error });
    addAuthorizationPrompt("Failed to fetch branches. Please Try Again.");
  }
};
