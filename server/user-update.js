import _ from "lodash";

export default function userUpdate(ctx, messages) {
  const { client } = ctx;
  client.logger.info("processing messages", messages.length);
  messages.map((message) => {
    const { user, changes } = message;

    console.log('THIS IS THE USER',user);
    // adjust your logic here:
    if (_.get(changes, "segments.left", []).length > 0) {
      client.logger.info("user left a segment", user.email);
    }

    if (_.get(changes, "segments.entered", []).length > 0) {
      client.logger.info("user entered a segment", user.email);
    }
  })
}
