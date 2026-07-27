# ⚡ Quick Reference Guide

Fast lookup for common commands and configurations.

## Setup Commands

```bash
# Run interactive setup wizard
npm run setup

# Verify installation
npm run verify

# Start development server
npm run dev

# Start production server
npm start
```

## MongoDB Commands

```bash
# Check status
sudo systemctl status mongodb

# Start/stop MongoDB
sudo systemctl start mongodb
sudo systemctl stop mongodb

# Connect to database
mongo mongodb://localhost:27017/asterisk-bot

# List databases
mongo --eval "db.adminCommand('listDatabases')"
```

## Asterisk Commands

```bash
# Check Asterisk status
sudo systemctl status asterisk

# Reload Asterisk
sudo asterisk -rx "reload"

# Reload manager
sudo asterisk -rx "manager reload"

# Show manager users
sudo asterisk -rx "manager show users"

# Show dialplan
sudo asterisk -rx "dialplan show"

# Show active calls
sudo asterisk -rx "core show calls"

# Verbose console output
sudo asterisk -r

# Exit console
exit
```

## Sound File Management

```bash
# List sound files
ls -lah /var/lib/asterisk/sounds/en/

# Check file format
file /var/lib/asterisk/sounds/en/coinbase.wav

# Set permissions
sudo chown asterisk:asterisk /var/lib/asterisk/sounds/en/*.wav
sudo chmod 644 /var/lib/asterisk/sounds/en/*.wav

# Convert audio to WAV
ffmpeg -i input.mp3 -ar 8000 -ac 1 -acodec pcm_s16le output.wav

# Copy sound file
sudo cp coinbase_intro.wav /var/lib/asterisk/sounds/en/coinbase.wav
```

## Logs

```bash
# View application logs
npm run dev

# View Asterisk logs
sudo tail -f /var/log/asterisk/messages

# View specific lines
sudo tail -n 100 /var/log/asterisk/messages

# Search logs
sudo grep "ERROR" /var/log/asterisk/messages

# Clear logs
sudo truncate -s 0 /var/log/asterisk/messages
```

## PM2 (Production Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start bot with PM2
pm2 start bin/www --name "asterisk-bot"

# View PM2 logs
pm2 logs asterisk-bot

# Stop bot
pm2 stop asterisk-bot

# Restart bot
pm2 restart asterisk-bot

# Remove from PM2
pm2 delete asterisk-bot

# View all processes
pm2 list

# Monitor resources
pm2 monit

# Save config
pm2 save

# Startup on reboot
pm2 startup
```

## Configuration

### MongoDB URI Examples

```
Local:
mongodb://localhost:27017/asterisk-bot

With auth:
mongodb://user:password@localhost:27017/asterisk-bot

Atlas Cloud:
mongodb+srv://user:password@cluster.mongodb.net/asterisk-bot

Docker:
mongodb://mongo:27017/asterisk-bot
```

### Telegram Bot Setup

```
1. Open @BotFather
2. Send /newbot
3. Follow prompts
4. Copy bot token
5. Send bot token to npm run setup
```

### Get Telegram Admin ID

```
1. Open @userinfobot
2. Forward any message from your bot
3. Copy User ID
4. Use in npm run setup
```

## Asterisk Configuration Locations

```
Manager config:     /etc/asterisk/manager.conf
Dialplan config:    /etc/asterisk/extensions.conf
PJSIP config:       /etc/asterisk/pjsip.conf
Sound files:        /var/lib/asterisk/sounds/en/
Logs:               /var/log/asterisk/
```

## Database Collections

```
Collections created by app:
- agents       (agent information)
- calls        (call records)
- alloweds     (permitted users)
```

## Environment Variables

```bash
# Create .env file
cp .env.example .env

# Edit as needed
nano .env

# Load in application
require('dotenv').config()
```

## Network Ports

```
Node.js:     3000  (application)
MongoDB:     27017 (database)
Asterisk:    5038  (AMI)
SIP:         5060  (VoIP signaling)
RTP:         10000-20000 (voice media)
```

## Firewall Rules

```bash
# Allow ports on UFW
sudo ufw allow 3000/tcp
sudo ufw allow 5038/tcp
sudo ufw allow 5060/tcp
sudo ufw allow 5060/udp
sudo ufw allow 10000:20000/udp

# Check UFW status
sudo ufw status

# Enable UFW
sudo ufw enable
```

## System Monitoring

```bash
# CPU and memory usage
top

# Disk usage
df -h

# Network connections
netstat -tlnp

# Process info
ps aux | grep asterisk

# Memory usage
free -h

# System load
uptime
```

## Common Issues & Fixes

### MongoDB not starting
```bash
sudo systemctl restart mongodb
sudo systemctl status mongodb
```

### Asterisk not connecting
```bash
sudo systemctl restart asterisk
sudo asterisk -rx "manager reload"
```

### Sound files not found
```bash
sudo chown -R asterisk:asterisk /var/lib/asterisk/sounds/
sudo chmod -R 755 /var/lib/asterisk/sounds/
```

### Permission denied errors
```bash
# Fix file ownership
sudo chown -R $USER:$USER /opt/asterisk-bot

# Fix Asterisk directories
sudo chown -R asterisk:asterisk /var/lib/asterisk/
```

### High CPU usage
```bash
# Check process
ps aux | grep node

# Reduce concurrent calls in config
concurrentCalls: 10

# Restart bot
npm run dev
```

## Testing Commands

```bash
# Test MongoDB connection
node -e "const mongoose = require('mongoose');
mongoose.connect(require('./config').mongodbUri)
  .then(() => console.log('✓ MongoDB'))
  .catch(e => console.error('✗', e.message))"

# Test Telegram bot token
curl -s https://api.telegram.org/bot<TOKEN>/getMe | jq

# Test Asterisk AMI
telnet localhost 5038

# Test network connectivity
ping 8.8.8.8

# Test DNS
nslookup api.telegram.org
```

## System Backup

```bash
# Backup database
mongodump --uri "mongodb://localhost:27017/asterisk-bot" \
  --archive=asterisk-bot-backup.archive

# Backup config
cp -r config/ config-backup/

# Backup sound files
cp -r /var/lib/asterisk/sounds/en/ sounds-backup/
```

## System Restore

```bash
# Restore database
mongorestore --archive=asterisk-bot-backup.archive

# Restore config
cp -r config-backup/* config/

# Restore sound files
sudo cp -r sounds-backup/* /var/lib/asterisk/sounds/en/
```

## Useful Aliases

Add to `~/.bashrc`:

```bash
alias astlog='sudo tail -f /var/log/asterisk/messages'
alias astcli='sudo asterisk -r'
alias mongosh='mongo mongodb://localhost:27017/asterisk-bot'
alias botdev='cd /opt/asterisk-bot && npm run dev'
alias botstart='pm2 start asterisk-bot'
alias botstop='pm2 stop asterisk-bot'
alias botrestart='pm2 restart asterisk-bot'
alias botlogs='pm2 logs asterisk-bot'
```

## Help & Support

```bash
# Show help
npm run setup -- --help

# Verify setup
npm run verify

# Check logs
npm run dev

# View documentation
cat SETUP_GUIDE.md
cat INSTALLATION.md
cat QUICK_REFERENCE.md
```

---

**Last Updated**: 2024
**Version**: 1.0.0

For detailed information, see:
- SETUP_GUIDE.md - Complete setup instructions
- INSTALLATION.md - Full installation guide
- README.md - Project overview
