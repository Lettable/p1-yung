const config = require("../config");
const Call = require("../models/call");
const Agent = require("../models/agent");
const axios = require("axios");
const Allowed = require("../models/allowed");
const { getSettings, setSettings } = require("../utils/settings");
const { sanitizePhoneNumber } = require("../utils/sanitization");
const { waitForConnection } = require("../asterisk/instance");
const {
  setUnprocessedData,
  popUnprocessedLine,
  getActiveCall,
  removeActiveCall,
} = require("../utils/entries");
const { startBotInstance } = require("./botInstance");
const audioHandler = require("./audioHandler");

// Helper function to read and parse the file buffer uploaded by the user
function parseFileData(fileBuffer) {
  return fileBuffer
    .toString("utf-8")
    .split("\n")
    .map((line) => {
      let cleaned = line.trim().replace(/\D/g, "");

      // Skip empty lines
      if (!cleaned || cleaned.length < 9) return null;

      // Return number exactly as cleaned, no modifications
      return { phoneNumber: cleaned, rawLine: line.trim() };
    })
    .filter(Boolean);
}

// Function to filter out already processed phone numbers
async function filterProcessedNumbers(data) {
  try {
    const processedNumbers = await Call.find().select("phoneNumber");
    const usedNumbers = new Set(
      processedNumbers.map((record) => record.phoneNumber),
    );
    return data.filter((entry) => {
      const sanitizedEntry = sanitizePhoneNumber(entry.phoneNumber);
      return !usedNumbers.has(`+${sanitizedEntry}`);
    });
  } catch (error) {
    console.error(`[telegram] Failed to fetch processed numbers: ${error.message}`);
    console.warn("[telegram] Returning all numbers as unprocessed due to database error");
    return data;
  }
}

async function startCallingProcess(data) {
  try {
    const concurrentCalls = config.concurrentCalls;

    await waitForConnection();

    setUnprocessedData(data);

    const callPromises = [];

    for (let i = 0; i < concurrentCalls; i++) {
      const line = popUnprocessedLine();
      if (!line) break;

      callPromises.push(
        require("../asterisk/call")(line).catch((err) => {
          console.error(`[telegram] Call initiation error: ${err.message}`);
          return null;
        })
      );
    }

    await Promise.all(callPromises);
    console.log("[telegram] Calling process completed");
  } catch (error) {
    console.error(`[telegram] startCallingProcess error: ${error.message}`);
  }
}

// Initialize Telegram Bot
let userStates = {};

