#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");
const readline = require("readline");

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
};

const symbols = {
  check: "✓",
  cross: "✗",
  arrow: "➜",
  circle: "●",
  star: "★",
  info: "ℹ",
  warning: "⚠",
};

// Setup logging
const log = {
  header: (text) => {
    console.log(
      `\n${colors.bright}${colors.bgBlue} ${text} ${colors.reset}\n`
    );
  },
  success: (text) => {
    console.log(`${colors.green}${symbols.check} ${text}${colors.reset}`);
  },
  error: (text) => {
    console.log(`${colors.red}${symbols.cross} ${text}${colors.reset}`);
  },
  info: (text) => {
    console.log(`${colors.cyan}${symbols.info} ${text}${colors.reset}`);
  },
  warning: (text) => {
    console.log(`${colors.yellow}${symbols.warning} ${text}${colors.reset}`);
  },
  step: (text) => {
    console.log(`${colors.magenta}${symbols.arrow} ${text}${colors.reset}`);
  },
  dim: (text) => {
    console.log(`${colors.dim}${text}${colors.reset}`);
  },
};

// Prompt user for input
const prompt = (question) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      `${colors.bright}${colors.cyan}${symbols.arrow} ${question}${colors.reset}\n  `,
      (answer) => {
        rl.close();
        resolve(answer);
      }
    );
  });
};

