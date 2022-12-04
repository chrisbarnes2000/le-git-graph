const setBranchOptions = (allBranches, selectedBranches) => {
  var branchesContainer = document.getElementById("branches-list-parent");
  var dropdownItem = branchesContainer.children[0];

  // Add Each Branch To The Dropdown List.
  Array.from(allBranches).forEach((branch) => {
    var newChild = dropdownItem.cloneNode(true);
    newChild.setAttribute("branch-name", branch);
    newChild.children[1].innerHTML = branch;

    newChild.addEventListener("click", () => {
      const isSelected = (branch) => selectedBranches.includes(branch);
      const allSelected = (selectedBranches) => allBranches.length == selectedBranches.length;
      isSelected(branch)
        ? (selectedBranches = selectedBranches.filter((id) => id != branch))
        : selectedBranches.push(branch);
      var thisItem = document.querySelector(`[branch-name="${branch}"]`);
      thisItem.setAttribute("aria-checked", isSelected(branch) ? "false" : "true");
      dropdownItem.setAttribute("aria-checked", allSelected(selectedBranches) ? "true" : "false");
    });

    branchesContainer.appendChild(newChild);
  });

  // Action For The Button: "All Branches"
  dropdownItem.addEventListener("click", () => {
    var dropdownItems = Array.from(branchesContainer.children);

    if (dropdownItem.getAttribute("aria-checked") == "true") {
      // Toggle All To False
      selectedBranches = [];
      dropdownItems.forEach((branchButton) => branchButton.setAttribute("aria-checked", "false"));
    } else {
      // Toggle 'All' To True If Selected / Matching Outer Container Names
      selectedBranches = [];
      dropdownItems.forEach((branchButton, i) => {
        branchButton.setAttribute("aria-checked", "true");
        if (i != 0 && branchesContainer.children[i].getAttribute("branch-name") != null) {
          selectedBranches.push(branchButton.getAttribute("branch-name"));
        }
      });
    }
  });

  var sizedContainer = document.getElementById("branches-sized-container");
  sizedContainer.style.height = 35 * allBranches.length + 45 + "px";
};
