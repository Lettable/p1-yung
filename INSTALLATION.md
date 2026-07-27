# 🎯 Asterisk Call Bot - Complete Installation Guide

Complete step-by-step guide to get your Asterisk call bot running in production.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Hardware
- **CPU**: Dual-core minimum (quad-core recommended)
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 20GB minimum for logs and recordings
- **Network**: Stable internet connection (10 Mbps+)

### Software (Ubuntu 20.04 LTS or newer)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install core dependencies
sudo apt install -y \
  nodejs npm \
  mongodb \
  asterisk asterisk-dev \
  ffmpeg \
  curl wget \
  git \
  build-essential \
  python3-dev
```

### Versions Required
- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **MongoDB**: v4.0 or higher
- **Asterisk**: v16.0 or higher

---

## Quick Start

For experienced users who want to get started immediately:

```bash
# 1. Clone/navigate to project
cd /path/to/asterisk-bot

# 2. Run interactive setup wizard
npm run setup

# 3. Verify installation
npm run verify

# 4. Start the bot
npm run dev
```

The setup wizard will handle:
- ✅ Configuration collection
- ✅ Sound file conversion and placement
- ✅ Dependency installation
- ✅ Asterisk configuration validation

**Time required**: ~5-10 minutes

---

## Detailed Setup

### Step 1: System Preparation

```bash
# Create application directory
sudo mkdir -p /opt/asterisk-bot
sudo chown $USER:$USER /opt/asterisk-bot

# Navigate to directory
cd /opt/asterisk-bot

