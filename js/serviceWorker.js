try {
  self.importScripts("dependencies/firebase-app.js", "dependencies/firebase-database.js");

  const app = firebase.initializeApp(
    (firebaseConfig = {
      apiKey: "AIzaSyAfYmATG88Dsjhe2f-Q8YrMVW1ZRvY6azA",
      authDomain: "github-tree-graph.firebaseapp.com",
      databaseURL: "https://github-tree-graph-default-rtdb.firebaseio.com",
      projectId: "github-tree-graph",
      storageBucket: "github-tree-graph.appspot.com",
      messagingSenderId: "258623901486",
      appId: "1:258623901486:web:b41cb523dbb8ee6e9674bf",
      measurementId: "G-WN4EFGB84W",
    }),
  );

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const githubTokenStream = firebase.database().ref("TokenData/" + browserToken + "/githubToken");
    const currentTab = (query) => chrome.tabs.query({ active: true, currentWindow: true }, query);
    const tabMessenger = (message) => chrome.tabs.sendMessage(sender.tab.id, message);
    var browserToken = request.browserToken;

    tabMessenger({ status: "LISTENING FOR " + `TokenData/${browserToken}/githubToken` });
    githubTokenStream.on("value", (snapshot) => {
      var githubToken = snapshot.val();
      if (githubToken == null) currentTab(() => tabMessenger({ status: "NULL" }));
      if (githubToken == "FAIL") {
        tabMessenger({ status: "FAIL" });
        githubTokenStream.off();
      } else {
        currentTab(() => tabMessenger({ status: "SUCCESS", value: githubToken }));
        githubTokenStream.off();
      }
    });
  });
} catch (error) {
  console.log(`Loading Firebase Error: ${error}`);
}
