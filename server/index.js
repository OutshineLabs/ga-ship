import { Connector } from "hull";
import { actionHandler, oAuthHandler } from "hull/lib/utils";
import express from "express";

import GoogleOauth from "./oauth";
import fetchReport from "./fetch-report";

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

connector.startApp(app);
