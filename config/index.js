require("dotenv").config();

const config = {
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/asterisk-bot",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  creatorTelegramId: process.env.TELEGRAM_ADMIN_ID,
  concurrentCalls: parseInt(process.env.CONCURRENT_CALLS) || 30,
  callContext: "test",
  asterisk: {
    host: process.env.ASTERISK_HOST || "127.0.0.1",
    port: parseInt(process.env.ASTERISK_PORT) || 5038,
    username: process.env.ASTERISK_USERNAME,
    password: process.env.ASTERISK_PASSWORD,
  },
  sip: {
    domain: process.env.SIP_DOMAIN,
    password: process.env.SIP_PASSWORD,
  },
  fileDownloadTimeout: parseInt(process.env.FILE_DOWNLOAD_TIMEOUT) || 30000,
};

function validateConfig() {
  const errors = [];

  if (!config.mongodbUri) {
    errors.push("ERROR: MONGODB_URI is empty. Database connection will fail.");
  }

  if (!config.telegramBotToken) {
    errors.push("ERROR: TELEGRAM_BOT_TOKEN is missing. Telegram bot will not work.");
  }

  if (!config.creatorTelegramId) {
    errors.push("ERROR: TELEGRAM_ADMIN_ID is missing. Admin commands will fail.");
  }

  if (!config.asterisk?.host || !config.asterisk?.port) {
    errors.push("ERROR: Asterisk configuration incomplete. Call system will not work.");
  }

  if (!config.asterisk?.username || !config.asterisk?.password) {
    errors.push("ERROR: Asterisk credentials missing. AMI connection will fail.");
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
