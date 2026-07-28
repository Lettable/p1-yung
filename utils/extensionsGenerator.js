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

  // Always include base test extension
  content += `[test]
exten => _X.,1,Answer()
exten => _X.,n,Progress()
exten => _X.,n,Background(/var/lib/asterisk/sounds/test_beep)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(60)
exten => 1,2,Hangup()

`;

  // Create extension for each user-added audio
  // Skip "test" since it has a hardcoded context above using test_beep
  const BUILT_IN = new Set(["test"]);
  if (audios && audios.length > 0) {
    audios.forEach((audio) => {
      if (BUILT_IN.has(audio.name)) return;

      let dtmfHandling;
      if (audio.outro) {
        dtmfHandling = `exten => 1,1,Playback(${audio.outro.replace(/\.wav$/, "")})
exten => 1,2,Hangup()`;
      } else {
        dtmfHandling = `exten => 1,1,Hangup()`;
      }

      content += `[${audio.name}]
exten => _X.,1,Answer()
exten => _X.,n,Progress()
exten => _X.,n,Background(/var/lib/asterisk/sounds/${audio.name},m)
exten => _X.,n,Hangup()
${dtmfHandling}

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