# Clone repository (or copy files)
git clone <repository-url> . || cp -r ~/Downloads/asterisk-bot/* .
```

### Step 2: Install System Dependencies

```bash
# Update packages
sudo apt update

# Install required packages
sudo apt install -y \
  build-essential \
  curl \
  git \
  mongodb \
  asterisk \
  asterisk-dev \
  ffmpeg \
  python3-dev \
  libssl-dev \
  libffi-dev \
  pkg-config

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version      # Should be v14.0.0+
npm --version       # Should be v6.0.0+
mongo --version     # Should be v4.0+
asterisk -v         # Should show version
```

### Step 3: Configure MongoDB

```bash
# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify MongoDB is running
sudo systemctl status mongodb

# Test MongoDB connection
mongo --eval "db.adminCommand('ping')"
```

### Step 4: Configure Asterisk AMI

Edit Asterisk manager configuration:

```bash
sudo nano /etc/asterisk/manager.conf
```

Ensure this section exists:

```ini
[general]
enabled = yes
port = 5038
bindaddr = 127.0.0.1

[bitcall]
secret = Anton123@
read = all
write = all
```

Reload Asterisk:

```bash
sudo asterisk -rx "manager reload"
```

### Step 5: Verify Asterisk Configuration

```bash
# Check extensions.conf
sudo nano /etc/asterisk/extensions.conf
```

Should include contexts like:
```ini
[outbound-coinbase]
exten => _X.,1,Answer()
exten => _X.,n,Progress()
exten => _X.,n,Background(coinbase)
exten => _X.,n,GotoIf($["${EXTEN}" = "1"]?wait:hangup)
exten => _X.,n(wait),Wait(60)
exten => _X.,n,Hangup()
exten => _X.,n(hangup),Hangup()
```

### Step 6: Prepare Sound Directory

```bash
# Create Asterisk sounds directory
sudo mkdir -p /var/lib/asterisk/sounds/en

# Set proper permissions
sudo chown -R asterisk:asterisk /var/lib/asterisk/sounds
sudo chmod -R 755 /var/lib/asterisk/sounds
```

### Step 7: Run Interactive Setup

```bash
# Navigate to project
cd /opt/asterisk-bot

# Run setup wizard
npm run setup
```

**You will be prompted for:**

1. **MongoDB URI**
   ```
   Example: mongodb://localhost:27017/asterisk-bot
   ```

2. **Telegram Bot Token**
   ```
   Get from @BotFather: https://t.me/botfather
   Format: 123456789:ABCDEFGHIJKLmnopqrstuvwxyz
   ```

3. **Telegram Admin ID**
   ```
   Get from @userinfobot: https://t.me/userinfobot
   Format: 987654321
   ```

4. **Asterisk Configuration**
   - Host: `127.0.0.1`
   - Port: `5038`
   - Username: `bitcall`
   - Password: `Anton123@`

5. **Sound Files**
   - Path to Coinbase intro audio
   - Path to Apple intro audio
   - Path to Bancocajamar intro audio

**Wizard will:**
- ✅ Auto-detect audio format
- ✅ Convert to WAV if needed
- ✅ Copy to correct location
- ✅ Set permissions
- ✅ Install npm packages

### Step 8: Verify Installation

```bash
# Run verification script
npm run verify

# Expected output:
# ✓ Node.js
# ✓ npm
# ✓ config/index.js exists
# ✓ MongoDB URI configured
# ✓ Telegram token configured
# ✓ Asterisk configured
# ✓ Sound files in place
# ✓ All dependencies installed
```

---

## Verification

### Quick Checks

```bash
# 1. Check Node.js setup
npm run verify

# 2. Test MongoDB connection
node -e "const mongoose = require('mongoose');
mongoose.connect(require('./config').mongodbUri)
  .then(() => console.log('✓ MongoDB OK'))
  .catch(e => console.error('✗ MongoDB failed:', e.message))"

# 3. Test Asterisk connection
sudo asterisk -rx "manager show users"

# 4. Check sound files
ls -lah /var/lib/asterisk/sounds/en/

# 5. Check permissions
stat /var/lib/asterisk/sounds/en/coinbase.wav
```

### Detailed Verification

For each component:

```bash
# MongoDB
mongo --eval "db.adminCommand('ping')"

# Asterisk AMI
telnet localhost 5038

# Node.js packages
npm list --depth=0

# Asterisk dialplan
sudo asterisk -rx "dialplan show"

# Sound file format
file /var/lib/asterisk/sounds/en/coinbase.wav
```

---

## Running the Bot

### Development Mode

```bash
# With live reload
npm run dev

# Expected output:
# ✓ Database connection established
# [asterisk] AMI connected successfully
# Listening on port 3000
```

### Production Mode

```bash
# Start application
npm start

# Run with PM2 (recommended)
npm install -g pm2
pm2 start bin/www --name "asterisk-bot"
pm2 startup
pm2 save
```

### Monitoring

```bash
# View logs
pm2 logs asterisk-bot

# Check status
pm2 status

# Monitor performance
pm2 monit
```

---

## Configuration Files

### config/index.js
Main application configuration:

```javascript
module.exports = {
  mongodbUri: "mongodb://localhost:27017/asterisk-bot",
  telegramBotToken: "YOUR_BOT_TOKEN",
  creatorTelegramId: "YOUR_TELEGRAM_ID",
  concurrentCalls: 30,
  agents: ["coinbase", "apple", "bancocajamar"],
  asterisk: {
    host: "127.0.0.1",
    port: 5038,
    username: "bitcall",
    password: "Anton123@",
  },
  fileDownloadTimeout: 30000,
};
```

### /etc/asterisk/extensions.conf
Dialplan configuration (already updated by setup wizard)

### /var/lib/asterisk/sounds/en/
Sound file location:
- `coinbase.wav` - Coinbase context
- `apple.wav` - Apple context
- `bancocajamar.wav` - Bancocajamar context

---

## Troubleshooting

### Setup Issues

**MongoDB connection failed**
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start if stopped
sudo systemctl start mongodb

# Verify connection string
mongo "mongodb://localhost:27017/asterisk-bot"
```

**Telegram bot not responding**
```bash
# Verify token is correct
curl -s https://api.telegram.org/bot<TOKEN>/getMe

# Check internet connectivity
ping -c 3 api.telegram.org
```

**Asterisk AMI connection failed**
```bash
# Check if Asterisk is running
sudo systemctl status asterisk

# Check AMI port
sudo netstat -tlnp | grep 5038

# Test connection
telnet localhost 5038

# Check manager.conf
sudo grep -A 5 "\[bitcall\]" /etc/asterisk/manager.conf
```

**Sound files not playing**
```bash
# Check file exists and permissions
ls -l /var/lib/asterisk/sounds/en/

# Verify file format
file /var/lib/asterisk/sounds/en/coinbase.wav
# Should output: PCM 16-bit mono 8000 Hz

# Test playback
sudo asterisk -rx "channel originate PJSIP/test application Playback coinbase"
```

### Runtime Issues

**Call ends immediately**
```bash
# Check Asterisk logs
sudo tail -f /var/log/asterisk/messages

# Check for dialplan errors
sudo asterisk -rx "dialplan show outbound-coinbase"

# Verify DTMF detection
sudo asterisk -rx "sip show settings"
```

**No incoming calls**
```bash
# Check SIP configuration
sudo asterisk -rx "sip show peers"

# Monitor calls
sudo asterisk -rx "core show calls"

# Check call logs
grep "Ringing number" /var/log/asterisk/messages
```

---

## Next Steps

1. **Test with Telegram**
   - Send `/start` to your bot
   - Send `/agents` to list agents
   - Upload test file with numbers

2. **Configure Agents**
   - Send `/add 1234567890 Agent Name`
   - Test transfers with `/add`

3. **Monitor Operations**
   - Watch logs: `npm run dev`
   - Check Asterisk: `sudo asterisk -r`

4. **Optimize Settings**
   - Adjust `concurrentCalls` in config
   - Fine-tune timeouts as needed

---

## Support Resources

- **Asterisk Docs**: https://wiki.asterisk.org
- **Telegram Bot API**: https://core.telegram.org/bots/api
- **MongoDB Docs**: https://docs.mongodb.com
- **Project Issues**: Create an issue on GitHub

---

**🎉 Setup Complete! Your Asterisk call bot is ready to go!**

Start making calls with: `npm run dev`
