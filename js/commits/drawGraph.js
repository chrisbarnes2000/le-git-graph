// Draws the graph into the graphSvg element. (Where the graph is supposed to be drawn)
const drawGraph = async (commitDict) => {
  // indexArray acts as a two dimensional array, which represents the structure of the whole graph.
  // indexArray[i][j] represents which currentLineIndex should occupy the jth horizontal position on the ith currentLineIndex (next to the ith commit)
  var indexArray = Array.from(Array(commitDict.length), () => new Array(0));
  var lineColors = Array.from("#000000", () => undefined);
  var yPos = 0;

  // Taking  the heights of the actual commit listings, so that the
  // commit dots (points) can be placed in the correct vertical position.
  var commitsContainer = document.getElementById("commits-container");
  var commitsContainerHeight = commitsContainer?.offsetHeight;

  // Clearing the graph container, so that the graph can be redrawn.
  var commitsGraphContainer = document.getElementById("graphSvg");
  commitsGraphContainer.style.height = commitsContainerHeight;
  commitsGraphContainer.innerHTML = "";
  // -------------------------------- \\
  Object.values(commitDict)
    .slice(0, -1)
    .forEach((_, lineIndex) => {
      var [lineBeginning, lineEnding] = [Infinity, -Infinity];
      // -------------------------------- \\
      Object.entries(commitDict)
        .slice(0, -1)
        .forEach(
          async (commit, commitIndex) => await processCommit(commit, commitDict, commitIndex, lineIndex, lineColors),
        );
      // Now - indexArray is an array of arrays, where the ith array contains all the lines that are on the ith row
      for (var xOffset = lineBeginning; xOffset < lineEnding; xOffset++) indexArray[xOffset + 1].push(lineIndex);
      // -------------------------------- \\
      Object.entries(commitDict).forEach((commit) => {
        [currentIndexArray, parentIndexArray] = [indexArray[commitIndex], indexArray[commitIndex + 1]];
        var commitItem = document.querySelectorAll(`[commitsha="${commit.oid}"]`)[0];
        yPos += (commitItem.offsetHeight - 1) / 2;
        drawDummyPoint(commit, commitsGraphContainer, currentIndexArray, commitLineIndex, yPos);
        yPos += commitItem.offsetHeight / 2;
      });
      // Now - we are able to map a course between each dummy point/circle
      // -------------------------------- \\
      Object.entries(commitDict)
        .slice(0, -1)
        .forEach(async (commit, commitIndex) => {
          await drawConnectingLines(commit, commitDict, container, parentIndexArray, lineColors);
          await drawContinuityLine(commit, container, currentIndexArray, parentIndexArray, commitIndex);
        });
    });
  // -------------------------------- \\
  // Finally Redraw each point for better visibility
  Object.entries(commitDict).forEach((commit) => redrawPoint(commit, commitsGraphContainer));
};

// -------------------------------- \\

const processCommit = async (commit, commitDict, commitIndex, lineIndex, lineColors) => {
  console.log(`--Processing Commit--\n\t@ Index: ${commitIndex} on Line: ${lineIndex}`);
  console.log({ commit, commitDict });
  var foundLineInParents = false;
  var commitLineIndex = commit.lineIndex;
  lineColors[commitLineIndex] = commit.color;

  // Loops through all commits. Specifically looking for commits which are suppose to be part of the currentLineIndex/lineIndex
  commit.parents.forEach((parent) => {
    var parentLineIndex = commitDict[parent.node.oid]?.lineIndex;
    if (parentLineIndex && lineIndex == parentLineIndex) foundLineInParents = true;
  });

  if (foundLineInParents || lineIndex == commitLineIndex) {
    lineBeginning = Math.min(lineBeginning, commitIndex);
    lineEnding = Math.max(lineEnding, commitIndex);
  }
};

const getCirclePos = async (commit) => {
  var commitCircle = document.querySelectorAll(`[circlesha="${commit.oid}"]`)[0];
  var nextCommitCircle = document.querySelectorAll(`[circlesha="${commit.parent?.oid}"]`)[0];

  var xOffset = 30 + 14;
  var commitCircleX = commitCircle?.cx.baseVal.value;
  var commitCircleY = commitCircle?.cy.baseVal.value;
  var nextCommitCircleY = nextCommitCircle?.cy.baseVal.value;
  return [commitCircleX, commitCircleY, nextCommitCircleY, xOffset];
};

