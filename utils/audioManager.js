const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const Audio = require("../models/Audio");

const ASTERISK_SOUNDS_DIR = "/var/lib/asterisk/sounds/";

const generateBeepSound = (outputPath, frequency = 1000, duration = 1.0) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=${frequency}:duration=${duration}`,
      "-ar",
      "8000",
      "-ac",
      "1",
      "-acodec",
      "pcm_s16le",
      "-f",
      "wav",
      outputPath,
      "-y",
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

const convertAudioToWav = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      inputPath,
      "-ar",
      "8000",
      "-ac",
      "1",
      "-acodec",
      "pcm_s16le",
      "-f",
      "wav",
      outputPath,
      "-y",
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`FFmpeg conversion failed with code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

const saveAudio = async (inputPath, audioName) => {
  try {
    // Create Asterisk sounds directory if it doesn't exist
    if (!fs.existsSync(ASTERISK_SOUNDS_DIR)) {
      require("child_process").execSync(`sudo mkdir -p ${ASTERISK_SOUNDS_DIR}`);
    }

    const outputFileName = `${audioName}.wav`;
    const outputPath = path.join(ASTERISK_SOUNDS_DIR, outputFileName);
    const tempPath = path.join("/tmp", `${audioName}_converted.wav`);

    // Convert to WAV
    await convertAudioToWav(inputPath, tempPath);

    // Move to Asterisk directory
    require("child_process").execSync(`sudo mv "${tempPath}" "${outputPath}"`);

    // Set permissions
    try {
      require("child_process").execSync(`sudo chown asterisk:asterisk "${outputPath}"`);
    } catch {
      // Asterisk user might not exist locally
    }
    require("child_process").execSync(`sudo chmod 644 "${outputPath}"`);

    // Save to database
    const audio = await Audio.findOneAndUpdate(
      { name: audioName },
      {
        name: audioName,
        path: outputPath,
        format: "wav",
        size: fs.statSync(outputPath).size,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return audio;
  } catch (err) {
    throw new Error(`Failed to save audio: ${err.message}`);
  }
};

const deleteAudio = async (audioName) => {
  try {
    const audio = await Audio.findOneAndDelete({ name: audioName });

    if (audio && audio.path) {
      try {
        require("child_process").execSync(`sudo rm "${audio.path}"`);
      } catch {
        // File might not exist
      }
    }

    return audio;
  } catch (err) {
    throw new Error(`Failed to delete audio: ${err.message}`);
  }
};

const getAudioList = async () => {
  return await Audio.find({}).sort({ createdAt: -1 });
};

const getAudioPath = async (audioName) => {
  const audio = await Audio.findOne({ name: audioName });
  return audio ? audio.path : null;
};

const initializeTestAudio = async () => {
  try {
    const BUILT_IN_NAMES = ["test", "test-one", "test-two"];
    const results = [];

    for (const name of BUILT_IN_NAMES) {
      const beepName = name === "test" ? "test_beep" : name;
      const outputPath = path.join(ASTERISK_SOUNDS_DIR, `${beepName}.wav`);
      const existing = await Audio.findOne({ name });

      if (existing && fs.existsSync(outputPath)) {
        results.push(existing);
        continue;
      }

      if (existing && !fs.existsSync(outputPath)) {
        console.log(`[audioManager] ${name} DB entry exists but file missing, regenerating...`);
      }

      const tempPath = path.join("/tmp", `${beepName}.wav`);
      await generateBeepSound(tempPath, 1000, 1.0);

      if (!fs.existsSync(ASTERISK_SOUNDS_DIR)) {
        require("child_process").execSync(`sudo mkdir -p ${ASTERISK_SOUNDS_DIR}`);
      }

      require("child_process").execSync(`sudo mv "${tempPath}" "${outputPath}"`);

      try {
        require("child_process").execSync(`sudo chown asterisk:asterisk "${outputPath}"`);
      } catch {
        // Asterisk user might not exist locally
      }
      require("child_process").execSync(`sudo chmod 644 "${outputPath}"`);

      const audio = await Audio.findOneAndUpdate(
        { name },
        {
          name,
          path: outputPath,
          format: "wav",
          size: fs.statSync(outputPath).size,
          createdAt: new Date(),
        },
        { upsert: true, new: true }
      );

      results.push(audio);
    }

    return results[0];
  } catch (err) {
    console.error(`[audioManager] Failed to initialize test audio: ${err.message}`);
    throw err;
  }
};

module.exports = {
  saveAudio,
  deleteAudio,
  getAudioList,
  getAudioPath,
  initializeTestAudio,
  generateBeepSound,
  convertAudioToWav,
};
