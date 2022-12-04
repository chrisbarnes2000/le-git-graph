var oauth2 = {
  access_token_url: "https://github.com/login/oauth/access_token",
  authorization_url: "https://github.com/login/oauth/authorize",
  redirect_url: "https://scaria.dev/github-tree-graph/success/",
  client_id: "91ddd618eba025e4104e",
  key: "oauth2_token",
  scope: "repo:read",

  /**
   * Starts the authorization process.
   */
  start: () => {
    window.close();
    var url = `${this.authorization_url}?client_id=${this.client_id}&redirect_uri=${this.redirect_url}&scope=${this.scope}`;
    window.open(url, "oauth2_popup", "width=800,height=600");
  },

  /**
   * Finishes the oauth2 process by exchanging the given authorization code for an
   * authorization token. The authorization token is saved to the browsers local storage.
   * If the redirect page does not return an authorization code or an error occurs when
   * exchanging the authorization code for an authorization token then the oauth2 process dies
   * and the authorization tab is closed.
   *
   * @param url The url of the redirect page specified in the authorization request.
   */
  finish: (url) => {
    console.log(`Received Url: ${url}`);
    if (url.match(/\?error=(.+)/)) removeTab();
    else {
      var that = this;
      // Send request for authorization token.
      var xhr = new XMLHttpRequest();
      xhr.addEventListener("readystatechange", () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
          if (xhr.responseText.match(/error=/)) removeTab();
          else {
            var token = xhr.responseText.match(/access_token=([^&]*)/)[1];
            window.localStorage.setItem(that.key, token);
            removeTab();
          }
        } else {
          console.log("XHR Status != 200. Removing tab.");
          removeTab();
        }
      });
      xhr.open("POST", this.access_token_url, true);
      xhr.send(
        new FormData({
          client_id: this.client_id,
          client_secret: this.client_secret,
          code: url.match(/\?code=([\w\/\-]+)/),
        }),
      );
    }
  },

  /**
   * Retrieves the authorization token from local storage.
   *
   * @return Authorization token if it exists, null if not.
   */
  getToken: () => window.localStorage.getItem(this.key),

  /**
   * Clears the authorization token from the local storage.
   */
  clearToken: () => delete localStorage.removeItem(this.key),
};
