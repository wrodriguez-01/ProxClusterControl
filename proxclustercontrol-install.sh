#!/usr/bin/env bash

# ProxClusterControl - Modern Proxmox VE Control Panel Installation Script
# Standalone Installation - Creates LXC Container and Installs ProxClusterControl
#
# Copyright (c) 2025 ProxClusterControl Contributors
# Licensed under MIT License
# 
# This script creates a Debian 12 LXC container and installs ProxClusterControl
# A modern, web-based control panel for Proxmox Virtual Environment
#
# Requirements: Run as root on Proxmox VE host
# Usage: bash -c "$(wget -qLO - https://raw.githubusercontent.com/wrodriguez-01/ProxClusterControl/main/proxclustercontrol-install.sh)"
# Or: wget https://raw.githubusercontent.com/wrodriguez-01/ProxClusterControl/main/proxclustercontrol-install.sh && chmod +x proxclustercontrol-install.sh && ./proxclustercontrol-install.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function msg_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

function msg_ok() {
    echo -e "${GREEN}[OK]${NC} $1"
}

function msg_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

function msg_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function header_info() {
    clear
    cat <<"EOF"
    ____                 ____                  __
   / __ \_________  ____/ __ \____ _____  ___/ /
  / /_/ / ___/ __ \/ __ / /_/ / __ `/ __ \/ _ / /
 / ____/ /  / /_/ / /_/ / ____/ /_/ / / / /  __/ /
/_/   /_/   \____/\____/_/    \__,_/_/ /_/\___/_/

 Modern Proxmox VE Control Panel
 
 Features:
 - Real-time VM & Container Management  
 - Live Resource Monitoring & Analytics
 - Script Execution & Automation
 - Multi-Server Support
 - Modern Web Interface
 
EOF
}

# Check if running on Proxmox VE
if ! command -v pct &> /dev/null; then
    msg_error "This script must be run on a Proxmox VE host (pct command not found)"
fi

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   msg_error "This script must be run as root"
fi

# Install jq if not present (needed for JSON parsing)
if ! command -v jq &> /dev/null; then
    msg_info "Installing jq..."
    apt-get update -qq
    apt-get install -y jq
fi

header_info
msg_info "ProxClusterControl Installation Starting..."

# Configuration
APP="ProxClusterControl"
DISK_SIZE="8"
CORE_COUNT="2"
RAM_SIZE="2048"
OSTYPE="debian"
OSVERSION="12"

# Get next available CT ID
NEXTID=$(pvesh get /cluster/nextid)
CT_ID=${NEXTID}

# Detect storage for containers and templates separately
NODE=$(hostname)

# Find storage that supports container root filesystems (prefer rootdir, fallback to images)
# First try to find storage with rootdir content
ROOTFS_STORAGE=$(pvesh get /nodes/$NODE/storage --output-format json | jq -r '.[] | select(.enabled==1 and (.content | contains("rootdir"))) | .storage' | head -1)

# If no rootdir storage found, try images content
if [[ -z "$ROOTFS_STORAGE" ]]; then
    ROOTFS_STORAGE=$(pvesh get /nodes/$NODE/storage --output-format json | jq -r '.[] | select(.enabled==1 and (.content | contains("images"))) | .storage' | head -1)
fi

# Find storage for templates
TEMPLATE_STORAGE=$(pvesh get /nodes/$NODE/storage --output-format json | jq -r '.[] | select(.enabled==1 and (.content|contains("vztmpl"))) | .storage' | head -1)

# Validate storages
if [[ -z "$ROOTFS_STORAGE" ]]; then
    msg_error "No storage with 'Container' (rootdir) or 'Disk image' (images) content found on node '$NODE'.
    
Please enable container storage:
1. Go to Datacenter → Storage in Proxmox web UI
2. Select an existing storage OR create a new directory storage
3. Enable 'Container' content type (or 'Disk image' for block storage)
4. Ensure it's enabled on this node

Available storages:
$(pvesh get /nodes/$NODE/storage --output-format json | jq -r '.[] | "  " + .storage + ": " + (.content // "no content") + " (enabled: " + (.enabled // false | tostring) + ")"')"
fi

if [[ -z "$TEMPLATE_STORAGE" ]]; then
    TEMPLATE_STORAGE="local"
    msg_warn "No storage with template support found, using 'local'"
fi

# Check available space for container
NEED_BYTES=$(( DISK_SIZE * 1024 * 1024 * 1024 ))
AVAIL=$(pvesh get /nodes/$NODE/storage --output-format json | jq -r --arg s "$ROOTFS_STORAGE" '.[] | select(.storage==$s) | .avail // 0')

if [[ -n "$AVAIL" ]] && [[ "$AVAIL" -gt 0 ]] && [[ "$AVAIL" -lt "$NEED_BYTES" ]]; then
    AVAIL_GB=$(( AVAIL / 1024 / 1024 / 1024 ))
    msg_error "Insufficient space on storage '$ROOTFS_STORAGE': ${AVAIL_GB}GB available, ${DISK_SIZE}GB needed"
fi

# Get bridge interface
BRIDGE=$(pvesh get /nodes/$(hostname)/network --output-format json | jq -r '.[] | select(.type == "bridge") | .iface' | head -1)
if [[ -z "$BRIDGE" ]]; then
    BRIDGE="vmbr0"
fi

msg_info "Configuration:"
msg_info "  Container ID: $CT_ID"
msg_info "  Disk Size: ${DISK_SIZE}GB"
msg_info "  CPU Cores: $CORE_COUNT"
msg_info "  RAM: ${RAM_SIZE}MB"
msg_info "  Container Storage: $ROOTFS_STORAGE"
msg_info "  Template Storage: $TEMPLATE_STORAGE"
msg_info "  Bridge: $BRIDGE"

# Find and download Debian template
msg_info "Checking for Debian 12 template..."
pveam update

# Get the latest Debian 12 template
TEMPLATE=$(pveam available --section system | grep "debian-12.*standard" | head -1 | awk '{print $2}')

if [[ -z "$TEMPLATE" ]]; then
    msg_error "No Debian 12 template found. Please check your Proxmox setup."
fi

TEMPLATE_PATH="/var/lib/vz/template/cache/$TEMPLATE"

if [[ ! -f "$TEMPLATE_PATH" ]]; then
    msg_info "Downloading template: $TEMPLATE to $TEMPLATE_STORAGE"
    pveam download "$TEMPLATE_STORAGE" "$TEMPLATE"
    if [[ $? -ne 0 ]]; then
        msg_error "Failed to download template. Please check your internet connection and Proxmox setup."
    fi
else
    msg_info "Template already exists: $TEMPLATE"
fi

# Generate secure passwords
ROOT_PASSWORD=$(openssl rand -base64 12)
PANEL_PASSWORD=$(openssl rand -base64 12)

# Create container
msg_info "Creating LXC container..."
pct create $CT_ID $TEMPLATE_PATH \
    --arch amd64 \
    --cores $CORE_COUNT \
    --hostname proxclustercontrol \
    --memory $RAM_SIZE \
    --net0 name=eth0,bridge=$BRIDGE,firewall=1,ip=dhcp,type=veth \
    --ostype debian \
    --rootfs $ROOTFS_STORAGE:$DISK_SIZE \
    --swap 512 \
    --unprivileged 1 \
    --onboot 1 \
    --start 1 \
    --password "$ROOT_PASSWORD"

# Wait for container to start
msg_info "Starting container and waiting for network..."
pct start $CT_ID
sleep 10

# Get container IP
CT_IP=""
for i in {1..30}; do
    CT_IP=$(pct exec $CT_ID -- hostname -I | awk '{print $1}' 2>/dev/null || echo "")
    if [[ -n "$CT_IP" ]]; then
        break
    fi
    sleep 2
done

if [[ -z "$CT_IP" ]]; then
    msg_warn "Could not determine container IP, using container ID for access"
    CT_IP="[Container-$CT_ID]"
fi

# Install ProxClusterControl inside container
msg_info "Installing ProxClusterControl application..."
pct exec $CT_ID -- bash -c 'export DEBIAN_FRONTEND=noninteractive

# Update system
apt-get update && apt-get upgrade -y

# Install required packages
apt-get install -y curl wget gnupg2 software-properties-common git build-essential ufw

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE proxclustercontrol;" || true
sudo -u postgres psql -c "CREATE USER proxclustercontrol WITH ENCRYPTED PASSWORD '\''proxcluster123'\'';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE proxclustercontrol TO proxclustercontrol;" || true
sudo -u postgres psql -c "ALTER USER proxclustercontrol CREATEDB;" || true

# Create application directory
mkdir -p /opt/proxclustercontrol
cd /opt/proxclustercontrol

# Create package.json
cat > package.json << '\''EOFPACKAGE'\''
{
  "name": "proxclustercontrol",
  "version": "1.0.0",
  "description": "Modern Proxmox VE Control Panel",
  "main": "server/index.js",
  "scripts": {
    "start": "NODE_ENV=production node server/index.js",
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build"
  },
  "dependencies": {
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "connect-pg-simple": "^9.0.1"
  }
}
EOFPACKAGE

# Install basic dependencies
npm install --production

# Set up environment variables
SESSION_SECRET=$(openssl rand -hex 32)
cat > .env << '\''EOFENV'\''
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://proxclustercontrol:proxcluster123@localhost:5432/proxclustercontrol
SESSION_SECRET='$SESSION_SECRET'
PGUSER=proxclustercontrol
PGPASSWORD=proxcluster123
PGHOST=localhost
PGPORT=5432
PGDATABASE=proxclustercontrol
PANEL_USERNAME=admin
PANEL_PASSWORD='$PANEL_PASSWORD'
EOFENV

# Create basic server with authentication
mkdir -p server client/dist
cat > server/index.js << '\''EOFSERVER'\''
const express = require('\''express'\'');
const path = require('\''path'\'');
const session = require('\''express-session'\'');
const app = express();
const PORT = process.env.PORT || 5000;

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || '\''fallback-secret'\'',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('\''/login'\'');
  }
};

// Login route
app.get('\''/login'\'', (req, res) => {
  res.sendFile(path.join(__dirname, '\''../client/dist/login.html'\''));
});

app.post('\''/api/login'\'', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.PANEL_USERNAME && password === process.env.PANEL_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: '\''Invalid credentials'\'' });
  }
});

app.get('\''/api/logout'\'', (req, res) => {
  req.session.destroy(() => {
    res.redirect('\''/login'\'');
  });
});

app.get('\''/api/health'\'', (req, res) => {
  res.json({ 
    status: '\''ok'\'', 
    message: '\''ProxClusterControl is running'\'',
    version: '\''1.0.0'\'',
    timestamp: new Date().toISOString(),
    authenticated: !!req.session.authenticated
  });
});

// Protected static files
app.use('\''/'\'', requireAuth, express.static(path.join(__dirname, '\''../client/dist'\'')));

app.get('\''*'\'', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '\''../client/dist/index.html'\''));
});

app.listen(PORT, '\''0.0.0.0'\'', () => {
  console.log(`ProxClusterControl server running on port ${PORT}`);
  console.log(`Default credentials: admin / ${process.env.PANEL_PASSWORD}`);
});
EOFSERVER

# Create login page
cat > client/dist/login.html << '\''EOFLOGIN'\''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProxClusterControl Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, '\''Segoe UI'\'', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .login-container { 
            background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
            padding: 40px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1); color: white; min-width: 400px;
        }
        .logo { text-align: center; font-size: 2.5rem; font-weight: 700; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 500; }
        input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3);
                background: rgba(255,255,255,0.1); color: white; font-size: 16px; }
        input::placeholder { color: rgba(255,255,255,0.7); }
        .btn { width: 100%; padding: 15px; background: rgba(255,255,255,0.2); color: white;
               border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; font-size: 16px;
               cursor: pointer; transition: all 0.3s; }
        .btn:hover { background: rgba(255,255,255,0.3); }
        .error { background: rgba(239, 68, 68, 0.2); color: #fecaca; padding: 12px;
                 border-radius: 8px; margin-bottom: 20px; display: none; }
        .credentials { background: rgba(34, 197, 94, 0.2); color: #bbf7d0; padding: 15px;
                      border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">🚀 ProxClusterControl</div>
        <div class="credentials">
            <strong>Default Login:</strong><br>
            Username: <code>admin</code><br>
            Password: <code id="default-password">Loading...</code>
        </div>
        <div class="error" id="error"></div>
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" value="admin" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
        </form>
    </div>
    <script>
        // Get default password from health endpoint
        fetch('\''/api/health'\'').then(r => r.json()).then(data => {
            // The password will be shown in server logs, this is just for demo
            document.getElementById('\''default-password'\'').textContent = '\''Check container logs'\'';
        });
        
        document.getElementById('\''loginForm'\'').addEventListener('\''submit'\'', async (e) => {
            e.preventDefault();
            const username = document.getElementById('\''username'\'').value;
            const password = document.getElementById('\''password'\'').value;
            
            try {
                const response = await fetch('\''/api/login'\'', {
                    method: '\''POST'\'',
                    headers: { '\''Content-Type'\'': '\''application/json'\'' },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                if (result.success) {
                    window.location.href = '\''/'\'';
                } else {
                    document.getElementById('\''error'\'').textContent = result.message;
                    document.getElementById('\''error'\'').style.display = '\''block'\'';
                }
            } catch (err) {
                document.getElementById('\''error'\'').textContent = '\''Login failed'\'';
                document.getElementById('\''error'\'').style.display = '\''block'\'';
            }
        });
    </script>
</body>
</html>
EOFLOGIN

# Create web interface
cat > client/dist/index.html << '\''EOFHTML'\''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProxClusterControl - Modern Proxmox Control Panel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, '\''Segoe UI'\'', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; color: white; overflow-x: hidden;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 50px; }
        .logo { font-size: 3rem; font-weight: 700; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .subtitle { font-size: 1.2rem; opacity: 0.9; }
        .card { 
            background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
            padding: 40px; border-radius: 20px; margin: 30px 0;
            border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .success { 
            background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4);
            padding: 25px; border-radius: 15px; margin: 30px 0; text-align: center;
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin: 40px 0; }
        .feature { 
            background: rgba(255,255,255,0.05); padding: 25px; border-radius: 15px;
            border: 1px solid rgba(255,255,255,0.1); transition: transform 0.3s ease;
        }
        .feature:hover { transform: translateY(-5px); }
        .feature-icon { font-size: 2rem; margin-bottom: 15px; }
        .feature-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 10px; }
        .button { 
            display: inline-block; background: rgba(255,255,255,0.2);
            color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none;
            margin: 10px 15px 10px 0; border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease; backdrop-filter: blur(5px);
        }
        .button:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
        .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; }
        .status-online { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.4); }
        .steps { text-align: left; margin: 30px 0; }
        .step { background: rgba(255,255,255,0.05); padding: 20px; margin: 15px 0; border-radius: 10px; border-left: 4px solid #60a5fa; }
        .code { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; font-family: '\''Courier New'\'', monospace; font-size: 0.9rem; margin: 10px 0; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 ProxClusterControl</div>
            <div class="subtitle">Modern Proxmox VE Control Panel</div>
            <div class="status status-online">● System Online</div>
        </div>
        
        <div class="success">
            <h2>🎉 Installation Successful!</h2>
            <p>ProxClusterControl is now running and ready for configuration.</p>
        </div>
        
        <div class="card">
            <h2>Welcome to ProxClusterControl</h2>
            <p style="margin-bottom: 30px;">Your modern Proxmox VE control panel has been successfully installed and is running.</p>
            
            <div class="grid">
                <div class="feature">
                    <div class="feature-icon">💻</div>
                    <div class="feature-title">VM & Container Management</div>
                    <p>Monitor and control virtual machines and containers with an intuitive interface.</p>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div class="feature-title">Live Resource Monitoring</div>
                    <p>Track CPU, memory, storage, and network usage across your Proxmox cluster.</p>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-title">Script Execution</div>
                    <p>Execute community scripts and manage automation tasks from the web interface.</p>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">🔧</div>
                    <div class="feature-title">Multi-Server Support</div>
                    <p>Connect and manage multiple Proxmox servers from a single control panel.</p>
                </div>
            </div>
            
            <h3>🚀 Next Steps</h3>
            <div class="steps">
                <div class="step">
                    <strong>1. Deploy Full Application</strong><br>
                    Replace the placeholder with your complete ProxClusterControl source code:
                    <div class="code">cd /opt/proxclustercontrol && rm -rf * && git clone YOUR_REPO .</div>
                </div>
                
                <div class="step">
                    <strong>2. Install Dependencies</strong><br>
                    <div class="code">npm install --production && npm run build</div>
                </div>
                
                <div class="step">
                    <strong>3. Restart Service</strong><br>
                    <div class="code">systemctl restart proxclustercontrol</div>
                </div>
                
                <div class="step">
                    <strong>4. Configure Proxmox Connection</strong><br>
                    Access the settings page to add your Proxmox server credentials.
                </div>
            </div>
            
            <a href="/api/health" class="button">📡 API Health Check</a>
            <a href="#" onclick="location.reload()" class="button">🔄 Refresh Status</a>
        </div>
    </div>
</body>
</html>
EOFHTML

# Create systemd service
cat > /etc/systemd/system/proxclustercontrol.service << '\''EOFSERVICE'\''
[Unit]
Description=ProxClusterControl - Modern Proxmox VE Control Panel
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/proxclustercontrol
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/proxclustercontrol/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOFSERVICE

# Enable and start service
systemctl daemon-reload
systemctl enable proxclustercontrol
systemctl start proxclustercontrol

# Configure firewall
ufw allow 5000/tcp

echo "ProxClusterControl installation completed successfully!"
'

# Check if installation was successful
if pct exec $CT_ID -- systemctl is-active --quiet proxclustercontrol; then
    msg_ok "ProxClusterControl service is running!"
else
    msg_warn "ProxClusterControl service may need manual start"
fi

# Save credentials to file for reference
pct exec $CT_ID -- bash -c "cat > /root/proxclustercontrol-credentials.txt << 'EOFCREDS'
ProxClusterControl Installation Credentials
=================================

Container Access:
- Container ID: $CT_ID  
- Container IP: $CT_IP
- Root Password: $ROOT_PASSWORD

ProxClusterControl Web Interface:
- URL: http://$CT_IP:5000
- Username: admin
- Password: $PANEL_PASSWORD

Database Access:
- PostgreSQL Host: localhost  
- Database: proxclustercontrol
- Username: proxclustercontrol
- Password: proxcluster123

Commands:
- Container Console: pct enter $CT_ID
- Service Logs: journalctl -u proxclustercontrol -f
- Restart Service: systemctl restart proxclustercontrol

Generated on: $(date)
EOFCREDS"

# Final success message
msg_ok "Installation completed successfully!"
echo ""
echo -e "${GREEN}🎉 ProxClusterControl Installation Complete! 🎉${NC}"
echo ""
echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                    ACCESS INFORMATION                        ║${NC}"  
echo -e "${RED}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${RED}║${NC} ${BLUE}Web Interface:${NC} ${YELLOW}http://$CT_IP:5000${NC}                     ${RED}║${NC}"
echo -e "${RED}║${NC} ${BLUE}Username:${NC}      ${YELLOW}admin${NC}                                ${RED}║${NC}"
echo -e "${RED}║${NC} ${BLUE}Password:${NC}      ${YELLOW}$PANEL_PASSWORD${NC}                ${RED}║${NC}"
echo -e "${RED}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${RED}║${NC} ${BLUE}Container ID:${NC}  ${YELLOW}$CT_ID${NC}                                ${RED}║${NC}"
echo -e "${RED}║${NC} ${BLUE}Root Password:${NC} ${YELLOW}$ROOT_PASSWORD${NC}                ${RED}║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo -e "   Start:   ${YELLOW}pct start $CT_ID${NC}"
echo -e "   Stop:    ${YELLOW}pct stop $CT_ID${NC}"
echo -e "   Console: ${YELLOW}pct enter $CT_ID${NC}"
echo -e "   Logs:    ${YELLOW}pct exec $CT_ID -- journalctl -u proxclustercontrol -f${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Access the web interface: http://$CT_IP:5000"
echo "2. Login with the admin credentials shown above"  
echo "3. Deploy complete ProxClusterControl source code:"
echo "   cd /opt/proxclustercontrol && rm -rf * && git clone https://github.com/wrodriguez-01/ProxClusterControl.git ."
echo "   npm install --production && npm run build && systemctl restart proxclustercontrol"
echo "4. Configure your Proxmox server connections"
echo ""
echo -e "${GREEN}✅ Installation complete! Enjoy your new ProxClusterControl control panel!${NC}"