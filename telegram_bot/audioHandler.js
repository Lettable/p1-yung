const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("../config");
const Audio = require("../models/Audio");
const { saveAudio, deleteAudio, getAudioList } = require("../utils/audioManager");
const { updateExtensionsConf } = require("../utils/extensionsGenerator");

let bot;
let pendingAudioUploads = {};
let userStates = {}; // Track user's current screen/state

const ITEMS_PER_PAGE = 3;

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

// View Audios Flow
const handleViewAudiosButton = async (chatId) => {
  try {
    const audios = await getAudioList();

    if (audios.length === 0) {
      await bot.sendMessage(
        chatId,
        "🔊 No audio files yet.\n\nUse ➕ Add Audio to upload your first audio.",
        {
          reply_markup: {
            inline_keyboard: [[{ text: "➕ Add Audio", callback_data: "add_audio" }]],
          },
        }
      );
      return;
    }

    userStates[chatId] = { screen: "audio_list", page: 0, audios: audios };
    showAudioList(chatId, 0, audios);
  } catch (err) {
    console.error(`[audioHandler] Error viewing audios: ${err.message}`);
    await bot.sendMessage(chatId, "❌ Error loading audio list. Try again later.");
  }
};

const showAudioList = async (chatId, page, audios) => {
  const totalPages = Math.ceil(audios.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const pageAudios = audios.slice(start, start + ITEMS_PER_PAGE);

  let messageText = `🔊 Audio Files (Page ${page + 1}/${totalPages})\n\n`;
  const buttons = [];

  pageAudios.forEach((audio) => {
    buttons.push([
      {
        text: `🎵 ${audio.name}`,
        callback_data: `audio_detail:${audio.name}`,
      },
    ]);
  });

  // Pagination buttons
  if (totalPages > 1) {
    const paginationRow = [];
    if (page > 0) {
      paginationRow.push({ text: "⬅️ Previous", callback_data: `audio_list_page:${page - 1}` });
    }
    if (page < totalPages - 1) {
      paginationRow.push({ text: "Next ➡️", callback_data: `audio_list_page:${page + 1}` });
    }
    buttons.push(paginationRow);
  }

  buttons.push([{ text: "➕ Add Audio", callback_data: "add_audio" }]);

  await bot.sendMessage(chatId, messageText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
};

const handleAudioDetail = async (chatId, audioName) => {
  try {
    const audio = await Audio.findOne({ name: audioName });

    if (!audio) {
      await bot.sendMessage(chatId, `❌ Audio "${audioName}" not found.`);
      return;
    }

    const sizeKB = (audio.size / 1024).toFixed(2);
    const createdDate = new Date(audio.createdAt).toLocaleDateString();

    const messageText =
      `🎵 **${audio.name}**\n\n` +
      `📊 Size: ${sizeKB} KB\n` +
      `📅 Added: ${createdDate}\n` +
      `📁 Path: \`${audio.path}\``;

    const buttons = [
      [
        { text: "⬅️ Back", callback_data: "view_audios" },
        { text: "🗑️ Delete", callback_data: `delete_audio:${audio.name}` },
      ],
    ];

    await bot.sendMessage(chatId, messageText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: buttons,
      },
    });

    userStates[chatId] = { screen: "audio_detail", audioName: audioName };
  } catch (err) {
    console.error(`[audioHandler] Error showing audio detail: ${err.message}`);
    await bot.sendMessage(chatId, "❌ Error loading audio details.");
  }
};

const handleDeleteAudioButton = async (chatId, audioName) => {
  try {
    const deleted = await deleteAudio(audioName);

    if (deleted) {
      // Regenerate extensions.conf after deletion
      try {
        const allAudios = await getAudioList();
        await updateExtensionsConf(allAudios);
      } catch (err) {
        console.error(`[audioHandler] Failed to regenerate extensions: ${err.message}`);
      }

      await bot.sendMessage(chatId, `✅ Audio "${audioName}" deleted!\n📝 Extension [${audioName}] removed`);

      // Refresh audio list
      const audios = await getAudioList();
      if (audios.length > 0) {
        userStates[chatId] = { screen: "audio_list", page: 0, audios: audios };
        await showAudioList(chatId, 0, audios);
      } else {
        await bot.sendMessage(chatId, "🔊 No audio files left.\n\nUse ➕ Add Audio to upload.", {
          reply_markup: {
            inline_keyboard: [[{ text: "➕ Add Audio", callback_data: "add_audio" }]],
          },
        });
      }
    } else {
      await bot.sendMessage(chatId, `❌ Audio "${audioName}" not found.`);
    }
  } catch (err) {
    console.error(`[audioHandler] Error deleting audio: ${err.message}`);
    await bot.sendMessage(chatId, `❌ Error deleting audio: ${err.message}`);
  }
};

