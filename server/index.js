import { Connector } from "hull";
import { actionHandler, oAuthHandler, notifHandler } from "hull/lib/utils";
import express from "express";

import GoogleOauth from "./oauth";
import fetchReport from "./fetch-report";
import userUpdate from "./user-update";

const connector = new Connector({
  port: process.env.PORT || 8082,
  hostSecret: process.env.SECRET || process.env.CLIENT_SECRET,
  service: { fetchReport }
});

const app = express();

connector.setupApp(app);

app.use("/auth", oAuthHandler(GoogleOauth));

app.use("/fetch-all", actionHandler(({ service }) => {
  service.fetchReport({ startDate: "7daysago" });
}));

app.use("/firstTouchSync", actionHandler(({ service }) => {
  service.fetchReport({ startDate: "2017-01-01" });
}));

app.use("/notify", notifHandler({
  userHandlerOptions: {
    maxSize: 1, // how many users you want to group together
    maxTime: 10 // how long you want to wait to hit the group count
  },
  onSubscribe: () => {
    console.log("notification handler subscribed");
  },
  handlers: {
    "user:update": userUpdate
  }
}));

connector.startApp(app);
