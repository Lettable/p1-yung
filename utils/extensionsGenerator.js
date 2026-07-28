const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ASTERISK_CONFIG_DIR = "/etc/asterisk";
const EXTENSIONS_CONF_PATH = path.join(ASTERISK_CONFIG_DIR, "extensions.conf");

const generateExtensionsConf = async (audios) => {
  let content = `[general]
static=yes
writeprotect=no

`;

  // Always include base test extensions
  content += `[test]
exten => _X.,1,Answer()
exten => _X.,n,Playback(/var/lib/asterisk/sounds/test_beep)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(3600)
exten => 1,2,Hangup()

[test-one]
exten => _X.,1,Answer()
exten => _X.,n,Playback(/var/lib/asterisk/sounds/test-one)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(3600)
exten => 1,2,Hangup()

[test-two]
exten => _X.,1,Answer()
exten => _X.,n,Playback(/var/lib/asterisk/sounds/test-two)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(3600)
exten => 1,2,Hangup()

`;

  // Create extension for each audio (user-added audios)
  // Skip built-in test audio names that have hardcoded contexts above
  const BUILT_IN = new Set(["test", "test-one", "test-two"]);
  if (audios && audios.length > 0) {
    audios.forEach((audio) => {
      if (BUILT_IN.has(audio.name)) return;
      content += `[${audio.name}]
exten => _X.,1,Answer()
exten => _X.,n,Playback(/var/lib/asterisk/sounds/${audio.name})
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(3600)
exten => 1,2,Hangup()

`;
    });
  }

  return content;
};

const ensureExtensionsConf = async () => {
  if (!fs.existsSync(EXTENSIONS_CONF_PATH)) {
    console.log("[extensionsGenerator] No extensions.conf found, generating default...");
    return updateExtensionsConf([]);
  }
  console.log("[extensionsGenerator] extensions.conf already exists, skipping regeneration");
  return true;
};

const updateExtensionsConf = async (audios) => {
  try {
    const content = await generateExtensionsConf(audios);

    if (process.platform === "linux") {
      execSync(`sudo tee ${EXTENSIONS_CONF_PATH} > /dev/null << 'EOF'
${content}
EOF`);

      execSync("sudo asterisk -rx 'dialplan reload'");
      console.log("[extensionsGenerator] Extensions.conf updated and reloaded");
      return true;
    } else {
      console.log("[extensionsGenerator] Not on Linux, skipping Asterisk update");
      return false;
    }
  } catch (err) {
    console.error(`[extensionsGenerator] Failed to update extensions.conf: ${err.message}`);
    throw err;
  }
};

module.exports = {
  generateExtensionsConf,
  updateExtensionsConf,
  ensureExtensionsConf,
};
