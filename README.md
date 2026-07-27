# Asterisk SIP Configuration

This guide helps you set up Asterisk for SIP communication with basic configuration files. Follow the steps below to configure your SIP settings.

---

## Prerequisites

- Ubuntu VPS (20.04 or 22.04)
- SSH Access
- At least 2GB RAM
- root or sudo access

---

## Step 1: Connect to VPS

```bash
ssh username@IP
```

---

## step 2: Update System and Install Dependencies

```bash
apt update && apt upgrade -y

apt install -y build-essential wget curl git uuid-dev libjansson-dev \
               libxml2-dev libsqlite3-dev libssl-dev pkg-config \
               subversion libedit-dev
```

---

## Step 3: Install Asterisk

```bash
cd /usr/src

wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz

tar -xzvf asterisk-20-current.tar.gz
cd asterisk-20*/

contrib/scripts/install_prereq install

./configure --with-jansson-bundled

make -j$(nproc)

make install
make samples
make config

make install-logrotate
```

---

## Step 4: Create Asterisk user and set Permissions

```bash
useradd -r -d /var/lib/asterisk -s /usr/sbin/nologin asterisk

chown -R asterisk:asterisk /etc/asterisk
chown -R asterisk:asterisk /var/{lib,log,spool}/asterisk
chown -R asterisk:asterisk /usr/lib/asterisk

sed -i 's/#AST_USER="asterisk"/AST_USER="asterisk"/' /etc/default/asterisk
sed -i 's/#AST_GROUP="asterisk"/AST_GROUP="asterisk"/' /etc/default/asterisk
```

---

## Step 5: Start and Enable Asterisk Service

```bash
systemctl start asterisk
systemctl enable asterisk
systemctl status asterisk
asterisk -rx "core show version"
```

you should see something like: `asterisk 20.x.x built by root @ ...`

---

## Step 6: Upload your project files

**From your windows pc**, upload the P1 folder to VPS:

### Option A: Using SCP (from windows powershell)

```powershell
scp -r "path\to\P1\folder" root@IP:/root/
```

### Option B: Using winscp or filezilla

- download winscp: https://winscp.net/
- connect to your vps
- drag and drop the `P1` folder to `/root/`

### Option C: Using git

```bash
# on vps
cd /root
git clone YOUR_REPO_URL
```

---

## Step 7: Copy Asterisk configuration files

```bash
# on vps
cd /root/P1

cp /etc/asterisk/pjsip.conf /etc/asterisk/pjsip.conf.backup
cp /etc/asterisk/manager.conf /etc/asterisk/manager.conf.backup
cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.backup

cp asterisk-config/pjsip.conf /etc/asterisk/pjsip.conf
cp asterisk-config/manager.conf /etc/asterisk/manager.conf
cp asterisk-config/extensions.conf /etc/asterisk/extensions.conf

chown asterisk:asterisk /etc/asterisk/*.conf
chmod 640 /etc/asterisk/*.conf
```

---

## Step 8: Copy sound files to Asterisk

```bash
# on vps
cd /root/P1

# convert audio files into wav format (https://wiki.kolmisoft.com/index.php/Convert_WAV_file_to_Asterisk_playable_format)
cp "sounds (put in asterisk)"/*.wav /var/lib/asterisk/sounds/

# set permissions
chown asterisk:asterisk /var/lib/asterisk/sounds/*.wav
chmod 644 /var/lib/asterisk/sounds/*.wav

# verify files are there
ls -lh /var/lib/asterisk/sounds/ | grep -E "(coinbase|google|uphold|cb|v6)"
```

---

## Step 9: Reload Asterisk to apply configs

```bash
# reload asterisk
asterisk -rx "core reload"

# verify ami is enabled
asterisk -rx "manager show users"

# verify sip peer
asterisk -rx "sip show peers"

# verify dialplan contexts
asterisk -rx "dialplan show"
```

---

## step 10: install node.js

```bash
# install node.js 20 (lts)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# verify
node --version
npm --version
```

---

## Step 11: install pm2 (process manager)

```bash
npm install -g pm2

# verify
pm2 --version
```

---

## Step 12: Set up your node.js application

