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
    var browserToken = request.browserToken;
    var key = `TokenData/${browserToken}/githubToken`;

    const githubTokenStream = firebase.database().ref(key);

    tabMessenger(sender, { status: `LISTENING FOR ${key}` });
    githubTokenStream.on("value", (snapshot) => {
      var githubToken = snapshot.val();
      switch (githubToken) {
        case "FAIL":
          currentTab(() => tabMessenger(sender, { status: "FAIL" }));
          githubTokenStream.off();
          break;
        case null:
          currentTab(() => tabMessenger(sender, { status: "NULL" }));
          break;
        default:
          currentTab(() => tabMessenger(sender, { status: "SUCCESS", value: githubToken }));
          githubTokenStream.off();
          break;
      }
    });
  });
} catch (error) {
  console.log(`Loading Firebase Error: ${error}`);
}
