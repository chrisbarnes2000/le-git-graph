const getRepo = () => ([repoOwner, repoName] = new URL(window.location.href).pathname.split("/"));

const reloadPage = () => window.location.reload();
const createTab = (url) => chrome.tabs.create(url);
const removeTab = () => chrome.tabs.getCurrent((tab) => chrome.tabs.remove(tab.id));
const currentTab = (query) => chrome.tabs.query({ active: true, currentWindow: true }, query);
const tabMessenger = (sender, message) => chrome.tabs.sendMessage(sender.tab.id, message);

const createToken = () => `${temp}${temp}${temp}`;
const temp = Math.random().toString(36).substring(2, 15);
const clearLocalToken = (key) => delete localStorage.removeItem(key);
const storeLocalToken = (key, token) => localStorage.setItem(key, token);
const getLocalToken = (key = "GithubOAuthToken") => localStorage.getItem(key);

const createTempDiv = (htmlText) => {
  var tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlText;
  return tempDiv.firstChild;
};

const showCommitsLoading = async (elem) => {
  var loadingIcon = chrome.runtime.getURL("html/commitsLoading.html");
  await fetch(loadingIcon)
    .then((response) => response.text())
    .then((loadingIconText) => {
      elem.innerHTML = "";
      elem.appendChild(createTempDiv(loadingIconText));
    });
  return;
};

const handleResponse = async (queryContent) => {
  var data;
  var [endpoint, options] = [
    "https://api.github.com/graphql",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getLocalToken()}` },
      body: JSON.stringify({ query: queryContent }),
    },
  ];

  try {
    await fetch(endpoint, options).then(async (response) => {
      console.log({ response });
      try {
        data = await response.json();
        console.log({ data });
        if (data.errors) throw { error: data.errors.message };
        else return data;
      } catch (error) {
        console.log("--ERROR PARSING DATA FROM GRAPHQL--", { error });
        addAuthorizationPrompt("Failed to parse commits. Please Try Again.");
        return;
      }
    });
  } catch (error) {
    console.log("--ERROR FETCHING GRAPHQL--", { error });
    addAuthorizationPrompt("Failed to fetch commits. Make sure your GitHub account has access to the repository.");
    return;
  }
};

// To convert ISO date to Date object
const parseDate = (dateString) => {
  if (typeof dateString === "object") return dateString;
  const b = dateString.split(/\D+/);
  const offsetMult = dateString.indexOf("+") !== -1 ? -1 : 1;
  const hrOffset = offsetMult * (+b[7] || 0);
  const minOffset = offsetMult * (+b[8] || 0);
  return new Date(Date.UTC(+b[0], +b[1] - 1, +b[2], +b[3] + hrOffset, +b[4] + minOffset, +b[5], +b[6] || 0));
};

/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

Date.prototype.
  - toLocaleString()        * Preferred
  - toLocaleDateString()
  - toLocaleTimeString()

  - toISOString()
  - toDateString()
*/
const relativeTime = (date) => {
  date = new Date(date);
  const commitDate = date.getTime();
  const commitLocal = date.toLocaleString();
  const currentDate = new Date().getTime();
  const [millisecondPerSecond, s_Minute, s_Hour, s_Day, s_Month, s_Year, s_Decade, s_Century, s_Millennium] = [
    1_000,
    60,
    60 * 60, //                     3,600  seconds per hour
    3_600 * 24, //                 86,400          per day
    31_556_952 / 12, //         2,629,746          per month
    86_400 * 365.2425, //      31,556,952          per year
    31_556_952 * 10, //       315,569,520          per decade
    31_556_952 * 100, //    3,155,695,200          per century
    31_556_952 * 1_000, // 31,556,952,000          per millennium
  ];

  const formatOutput = (relativeDate) => (output += ` - i.e. ${relativeDate} ago`);
  const pluralize = (count, noun, suffix = "s", inclusive = true) => {
    // Format the date to a human friendly format Like "1 day ago", "2 weeks ago", "3 months ago"
    count = Math.floor(count);
    num = inclusive ? count : "";
    word = count !== 1 && noun.at(-1) == "y" && noun !== "day" ? noun.substring(0, noun.length - 1) : noun;
    ending = count !== 1 ? suffix : "";

    return `${num} ${word}${ending}`;
  };

  const difference = (currentDate - commitDate) / millisecondPerSecond;

  LT_MINUTE = difference < s_Minute;
  LT_HOUR = difference < s_Hour;
  LT_DAY = difference < s_Day;
  LT_MONTH = difference < s_Month;
  LT_YEAR = difference < s_Year;
  LT_DECADE = difference < s_Decade;
  LT_CENTURY = difference < s_Century;
  LT_MILLENNIUM = difference < s_Millennium;

  let output = `${commitLocal}`;
  LT_MINUTE
    ? formatOutput(pluralize(difference, "second"))
    : LT_HOUR
    ? formatOutput(pluralize(difference / s_Minute, "minute"))
    : LT_DAY
    ? formatOutput(pluralize(difference / s_Hour, "hour"))
    : LT_MONTH
    ? formatOutput(pluralize(difference / s_Day, "day"))
    : LT_YEAR
    ? formatOutput(pluralize(difference / s_Month, "month"))
    : LT_DECADE
    ? formatOutput(pluralize(difference / s_Year, "year"))
    : LT_CENTURY
    ? formatOutput(pluralize(difference / s_Decade, "decade"))
    : LT_MILLENNIUM
    ? formatOutput(pluralize(difference / s_Century, "century", "ies"))
    : "Too old";
  return output.endsWith("1 day ago") ? output.replace("1 day ago", "yesterday") : output;
};
