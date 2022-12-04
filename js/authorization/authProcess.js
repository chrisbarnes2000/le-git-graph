var url = window.location.href;
var code = new URL(url).searchParams.get("code");
var accessTokenUrl = "https://scaria.herokuapp.com/github-tree-graph-server/authorize";
console.log(`Injection Success -- Received Url: ${url}`);

if (url.match(/\?error=(.+)/)) {
  console.log("Found Error In URL. Removing Tab.");
  removeTab();
} else {
  var that = this;
  var key = that.key;
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function (event) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var accessToken = JSON.parse(xhr.responseText).access_token;
      if (accessToken) {
        console.log("Setting Token", { token });
        window.localStorage.setItem(key, accessToken);
      } else {
        console.log("No Token Found In Response");
        removeTab();
      }
    } else {
      console.log("Request Failed, Removing Tab.");
      removeTab();
    }
  });
  xhr.open("GET", `${accessTokenUrl}?code=${code}`, true);
  xhr.withCredentials = false;
  xhr.send();
}
