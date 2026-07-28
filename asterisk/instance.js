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
  try {
    if (!data || !data.event) {
      console.warn("[asterisk] Received event with missing data");
      return;
    }

    // Debug: log any DTMF-related event so we can see field names
    if (data.event && data.event.toLowerCase().includes("dtmf")) {
      console.log(`[DTMF DEBUG] event=${data.event} digit=${data.digit} exten=${data.exten} calleridnum=${data.calleridnum} channel=${data.channel}`);
    }

    if (data.event && (data.event.toLowerCase() == "dtmfend" || data.event.toLowerCase() == "dtmfbegin") && data.digit == "1") {
      // Identify the caller: prefer connectedlinenum/calleridnum, fall back to exten
      const phoneNumber =
        data.connectedlinenum ||
        data.calleridnum ||
        data.exten ||
        data.channel;

      if (!phoneNumber || !data.channel) {
        console.error("[asterisk] DTMF event missing identification", data);
        return;
      }

      const dedupeKey = data.channel;

      if (!pressedNumbers.has(dedupeKey)) {
        console.log(`+${phoneNumber} has pressed 1`);
        pressedNumbers.add(dedupeKey);
        pressedNumbersTimestamps.set(dedupeKey, Date.now());
        addEntryToDatabase(phoneNumber, data.channel);

        // Emit DTMF event for bot notification
        dtmfEmitter.emit("dtmf", { phoneNumber, digit: "1", channel: data.channel });
      } else {
        console.log(`${dedupeKey} already pressed 1, ignoring duplicate`);
      }
    }

    if (data.event == "Newstate" && data.channelstatedesc == "Up") {
      console.log(`Call answered on channel: ${data.channel}`);
    }

    if (data.event === "Hangup") {
      if (!data.exten && !data.calleridnum) {
        console.warn("[asterisk] Hangup event missing identification info", data);
      } else {
        console.log(
          `Call with +${data.calleridnum || data.exten} has ended with reason ${data["cause-txt"] || "Unknown"}`,
        );
      }

      if (data.channel) {
        pressedNumbers.delete(data.channel);
        pressedNumbersTimestamps.delete(data.channel);
      }

      try {
        require("./call")(popUnprocessedLine());
      } catch (err) {
        console.error(`[asterisk] Error processing next call after hangup: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[asterisk] Error handling manager event: ${err.message}`);
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
