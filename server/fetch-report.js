import Google from "googleapis";

import hull from 'hull';

const Reporting = Google.analyticsreporting('v4');

function fetchFirstTouchReport({ client, ship }, { startDate }) {


  const { access_token, refresh_token, first_touch_dimensions, view_id, client_id } = ship.private_settings;


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
        dimensions: first_touch_dimensions.map(dimension => { return {"name": `ga:${dimension}`} }),
      }]
    }
  }, (err, data) => {
    if (err) return client.logger.info("fetchReport error", err);

    console.warn("Boom, here is our report");


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




    reports.forEach((report) => {

      var clientIds = [];

      report.forEach((row) => {

        if(clientIds.indexOf(`ga:dimension${client_id}`) <= 1) {
          console.log("client id", row['ga:dimension1'])
          client.asUser({ anonymous_id: row['ga:dimension1'] }).traits(
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





function fetchConversionTouchReport({ client, ship }, { startDate }) {

  const { access_token, refresh_token, conversion_dimensions, view_id, client_id } = ship.private_settings;


  if (!access_token || !view_id) {
    client.logger.warn("Skip fetch - Missing configuration");
    return false;
  }


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
        dimensions: conversion_dimensions.map(dimension => { return {"name": `ga:${dimension}`} }),
      }]
    }
  }, (err, data) => {
    if (err) return client.logger.info("fetchReport error", err);

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
      var ids = [];
      report.forEach(row => {
        ids.push(row['ga:dimension1']);
      })
      console.log("ids", ids);

      client.post('search/user_reports', { raw: true, query: { terms: { anonymous_ids: ids }}})
      .then((users) => {
        users.data.forEach((user) => {
          report.forEach(row => {
            if(user.traits_conversionid === row['ga:dimension2']) {
              console.log(row);
              client.asUser({ anonymous_id: row['ga:dimension1'] }).traits(
                row,
                { source: 'google_analytics_conversion_touch' }
              );
            }
          })
        })
      })
    })
    client.logger.info("fetchReport done");
    return true;
  });

}

let reports = {
  'firstTouchReport': fetchFirstTouchReport,
  'conversionTouchReport': fetchConversionTouchReport
}


export { reports }
