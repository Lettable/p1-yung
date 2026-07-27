const config = {
  mongodbUri: "mongodb://mongo:tkAxhQmeXFRzNYivasGxUmqYlFanFwgv@crossover.proxy.rlwy.net:33696/yungp1",
  telegramBotToken: "8742651661:AAHPwzzQLDG8E0BkZ_onOFl_rKA0Rj3KBWY",
  creatorTelegramId: "129090875",
  concurrentCalls: 30,
  asterisk: {
    host: "185.130.46.72",
    port: 5038,
    username: "yung",
    password: "yungp1botIsUp@@@@Ff%",
  },
  sip: {
    domain: "gateway.bitcall.io",
    password: "HAs207933@@",
  },
  fileDownloadTimeout: 30000,
};

// Validate critical configuration
function validateConfig() {
  const errors = [];

  if (!config.mongodbUri) {
    errors.push("ERROR: mongodbUri is empty. Database connection will fail.");
  }

  if (!config.telegramBotToken) {
    errors.push("ERROR: telegramBotToken is missing. Telegram bot will not work.");
  }

  if (!config.creatorTelegramId) {
    errors.push("ERROR: creatorTelegramId is missing. Admin commands will fail.");
  }

  if (!config.asterisk?.host || !config.asterisk?.port) {
    errors.push("ERROR: Asterisk configuration incomplete. Call system will not work.");
  }

  if (!Array.isArray(config.agents) || config.agents.length === 0) {
    errors.push("ERROR: No agents configured. Transfer will fail.");
  }

  if (errors.length > 0) {
    console.error("[config] Configuration validation failed:");
    errors.forEach((err) => console.error(`  - ${err}`));
    return false;
  }

  console.log("[config] Configuration validated successfully");
  return true;
}

if (require.main === module) {
  validateConfig();
}

module.exports = config;