// Select Audio for Calls Flow
const handleSelectAudioButton = async (chatId) => {
  try {
    const audios = await getAudioList();

    if (audios.length === 0) {
      await bot.sendMessage(
        chatId,
        "❌ No audio files available.\n\nUse ➕ Add Audio to upload first.",
        {
          reply_markup: {
            inline_keyboard: [[{ text: "➕ Add Audio", callback_data: "add_audio" }]],
          },
        }
      );
      return;
    }

    userStates[chatId] = { screen: "select_audio", page: 0, audios: audios };
    showSelectAudioList(chatId, 0, audios);
  } catch (err) {
    console.error(`[audioHandler] Error selecting audio: ${err.message}`);
    await bot.sendMessage(chatId, "❌ Error loading audio list. Try again later.");
  }
};

const showSelectAudioList = async (chatId, page, audios) => {
  const totalPages = Math.ceil(audios.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const pageAudios = audios.slice(start, start + ITEMS_PER_PAGE);

  let messageText = `📝 Select Audio for Next Calls (Page ${page + 1}/${totalPages})\n\n`;
  const buttons = [];

  pageAudios.forEach((audio) => {
    buttons.push([
      {
        text: `✓ ${audio.name}`,
        callback_data: `select_audio_confirm:${audio.name}`,
      },
    ]);
  });

  // Pagination buttons
  if (totalPages > 1) {
    const paginationRow = [];
    if (page > 0) {
      paginationRow.push({ text: "⬅️ Previous", callback_data: `select_audio_page:${page - 1}` });
    }
    if (page < totalPages - 1) {
      paginationRow.push({ text: "Next ➡️", callback_data: `select_audio_page:${page + 1}` });
    }
    buttons.push(paginationRow);
  }

  await bot.sendMessage(chatId, messageText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
};

const handleSelectAudioConfirm = async (chatId, audioName) => {
  try {
    const audio = await Audio.findOne({ name: audioName });

    if (!audio) {
      await bot.sendMessage(chatId, `❌ Audio "${audioName}" not found.`);
      return;
    }

    const { setSettings } = require("../utils/settings");
    setSettings({ selectedAudio: audioName });

    await bot.sendMessage(
      chatId,
      `✅ Selected audio for next calls:\n\n🎵 **${audioName}**`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "📝 Select Different", callback_data: "set_agent" }]],
        },
      }
    );

    delete userStates[chatId];
  } catch (err) {
    console.error(`[audioHandler] Error confirming audio selection: ${err.message}`);
    await bot.sendMessage(chatId, `❌ Error selecting audio: ${err.message}`);
  }
};

// Audio Upload Handlers
const handleAudioFile = async (chatId, fileId) => {
  try {
    if (!pendingAudioUploads[chatId] || pendingAudioUploads[chatId].stage !== "waiting_for_file") {
      await bot.sendMessage(chatId, "❌ Please click 'Add Audio' first.");
      return;
    }

    const fileInfo = await bot.getFile(fileId);
    const downloadUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${fileInfo.file_path}`;

    const tempDir = "/tmp/asterisk-bot-audio";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPath = path.join(tempDir, `upload_${Date.now()}.tmp`);

    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: config.fileDownloadTimeout,
    });

    fs.writeFileSync(tempPath, response.data);

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

    await bot.sendMessage(chatId, "⏳ Processing and saving audio...");

    const audio = await saveAudio(tempPath, audioName);

    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Temp file might not exist
    }

    // Regenerate extensions.conf
    try {
      const allAudios = await getAudioList();
      await updateExtensionsConf(allAudios);
    } catch (err) {
      console.error(`[audioHandler] Failed to regenerate extensions: ${err.message}`);
    }

    delete pendingAudioUploads[chatId];

    await bot.sendMessage(
      chatId,
      `✅ Audio "${audioName}" saved!\n\n📊 Size: ${(audio.size / 1024).toFixed(2)} KB\n📝 Extension [${audioName}] created`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔊 View Audios", callback_data: "view_audios" }],
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

const handlePageNavigation = async (chatId, page, data) => {
  const state = userStates[chatId];
  if (!state) return;

  if (state.screen === "audio_list") {
    await showAudioList(chatId, page, state.audios);
  } else if (state.screen === "select_audio") {
    await showSelectAudioList(chatId, page, state.audios);
  }
};

module.exports = {
  setBot,
  handleAddAudioButton,
  handleViewAudiosButton,
  handleAudioDetail,
  handleDeleteAudioButton,
  handleSelectAudioButton,
  handleSelectAudioConfirm,
  handleAudioFile,
  handleAudioName,
  handleCancelAudio,
  handlePageNavigation,
  getPendingUploads: () => pendingAudioUploads,
};
