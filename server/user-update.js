import _ from "lodash";

import uuid from "uuid/v4"
import ua from "universal-analytics"

export default function userUpdate(ctx, messages) {
  const { client } = ctx;
  client.logger.info("processing messages", messages.length);


  const { access_token, refresh_token, uaid, client_id, leads_mapping} = ctx.ship.private_settings;

  if (!access_token || !uaid) {
    client.logger.warn("Skip Sync - Missing configuration");
    return false;
  }


  console.log(messages);

  messages.map((message) => {
    const { user, changes } = message;


    var params = {};

    if(changes) {
      leads_mapping.forEach((lead_map) => {
        if(changes.user[lead_map.hull_field_name]) {
          params[`cd${lead_map.google_analytics_dimension}`] = changes.user[lead_map.hull_field_name][1];
        }
      })
    }

    params[`cd${client_id}`] = user.traits_clientid || user.anonymous_ids[0];

    if(Object.keys(params).length > 0) {
      var visitor = ua(uaid);
      var session_id = Date.now() * 1000 + "" + uuid()

      params['cid'] = user.traits_clientid || user.anonymous_ids[0];
      params['ec'] = 'Status Update';
      params['ea'] =  'Hull User Update';


      visitor.event(params, function(err, res) {

      })
    }
  })
}
