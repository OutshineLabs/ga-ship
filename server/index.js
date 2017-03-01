import Hull from "hull";
import Promise from "bluebird";
import express from "express";


var google = require('googleapis');

var reporting = google.analyticsreporting('v4');

var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  '/auth/callback'
);

// pick what we need from the hull-node
import { batchHandler, notifHandler, actionHandler, batcherHandler, oAuthHandler } from "hull/lib/utils";

import { Strategy as HubspotStrategy } from "passport-hubspot";

import { Strategy as GoogleStrategy} from "passport-google-oauth20"


const port = process.env.PORT || 8082;
const hostSecret = process.env.SECRET || "1234";

const service = {
  sendUsers: (ctx, users) => {
    users.map(u => {
      console.log(u);
      // console.log(u.segment_ids, u.remove_segment_ids);
    })
    return ctx.enqueue("exampleJob", { users });
  }
}

/**
 * Express application with static routing view engine,
 * can be changed into a decorator/command pattern:
 * patchedExpressApp = WebApp(expressApp);
 * @type {HullApp}
 */
const connector = new Hull.Connector({ port, hostSecret, service });
const app = express();

connector.setupApp(app);


app.use("/fetch-all", actionHandler((ctx, { query, body }) => {
  reporting.reports.batchGet({resource: {
    reportRequests: [
          {
            'viewId': '15823103',
            'dateRanges': [{"startDate": "7daysago", "endDate": "yesterday"}],
            'dimensions': [{"name": "ga:dimension1"}, {"name": "ga:dimension13"}, {"name": "ga:source"}, {"name": "ga:medium"}, {"name": "ga:channelGrouping"}, {"name": "ga:adContent"}, {"name": "ga:campaign"}],
            'metrics': [{"expression": "ga:uniqueEvents"}]
          }]
  }}, function(err, data) {
          console.log(err, data.reports[0].data.rows);
        });

}));


 app.use("/webhook", batcherHandler((ctx, messages) => {
   console.log("Batcher.messages", messages);
 }));

 app.use("/batch", batchHandler((ctx, users) => {
   const { service } = ctx;
   return service.sendUsers(users);
 }, { batchSize: 100, groupTraits: true }));

 app.use("/notify", notifHandler({
   userHandlerOptions: {
     groupTraits: true,
     maxSize: 6,
     maxTime: 10000
   },
   handlers: {
     "ship:update": (ctx, messages) => {
       console.log("ship was updated");
     },
     "user:update": (ctx, messages) => {
       const { client } = ctx;
       console.log("users was updated", messages[0]);
       client.logger.info("user was updated", messages.map(m => m.user.email));
     }
   }
 }));


app.use("/auth", oAuthHandler({
  name: "Google",
  Strategy: GoogleStrategy,
  options: {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scope: ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/analytics', 'https://www.googleapis.com/auth/plus.login']
  },
  isSetup(req) {
    if (req.query.reset) return Promise.reject();
    if (req.hull.ship.private_settings.token) {
      console.log(req.hull.ship.private_settings);
      return Promise.resolve({ settings: req.hull.ship.private_settings });
    }
    return Promise.reject();
  },
  onLogin: (req) => {
    req.authParams = { ...req.body, ...req.query };
    return req.hull.client.updateSettings({
      portal_id: req.authParams.portalId
    });
  },
  onAuthorize: (req) => {
    const { refreshToken, accessToken, expiresIn } = (req.account || {});

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    google.options({
      auth: oauth2Client
    });

    return req.hull.client.updateSettings({
      refresh_token: refreshToken,
      token: accessToken,
      expires_in: expiresIn
    });;
  },
  views: {
    login: "login.html",
    home: "home.html",
    failure: "failure.html",
    success: "success.html"
  }
}));

connector.worker({
  exampleJob: (ctx, { users }) => {
    console.log("exampleJob", users.length);
  },
  fetchAll: (ctx, { body }) => {
    console.log("fetchAllJob", ctx.segments.map(s => s.name), body);
  }
})


connector.startApp(app);
connector.startWorker();
