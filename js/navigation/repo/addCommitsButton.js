function addCommitsButton() {
  var commitLogo = `M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z`;

  // navObject is the bar which contains all the tab buttons, (code, issues, pull requests,..)
  var navObject = document.querySelector('[data-pjax="#js-repo-pjax-container"]')?.children[0];

  // closeCommitsTab --> Deselect the commits tab i.e. removeAttributes: ata-selected-links & aria-current
  Array.from(navObject?.children).forEach((child) => child.children[0].addEventListener("click", closeCommitsTab));

  // Copies the "Issues" tab button, and edit it to commits so that the UI matches even if GitHub choose to change UI
  var newButton = navObject.children[1].cloneNode(true).children[0];
  newButton.setAttribute("data-tab-item", "commits-tab");
  newButton.setAttribute("aria-disabled", "true");
  newButton.removeAttribute("aria-current");
  newButton.classList.remove("selected");
  newButton.id = "commits-tab";

  // Remove the href. We wont navigate anywhere.
  newButton.addEventListener("click", openCommitsTab);
  // newButton.href = "/".join(navObject.children[1].split("/")[0, -1])+"/commits"
  // newButton.removeAttribute("href");

  // Set The New Button's Properties
  [buttonLogo, buttonName, countIndicator] = newButton.children;
  [outerLogo, innerLogo] = buttonLogo.children;

  // Set A New Logo (SVG)
  try {
    buttonLogo.setAttribute("class", "octicon octicon-issue-opened UnderlineNav-octicon d-none d-sm-inline");
    // Remove/Replace The Logo's Child Elements
    buttonLogo.removeChild(innerLogo);
    // buttonLogo.removeChild(outerLogo);
    outerLogo.setAttribute("d", commitLogo);
    outerLogo.setAttribute("fill-rule", "evenodd");
  } catch {
    // The New Tab/Button Has No Logo
  }

  // Set The New Label To "Commits"
  buttonName.setAttribute("data-content", "Commits");
  buttonName.innerText = "Commits";

  // Remove The Count Indicator If It Exists
  if (countIndicator) newButton.removeChild(countIndicator);

  // Add The Commits Button To The UI
  navObject.insertBefore(newButton, navObject.children[1]);
}