// Check if command exists
const commandExists = (command) => {
  try {
    execSync(`which ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

// Detect audio file format
const detectAudioFormat = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".mp3": "mp3",
    ".wav": "wav",
    ".alaw": "alaw",
    ".ulaw": "ulaw",
    ".gsm": "gsm",
    ".ogg": "ogg",
    ".flac": "flac",
    ".m4a": "aac",
  };
  return mimeTypes[ext] || "unknown";
};

// Convert audio file to WAV format
const convertToWav = async (inputPath, outputPath) => {
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

// Main setup function
const setup = async () => {
  console.clear();

  log.header("🚀 ASTERISK CALL BOT - SETUP WIZARD");

  log.info(
    "This wizard will set up your Asterisk call bot with all required configurations."
  );
  console.log();

  const setupData = {
    mongodb: {},
    telegram: {},
    asterisk: {},
    sounds: {},
    dependencies: {},
  };

  // Step 1: Check Prerequisites
  log.header("Step 1: Checking Prerequisites");

  const requiredCommands = ["node", "npm"];
  let allPrereqsMet = true;

  for (const cmd of requiredCommands) {
    if (commandExists(cmd)) {
      log.success(`${cmd} is installed`);
    } else {
      log.error(`${cmd} is NOT installed`);
      allPrereqsMet = false;
    }
  }

  if (!allPrereqsMet) {
    log.error("Please install missing prerequisites and run this script again.");
    process.exit(1);
  }

  // Step 2: MongoDB Configuration
  log.header("Step 2: MongoDB Configuration");

  log.info("MongoDB is required to store call records and agent data.");

  setupData.mongodb.uri = await prompt(
    "Enter MongoDB URI (e.g., mongodb://localhost:27017/asterisk-bot)"
  );

  if (setupData.mongodb.uri) {
    log.success("MongoDB URI configured");
  }

  // Step 3: Telegram Bot Configuration
  log.header("Step 3: Telegram Bot Configuration");

  log.info("Get your bot token from @BotFather on Telegram.");

  setupData.telegram.token = await prompt("Enter Telegram Bot Token");
  setupData.telegram.creatorId = await prompt(
    "Enter your Telegram User ID (admin)"
  );

  if (setupData.telegram.token && setupData.telegram.creatorId) {
    log.success("Telegram configuration saved");
  }

  // Step 4: Asterisk Configuration
  log.header("Step 4: Asterisk Configuration");

  log.info("Configure your Asterisk server details.");

  setupData.asterisk.host = await prompt("Asterisk host (default: 127.0.0.1)");
  setupData.asterisk.host = setupData.asterisk.host || "127.0.0.1";

  setupData.asterisk.port = await prompt("Asterisk AMI port (default: 5038)");
  setupData.asterisk.port = setupData.asterisk.port || "5038";

  setupData.asterisk.username = await prompt(
    "Asterisk AMI username (default: bitcall)"
  );
  setupData.asterisk.username = setupData.asterisk.username || "bitcall";

  setupData.asterisk.password = await prompt(
    "Asterisk AMI password (default: Anton123@)"
  );
  setupData.asterisk.password = setupData.asterisk.password || "Anton123@";

  log.success("Asterisk configuration saved");

  // Step 5: Sound Files Configuration
  log.header("Step 5: Sound Files Configuration");

  log.info("Provide paths to your audio files for different contexts.");
  log.dim("Supported formats: MP3, WAV, OGG, FLAC, M4A");
  log.dim(
    "Files will be automatically converted to WAV (8kHz mono) if needed.\n"
  );

  const soundContexts = ["coinbase", "apple", "bancocajamar"];

  for (const context of soundContexts) {
    log.step(`Setting up sound for context: ${context}`);

    const soundPath = await prompt(`Path to ${context} audio file`);

    if (!soundPath) {
      log.warning(`Skipping ${context} - no file provided`);
      continue;
    }

    if (!fs.existsSync(soundPath)) {
      log.error(`File not found: ${soundPath}`);
      continue;
    }

    const format = detectAudioFormat(soundPath);
    log.info(`Detected format: ${format}`);

    const asteriskSoundDir = `/var/lib/asterisk/sounds/en/`;
    const outputFileName = `${context}.wav`;
    const outputPath = path.join(asteriskSoundDir, outputFileName);

    try {
      // Create Asterisk sounds directory if it doesn't exist
      if (!fs.existsSync(asteriskSoundDir)) {
        execSync(`sudo mkdir -p ${asteriskSoundDir}`);
        log.info(`Created directory: ${asteriskSoundDir}`);
      }

      if (format === "wav") {
        // Copy WAV file directly
        execSync(`sudo cp "${soundPath}" "${outputPath}"`);
        log.success(`${context} sound copied to ${outputPath}`);
      } else if (format === "unknown") {
        log.error(
          `Unknown audio format for ${context}. Please use: MP3, WAV, OGG, FLAC, or M4A`
        );
        continue;
      } else {
        // Check if ffmpeg is available
        if (!commandExists("ffmpeg")) {
          log.warning("ffmpeg not found. Install it with: sudo apt install ffmpeg");
          log.info("For now, please manually convert your audio files to WAV format.");
          continue;
        }

        // Convert to WAV
        log.step(`Converting ${context} audio to WAV format...`);
        const tempPath = path.join("/tmp", `${context}_temp.wav`);

        await convertToWav(soundPath, tempPath);
        execSync(`sudo mv "${tempPath}" "${outputPath}"`);

        log.success(`${context} sound converted and placed at ${outputPath}`);
      }

      // Set proper permissions
      execSync(`sudo chown asterisk:asterisk "${outputPath}"`);
      execSync(`sudo chmod 644 "${outputPath}"`);

      setupData.sounds[context] = outputPath;
    } catch (err) {
      log.error(`Failed to process ${context} sound: ${err.message}`);
    }
  }

  // Step 6: Update Configuration Files
  log.header("Step 6: Updating Configuration Files");

  try {
    log.step("Updating config/index.js...");

    const configTemplate = `module.exports = {
  mongodbUri: "${setupData.mongodb.uri}",
  telegramBotToken: "${setupData.telegram.token}",
  creatorTelegramId: "${setupData.telegram.creatorId}",
  concurrentCalls: 30,
  agents: ["coinbase", "apple", "bancocajamar"],
  asterisk: {
    host: "${setupData.asterisk.host}",
    port: ${setupData.asterisk.port},
    username: "${setupData.asterisk.username}",
    password: "${setupData.asterisk.password}",
  },
  fileDownloadTimeout: 30000,
};
`;

    fs.writeFileSync(path.join(__dirname, "config/index.js"), configTemplate);
    log.success("config/index.js updated");
  } catch (err) {
    log.error(`Failed to update config: ${err.message}`);
  }

  // Step 7: Install Dependencies
  log.header("Step 7: Installing Dependencies");

  try {
    log.step("Running npm install...");
    execSync("npm install", { stdio: "inherit", cwd: __dirname });
    setupData.dependencies.installed = true;
    log.success("Dependencies installed successfully");
  } catch (err) {
    log.error(`Failed to install dependencies: ${err.message}`);
    setupData.dependencies.installed = false;
  }

  // Step 8: Summary
  log.header("✨ Setup Summary");

  console.log(`\n${colors.bright}MongoDB Configuration:${colors.reset}`);
  console.log(
    `  ${symbols.check} URI: ${colors.green}${setupData.mongodb.uri}${colors.reset}`
  );

  console.log(`\n${colors.bright}Telegram Bot Configuration:${colors.reset}`);
  console.log(
    `  ${symbols.check} Token: ${colors.green}${setupData.telegram.token.substring(0, 20)}...${colors.reset}`
  );
  console.log(
    `  ${symbols.check} Admin ID: ${colors.green}${setupData.telegram.creatorId}${colors.reset}`
  );

  console.log(`\n${colors.bright}Asterisk Configuration:${colors.reset}`);
  console.log(
    `  ${symbols.check} Host: ${colors.green}${setupData.asterisk.host}${colors.reset}`
  );
  console.log(
    `  ${symbols.check} Port: ${colors.green}${setupData.asterisk.port}${colors.reset}`
  );
  console.log(
    `  ${symbols.check} Username: ${colors.green}${setupData.asterisk.username}${colors.reset}`
  );

  console.log(`\n${colors.bright}Sound Files:${colors.reset}`);
  for (const [context, soundPath] of Object.entries(setupData.sounds)) {
    console.log(
      `  ${symbols.check} ${context}: ${colors.green}${soundPath}${colors.reset}`
    );
  }

  const soundsProvided = Object.keys(setupData.sounds).length;
  if (soundsProvided < 3) {
    log.warning(
      `Only ${soundsProvided}/3 sound files configured. You can add more later.`
    );
  }

  console.log(`\n${colors.bright}Dependencies:${colors.reset}`);
  if (setupData.dependencies.installed) {
    console.log(
      `  ${symbols.check} npm packages: ${colors.green}Installed${colors.reset}`
    );
  } else {
    console.log(
      `  ${symbols.cross} npm packages: ${colors.red}Failed${colors.reset}`
    );
    log.info("Run 'npm install' manually to install dependencies.");
  }

  // Final instructions
  log.header("🎉 Setup Complete!");

  log.info("Next steps:");
  console.log(
    `  1. ${colors.dim}Verify Asterisk configuration at: /etc/asterisk/extensions.conf${colors.reset}`
  );
  console.log(
    `  2. ${colors.dim}Start your bot with: npm run dev${colors.reset}`
  );
  console.log(
    `  3. ${colors.dim}Test the bot by sending a file to your Telegram bot${colors.reset}`
  );

  log.info("Documentation:");
  console.log(`  ${colors.dim}https://github.com/your-repo/wiki${colors.reset}`);

  console.log();
};

// Run setup
setup().catch((err) => {
  log.error(`Setup failed: ${err.message}`);
  process.exit(1);
});
