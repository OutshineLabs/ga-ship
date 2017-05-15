import _ from "lodash";

import uuid from "uuid/v4"
import ua from "universal-analytics"

export default function userUpdate(ctx, messages) {
  const { client } = ctx;
  client.logger.info("processing messages", messages.length);
  messages.map((message) => {
    const { user, changes } = message;

    console.log('THIS IS THE USER', user);
    console.log('THESE ARE THE CHANGES', changes);

    if(changes.user['traits_salesforce_lead/status']) {
      var visitor = ua('UA-18835138-1');
      var session_id = Date.now() * 1000 + "" + uuid()

      var params = {
          'cid': user.anonymous_ids[0],
          'ec': 'Status Update',
          'ea': changes.user['traits_salesforce_lead/status'][1],

          'cd1': user.anonymous_ids[0],
          'cd3': changes.user['traits_salesforce_lead/status'][1]

      };

      visitor.event(params, function(err, res) {
        console.log(err);
        console.log(res);
      })
      // let query = Object.keys(params).map((i) => i+'='+params[i]).join('&');
      // console.log(encodeURI(query));
      // request.post('https://www.google-analytics.com/debug/collect', encodeURI(query) ,function(err,httpResponse,body){
      //   console.log('err', err);
      //   console.log('httpRes', httpResponse);
      //   console.log('res', body);
      // })
    }
  })
}
