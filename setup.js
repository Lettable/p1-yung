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

// Generate beep sound using ffmpeg
const generateBeepSound = (outputPath, frequency = 1000, duration = 0.5) => {
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
        reject(new Error(`FFmpeg beep generation failed with code ${code}`));
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
    sip: {},
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
  log.dim(
    "This will create an AMI (Asterisk Manager Interface) user for the bot to make calls.\n"
  );

  setupData.asterisk.host = await prompt("Asterisk host (e.g., 127.0.0.1)");
  if (!setupData.asterisk.host) {
    log.error("Asterisk host is required");
    process.exit(1);
  }

  setupData.asterisk.port = await prompt("Asterisk AMI port (e.g., 5038)");
  if (!setupData.asterisk.port) {
    log.error("Asterisk port is required");
    process.exit(1);
  }

  log.info("Creating new AMI user for the bot...");

  setupData.asterisk.username = await prompt(
    "Choose AMI username (e.g., asterisk_bot)"
  );
  if (!setupData.asterisk.username) {
    log.error("AMI username is required");
    process.exit(1);
  }

  setupData.asterisk.password = await prompt(
    "Choose AMI password (strong password recommended)"
  );
  if (!setupData.asterisk.password) {
    log.error("AMI password is required");
    process.exit(1);
  }

  if (setupData.asterisk.password.length < 8) {
    log.warning("Password is short - consider using a stronger password");
  }

  log.success("Asterisk AMI user will be created with:");
  log.dim(`  Username: ${setupData.asterisk.username}`);
  log.dim(`  Password: ${"*".repeat(setupData.asterisk.password.length)}`);

  // Step 5: SIP Configuration
  log.header("Step 5: SIP Configuration");

  log.info("Configure your SIP gateway/peer details.");

  setupData.sip.domain = await prompt("Enter SIP Domain or IP (e.g., gateway.example.com or 192.168.1.1)");
  if (!setupData.sip.domain) {
    log.error("SIP Domain/IP is required");
    process.exit(1);
  }

  setupData.sip.password = await prompt("Enter SIP Password");
  if (!setupData.sip.password) {
    log.error("SIP Password is required");
    process.exit(1);
  }

  log.success("SIP configuration saved");
  log.dim(`  Domain/IP: ${setupData.sip.domain}`);
  log.dim(`  Password: ${"*".repeat(setupData.sip.password.length)}`);

  // Step 6: Auto-Generate Universal Test Beep Sound
  log.header("Step 6: Generating Universal Test Beep Sound");

  if (!commandExists("ffmpeg")) {
    log.warning("ffmpeg not found. Install it with: sudo apt install ffmpeg");
    log.info("Skipping sound file generation.");
  } else {
    const asteriskSoundDir = `/var/lib/asterisk/sounds/en/`;

    try {
      // Create Asterisk sounds directory if it doesn't exist
      if (!fs.existsSync(asteriskSoundDir)) {
        execSync(`sudo mkdir -p ${asteriskSoundDir}`);
        log.info(`Created directory: ${asteriskSoundDir}`);
      }

      log.step("Generating universal test beep sound...");
      const tempPath = path.join("/tmp", "test_beep.wav");
      const outputPath = path.join(asteriskSoundDir, "test_beep.wav");

      try {
        await generateBeepSound(tempPath, 1000, 1.0);
        execSync(`sudo mv "${tempPath}" "${outputPath}"`);

        // Try to set permissions - skip if asterisk user doesn't exist
        try {
          execSync(`sudo chown asterisk:asterisk "${outputPath}"`);
        } catch {
          log.dim("  (asterisk user not found locally - permissions set to root)");
        }

        execSync(`sudo chmod 644 "${outputPath}"`);
        log.success("Universal test beep generated: test_beep.wav");
        setupData.sounds.test = outputPath;
      } catch (err) {
        log.error(`Failed to generate beep: ${err.message}`);
      }
    } catch (err) {
      log.error(`Sound generation failed: ${err.message}`);
    }
  }

  // Step 7: Update Configuration Files
  log.header("Step 7: Updating Configuration Files");

  try {
    log.step("Updating config/index.js...");

    const configTemplate = `module.exports = {
  mongodbUri: "${setupData.mongodb.uri}",
  telegramBotToken: "${setupData.telegram.token}",
  creatorTelegramId: "${setupData.telegram.creatorId}",
  concurrentCalls: 30,
  asterisk: {
    host: "${setupData.asterisk.host}",
    port: ${setupData.asterisk.port},
    username: "${setupData.asterisk.username}",
    password: "${setupData.asterisk.password}",
  },
  sip: {
    domain: "${setupData.sip.domain}",
    password: "${setupData.sip.password}",
  },
  fileDownloadTimeout: 30000,
};
`;

    fs.writeFileSync(path.join(__dirname, "config/index.js"), configTemplate);
    log.success("config/index.js updated");

    // Create .env file with sensitive data
    log.step("Creating .env file...");

    const envTemplate = `# MongoDB Configuration
MONGODB_URI=${setupData.mongodb.uri}

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=${setupData.telegram.token}
TELEGRAM_ADMIN_ID=${setupData.telegram.creatorId}

# Asterisk Configuration
ASTERISK_HOST=${setupData.asterisk.host}
ASTERISK_PORT=${setupData.asterisk.port}
ASTERISK_USERNAME=${setupData.asterisk.username}
ASTERISK_PASSWORD=${setupData.asterisk.password}

# SIP Configuration
SIP_DOMAIN=${setupData.sip.domain}
SIP_PASSWORD=${setupData.sip.password}

# Application Configuration
NODE_ENV=production
CONCURRENT_CALLS=30
FILE_DOWNLOAD_TIMEOUT=30000

# Logging
LOG_LEVEL=info
`;

    fs.writeFileSync(path.join(__dirname, ".env"), envTemplate);
    log.success(".env file created (keep this safe!)");

    // Create/update Asterisk manager.conf
    log.step("Setting up Asterisk manager.conf...");

    const managerConfTemplate = `[general]
enabled = yes
port = ${setupData.asterisk.port}
bindaddr = 0.0.0.0
tlsenable = no

[${setupData.asterisk.username}]
secret = ${setupData.asterisk.password}
read = all
write = all
`;

    const asteriskConfigDir = "/etc/asterisk";
    const managerConfPath = path.join(asteriskConfigDir, "manager.conf");

    try {
      // Check if running on Linux with Asterisk
      if (process.platform === "linux" && fs.existsSync(asteriskConfigDir)) {
        try {
          execSync(`sudo tee ${managerConfPath} > /dev/null << 'EOF'
${managerConfTemplate}
EOF`);

          execSync("sudo asterisk -rx 'manager reload'");
          log.success("Asterisk manager.conf configured and reloaded");
          setupData.asterisk.managerConfConfigured = true;
        } catch (err) {
          log.warning(
            "Could not auto-configure manager.conf. Manual setup needed:"
          );
          log.dim(`\nRun: sudo nano /etc/asterisk/manager.conf`);
          log.dim("Add this section:");
          console.log(managerConfTemplate);
          setupData.asterisk.managerConfConfigured = false;
        }
      } else if (process.platform !== "linux") {
        log.info(
          "Not on Linux - manual Asterisk setup will be needed on your server"
        );
        setupData.asterisk.managerConfConfigured = false;
      }
    } catch (err) {
      log.warning(
        `Could not auto-configure manager.conf: ${err.message}`
      );
      setupData.asterisk.managerConfConfigured = false;
    }
  } catch (err) {
    log.error(`Failed to update config: ${err.message}`);
  }

  // Step 8: Install Dependencies
  log.header("Step 8: Installing Dependencies");

  try {
    log.step("Running npm install...");
    execSync("npm install", { stdio: "inherit", cwd: __dirname });
    setupData.dependencies.installed = true;
    log.success("Dependencies installed successfully");
  } catch (err) {
    log.error(`Failed to install dependencies: ${err.message}`);
    setupData.dependencies.installed = false;
  }

  // Step 9: Summary
  log.header("✨ Setup Summary");

  console.log(`
${colors.bright}MongoDB Configuration:${colors.reset}
  ${symbols.check} URI: ${setupData.mongodb.uri}

${colors.bright}Telegram Bot Configuration:${colors.reset}
  ${symbols.check} Token: ${setupData.telegram.token.substring(0, 20)}...
  ${symbols.check} Admin ID: ${setupData.telegram.creatorId}

${colors.bright}Asterisk Configuration:${colors.reset}
  ${symbols.check} Host: ${setupData.asterisk.host}
  ${symbols.check} Port: ${setupData.asterisk.port}
  ${symbols.check} AMI Username: ${setupData.asterisk.username}
  ${symbols.check} AMI Password: ${"*".repeat(setupData.asterisk.password.length)}

${colors.bright}SIP Configuration:${colors.reset}
  ${symbols.check} Domain/IP: ${setupData.sip.domain}
  ${symbols.check} Password: ${"*".repeat(setupData.sip.password.length)}

${colors.bright}Sound Files:${colors.reset}
  ${symbols.check} Universal test beep: test_beep.wav (${Object.keys(setupData.sounds).length}/1)

${colors.bright}Dependencies:${colors.reset}
  ${symbols.check} npm packages: Installed
  `);

  log.header("🎉 Setup Complete!");

  log.warning("IMPORTANT - Security:");
  log.dim("  ⚠ Keep .env file safe - it contains your credentials");
  log.dim("  ⚠ Add .env to .gitignore (never commit credentials)");
  log.dim("  ⚠ Your Asterisk AMI user is now created");

  log.info("Next steps:");
  log.dim("  1. Verify Asterisk manager.conf was created/updated");
  log.dim("  2. Verify Asterisk extensions.conf at: /etc/asterisk/extensions.conf");
  log.dim("  3. Start your bot with: npm run dev");
  log.dim("  4. Test the bot by sending a file to your Telegram bot");

  log.info("Files created/updated:");
  log.dim("  ✓ config/index.js - Configuration");
  log.dim("  ✓ .env - Credentials (DO NOT COMMIT TO GIT)");
  log.dim("  ✓ /etc/asterisk/manager.conf - AMI user");
  log.dim("  ✓ /var/lib/asterisk/sounds/en/test_beep.wav - Universal test beep");

  log.info("Documentation:");
  log.dim("  SETUP_GUIDE.md - Complete setup instructions");
  log.dim("  QUICK_REFERENCE.md - Command cheat sheet");

  console.log();
};

// Run setup
setup().catch((err) => {
  log.error(`Setup failed: ${err.message}`);
  process.exit(1);
});
