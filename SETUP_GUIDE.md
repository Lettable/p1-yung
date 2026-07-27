# 🚀 Asterisk Call Bot - Setup Guide

Complete interactive setup wizard for your Asterisk call bot system.

## Prerequisites

Before running the setup wizard, ensure you have:

- **Node.js** (v14+)
- **npm** (v6+)
- **MongoDB** running (local or remote)
- **Asterisk** installed and configured
- **FFmpeg** (for audio format conversion) - optional but recommended

### Install Prerequisites (Ubuntu/Debian)

```bash
# Update package manager
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm

# Install MongoDB
sudo apt install mongodb

# Install FFmpeg (for audio conversion)
sudo apt install ffmpeg

# Install Asterisk (if not already installed)
sudo apt install asterisk asterisk-dev
```

## Quick Start

### 1. Run the Setup Wizard

```bash
# Navigate to project directory
cd /path/to/asterisk-bot

# Run interactive setup
npm run setup
```

### 2. What the Wizard Will Ask

The setup wizard will guide you through:

#### Step 1: Prerequisites Check ✓
- Verifies Node.js and npm installation
- Checks for required system tools

#### Step 2: MongoDB Configuration 🗄️
- **MongoDB URI**: Connection string to your MongoDB instance
  - Local: `mongodb://localhost:27017/asterisk-bot`
  - Remote: `mongodb://user:pass@host:port/database`

#### Step 3: Telegram Bot Configuration 🤖
- **Telegram Bot Token**: Get from [@BotFather](https://t.me/botfather)
  - Format: `123456789:ABCDEFGHIJKLmnopqrstuvwxyz`
- **Admin Telegram ID**: Your personal Telegram user ID
  - Get it from [@userinfobot](https://t.me/userinfobot)

#### Step 4: Asterisk Configuration 📞
- **Host**: Asterisk server address (default: `127.0.0.1`)
- **Port**: AMI port (default: `5038`)
- **Username**: AMI user (default: `bitcall`)
- **Password**: AMI password (default: `Anton123@`)

#### Step 5: Sound Files Configuration 🔊
Configure audio prompts for each agent context:
- **Coinbase**: Audio file to play for Coinbase calls
- **Apple**: Audio file to play for Apple calls
- **Bancocajamar**: Audio file to play for Bancocajamar calls

**Supported Formats:**
- MP3
- WAV
- OGG
- FLAC
- M4A (AAC)

The wizard automatically:
- ✅ Detects file format
- ✅ Converts to WAV (8kHz mono) if needed
- ✅ Copies to Asterisk sounds directory
- ✅ Sets proper permissions

#### Step 6: Configuration Update 📝
- Updates `config/index.js` with your settings
- Creates/updates `.env` if needed

#### Step 7: Dependency Installation 📦
- Runs `npm install`
- Installs all required Node.js packages

#### Step 8: Setup Summary 📊
- Shows all configured values
- Lists installed dependencies
- Provides next steps

## Configuration Details

### MongoDB Connection

```
mongodb://[username:password@]host[:port]/[database]
```

**Examples:**
```
Local development:
mongodb://localhost:27017/asterisk-bot

Atlas Cloud:
mongodb+srv://user:password@cluster.mongodb.net/asterisk-bot

Docker:
mongodb://mongo:27017/asterisk-bot
```

### Asterisk AMI Configuration

Make sure these are configured in `/etc/asterisk/manager.conf`:

```ini
[bitcall]
secret = Anton123@
read = all
write = all
```

### Sound Files

**Location:** `/var/lib/asterisk/sounds/en/`

**Naming Convention:**
- `coinbase.wav` - Coinbase intro
- `apple.wav` - Apple intro
- `bancocajamar.wav` - Bancocajamar intro

**Audio Specifications:**
- Format: WAV (PCM 16-bit)
- Sample Rate: 8000 Hz (8 kHz)
- Channels: Mono (1)
- Codec: PCM linear

**Audio Conversion:**
```bash
# Using FFmpeg (automatic in setup)
ffmpeg -i input.mp3 -ar 8000 -ac 1 -acodec pcm_s16le -f wav output.wav

# Using SoX
sox input.mp3 -r 8000 -c 1 -b 16 output.wav
```

## Manual Configuration

If you prefer to configure manually instead of using the wizard:

### 1. Create config/index.js

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

### 2. Place Sound Files

```bash
# Create sounds directory
sudo mkdir -p /var/lib/asterisk/sounds/en/

# Copy your sound files
sudo cp coinbase_intro.wav /var/lib/asterisk/sounds/en/coinbase.wav
sudo cp apple_intro.wav /var/lib/asterisk/sounds/en/apple.wav
sudo cp bancocajamar_intro.wav /var/lib/asterisk/sounds/en/bancocajamar.wav

# Set permissions
sudo chown asterisk:asterisk /var/lib/asterisk/sounds/en/*.wav
sudo chmod 644 /var/lib/asterisk/sounds/en/*.wav
```

### 3. Install Dependencies

```bash
npm install
```

## Troubleshooting

### "MongoDB connection failed"
- Verify MongoDB is running: `sudo systemctl status mongodb`
- Check connection string in config
- Verify database credentials

### "Telegram bot not responding"
- Verify bot token is correct
- Check internet connection
- Ensure bot has message permissions

### "Asterisk AMI connection failed"
- Verify Asterisk is running: `sudo systemctl status asterisk`
- Check AMI port (5038) is open: `sudo netstat -tlnp | grep 5038`
- Verify credentials in `/etc/asterisk/manager.conf`

### "Sound file format not supported"
- Ensure audio is MP3, WAV, OGG, FLAC, or M4A
- Install FFmpeg for automatic conversion
- Check file path is correct and readable

### "Permission denied" for sound files
```bash
# Fix Asterisk permissions
sudo chown -R asterisk:asterisk /var/lib/asterisk/sounds/
sudo chmod -R 755 /var/lib/asterisk/sounds/
```

## Verify Setup

### 1. Check Configuration
```bash
node -e "console.log(require('./config'))"
```

### 2. Test Database Connection
```bash
node -e "const mongoose = require('mongoose'); 
mongoose.connect(require('./config').mongodbUri).then(() => {
  console.log('✓ MongoDB connected');
  process.exit(0);
}).catch(err => {
  console.error('✗ MongoDB failed:', err.message);
  process.exit(1);
});"
```

### 3. Test Asterisk Connection
```bash
node -e "const { ami } = require('./asterisk/instance');
setTimeout(() => {
  console.log(ami.connected ? '✓ Asterisk AMI connected' : '✗ Asterisk AMI failed');
  process.exit(0);
}, 2000);"
```

### 4. Check Sound Files
```bash
ls -lah /var/lib/asterisk/sounds/en/*.wav
```

## Running the Bot

Once setup is complete:

```bash
# Development mode
npm run dev

# Production mode
node bin/www
```

## Next Steps

1. **Test with Telegram**
   - Send `/start` to your bot
   - Upload a test file with phone numbers

2. **Monitor Logs**
   - Watch console output for errors
   - Check Asterisk logs: `tail -f /var/log/asterisk/messages`

3. **Configure Agents**
   - Add agents via Telegram: `/add 16504668920 Agent Name`
   - Verify with `/agents` command

## Support

For issues or questions:
- Check logs in `/var/log/asterisk/`
- Review `SETUP_GUIDE.md` troubleshooting section
- Check project README.md

---

**Happy calling! 🎉**
