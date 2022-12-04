const showCommits = async (allCommits, commits, branchNames, heads, pageNo) => {
  var commitsLoadingHtml = chrome.runtime.getURL("html/commitsContainer.html");
  var commitItemHtml = chrome.runtime.getURL("html/commitItem.html");
  var [repoOwner, repoName] = getRepo();
  var contentView = document.getElementsByClassName("clearfix")[0];
  var commitsContainerDummy = document.createElement("div");
  var commitsOutsideContainer, commitsGraphContainer;
  // -------------------------------- \\
  [commits, allCommits, commitDict] = await getCommitDetails(repoOwner, repoName, allCommits, commits);
  [commits, commitDict] = assignColors(commits, commitDict);

  await fetch(commitsLoadingHtml)
    .then((response) => response.text())
    .then((commitsContainerHtmlText) => {
      var tempDiv = document.createElement("div");
      tempDiv.innerHTML = commitsContainerHtmlText;
      commitsOutsideContainer = tempDiv.querySelector("#commits-outside-container");
      commitsGraphContainer = tempDiv.querySelector("#commits-container");
    });

  await fetch(commitItemHtml)
    .then((response) => response.text())
    .then((commitItemHtmlText) => {
      var tempCommitItem = createTempDiv(commitItemHtmlText);
      commits.forEach((commit) => drawCommitCard(repoOwner, repoName, commit, tempCommitItem));
    });

  console.log("Done Processing Commits... Adding First 10 To The UI Now!");
  commitsGraphContainer.appendChild(commitsContainerDummy);

  // Display the branches filter dropdown button with default value only (All branches)
  // TODO : Moved the below code (with necessary modifications) from addCommitButton().
  await loadBranchesButton();

  // Fetches the branch data from API.
  // [branches, selectedBranchNames] = await fetchActiveBranches();

  // Set the branches to dropdown
  setBranchOptions(branches, selectedBranchNames);

  // Fetch the commits from API.
  // await fetchCommits(branches);

  contentView.appendChild(commitsOutsideContainer);

  addLoadMoreButton(allCommits, commits, branchNames, heads, pageNo);

  drawGraph(commits, commitDict);

  // Redraw the graph each time the height of the commits container changes.
  // This is necessary because the dots have to align even if the user
  // resizes the window and wrapping commit message increases the commit item height.
  const resizeObserver = new ResizeObserver((entries) => drawGraph(commitDict));
  resizeObserver.observe(commitsGraphContainer);
  return;
};

// Get the required commit details from api
// commits parameter contains the commit shas
const getCommitDetails = async (repoOwner, repoName, allCommits, commits) => {
  var queryBeginning = `query {
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
    repository(owner:"${repoOwner}", name: "${repoName}") {`;
  var queryContent = queryBeginning;
  // -------------------------------- \\
  for (var i = Math.max(0, commits.length - 11); i < commits.length; i++) {
    queryContent += `commit${i}: object(oid: "${commits[i].oid}") {
      ... on Commit{
        parents(first:100) {
          edges {
            node {
              ... on Commit{
                oid
              }
            }
          }
        }
        author{
          name
          user{
            login
            avatarUrl
          }
        }
      }
    }`;
  }
  queryContent += ` } } `;
  // -------------------------------- \\
  var data = handleResponse(queryContent);
  try {
    var commitDetails = data.data.repository;
    for (const [commit, i] of commits.splice(0, -1)) {
      currentDetails = commitDetails[`commit${i}`];
      if (currentDetails == undefined) continue;
      commit.author = currentDetails.author.name;
      userInfo = currentDetails.author.user;
      if (userInfo)
        commit = { ...commit, authorAvatar: userInfo.avatarUrl, authorLogin: userInfo.login, hasUserData: true };
      else commit = { ...commit, authorAvatar: "", authorLogin: currentDetails.author.name, hasUserData: false };
      commit.parents = currentDetails.parents.edges;
    }
  } catch (error) {
    console.log("--ERROR FETCHING BRANCHES--", { error });
    addAuthorizationPrompt("Failed to fetch branches. Please Try Again.");
  }
  // -------------------------------- \\
  var commitDict = {};
  commits.forEach((commit) => {
    commitDict[commit.oid] = commit;

    allCommits.forEach((target) => {
      if (commit.oid == target.oid) {
        target = {
          ...target,
          author: commit.author,
          authorAvatar: commit.authorAvatar,
          authorLogin: commit.authorLogin,
          hasUserData: commit.hasUserData,
          parents: commit.parents,
        };
      }
    });
  });
  // -------------------------------- \\
  return [commits, allCommits, commitDict];
};

