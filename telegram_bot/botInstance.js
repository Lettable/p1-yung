const TelegramBot = require("node-telegram-bot-api");
const config = require("../config");

let bot;

function getBot() {
  return bot;
}

function startBotInstance() {
  bot = new TelegramBot(config.telegramBotToken, { polling: true });

  return bot;
}

module.exports = { getBot, startBotInstance };
