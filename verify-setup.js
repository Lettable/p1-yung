#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const symbols = {
  check: "✓",
  cross: "✗",
  info: "ℹ",
  warning: "⚠",
};

// Verify setup
const verify = async () => {
  console.clear();
  console.log(
    `\n${colors.bright}${colors.blue}🔍 Asterisk Call Bot - Setup Verification${colors.reset}\n`
  );

  let passedChecks = 0;
  let failedChecks = 0;
  const results = [];

  const check = (name, condition, details = "") => {
    if (condition) {
      console.log(
        `${colors.green}${symbols.check} ${name}${colors.reset}${details ? ` - ${details}` : ""}`
      );
      results.push({ name, passed: true, details });
      passedChecks++;
    } else {
      console.log(
        `${colors.red}${symbols.cross} ${name}${colors.reset}${details ? ` - ${details}` : ""}`
      );
      results.push({ name, passed: false, details });
      failedChecks++;
    }
  };

  // System requirements
  console.log(`${colors.bright}📋 System Requirements:${colors.reset}`);

  try {
    const nodeVersion = execSync("node -v", { encoding: "utf-8" }).trim();
    check("Node.js", true, nodeVersion);
  } catch {
    check("Node.js", false, "not installed");
  }

  try {
    const npmVersion = execSync("npm -v", { encoding: "utf-8" }).trim();
    check("npm", true, npmVersion);
  } catch {
    check("npm", false, "not installed");
  }

  // Configuration files
  console.log(`\n${colors.bright}📁 Configuration Files:${colors.reset}`);

  const configPath = path.join(__dirname, "config/index.js");
  check("config/index.js exists", fs.existsSync(configPath), configPath);

  if (fs.existsSync(configPath)) {
    try {
      const config = require(configPath);
      check(
        "MongoDB URI configured",
        !!config.mongodbUri,
        config.mongodbUri.substring(0, 30) + "..."
      );
      check(
        "Telegram token configured",
        !!config.telegramBotToken,
        config.telegramBotToken.substring(0, 20) + "..."
      );
      check(
        "Telegram admin ID configured",
        !!config.creatorTelegramId,
        config.creatorTelegramId
      );
      check(
        "Asterisk host configured",
        !!config.asterisk?.host,
        config.asterisk?.host
      );
      check(
        "Asterisk port configured",
        !!config.asterisk?.port,
        config.asterisk?.port
      );
    } catch (err) {
      check("Config file valid", false, err.message);
    }
  }

  // Dependencies
  console.log(`\n${colors.bright}📦 Dependencies:${colors.reset}`);

  const packageJsonPath = path.join(__dirname, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  const requiredDeps = [
    "mongoose",
    "node-telegram-bot-api",
    "asterisk-manager",
    "express",
    "axios",
  ];

  for (const dep of requiredDeps) {
    const installed = !!packageJson.dependencies[dep];
    check(
      dep,
      installed,
      installed ? packageJson.dependencies[dep] : "not installed"
    );
  }

  // Sound files
  console.log(`\n${colors.bright}🔊 Sound Files:${colors.reset}`);

  const soundDir = "/var/lib/asterisk/sounds/en/";
  const contexts = ["coinbase", "apple", "bancocajamar"];

  for (const context of contexts) {
    const soundPath = path.join(soundDir, `${context}.wav`);
    const exists = fs.existsSync(soundPath);
    check(`${context}.wav`, exists, soundPath);

    if (exists) {
      try {
        const stats = fs.statSync(soundPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(
          `${colors.cyan}  ${symbols.info} Size: ${sizeMB} MB, Modified: ${stats.mtime.toLocaleString()}${colors.reset}`
        );
      } catch (err) {
        console.log(
          `${colors.yellow}  ${symbols.warning} Could not read file stats: ${err.message}${colors.reset}`
        );
      }
    }
  }

  // Asterisk configuration
  console.log(`\n${colors.bright}📞 Asterisk Configuration:${colors.reset}`);

  const asteriskConfigPath = "/etc/asterisk/extensions.conf";
  check(
    "extensions.conf exists",
    fs.existsSync(asteriskConfigPath),
    asteriskConfigPath
  );

  if (fs.existsSync(asteriskConfigPath)) {
    try {
      const configContent = fs.readFileSync(asteriskConfigPath, "utf-8");
      check(
        "outbound-coinbase context defined",
        configContent.includes("[outbound-coinbase]")
      );
      check(
        "outbound-apple context defined",
        configContent.includes("[outbound-apple]")
      );
      check(
        "outbound-bancocajamar context defined",
        configContent.includes("[outbound-bancocajamar]")
      );
      check(
        "Background application used",
        configContent.includes("Background("),
        "Dynamic DTMF detection enabled"
      );
    } catch (err) {
      check("Asterisk config readable", false, err.message);
    }
  }

  // Node modules
  console.log(`\n${colors.bright}🔗 Node Modules:${colors.reset}`);

  const nodeModulesPath = path.join(__dirname, "node_modules");
  check("node_modules exists", fs.existsSync(nodeModulesPath), nodeModulesPath);

  // Database models
  console.log(`\n${colors.bright}💾 Database Models:${colors.reset}`);

  const modelsDir = path.join(__dirname, "models");
  if (fs.existsSync(modelsDir)) {
    const models = ["agent.js", "allowed.js", "call.js"];
    for (const model of models) {
      const modelPath = path.join(modelsDir, model);
      check(`${model} exists`, fs.existsSync(modelPath), modelPath);
    }
  } else {
    check("models directory", false, "not found");
  }

  // Routes
  console.log(`\n${colors.bright}🛣️  Routes:${colors.reset}`);

  const routesPath = path.join(__dirname, "routes/index.js");
  check("routes/index.js exists", fs.existsSync(routesPath), routesPath);

  // Telegram bot
  console.log(`\n${colors.bright}🤖 Telegram Bot:${colors.reset}`);

  const botPath = path.join(__dirname, "telegram_bot/index.js");
  check("telegram_bot/index.js exists", fs.existsSync(botPath), botPath);

  if (fs.existsSync(botPath)) {
    try {
      const botContent = fs.readFileSync(botPath, "utf-8");
      check("initializeBot exported", botContent.includes("initializeBot"));
      check("Command handlers defined", botContent.includes("bot.onText"));
    } catch (err) {
      check("Telegram bot readable", false, err.message);
    }
  }

  // Asterisk integration
  console.log(`\n${colors.bright}📡 Asterisk Integration:${colors.reset}`);

  const instancePath = path.join(__dirname, "asterisk/instance.js");
  const callPath = path.join(__dirname, "asterisk/call.js");

  check("asterisk/instance.js exists", fs.existsSync(instancePath), instancePath);
  check("asterisk/call.js exists", fs.existsSync(callPath), callPath);

  if (fs.existsSync(instancePath)) {
    try {
      const instanceContent = fs.readFileSync(instancePath, "utf-8");
      check("AMI connection", instanceContent.includes("AMI"));
      check("Event handlers", instanceContent.includes("managerevent"));
      check("DTMF detection", instanceContent.includes("DTMFBegin"));
    } catch (err) {
      check("Asterisk instance readable", false, err.message);
    }
  }

  // Summary
  console.log(`\n${colors.bright}📊 Summary:${colors.reset}`);
  console.log(
    `${colors.green}${symbols.check} Passed: ${passedChecks}${colors.reset}`
  );
  console.log(`${colors.red}${symbols.cross} Failed: ${failedChecks}${colors.reset}`);

  const successPercentage = (
    (passedChecks / (passedChecks + failedChecks)) *
    100
  ).toFixed(1);
  console.log(
    `${colors.blue}${symbols.info} Success Rate: ${successPercentage}%${colors.reset}`
  );

  // Recommendations
  if (failedChecks > 0) {
    console.log(`\n${colors.yellow}⚠️  Recommendations:${colors.reset}`);
    for (const result of results) {
      if (!result.passed) {
        console.log(`  ${colors.yellow}${symbols.warning} ${result.name}${colors.reset}`);
        if (result.details) {
          console.log(`     ${colors.cyan}${result.details}${colors.reset}`);
        }
      }
    }
    console.log(
      `\n${colors.cyan}Run 'npm run setup' to fix configuration issues.${colors.reset}`
    );
  } else {
    console.log(
      `\n${colors.green}${symbols.check} All checks passed! System is ready.${colors.reset}`
    );
    console.log(
      `${colors.cyan}Start the bot with: npm run dev${colors.reset}`
    );
  }

  console.log();
};

verify().catch((err) => {
  console.error(`${colors.red}Verification failed: ${err.message}${colors.reset}`);
  process.exit(1);
});
