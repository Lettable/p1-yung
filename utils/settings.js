let settings = {
  agent: "coinbase",
  notificationsChatId: null,
};

exports.setSettings = (newSettings) => {
  if (!newSettings || typeof newSettings !== "object") {
    console.error("[settings] Invalid settings object passed to setSettings");
    return settings;
  }
  settings = { ...settings, ...newSettings };
  console.log(`[settings] Updated:`, settings);
  return settings;
};

exports.getSettings = () => {
  if (!settings) {
    console.error("[settings] Settings object is undefined, returning defaults");
    settings = {
      agent: "coinbase",
      notificationsChatId: null,
    };
  }
  return settings;
};

exports.validateSettings = () => {
  const errors = [];
  if (!settings.agent) {
    errors.push("Missing agent setting");
  }
  if (errors.length > 0) {
    console.warn("[settings] Validation errors:", errors);
    return false;
  }
  return true;
};