const assignColors = (commits, commitDict) => {
  var colors = {
    Salmon: "#fd7f6f",
    LightBlue: "#7eb0d5",
    LimeGreen: "#b2e061",
    Magenta: "#bd7ebe",
    Orange: "#ffb55a",
    Lemon: "#ffee65",
    LightPurple: "#beb9db",
    LightPink: "#fdcce5",
    LightGreen: "#8bd3c7",
  };
  // -------------------------------- \\
  commits.forEach((commit, commitIndex) => {
    // For each commit, assign a colour
    // If the commit has no parent,   -->   Assign a random colour
    // If the commit has one parent,  -->   Assign the same color as it's parent(s)
    // If the commit has two parents, -->   Assign the original color to first parent (merge target branch)
    //                                       and a random colour to the second parent (merge source branch)
    randomColor = colors[commitIndex % colors.length];
    if (commit.color == null) commit = { ...commit, color: randomColor, lineIndex: commitIndex };
    if (commit.parents?.length > 0) {
      firstParent = commitDict[commit.parents[0].node.oid];
      if (firstParent?.color == null) {
        firstParent = { ...firstParent, color: commit.color, lineIndex: commit.lineIndex };
      }
    }
  });
  // -------------------------------- \\
  return [commits, commitDict];
};

const drawCommitCard = (repoOwner, repoName, commit, tempCommitItem) => {
  const setAttributes = (elem, attrs) => Object.entries(attrs).forEach((key, value) => elem.setAttribute(key, value));
  var mainURL = `/${repoOwner}/${repoName}/commit/${commit.oid}`;
  var newDiv = tempCommitItem.cloneNode(true);

  newDiv.querySelector(`#relativeTime`).innerText = relativeTime(commit.committedDate);

  newDiv.querySelector(`#statusDetails`).setAttribute(`data-deferred-details-content-url`, `${mainURL}/status-details`);
  newDiv.querySelector(`#commitTreeLink`).setAttribute(`href`, `/${repoOwner}/${repoName}/tree/${commit.oid}`);
  newDiv.querySelector(`#avatarBody`).setAttribute(`aria-label`, commit.authorLogin);
  newDiv.querySelector(`#avatarImage`).setAttribute(`alt`, `@${commit.authorLogin}`);
  newDiv.querySelector(`#copyFullSHA`).setAttribute(`value`, commit.oid);

  Promise.resolve(newDiv.querySelector(`#commitMessage`)).then((d) => {
    d.innerHTML = commit.messageHeadlineHTML;
    d.setAttribute(`href`, mainURL);
  });
  Promise.resolve(newDiv.querySelector(`#commitLink`)).then((d) => {
    d.innerHTML = commit.oid.substring(0, 7);
    d.setAttribute(`href`, mainURL);
  });

  setAttributes(newDiv, {
    commitSha: commit.oid,
    "data-url": `/${repoOwner}/${repoName}/commits/${commit.oid}/commits_list_item`,
  });
  setAttributes(newDiv.querySelector(`#hoverCard`), {
    href: `/${commit.authorLogin}`,
    "data-hovercard-url": `/users/${commit.authorLogin}/hovercard`,
  });

  if (commit.hasUserData) {
    newDiv.querySelector(`#avatarImage`).setAttribute(`src`, `${commit.authorAvatar}&s=40`);
    Promise.resolve(newDiv.querySelector(`#viewAllCommits`)).then((d) => {
      d.innerHTML = commit.authorLogin;
      setAttributes(d, {
        title: `View all commits by ${commit.authorLogin}`,
        href: `/${repoOwner}/${repoName}/commits?author=${commit.authorLogin}`,
      });
    });
  }

  commitsContainerDummy.appendChild(newDiv);
};
