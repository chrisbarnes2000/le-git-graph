const loadBranchesButton = async () => {
  var branchSelectionHtml = chrome.runtime.getURL("html/branchSelection.html");
  var contentView = document.getElementsByClassName("clearfix")[0];

  await fetch(branchSelectionHtml)
    .then((response) => response.text())
    .then((branchSelectionHtmlText) => {
      contentView.innerHTML = "";
      contentView.appendChild(createTempDiv(branchSelectionHtmlText));

      var xhr = new XMLHttpRequest();
      xhr.open("GET", `https://us-central1-github-tree-graph.cloudfunctions.net/prompt?token=${getLocalToken()}`, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && JSON.parse(xhr.responseText).showPrompt) {
          promptImage.addEventListener("click", () => window.open("https://scaria.dev/redirection.html", "_blank"));
          promptImage = document.getElementById("promptImage");
          promptImage.style.display = "inline-block";
        }
      };
      xhr.send();
    });
  return;
};
