const Call = require("../models/call");
const Agent = require("../models/agent");
const { getBot } = require("../telegram_bot/botInstance");
const { getSettings } = require("./settings");

let entries = [];
let unprocessedData = [];

// phoneNumber (without +) -> { channel, chatId, messageId, timestamp }
const activeCallChannels = {};

// Clean up stale entries every 30 minutes (entries older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const initialCount = entries.length;

  entries = entries.filter((entry) => {
    if (entry.timestamp && entry.timestamp < oneHourAgo) {
      console.log(`[entries] Purging stale entry for +${entry.phoneNumber}`);
      return false;
    }
    return true;
  });

  if (entries.length < initialCount) {
    console.log(`[entries] Cleaned up ${initialCount - entries.length} stale entries. Remaining: ${entries.length}`);
  }
}, 30 * 60 * 1000);

// Clean up stale active calls every 5 minutes (calls inactive for 2 hours)
setInterval(() => {
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  const phoneNumbersToDelete = [];

  for (const [phoneNumber, callData] of Object.entries(activeCallChannels)) {
    if (callData.timestamp && callData.timestamp < twoHoursAgo) {
      console.log(`[entries] Purging stale active call for +${phoneNumber}`);
      phoneNumbersToDelete.push(phoneNumber);
    }
  }

  phoneNumbersToDelete.forEach((phoneNumber) => {
    delete activeCallChannels[phoneNumber];
  });

  if (phoneNumbersToDelete.length > 0) {
    console.log(`[entries] Cleaned up ${phoneNumbersToDelete.length} stale active calls. Remaining: ${Object.keys(activeCallChannels).length}`);
  }
}, 5 * 60 * 1000);

const getEntryByNumber = (phoneNumber) => {
  return entries.find((entry) => entry.phoneNumber === phoneNumber) || null;
};

const removeEntryFromMemory = (phoneNumber) => {
  const index = entries.findIndex((entry) => entry.phoneNumber === phoneNumber);
  if (index !== -1) {
    entries.splice(index, 1);
    console.log(`[entries] Removed entry for +${phoneNumber} from memory`);
  }
};

exports.setActiveCall = (phoneNumber, data) => {
  activeCallChannels[phoneNumber] = {
    ...data,
    timestamp: Date.now(),
  };
  console.log(`[entries] Registered active call for +${phoneNumber}`);
};

exports.getActiveCall = (phoneNumber) => {
  return activeCallChannels[phoneNumber] || null;
};

exports.removeActiveCall = (phoneNumber) => {
  delete activeCallChannels[phoneNumber];
  removeEntryFromMemory(phoneNumber);
};

exports.addEntryToDatabase = (phoneNumber, channel) => {
  _addEntryToDatabase(phoneNumber, channel).catch((err) =>
    console.error(`[entries] addEntryToDatabase error for ${phoneNumber}:`, err)
  );
};

async function _addEntryToDatabase(phoneNumber, channel) {
  try {
    const entry = getEntryByNumber(phoneNumber);
    const settings = getSettings();

    if (!entry?.phoneNumber) {
      console.log("Failed to add entry: ", entry);
      return;
    }

    const notificationsChatId = settings?.notificationsChatId;
    if (!notificationsChatId) {
      console.error(`[entries] No notifications chat ID set. Cannot send DTMF alert for +${phoneNumber}`);
      return;
    }

    let existingCall;
    try {
      existingCall = await Call.findOne({ phoneNumber: `+${phoneNumber}` });
    } catch (dbError) {
      console.error(`[entries] Database error checking existing call for +${phoneNumber}: ${dbError.message}`);
      return;
    }

    if (existingCall) {
      console.log(`Call entry for +${phoneNumber} already exists.`);
      return;
    }

    const newCall = new Call({
      phoneNumber: `+${entry.phoneNumber}`,
      rawLine: entry.rawLine,
    });

    try {
      await newCall.save();
    } catch (dbError) {
      console.error(`[entries] Failed to save call record for +${phoneNumber}: ${dbError.message}`);
      return;
    }

    const bot = getBot();
    bot.sendMessage(
      notificationsChatId,
      `📞 <b>+${phoneNumber}</b> pressed 1`,
      { parse_mode: "HTML" }
    ).catch((err) => console.error(`[entries] Failed to send DTMF notification: ${err.message}`));

    removeEntryFromMemory(phoneNumber);
  } catch (err) {
    console.error(`[entries] Unexpected error in addEntryToDatabase for +${phoneNumber}: ${err.message}`);
  }
};

exports.addEntryToMemory = (entry) => {
  if (!entries.some((e) => e.phoneNumber === entry.phoneNumber)) {
    entries.push({
      ...entry,
      timestamp: Date.now(),
    });
  }
};

exports.setUnprocessedData = (data) => {
  if (!Array.isArray(data)) {
    console.error("[entries] setUnprocessedData received non-array data");
    return;
  }
  unprocessedData = data;
  console.log(`[entries] Loaded ${data.length} phone numbers for processing`);
};

exports.popUnprocessedLine = () => {
  const line = unprocessedData.pop();
  if (!line && unprocessedData.length === 0) {
    console.log("[entries] All phone numbers processed, clearing queue");
  }
  return line;
};

exports.clearUnprocessedData = () => {
  const count = unprocessedData.length;
  unprocessedData = [];
  if (count > 0) {
    console.log(`[entries] Cleared ${count} unprocessed phone numbers`);
  }
};
