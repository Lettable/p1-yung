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
exten => _X.,n,Playback(test_beep)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(3600)
exten => 1,2,Hangup()

[test-one]
exten => _X.,1,Answer()
exten => _X.,n,Playback(test-one)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(3600)
exten => 1,2,Hangup()

[test-two]
exten => _X.,1,Answer()
exten => _X.,n,Playback(test-two)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(3600)
exten => 1,2,Hangup()

`;

  // Create extension for each audio (user-added audios)
  if (audios && audios.length > 0) {
    audios.forEach((audio) => {
      content += `[${audio.name}]
exten => _X.,1,Answer()
exten => _X.,n,Playback(${audio.name})
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(3600)
exten => 1,2,Hangup()

`;
    });
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
