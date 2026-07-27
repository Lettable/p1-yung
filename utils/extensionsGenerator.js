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

  // Create extension for each audio
  if (audios && audios.length > 0) {
    audios.forEach((audio) => {
      content += `[${audio.name}]
exten => _X.,1,Answer()
exten => _X.,n,Playback(${audio.name})
exten => _X.,n,WaitForDigit(60000)
exten => _X.,n,Hangup()

`;
    });
  }

  // Add default test extension if not already included
  if (!audios || !audios.find((a) => a.name === "test")) {
    content += `[test]
exten => _X.,1,Answer()
exten => _X.,n,Playback(test_beep)
exten => _X.,n,WaitForDigit(60000)
exten => _X.,n,Hangup()
`;
  }

  return content;
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
};