// Drawing the commits dots. (This is more of a dummy and will be redrawn so that lines appear below circles)
// The purpose of this first set of circles is to easily query the position of the commit dot.
const drawDummyPoint = async (commit, container, currentIndexArray, commitLineIndex, yPos) => {
  indexExists = currentIndexArray?.indexOf(commitLineIndex) != -1;
  commitXIndex = 30 + (indexExists ? currentIndexArray?.indexOf(commitLineIndex) : currentIndexArray.length) * 14;
  container.innerHTML += `<circle cx="${commitXIndex}" cy="${yPos}" r="1" fill="${commit.color}" circlesha="${commit.oid}"/>`;
};

// Redraw the actual commit dots for better visibility
const redrawPoint = async (commit, container) => {
  [circleX, circleY] = await getCirclePos(commit);
  point = `<circle cx="${circleX}" cy="${circleY}" fill="${commit.color}" r="4" circlesha="${commit.oid}"/>`;
  headPoint = `<circle cx="${circleX}" cy="${circleY}" stroke="${commit.color}" r="7" fill="#00000000" circlesha="${commit.oid}"/>`;
  container.innerHTML += commit.isHead ? headPoint : point;
};

/*
<path d="M 30 29.5 L 30 9.5 C 30 29 , -44 29 , -44 49 L -44 29.5" stroke="#fd7f6f" stroke-width="1" fill="#00000000"></path>
Path  Values
  M = moveto
  L = lineto
  H = horizontal lineto
  V = vertical lineto
  C = curveto
  S = smooth curveto
  Q = quadratic Bézier curve
  T = smooth quadratic Bézier curveto
  A = elliptical Arc
  Z = closepath
*/

// Draw a currentLineIndex for connecting existing commits -- dotted if parent curved otherwise
const drawConnectingLines = async (commit, commitDict, container, parentIndexArray, lineColors) => {
  var [circleX, circleY, nextCircleY, xOffset] = await getCirclePos(commit);
  var commitLineIndex = commit.lineIndex;
  var hasVisibleParents = false;
  commit.parents.forEach((parentItem) => {
    var parent = commitDict[parentItem.node.oid];
    if (parent != undefined) {
      hasVisibleParents = true;
      var nextCircleX = xOffset * parentIndexArray?.indexOf(parent.lineIndex);
      drawCurvedLine(container, circleX, circleY, nextCircleX, nextCircleY, lineColors[parent.lineIndex]);
    }
  });
  if (!hasVisibleParents) drawDottedLine(container, circleX, circleY, lineColors[commitLineIndex]);
};

// Draw an indication that there are parent commits, but don't show them, because the parents are too old (pagination).
const drawDottedLine = async (container, startx, starty, color) => {
  var M1 = `M ${startx} ${starty}`;
  var L1 = `L ${startx} ${starty + 10}`;
  var M2 = `M ${startx} ${starty + 10}`;
  var L2 = `L ${startx} ${starty + 30}`;
  container.innerHTML += `
    <path d="${M1} ${L1}" stroke="${color}" stroke-width="1" fill="#00000000"/>
    <path d="${M2} ${L2}" stroke="${color}" stroke-width="1" stroke-dasharray="2,2" fill="#00000000"/>
  `;
};

// Draw a curve between two given commit points
const drawCurvedLine = async (container, startx, starty, endx, endy, color) => {
  var firstLineEndY = starty + (endy - starty - 40) / 2;
  // var secondLineStartY = firstLineEndY + 40;
  var M1 = `M ${startx} ${starty}`; // `M 30 29.5`;
  var L1 = `L ${startx} ${firstLineEndY}`; // `L 30 9.5`;
  var C1 = `C ${startx} ${parseInt(firstLineEndY) + 20}`; // `C 30 29`;
  var S1 = `, ${endx} ${parseInt(firstLineEndY) + 20}`; // `, -44 29`;
  var S2 = `, ${endx} ${parseInt(firstLineEndY) + 40}`; // `, -44 49`;
  var L2 = `L ${endx} ${endy}`; // `L -44 29.5`;
  container.innerHTML += `<path d="${M1} ${L1} ${C1} ${S1} ${S2} ${L2}" stroke="${color}" stroke-width="1" fill="#00000000"/>`;
};

// Draw an indication that there are future commits (merge/rebase/etc).
const drawContinuityLine = async (commit, container, currentIndArray, parentIndArray, currentLineIndex, lineColors) => {
  var [circleY, nextCircleY, xOffset] = await getCirclePos(commit);
  // Curve for maintaining continuity of lines
  if (currentIndArray?.includes(currentLineIndex) && parentIndArray?.includes(currentLineIndex)) {
    var circleX = xOffset * currentIndArray?.indexOf(currentLineIndex);
    var nextCircleX = xOffset * parentIndArray?.indexOf(currentLineIndex);
    drawCurvedLine(container, circleX, circleY, nextCircleX, nextCircleY, lineColors[currentLineIndex]);
  }
};
