const AMI = require("asterisk-manager");
const EventEmitter = require("events");
const config = require("../config");

// Create event emitter for DTMF notifications
const dtmfEmitter = new EventEmitter();

// Initialize AMI connection
const amiConfig = {
  host: config.asterisk.host,
  port: config.asterisk.port,
  username: config.asterisk.username,
  password: config.asterisk.password,
};
const {
  addEntryToDatabase,
  popUnprocessedLine,
} = require("../utils/entries");
const pressedNumbers = new Set();
const pressedNumbersTimestamps = new Map();

// Clean up stale pressed numbers every 10 minutes (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const numbersToClear = [];

  for (const [phoneNumber, timestamp] of pressedNumbersTimestamps.entries()) {
    if (timestamp < oneHourAgo) {
      numbersToClear.push(phoneNumber);
    }
  }

  numbersToClear.forEach((phoneNumber) => {
    pressedNumbers.delete(phoneNumber);
    pressedNumbersTimestamps.delete(phoneNumber);
    console.log(`[asterisk] Cleared stale pressed number tracking for +${phoneNumber}`);
  });

  if (numbersToClear.length > 0) {
    console.log(`[asterisk] Cleaned up ${numbersToClear.length} stale pressed numbers. Remaining: ${pressedNumbers.size}`);
  }
}, 10 * 60 * 1000);

const ami = new AMI(
  config.asterisk.port,
  config.asterisk.host,
  config.asterisk.username,
  config.asterisk.password,
  true,
);
ami.keepConnected();

ami.on("connect", () => {
  console.log("[asterisk] AMI connected successfully");
});

ami.on("error", (err) => {
  console.error(`[asterisk] AMI connection error: ${err.message}`);
});

ami.on("close", () => {
  console.warn("[asterisk] AMI connection closed");
});

ami.on("managerevent", (data) => {
  if (data?.event == "DTMFBegin" && data?.digit == "1") {
    if (!pressedNumbers.has(data?.exten)) {
      console.log(`+${data?.exten} has pressed 1`);
      pressedNumbers.add(data?.exten);
      addEntryToDatabase(data?.exten, data?.channel);
      dtmfEmitter.emit("dtmf", { phoneNumber: data?.exten, digit: "1", channel: data?.channel });
    } else {
      console.log(`+${data?.exten} has already pressed 1, ignoring duplicate`);
    }
  }

  if (data?.event == "Newstate" && data?.channelstatedesc == "Up") {
    console.log(`Call answered on channel: ${data?.channel}`);
  }

  if (data?.event === "Hangup") {
    console.log(
      `Call with +${data?.calleridnum} has ended with reason ${data["cause-txt"]}`,
    );
    if (data?.exten) {
      pressedNumbers.delete(data.exten);
      pressedNumbersTimestamps.delete(data.exten);
    }
    try {
      require("./call")(popUnprocessedLine());
    } catch (err) {
      console.error(`[asterisk] Error processing next call after hangup: ${err.message}`);
    }
  }
});

function waitForConnection() {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (ami.connected) {
        clearInterval(check);
        resolve();
      }
    }, 1000);
  });
}

function transferCall(channel, agentNumber) {
  return new Promise((resolve, reject) => {
    ami.action(
      {
        action: "Redirect",
        channel: channel,
        context: "transfer-to-agent",
        exten: agentNumber,
        priority: 1,
        extrachan: channel,
      },
      (err, res) => {
        if (err) reject(err);
        else resolve(res);
      },
    );
  });
}

function hangupCall(channel) {
  return new Promise((resolve, reject) => {
    ami.action(
      {
        action: "Hangup",
        channel: channel,
      },
      (err, res) => {
        if (err) reject(err);
        else resolve(res);
      },
    );
  });
}

module.exports = { ami, waitForConnection, transferCall, hangupCall, dtmfEmitter };
