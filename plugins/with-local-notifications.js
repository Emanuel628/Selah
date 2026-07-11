const { withEntitlementsPlist } = require("expo/config-plugins");

// Selah schedules reminders locally on the device. APNs is not required for
// local notifications, so do not require the remote-push provisioning profile.
module.exports = function withLocalNotifications(config) {
  return withEntitlementsPlist(config, (next) => {
    delete next.modResults["aps-environment"];
    return next;
  });
};
