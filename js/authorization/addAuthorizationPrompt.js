const addAuthorizationPrompt = async (reason) => {
  var branchSelectionHtml = chrome.runtime.getURL("html/authorizationPrompt.html");
  var contentView = document.getElementsByClassName("clearfix")[0];
  contentView.innerHTML = "";

  await fetch(branchSelectionHtml)
    .then((response) => response.text())
    .then((branchSelectionHtmlText) => {
      var newContent = createTempDiv(branchSelectionHtmlText);
      var authorizationButton = newContent.getElementsByClassName("authorizationButton")[0];
      var authorizationReason = newContent.getElementsByClassName("authorizationReason")[0];

      authorizationButton.addEventListener("click", openAuthorization);
      authorizationReason.innerHTML = reason;
      contentView.appendChild(newContent);
    });
  return;
};

const changeAuthorizationStatus = async (status) => {
  var authorizationTitle = document.getElementById("authorizationTitle");
  var authorizationDescription = document.getElementById("authorizationDescription");
  var authorizationButton = document.getElementById("authorizationButton");
  const authStatusProps = (props) => {
    authorizationTitle.innerHTML = props.title;
    authorizationDescription.innerHTML = props.description;

    authorizationButton.innerHTML = props.buttonText;
    authorizationButton.removeEventListener("click", props.buttonAction);
    props.buttonClassAction();
  };

  switch (status) {
    case "WAITING":
      authStatusProps({
        title: "Waiting for authorization",
        description: "Please complete the authorization process in the popup window.",

        buttonText: "Waiting...",
        buttonAction: openAuthorization,
        buttonClassAction: () => authorizationButton.classList.remove("btn-primary"),
      });
      break;
    case "SUCCESS":
      authStatusProps({
        title: "Authorization successful",
        description: "Reload this page to see the commits.",

        buttonText: "Reload Now",
        buttonAction: reloadPage,
        buttonClassAction: () => authorizationButton.classList.add("btn-primary"),
      });
      break;
    case "FAIL":
      authStatusProps({
        title: "Authorization failed",
        description: "Please try again.",

        buttonText: "Try Again",
        buttonAction: openAuthorization,
        buttonClassAction: () => authorizationButton.classList.add("btn-primary"),
      });
      break;
  }
};

const openAuthorization = () => {
  var scope = "repo";
  var randomToken = createToken();
  var client_id = "91ddd618eba025e4104e";
  var authorization_url = "https://github.com/login/oauth/authorize";
  var redirect_url = `https://scaria.dev/github-tree-graph/authorize?browsertoken=${randomToken}`;
  var url = `${authorization_url}?client_id=${client_id}&redirect_uri=${redirect_url}&scope=${scope}`;

  changeAuthorizationStatus("WAITING");
  chrome.runtime.sendMessage({ action: "startListening", browserToken: randomToken });
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);

    if (request.status == "FAIL") changeAuthorizationStatus("FAIL");
    else if (request.status == "SUCCESS") {
      var githubToken = request.value;
      changeAuthorizationStatus("SUCCESS");
      storeLocalToken("GithubOAuthToken", githubToken);
    }
  });
  window.open(url, "oauth2_popup", "width=800,height=600");
};
