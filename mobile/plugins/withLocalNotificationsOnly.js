const { withEntitlementsPlist } = require("expo/config-plugins");

/**
 * Free Apple Personal Teams cannot use Push Notifications (aps-environment).
 * Local scheduled reminders still work without that entitlement.
 *
 * Entitlement mods run LIFO — list this plugin *before* expo-notifications
 * in app.json so our delete runs after that plugin adds aps-environment.
 */
function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults["aps-environment"];
    return cfg;
  });
}

module.exports = withLocalNotificationsOnly;
