import Google from "googleapis";

import hull from 'hull';

const Reporting = Google.analyticsreporting('v4');

export default function fetchReport({ client, ship }, { startDate }) {


  const { access_token, refresh_token, dimensions, view_id, client_id } = ship.private_settings;


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
    if (err) return client.logger.info("fetchReport error", err);

    console.warn("Boom, here is our report");
    console.log(JSON.stringify({ err, data }));


    let reports = data.reports;

    reports.forEach((report, i) => {
      let columnHeader = report.columnHeader;
      let dimensionHeaders = columnHeader.dimensions;
      let metricHeaders = columnHeader.metricHeader.metricHeaderEntries;

      let rows = report.data.rows;
      reports[i] = [];

      rows.forEach((row, j) => {
        let rowObj = {};
        row.dimensions.forEach((dimension, k) => {
          rowObj[dimensionHeaders[k]] = dimension;
        });
        reports[i].push(rowObj);
      });
    });

    console.log(reports);



    reports.forEach((report) => {

      var clientIds = [];

      report.forEach((row) => {

        if(clientIds.indexOf(`ga:dimension${client_id}`) <= 1) {
          client.logger.info('updating user', row['ga:dimension1']);
          client.as({ guest_id: row['ga:dimension1'] }).traits(
            row,
            { source: 'google_analytics_first_touch' }
          );
        }

        clientIds.push(`ga:dimension${client_id}`);

      })
    });



    client.logger.info("fetchReport done");
    return true;
  });


}