const initializeBot = () => {
  const bot = startBotInstance();
  const adminId = config.creatorTelegramId;

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Welcome! Use the options below:", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📞 Start Calling", callback_data: "call" },
            { text: "📊 Check Remaining Lines", callback_data: "count" },
          ],
          [
            { text: "🆔 Get Your ID", callback_data: "id" },
            { text: "✅ Permit User", callback_data: "permit" },
          ],
          [
            { text: "🚫 Unpermit User", callback_data: "unpermit" },
            { text: "📞 Claim a Line", callback_data: "line" },
          ],
          [
            {
              text: "📍 Set Notifications Channel",
              callback_data: "set_notifications",
            },
            {
              text: "📃 Set P1 Script",
              callback_data: "set_agent",
            },
          ],
          [
            {
              text: "🔊 View Audios",
              callback_data: "view_audios",
            },
            {
              text: "➕ Add Audio",
              callback_data: "add_audio",
            },
          ],
          [
            {
              text: "📱 Set Caller ID",
              callback_data: "set_caller_id",
            },
          ],
        ],
      },
    }).catch((err) => console.error(`[telegram] /start command error: ${err.message}`));
  });

  // Initialize audio handler
  audioHandler.setBot(bot);

  bot.onText(/\/permit (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match[1];
    if (msg.from.id != adminId)
      return bot.sendMessage(
        chatId,
        "❌ You are not authorized to use this command.",
      ).catch((err) => console.error(`[telegram] /permit auth error: ${err.message}`));

    try {
      const existingUser = await Allowed.findOne({ telegram_id: userId });
      if (existingUser)
        return bot.sendMessage(chatId, `⚠️ This user is already permitted.`)
          .catch((err) => console.error(`[telegram] /permit duplicate user error: ${err.message}`));
      await new Allowed({ telegram_id: userId }).save();
      bot.sendMessage(
        chatId,
        `✅ User with ID <code>${userId}</code> has been permitted.`,
        { parse_mode: "HTML" },
      ).catch((err) => console.error(`[telegram] /permit success message error: ${err.message}`));
    } catch (error) {
      bot.sendMessage(
        chatId,
        `❌ Failed to permit user with ID <code>${userId}</code>. Error: ${error.message}`,
        { parse_mode: "HTML" },
      ).catch((err) => console.error(`[telegram] /permit error message failed: ${err.message}`));
    }
  });

  bot.onText(/\/unpermit (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match[1];
    if (msg.from.id !== adminId)
      return bot.sendMessage(
        chatId,
        "❌ You are not authorized to use this command.",
      ).catch((err) => console.error(`[telegram] /unpermit auth error: ${err.message}`));

    try {
      const user = await Allowed.findOneAndDelete({ telegram_id: userId });
      if (!user)
        return bot.sendMessage(chatId, `⚠️ This user is not permitted.`)
          .catch((err) => console.error(`[telegram] /unpermit not found error: ${err.message}`));
      bot.sendMessage(
        chatId,
        `✅ User with ID <code>${userId}</code> has been unpermitted.`,
        { parse_mode: "HTML" },
      ).catch((err) => console.error(`[telegram] /unpermit success message error: ${err.message}`));
    } catch (error) {
      bot.sendMessage(
        chatId,
        `❌ Failed to unpermit user with ID <code>${userId}</code>. Error: ${error.message}`,
        { parse_mode: "HTML" },
      ).catch((err) => console.error(`[telegram] /unpermit error message failed: ${err.message}`));
    }
  });

  bot.onText(/\/count/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const linesAmount = await Call.countDocuments({ used: false });

      return bot.sendMessage(
        chatId,
        `📊 <b>There are currently <u>${linesAmount}</u> lines left!</b>\n\n👤 <b>User:</b> <a href="tg://user?id=${msg.from.id}">@${msg.from.username}</a>`,
        { parse_mode: "HTML" },
      ).catch((err) => console.error(`[telegram] /count message error: ${err.message}`));
    } catch (error) {
      bot.sendMessage(chatId, `❌ Failed to retrieve line count: ${error.message}`)
        .catch((err) => console.error(`[telegram] /count error message failed: ${err.message}`));
    }
  });

  bot.onText(/\/line/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const isAllowed = await Allowed.findOne({ telegram_id: msg.from.id });
      const callsLeft = await Call.countDocuments({ used: false });

      if (!isAllowed) {
        return bot.sendMessage(
          chatId,
          `🚫 You are not permitted to use this command!`,
          { parse_mode: "HTML" },
        ).catch((err) => console.error(`[telegram] /line permission error: ${err.message}`));
      }

      if (callsLeft === 0) {
        return bot.sendMessage(chatId, `❌ No lines left!`, {
          parse_mode: "HTML",
        }).catch((err) => console.error(`[telegram] /line no lines error: ${err.message}`));
      }

      const callData = await Call.findOneAndUpdate(
        { used: false },
        { used: true },
        { new: true },
      );

      bot.sendMessage(
        chatId,
        `✅ You have successfully claimed a line! \n\n` +
          `📞 *Phone Number*: \`${callData.phoneNumber}\`\n` +
          `🔲 *Raw Line*: \`${callData.rawLine}\``,
        {
          parse_mode: "Markdown",
        },
      ).catch((err) => console.error(`[telegram] /line success message error: ${err.message}`));
    } catch (error) {
      bot.sendMessage(chatId, `❌ Failed to claim line: ${error.message}`)
        .catch((err) => console.error(`[telegram] /line error message failed: ${err.message}`));
    }
  });

  bot.onText(/\/call/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "📤 Reply with the file that contains your lines", {
      parse_mode: "HTML",
    }).catch((err) => console.error(`[telegram] /call message error: ${err.message}`));
  });

  // Add agent: /add <number> <name>
  bot.onText(/\/add (\d+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.from.id != adminId) {
      return bot.sendMessage(
        chatId,
        "❌ You are not authorized to use this command.",
      ).catch((err) => console.error(`[telegram] /add auth error: ${err.message}`));
    }

    const number = match[1];
    const name = match[2].trim();

    try {
      const existing = await Agent.findOne({ number });
      if (existing) {
        return bot.sendMessage(
          chatId,
          `⚠️ Agent with number <code>${number}</code> already exists.`,
          { parse_mode: "HTML" },
        ).catch((err) => console.error(`[telegram] /add duplicate agent error: ${err.message}`));
      }

      await new Agent({ number, name }).save();
      bot.sendMessage(
        chatId,
        `✅ Agent <b>${name}</b> (<code>${number}</code>) added.`,
        { parse_mode: "HTML" },
      ).catch((err) => console.error(`[telegram] /add success message error: ${err.message}`));
    } catch (error) {
      bot.sendMessage(chatId, `❌ Failed to add agent: ${error.message}`)
        .catch((err) => console.error(`[telegram] /add error message failed: ${err.message}`));
    }
  });

  // List agents: /agents
  bot.onText(/\/agents/, async (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.id != adminId) {
      return bot.sendMessage(
        chatId,
        "❌ You are not authorized to use this command.",
      ).catch((err) => console.error(`[telegram] /agents auth error: ${err.message}`));
    }

    try {
      const agents = await Agent.find();
      if (agents.length === 0) {
        return bot.sendMessage(
          chatId,
          "⚠️ No agents added yet. Use /add &lt;number&gt; &lt;name&gt;",
          { parse_mode: "HTML" },
        ).catch((err) => console.error(`[telegram] /agents no agents error: ${err.message}`));
      }

      const list = agents
        .map((a) => `• <b>${a.name}</b>: <code>${a.number}</code>`)
        .join("\n");
      bot.sendMessage(chatId, `👥 <b>Agents:</b>\n\n${list}`, {
        parse_mode: "HTML",
      }).catch((err) => console.error(`[telegram] /agents list message error: ${err.message}`));
    } catch (error) {
      bot.sendMessage(chatId, `❌ Failed to retrieve agents: ${error.message}`)
        .catch((err) => console.error(`[telegram] /agents error message failed: ${err.message}`));
    }
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const pendingUploads = audioHandler.getPendingUploads();

    // Handle Caller ID reply
    if (userStates[chatId] && userStates[chatId].screen === "awaiting_caller_id") {
      const newCallerID = msg.text?.trim();
      if (newCallerID) {
        setSettings({ callerID: newCallerID });
        await bot.sendMessage(
          chatId,
          `✅ Caller ID updated to: <b>${newCallerID}</b>`,
          { parse_mode: "HTML" }
        ).catch((err) => console.error(`[telegram] Caller ID set message error: ${err.message}`));
        delete userStates[chatId];
      }
      return;
    }

    // Handle audio name reply
    if (
      pendingUploads[chatId] &&
      pendingUploads[chatId].stage === "waiting_for_name"
    ) {
      const audioName = msg.text?.trim();
      if (audioName) {
        try {
          await audioHandler.handleAudioName(chatId, audioName);
        } catch (err) {
          console.error(`[telegram] Audio name handler error: ${err.message}`);
        }
      }
      return;
    }
  });

  bot.on("audio", async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.audio?.file_id;

    if (!fileId) {
      console.error("[telegram] Audio message missing file_id");
      bot.sendMessage(chatId, "❌ Invalid audio file")
        .catch((err) => console.error(`[telegram] audio invalid error: ${err.message}`));
      return;
    }

    try {
      await audioHandler.handleAudioFile(chatId, fileId);
    } catch (err) {
      console.error(`[telegram] Audio file handler error: ${err.message}`);
      bot.sendMessage(chatId, `❌ Error processing audio: ${err.message}`)
        .catch((e) => console.error(`[telegram] audio error message failed: ${e.message}`));
    }
  });

  bot.on("document", async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.document?.file_id;
    const fileName = msg.document?.file_name;

    if (!fileId) {
      console.error("[telegram] Document message missing file_id");
      bot.sendMessage(chatId, "❌ Invalid document")
        .catch((err) => console.error(`[telegram] document invalid error: ${err.message}`));
      return;
    }

    const settings = getSettings();

    if (!settings?.notificationsChatId) {
      setSettings({ notificationsChatId: chatId });
    }

    try {
      console.log(`[telegram] Processing document ${fileName} from chat ${chatId}`);

      let file;
      try {
        file = await bot.getFile(fileId);
      } catch (fileErr) {
        console.error(`[telegram] Failed to get file info: ${fileErr.message}`);
        bot.sendMessage(chatId, `❌ Failed to download file: ${fileErr.message}`)
          .catch((err) => console.error(`[telegram] file info error: ${err.message}`));
        return;
      }

      if (!file?.file_path) {
        console.error("[telegram] File info missing file_path");
        bot.sendMessage(chatId, "❌ File not found")
          .catch((err) => console.error(`[telegram] file not found error: ${err.message}`));
        return;
      }

      const filePath = `https://api.telegram.org/file/bot${config.telegramBotToken}/${file.file_path}`;
      let fileBuffer;

      try {
        fileBuffer = (
          await axios.get(filePath, {
            responseType: "arraybuffer",
            timeout: config.fileDownloadTimeout || 30000,
          })
        ).data;
      } catch (downloadErr) {
        console.error(`[telegram] Failed to download file: ${downloadErr.message}`);
        bot.sendMessage(chatId, `❌ File download failed (timeout or network error): ${downloadErr.message}`)
          .catch((err) => console.error(`[telegram] download error: ${err.message}`));
        return;
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        console.warn("[telegram] Downloaded file is empty");
        bot.sendMessage(chatId, "❌ File is empty")
          .catch((err) => console.error(`[telegram] empty file error: ${err.message}`));
        return;
      }

      const data = parseFileData(fileBuffer);

      if (!Array.isArray(data)) {
        console.error("[telegram] parseFileData returned non-array");
        bot.sendMessage(chatId, "❌ Failed to parse file data")
          .catch((err) => console.error(`[telegram] parse error: ${err.message}`));
        return;
      }

      if (data.length === 0) {
        return bot.sendMessage(chatId, "⚠️ No valid phone numbers found in file")
          .catch((err) => console.error(`[telegram] document no data error: ${err.message}`));
      }

      const unprocessedData = await filterProcessedNumbers(data);

      if (unprocessedData.length === 0) {
        return bot.sendMessage(
          chatId,
          "⚠️ All numbers have already been processed.",
        ).catch((err) => console.error(`[telegram] document all processed error: ${err.message}`));
      }

      bot.sendMessage(
        chatId,
        `📊 Calling ${unprocessedData.length} phone numbers... Please wait.`,
      ).catch((err) => console.error(`[telegram] document start calling message error: ${err.message}`));

      startCallingProcess(unprocessedData, chatId);
    } catch (error) {
      console.error(`[telegram] Unexpected document processing error: ${error.message}`);
      bot.sendMessage(
        chatId,
        `❌ Failed to process file: ${error.message}`,
      ).catch((err) => console.error(`[telegram] document error message failed: ${err.message}`));
    }
  });

  // Handle agent selection (moved to main callback_query handler below to avoid duplicate listeners)

  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const callbackData = query.data;

    // Handle audio management callbacks
    if (callbackData === "add_audio") {
      try {
        await audioHandler.handleAddAudioButton(chatId);
        bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(`[telegram] Add audio error: ${err.message}`);
        bot.answerCallbackQuery(query.id, { text: "❌ Error", show_alert: true });
      }
      return;
    }

    if (callbackData === "view_audios") {
      try {
        await audioHandler.handleViewAudiosButton(chatId);
        bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(`[telegram] View audios error: ${err.message}`);
        bot.answerCallbackQuery(query.id, { text: "❌ Error", show_alert: true });
      }
      return;
    }

    if (callbackData.startsWith("audio_detail:")) {
      const audioName = callbackData.replace("audio_detail:", "");
      try {
        await audioHandler.handleAudioDetail(chatId, audioName);
        bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(`[telegram] Audio detail error: ${err.message}`);
      }
      return;
    }

    if (callbackData.startsWith("audio_list_page:")) {
      const page = parseInt(callbackData.replace("audio_list_page:", ""));
      try {
        await audioHandler.handlePageNavigation(chatId, page, "audio_list");
        bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(`[telegram] Audio pagination error: ${err.message}`);
      }
      return;
    }

    if (callbackData.startsWith("delete_audio:")) {
      const audioName = callbackData.replace("delete_audio:", "");
      try {
        await audioHandler.handleDeleteAudioButton(chatId, audioName);
        bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(`[telegram] Delete audio error: ${err.message}`);
        bot.answerCallbackQuery(query.id, { text: "❌ Error", show_alert: true });
      }
      return;
    }

    if (callbackData.startsWith("select_audio_page:")) {
      const page = parseInt(callbackData.replace("select_audio_page:", ""));
      try {
        await audioHandler.handlePageNavigation(chatId, page, "select_audio");
        bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(`[telegram] Select audio pagination error: ${err.message}`);
      }
      return;
    }

    if (callbackData.startsWith("select_audio_confirm:")) {
      const audioName = callbackData.replace("select_audio_confirm:", "");
      try {
        await audioHandler.handleSelectAudioConfirm(chatId, audioName);
        bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(`[telegram] Select audio confirm error: ${err.message}`);
        bot.answerCallbackQuery(query.id, { text: "❌ Error", show_alert: true });
      }
      return;
    }

    if (callbackData === "cancel_audio") {
      try {
        await audioHandler.handleCancelAudio(chatId);
        bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(`[telegram] Cancel audio error: ${err.message}`);
      }
      return;
    }

    if (callbackData === "set_caller_id") {
      const currentCallerID = getSettings()?.callerID || "Not set";
      await bot.sendMessage(
        chatId,
        `📱 Current Caller ID: <b>${currentCallerID}</b>\n\n` +
          "Send a new Caller ID (your phone number or name)",
        {
          parse_mode: "HTML",
          reply_markup: {
            force_reply: true,
            selective: true,
          },
        }
      ).catch((err) => console.error(`[telegram] Set caller ID message error: ${err.message}`));
      userStates[chatId] = { screen: "awaiting_caller_id" };
      bot.answerCallbackQuery(query.id);
      return;
    }

    // Agent selection removed - using universal "test" context now

    // Transfer call to agent
    if (callbackData.startsWith("transfer_")) {
      const parts = callbackData.split("_");
      const phoneNumber = parts[1];
      const agentId = parts[2];

      if (!phoneNumber || !agentId) {
        console.error("[telegram] Invalid transfer parameters", { phoneNumber, agentId });
        bot.answerCallbackQuery(query.id, { text: "❌ Invalid transfer request." })
          .catch((err) => console.error(`[telegram] transfer invalid params error: ${err.message}`));
        return;
      }

      try {
        const { transferCall } = require("../asterisk/instance");

        let agent;
        try {
          agent = await Agent.findById(agentId);
        } catch (dbErr) {
          console.error(`[telegram] Failed to fetch agent ${agentId}: ${dbErr.message}`);
          bot.answerCallbackQuery(query.id, { text: "❌ Agent lookup failed." })
            .catch((err) => console.error(`[telegram] agent lookup error: ${err.message}`));
          return;
        }

        const activeCall = getActiveCall(phoneNumber);

        if (!agent) {
          console.warn(`[telegram] Agent ${agentId} not found or deleted`);
          bot.answerCallbackQuery(query.id, { text: "⚠️ Agent not found." })
            .catch((err) => console.error(`[telegram] agent not found error: ${err.message}`));
          return;
        }

        if (!activeCall) {
          console.warn(`[telegram] Active call for +${phoneNumber} not found`);
          bot.answerCallbackQuery(query.id, { text: "⚠️ Call not found or expired." })
            .catch((err) => console.error(`[telegram] call not found error: ${err.message}`));
          return;
        }

        if (!agent.number) {
          console.error(`[telegram] Agent ${agentId} has no phone number`);
          bot.answerCallbackQuery(query.id, { text: "❌ Agent configuration error." })
            .catch((err) => console.error(`[telegram] agent config error: ${err.message}`));
          return;
        }

        try {
          await transferCall(activeCall.channel, agent.number);
        } catch (transferErr) {
          console.error(`[telegram] Failed to transfer call to agent ${agent.number}: ${transferErr.message}`);
          bot.answerCallbackQuery(query.id, { text: "❌ Transfer failed." })
            .catch((err) => console.error(`[telegram] transfer failed response error: ${err.message}`));
          return;
        }

        await bot.editMessageText(
          `📞 <b>+${phoneNumber}</b>\nTransferred to <b>${agent.name}</b> (${agent.number})`,
          {
            chat_id: activeCall.chatId,
            message_id: activeCall.messageId,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📵 Hang Up",
                    callback_data: `hangup_${phoneNumber}`,
                  },
                ],
              ],
            },
          },
        ).catch((err) => console.error(`[telegram] transfer message edit error: ${err.message}`));

        bot.answerCallbackQuery(query.id, { text: "✅ Call transferred!" })
          .catch((err) => console.error(`[telegram] transfer success response error: ${err.message}`));
      } catch (err) {
        console.error(`[telegram] Transfer error: ${err.message}`);
        bot.answerCallbackQuery(query.id, { text: "❌ Transfer failed." })
          .catch((err) => console.error(`[telegram] transfer failed response error: ${err.message}`));
      }
      return;
    }

    // Hang up call remotely
    if (callbackData.startsWith("hangup_")) {
      const phoneNumber = callbackData.split("_")[1];

      try {
        const { hangupCall } = require("../asterisk/instance");

        const activeCall = getActiveCall(phoneNumber);

        if (!activeCall) {
          bot.answerCallbackQuery(query.id, { text: "⚠️ Call not found." })
            .catch((err) => console.error(`[telegram] hangup not found error: ${err.message}`));
          return;
        }

        await hangupCall(activeCall.channel);
        removeActiveCall(phoneNumber);

        await bot.editMessageText(`📞 <b>+${phoneNumber}</b>\nCall ended.`, {
          chat_id: activeCall.chatId,
          message_id: activeCall.messageId,
          parse_mode: "HTML",
        }).catch((err) => console.error(`[telegram] hangup message edit error: ${err.message}`));
      } catch (err) {
        console.error(`[telegram] Hangup error: ${err.message}`);
        bot.answerCallbackQuery(query.id, { text: "❌ Hangup failed." })
          .catch((err) => console.error(`[telegram] hangup failed response error: ${err.message}`));
        return;
      }

      bot.answerCallbackQuery(query.id, { text: "📵 Call hung up." })
        .catch((err) => console.error(`[telegram] hangup success response error: ${err.message}`));
      return;
    }

    switch (callbackData) {
      case "call":
        bot.sendMessage(
          chatId,
          "📤 Reply with the file that contains your lines",
          { parse_mode: "HTML" },
        ).catch((err) => console.error(`[telegram] call callback message error: ${err.message}`));
        break;

      case "count":
        bot.sendMessage(
          chatId,
          "🔢 <b>Line Count</b>\n\nTo retrieve the amount of lines, use the <code>/count</code> command directly.",
          { parse_mode: "HTML" },
        ).catch((err) => console.error(`[telegram] count callback message error: ${err.message}`));
        break;

      case "id":
        bot.sendMessage(
          chatId,
          `🔑 <b>Your Telegram ID</b>\n\nYour unique Telegram ID is: <code>${query.from.id}</code>`,
          { parse_mode: "HTML" },
        ).catch((err) => console.error(`[telegram] id callback message error: ${err.message}`));
        break;

      case "permit":
      case "unpermit":
        bot.sendMessage(
          chatId,
          `⚖️ <b>User Permission</b>\n\nTo permit/unpermit a user, type <code>/permit &lt;Telegram ID&gt;</code> or <code>/unpermit &lt;Telegram ID&gt;</code>.`,
          { parse_mode: "HTML" },
        ).catch((err) => console.error(`[telegram] permission callback message error: ${err.message}`));
        break;

      case "line":
        bot.sendMessage(
          chatId,
          "💬 <b>Claim a Line</b>\n\nTo claim a line, simply use the <code>/line</code> command directly.",
          { parse_mode: "HTML" },
        ).catch((err) => console.error(`[telegram] line callback message error: ${err.message}`));
        break;

      case "set_notifications":
        setSettings({ notificationsChatId: chatId });
        bot.sendMessage(
          chatId,
          `✅ <b>Notifications Channel Updated</b>\n\nSuccessfully changed the notifications channel to <code>${chatId}</code>. You will now receive updates in this channel.`,
          { parse_mode: "HTML" },
        ).catch((err) => console.error(`[telegram] set_notifications message error: ${err.message}`));
        break;

      case "set_agent":
        try {
          await audioHandler.handleSelectAudioButton(chatId);
        } catch (err) {
          console.error(`[telegram] Select audio error: ${err.message}`);
          bot.sendMessage(chatId, "❌ Error loading audio list.")
            .catch((e) => console.error(`[telegram] error message failed: ${e.message}`));
        }
        break;
    }

    bot.answerCallbackQuery(query.id)
      .catch((err) => console.error(`[telegram] answerCallbackQuery error: ${err.message}`));
  });
};

module.exports = { initializeBot };
