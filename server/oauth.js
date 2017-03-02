import { Strategy as GoogleStrategy} from "passport-google-oauth20";

export default {
  tokenInUrl: false,
  name: "Google",
  Strategy: GoogleStrategy,
  options: {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scope: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics',
      'https://www.googleapis.com/auth/plus.login'
    ]
  },
  isSetup({ hull, query }) {
    if (query.reset) return Promise.reject();
    if (hull.ship.private_settings.access_token) {
      return Promise.resolve({ settings: hull.ship.private_settings });
    }
    return Promise.reject();
  },
  onAuthorize: ({ account, hull }) => {
    console.warn("Hello account: ", account);
    const { refreshToken, accessToken, expiresIn } = (account || {});
    return hull.client.updateSettings({
      refresh_token: refreshToken,
      access_token: accessToken,
      expires_in: expiresIn
    });
  },
  views: {
    login: "login.html",
    home: "home.html",
    failure: "failure.html",
    success: "success.html"
  }
};