```bash
# go to project directory
cd /root/P1

# install dependencies
npm install

# After npm install, also install these if missing
npm install -g pm2
npm install ami mongodb axios

# Install unzip (required for bun)
apt install unzip -y

# Install bun
curl -fsSL https://bun.sh/install | bash

# Source it
source /root/.bashrc

# verify config
nano config/index.js
```

---

## Step 13: Start your Application with pm2

```bash
cd /root/p1

# start the app
pm2 start ./bin/www --name p1-dialer --interpreter node

# save pm2 process list
pm2 save

# enable pm2 to start on boot
pm2 startup
# run the command it outputs

# check status
pm2 status
pm2 logs p1-dialer
```

---

## step 14: configure firewall

```bash
# allow ssh (important - don't lock yourself out!)
ufw allow 22/tcp

# allow web access (for your app)
ufw allow 3000/tcp

# allow sip (for outbound calls)
ufw allow 5060/udp

# Allow ami port (only if you need external access - not recommended)
# ufw allow 5038/tcp

# enable firewall
ufw enable

# check status
ufw status
```

---

## SIP Configuration (`pjsip.conf`)

```ini
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060
external_media_address=121.127.33.217
external_signaling_address=121.127.33.217
local_net=121.127.33.217/32

[transport-tcp]
type=transport
protocol=tcp
bind=0.0.0.0:5060

[bitcall-endpoint]
type=endpoint
context=outbound-coinbase
aors=bitcall-aor
auth=bitcall-auth
outbound_auth=bitcall-auth
disallow=all
allow=ulaw
allow=alaw
dtmf_mode=rfc4733
transport=transport-udp
force_rport=yes
rewrite_contact=yes
rtp_symmetric=yes
direct_media=no
from_user=melapela
from_domain=gateway.bitcall.io
trust_id_outbound=yes
send_rpid=yes
send_pai=yes

[bitcall-auth]
type=auth
auth_type=userpass
username=melapela
password=Anton123@

[bitcall-aor]
type=aor
contact=sip:gateway.bitcall.io:5060
max_contacts=1
qualify_frequency=0

[bitcall-reg]
type=registration
outbound_auth=bitcall-auth
server_uri=sip:gateway.bitcall.io:5060
client_uri=sip:melapela@121.127.33.217:5060
contact_user=melapela
expiration=3600
retry_interval=60

[bitcall-id]
type=identify
endpoint=bitcall-endpoint
match=gateway.bitcall.io
```

## SIP Extension (`extensions.conf`)

```ini
[general]
autofallthrough=yes

[outbound-coinbase]
exten => _X.,1,Answer()
exten => _X.,n,Progress()
exten => _X.,n,Playback(coinbaseintro)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(60)
exten => 1,2,Hangup()

[outbound-apple]
exten => _X.,1,Answer()
exten => _X.,n,Progress()
exten => _X.,n,Playback(appleintro)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
exten => 1,1,Wait(60)
exten => 1,2,Hangup()

[transfer-to-agent]
exten => _X.,1,Dial(PJSIP/${EXTEN}@bitcall-endpoint,60)
exten => _X.,n,Hangup()

[outbound-bancocajamar]
exten => _X.,1,Answer()
exten => _X.,n,Progress()
exten => _X.,n,Playback(bancocajamar)
exten => _X.,n,WaitExten(10)
exten => _X.,n,Hangup()
```

## SIP Manager (`manager.conf`)

```ini
[general]
enabled=yes
port=5038
bindaddr=127.0.0.1
tlsenable=no

[bitcall]
secret=Anton123@
read=all
write=all
```

## NodeJS Bot Config (`/config/index.js`)

```
module.exports = {
  mongodb_uri: "mongodb://user:pass@server:port/",
  telegram_bot_token: "token",
  creator_telegram_id: "userId",
  concurrent_calls: 30,
  agents: [
    "coinbase",
    "apple"
  ],
  asterisk: {
    host: "127.0.0.1", // since asterisk is on local host
    port: 5038,
    username: "",
    password: "",
  },
};
```

ALL SOUND FILES GO IN /var/lib/asterisk/sounds/
All WAV files should be mono, 8000Hz sample rate, 16 bits.

IF HAVING TROUBLE WITH ASTERISKS FILE FORMATS https://wiki.kolmisoft.com/index.php/Convert_WAV_file_to_Asterisk_playable_format
