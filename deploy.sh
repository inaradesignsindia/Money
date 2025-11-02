
#!/bin/bash

# ==============================================================================
# AI SCALPING SYSTEM - FULL STACK DEPLOYMENT SCRIPT FOR GCP (UBUNTU 22.04)
# ==============================================================================
# This script automates the setup of the entire trading system on a fresh
# Google Cloud e2-micro VM, including:
#   1. System dependencies (Python, Node.js, Nginx, SQLite).
#   2. Python backend services (Flask, Feature Engine, Signal Generator).
#   3. React frontend application build and deployment.
#   4. Nginx configuration as a reverse proxy and static file server.
#   5. systemd service configuration for robust process management.
#   6. Cron jobs for database maintenance and backups.
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
PROJECT_DIR="/home/$USER/trading_system"
FRONTEND_DIR="$PROJECT_DIR/frontend" # Directory for React app source
REPO_URL="https://github.com/your-repo/trading-system.git" # CHANGE THIS

echo "========================================"
echo "Starting Full Stack HF Trading System Deployment"
echo "Project Directory: $PROJECT_DIR"
echo "========================================"

# --- 1. System Preparation & Dependency Installation ---
echo "[1/10] Updating system and installing core dependencies..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
sudo apt-get install -y python3.10-venv python3-pip sqlite3 nginx curl git

echo "[2/10] Installing Node.js (for React build)..."
# Using NodeSource repository for a modern version of Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# --- 2. Project Setup ---
echo "[3/10] Cloning project from repository..."
# git clone "$REPO_URL" "$PROJECT_DIR"
# As we don't have a repo, we'll create the directories.
# In a real scenario, you would uncomment the git clone line above.
mkdir -p "$PROJECT_DIR"
mkdir -p "$FRONTEND_DIR"
mkdir -p "$PROJECT_DIR/gcp_vm"
mkdir -p "$PROJECT_DIR/scripts"
mkdir -p "$PROJECT_DIR/logs"
echo "NOTE: In a real deployment, you would 'git clone' your project here."
echo "Please upload your project files to $PROJECT_DIR"
# A short pause to allow for manual file upload in a guided setup
# read -p "Upload your files now, then press [Enter] to continue..."

# --- 3. Python Backend Setup ---
echo "[4/10] Setting up Python virtual environment and installing dependencies..."
cd "$PROJECT_DIR/gcp_vm"
python3 -m venv venv
source venv/bin/activate
pip install --no-cache-dir -r requirements.txt
deactivate

echo "[5/10] Initializing SQLite database..."
# Assumes init_db.sql and other scripts are in the 'scripts' subfolder
sqlite3 "$PROJECT_DIR/trading_system.db" < "$PROJECT_DIR/scripts/init_db.sql"
sudo chown -R $USER:$USER "$PROJECT_DIR"

# --- 4. React Frontend Build ---
echo "[6/10] Building the React frontend application..."
cd "$FRONTEND_DIR"
npm install
# This assumes a standard React setup with a build script in package.json
# e.g., "build": "vite build" or "build": "react-scripts build"
npm run build # This creates a 'dist' or 'build' folder
# For this project, we'll assume the output is 'dist'
echo "Frontend build complete. Static files are in $FRONTEND_DIR/dist"

# --- 5. Nginx Configuration ---
echo "[7/10] Configuring Nginx as a reverse proxy..."
sudo rm -f /etc/nginx/sites-enabled/default

sudo tee /etc/nginx/sites-available/trading_system > /dev/null <<EOF
server {
    listen 80;
    server_name _; # Listen on all hostnames

    # Path for React static files
    root $FRONTEND_DIR/dist;
    index index.html;

    # Serve static files directly
    location / {
        try_files \$uri /index.html;
    }

    # Reverse proxy for API calls
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Reverse proxy for Server-Sent Events (SSE)
    location /api/dashboard/stream {
        proxy_pass http://127.0.0.1:5000/api/dashboard/stream;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$host;
        proxy_buffering off; # Important for SSE
        proxy_cache off;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/trading_system /etc/nginx/sites-enabled/
sudo nginx -t # Test configuration
sudo systemctl restart nginx

# --- 6. Systemd Service Setup ---
echo "[8/10] Creating systemd services for backend processes..."
# Flask API service
sudo tee /etc/systemd/system/trading-api.service > /dev/null <<EOF
[Unit]
Description=Trading System Flask API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/gcp_vm
ExecStart=$PROJECT_DIR/gcp_vm/venv/bin/python3 app.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Feature Engine service
sudo tee /etc/systemd/system/feature-engine.service > /dev/null <<EOF
[Unit]
Description=Trading System Feature Engine
After=trading-api.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/gcp_vm
ExecStart=$PROJECT_DIR/gcp_vm/venv/bin/python3 feature_engine.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Signal Generator service
sudo tee /etc/systemd/system/signal-generator.service > /dev/null <<EOF
[Unit]
Description=Trading System Signal Generator
After=feature-engine.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/gcp_vm
ExecStart=$PROJECT_DIR/gcp_vm/venv/bin/python3 signal_generator.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "Enabling and starting services..."
sudo systemctl daemon-reload
sudo systemctl enable trading-api.service feature-engine.service signal-generator.service
sudo systemctl start trading-api.service feature-engine.service signal-generator.service

# --- 7. Cron Job Setup ---
echo "[9/10] Setting up cron jobs for maintenance..."
(crontab -l 2>/dev/null; echo "0 * * * * $PROJECT_DIR/gcp_vm/venv/bin/python3 $PROJECT_DIR/scripts/cleanup_ticks.py >> $PROJECT_DIR/logs/cleanup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * 0 $PROJECT_DIR/gcp_vm/venv/bin/python3 $PROJECT_DIR/scripts/archive_trades.py >> $PROJECT_DIR/logs/archive.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * 0 $PROJECT_DIR/gcp_vm/venv/bin/python3 $PROJECT_DIR/scripts/retrain_model.py >> $PROJECT_DIR/logs/retrain.log 2>&1") | crontab -
echo "Cron jobs installed."

# --- 8. Firewall Configuration ---
echo "[10/10] Configuring firewall..."
sudo ufw allow 'Nginx Full' # Allows HTTP and HTTPS
sudo ufw --force enable

# --- Deployment Summary ---
PUBLIC_IP=$(curl -s ifconfig.me)
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "Dashboard accessible at: http://$PUBLIC_IP"
echo "API endpoints available under: http://$PUBLIC_IP/api/"
echo ""
echo "Service Status:"
sudo systemctl is-active trading-api.service
sudo systemctl is-active feature-engine.service
sudo systemctl is-active signal-generator.service
echo ""
echo "Next Steps:"
echo "1. Navigate to http://$PUBLIC_IP in your browser."
echo "2. Go to the 'Settings' page and configure all parameters, especially API keys."
echo "3. Configure your MT4 Expert Advisor to point to http://$PUBLIC_IP"
echo "4. Start the EA and monitor the dashboard for live data."
echo ""
echo "Log files are located in: $PROJECT_DIR/logs/"
echo "========================================"
