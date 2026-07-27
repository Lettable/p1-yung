const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("../config");
const Audio = require("../models/Audio");
const { saveAudio, deleteAudio, getAudioList } = require("../utils/audioManager");

let bot;
let pendingAudioUploads = {};

const setBot = (botInstance) => {
  bot = botInstance;
};

const handleAddAudioButton = async (chatId) => {
  const message = await bot.sendMessage(
    chatId,
    "📤 Upload an audio file to add to the system.\n\n" +
      "Supported formats: MP3, WAV, OGG, FLAC, M4A\n" +
      "File will be automatically converted to WAV format.",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel_audio" }]],
      },
    }
  );

  pendingAudioUploads[chatId] = { stage: "waiting_for_file", messageId: message.message_id };
};

const handleViewAudiosButton = async (chatId) => {
  try {
    const audios = await getAudioList();

    if (audios.length === 0) {
      await bot.sendMessage(
        chatId,
        "🔊 No audio files configured yet.\n\nUse 'Add Audio' to upload your first audio.",
        {
          reply_markup: {
            inline_keyboard: [[{ text: "➕ Add Audio", callback_data: "add_audio" }]],
          },
        }
      );
      return;
    }

    let messageText = "🔊 Available Audio Files:\n\n";
    const buttons = [];

    audios.forEach((audio, index) => {
      messageText += `${index + 1}. *${audio.name}*\n`;
      messageText += `   📁 Path: \`${audio.path}\`\n`;
      messageText += `   📊 Size: ${(audio.size / 1024).toFixed(2)} KB\n`;
      messageText += `   📅 Added: ${new Date(audio.createdAt).toLocaleDateString()}\n\n`;

      buttons.push([
        {
          text: `🗑️ Delete ${audio.name}`,
          callback_data: `delete_audio:${audio.name}`,
        },
      ]);
    });

    buttons.push([{ text: "➕ Add New", callback_data: "add_audio" }]);

    await bot.sendMessage(chatId, messageText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  } catch (err) {
    console.error(`[audioHandler] Error viewing audios: ${err.message}`);
    await bot.sendMessage(chatId, "❌ Error loading audio list. Try again later.");
  }
};

const handleDeleteAudioButton = async (chatId, audioName) => {
  try {
    const deleted = await deleteAudio(audioName);

    if (deleted) {
      await bot.sendMessage(chatId, `✅ Audio "${audioName}" deleted successfully!`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔊 View All Audios", callback_data: "view_audios" }],
            [{ text: "➕ Add Audio", callback_data: "add_audio" }],
          ],
        },
      });
    } else {
      await bot.sendMessage(chatId, `❌ Audio "${audioName}" not found.`);
    }
  } catch (err) {
    console.error(`[audioHandler] Error deleting audio: ${err.message}`);
    await bot.sendMessage(chatId, `❌ Error deleting audio: ${err.message}`);
  }
};

const handleAudioFile = async (chatId, fileId) => {
  try {
    if (!pendingAudioUploads[chatId] || pendingAudioUploads[chatId].stage !== "waiting_for_file") {
      await bot.sendMessage(chatId, "❌ Please click 'Add Audio' first.");
      return;
    }

    // Download file from Telegram
    const fileInfo = await bot.getFile(fileId);
    const downloadUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${fileInfo.file_path}`;

    const tempDir = "/tmp/asterisk-bot-audio";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPath = path.join(tempDir, `upload_${Date.now()}.tmp`);

    // Download file
    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: config.fileDownloadTimeout,
    });

    fs.writeFileSync(tempPath, response.data);

    // Ask for audio name
    pendingAudioUploads[chatId] = {
      stage: "waiting_for_name",
      tempPath: tempPath,
      messageId: null,
    };

    const msg = await bot.sendMessage(
      chatId,
      "📝 What should this audio be called?\n\n" +
        "Enter a name (e.g., support, sales, main_menu)\n" +
        "No spaces or special characters allowed.",
      {
        reply_markup: {
          force_reply: true,
          selective: true,
        },
      }
    );

    pendingAudioUploads[chatId].messageId = msg.message_id;
  } catch (err) {
    console.error(`[audioHandler] Error handling audio file: ${err.message}`);
    delete pendingAudioUploads[chatId];
    await bot.sendMessage(chatId, `❌ Error processing audio: ${err.message}`);
  }
};

const handleAudioName = async (chatId, audioName) => {
  try {
    if (!pendingAudioUploads[chatId] || pendingAudioUploads[chatId].stage !== "waiting_for_name") {
      return;
    }

    // Validate name
    if (!audioName || audioName.length < 2 || audioName.length > 50) {
      await bot.sendMessage(chatId, "❌ Audio name must be 2-50 characters long.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(audioName)) {
      await bot.sendMessage(
        chatId,
        "❌ Audio name can only contain letters, numbers, hyphens, and underscores."
      );
      return;
    }

    // Check if audio already exists
    const existing = await Audio.findOne({ name: audioName });
    if (existing) {
      await bot.sendMessage(
        chatId,
        `❌ Audio "${audioName}" already exists.\n\nDelete it first if you want to replace it.`
      );
      delete pendingAudioUploads[chatId];
      return;
    }

    const tempPath = pendingAudioUploads[chatId].tempPath;

    // Save audio
    await bot.sendMessage(chatId, "⏳ Processing and saving audio...");

    const audio = await saveAudio(tempPath, audioName);

    // Clean up temp file
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Temp file might not exist
    }

    delete pendingAudioUploads[chatId];

    await bot.sendMessage(
      chatId,
      `✅ Audio "${audioName}" saved successfully!\n\n` +
        `📁 Path: \`${audio.path}\`\n` +
        `📊 Size: ${(audio.size / 1024).toFixed(2)} KB`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔊 View All Audios", callback_data: "view_audios" }],
            [{ text: "➕ Add Another", callback_data: "add_audio" }],
          ],
        },
      }
    );
  } catch (err) {
    console.error(`[audioHandler] Error saving audio: ${err.message}`);
    delete pendingAudioUploads[chatId];
    await bot.sendMessage(chatId, `❌ Error saving audio: ${err.message}`);
  }
};

const handleCancelAudio = async (chatId) => {
  delete pendingAudioUploads[chatId];
  await bot.sendMessage(chatId, "❌ Audio upload cancelled.");
};

module.exports = {
  setBot,
  handleAddAudioButton,
  handleViewAudiosButton,
  handleDeleteAudioButton,
  handleAudioFile,
  handleAudioName,
  handleCancelAudio,
  getPendingUploads: () => pendingAudioUploads,
};
