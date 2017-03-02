import Google from "googleapis";

const Reporting = Google.analyticsreporting('v4');

export default function fetchReport({ client, ship }, { startDate }) {

  const { access_token, refresh_token, dimensions, view_id } = ship.private_settings;


  if (!access_token || !view_id) {
    client.logger.warn("Skip fetch - Missing configuration");
    return false;
  }

  client.logger.info("fethReport start");

  const auth = new Google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    '/auth/callback'
  );

  auth.setCredentials({
    access_token,
    refresh_token
  });

  const dateRanges = [{ startDate, endDate: "yesterday" }];
  const metrics = [ {"expression": "ga:uniqueEvents"} ];

  Reporting.reports.batchGet({
    auth,
    resource: {
      reportRequests: [{
        dateRanges, metrics,
        viewId: view_id,
        dimensions: dimensions.map(dimension => { return {"name": `ga:${dimension}`} }),
      }]
    }
  }, (err, data) => {
    if (err) return client.logger.info("fethReport error", err);

    console.warn("Boom, here is our report");
    console.log(JSON.stringify({ err, data }));

    // const { client_id, source, medium } = manipulated_data;

    // hull.as({ anonymous_id: client_id }).traits({
    //   first_touch_source, first_touch_medium
    // }, { source: 'google_analytics' });

    client.logger.info("fethReport done");
  });


}