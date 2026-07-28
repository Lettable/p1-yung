const { getBot } = require("../telegram_bot/botInstance");
const {
  addEntryToMemory,
  popUnprocessedLine,
} = require("../utils/entries");
const { sanitizePhoneNumber } = require("../utils/sanitization");
const { getSettings } = require("../utils/settings");
const { ami } = require("./instance");

let hasLoggedAllLines = false;

module.exports = async (entry) => {
  if (!entry) {
    if (!hasLoggedAllLines) {
      const bot = getBot();
      const settings = getSettings();

      const notificationsChatId = settings?.notificationsChatId;
      if (!notificationsChatId) {
        console.error("[call] No notifications chat ID set. Cannot send completion message.");
        hasLoggedAllLines = true;
        return;
      }

      bot.sendMessage(
        notificationsChatId,
        `✅ All lines have been called`,
        {
          parse_mode: "HTML",
        },
      ).catch((err) => console.error(`[call] Failed to send completion message: ${err.message}`));
      hasLoggedAllLines = true;
    }
    return;
  }

  const originalNumber = entry?.phoneNumber;
  const number = sanitizePhoneNumber(originalNumber);
  const settings = getSettings();

  if (!number) {
    console.error("[call] Invalid phone number after sanitization");
    return;
  }

  console.log(`[DEBUG] Original number: ${originalNumber}`);
  console.log(`[DEBUG] Sanitized number: ${number}`);

  const callerID = settings?.callerID || number;
  const context = settings?.selectedAudio || "test";

  console.log(`[DEBUG] Context: ${context}`);

  ami.action({
    action: "Originate",
    channel: `PJSIP/${number}@bitcall-endpoint`,
    context: context,
    exten: number,
    priority: 1,
    actionid: actionId,
    CallerID: callerID,
    async: true,
  }, (err, res) => {
    if (err) {
      console.error(`[call] Failed to originate call to ${number} (${actionId}): ${err.message}`);
      const bot = getBot();
      const notificationsChatId = settings?.notificationsChatId;

      if (notificationsChatId) {
        bot.sendMessage(
          notificationsChatId,
          `❌ <b>Call Origination Failed</b>\n\n📞 <code>${number}</code>\n\nReason: ${err.message}`,
          { parse_mode: "HTML" }
        ).catch((msgErr) => console.error(`[call] Failed to send error notification: ${msgErr.message}`));
      }
      return;
    }

    if (res?.response === "Error") {
      console.error(`[call] Asterisk rejected call to ${number} (${actionId}): ${res.message || "Unknown error"}`);
      const bot = getBot();
      const notificationsChatId = settings?.notificationsChatId;

      if (notificationsChatId) {
        bot.sendMessage(
          notificationsChatId,
          `❌ <b>Call Rejected by Asterisk</b>\n\n📞 <code>${number}</code>\n\nReason: ${res.message || "Unknown error"}`,
          { parse_mode: "HTML" }
        ).catch((msgErr) => console.error(`[call] Failed to send rejection notification: ${msgErr.message}`));
      }
      return;
    }

    console.log(`[call] Successfully initiated call to ${number} (${actionId})`);
  });

  hasLoggedAllLines = false;
};
