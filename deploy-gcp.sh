#!/bin/bash

# ==============================================================================
# AI SCALPING SYSTEM - COMPLETE GCP DEPLOYMENT SCRIPT
# ==============================================================================
# This script automates the complete deployment of the AI trading system to GCP
# including VM setup, Docker deployment, and system configuration.
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
PROJECT_NAME="ai-scalping-system"
ZONE="us-central1-a"
MACHINE_TYPE="e2-micro"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
FIREWALL_RULE_NAME="allow-trading-system"
REPO_URL="https://github.com/inaradesignsindia/Money.git"

# --- Colors for output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "AI Scalping System - GCP Deployment"
echo -e "========================================${NC}"

# --- 1. Create GCP VM Instance ---
echo -e "${YELLOW}[1/8] Creating GCP VM instance...${NC}"

VM_NAME="${PROJECT_NAME}-$(date +%s)"
echo "Creating VM: $VM_NAME"

gcloud compute instances create $VM_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=30GB \
    --boot-disk-type=pd-standard \
    --tags=http-server,https-server \
    --metadata startup-script="#!/bin/bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker \$USER
echo 'Docker installed and configured'"

echo -e "${GREEN}VM created successfully: $VM_NAME${NC}"

# Get VM external IP
VM_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="get(networkInterfaces[0].accessConfigs[0].natIP)")
echo -e "${GREEN}VM External IP: $VM_IP${NC}"

# --- 2. Configure Firewall ---
echo -e "${YELLOW}[2/8] Configuring firewall rules...${NC}"

# Check if firewall rule exists, create if not
if ! gcloud compute firewall-rules describe $FIREWALL_RULE_NAME &>/dev/null; then
    gcloud compute firewall-rules create $FIREWALL_RULE_NAME \
        --allow tcp:80,tcp:443,tcp:5000 \
        --target-tags=http-server,https-server \
        --description="Allow HTTP, HTTPS and API access for trading system"
    echo -e "${GREEN}Firewall rule created${NC}"
else
    echo -e "${BLUE}Firewall rule already exists${NC}"
fi

# --- 3. Wait for VM to be ready ---
echo -e "${YELLOW}[3/8] Waiting for VM to be ready...${NC}"
sleep 60

# Test SSH connection
echo "Testing SSH connection..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="echo 'VM is ready'" --quiet

# --- 4. Deploy Application ---
echo -e "${YELLOW}[4/8] Deploying application to VM...${NC}"

# Copy deployment script to VM
gcloud compute scp deploy-vm.sh $VM_NAME:~ --zone=$ZONE --quiet

# Execute deployment on VM
echo "Running deployment script on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="chmod +x deploy-vm.sh && ./deploy-vm.sh" --quiet

# --- 5. Configure Nginx ---
echo -e "${YELLOW}[5/8] Configuring Nginx reverse proxy...${NC}"

gcloud compute ssh $VM_NAME --zone=$ZONE --command="
sudo tee /etc/nginx/sites-available/trading-system > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # React app static files
    root /home/\$USER/trading_system/frontend/build;
    index index.html;

    # Handle React Router
    location / {
        try_files \$uri /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # SSE proxy
    location /api/dashboard/stream {
        proxy_pass http://127.0.0.1:5000/api/dashboard/stream;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$host;
        proxy_buffering off;
        proxy_cache off;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/trading-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
" --quiet

# --- 6. Setup SSL (Let's Encrypt) ---
echo -e "${YELLOW}[6/8] Setting up SSL certificate...${NC}"

gcloud compute ssh $VM_NAME --zone=$ZONE --command="
sudo apt-get install -y certbot python3-certbot-nginx
# Note: SSL setup requires a domain name
# sudo certbot --nginx -d your-domain.com
echo 'SSL setup skipped - requires domain name'
" --quiet

# --- 7. Create systemd services ---
echo -e "${YELLOW}[7/8] Creating systemd services...${NC}"

gcloud compute ssh $VM_NAME --zone=$ZONE --command="
# Create API service
sudo tee /etc/systemd/system/trading-api.service > /dev/null <<EOF
[Unit]
Description=Trading System Flask API
After=network.target

[Service]
Type=simple
User=\$USER
WorkingDirectory=/home/\$USER/trading_system/backend
ExecStart=/home/\$USER/trading_system/backend/venv/bin/python3 app.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create feature engine service
sudo tee /etc/systemd/system/feature-engine.service > /dev/null <<EOF
[Unit]
Description=Trading System Feature Engine
After=trading-api.service

[Service]
Type=simple
User=\$USER
WorkingDirectory=/home/\$USER/trading_system/backend
ExecStart=/home/\$USER/trading_system/backend/venv/bin/python3 feature_engine.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create signal generator service
sudo tee /etc/systemd/system/signal-generator.service > /dev/null <<EOF
[Unit]
Description=Trading System Signal Generator
After=feature-engine.service

[Service]
Type=simple
User=\$USER
WorkingDirectory=/home/\$USER/trading_system/backend
ExecStart=/home/\$USER/trading_system/backend/venv/bin/python3 signal_generator.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable trading-api.service feature-engine.service signal-generator.service
sudo systemctl start trading-api.service feature-engine.service signal-generator.service
" --quiet

# --- 8. Setup monitoring and backups ---
echo -e "${YELLOW}[8/8] Setting up monitoring and maintenance...${NC}"

gcloud compute ssh $VM_NAME --zone=$ZONE --command="
# Create backup script
mkdir -p /home/\$USER/backups

tee /home/\$USER/backup.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
sqlite3 /home/\$USER/trading_system/backend/trading_system.db '.backup /home/\$USER/backups/backup_\$DATE.db'
find /home/\$USER/backups -name 'backup_*.db' -mtime +7 -delete
echo \"Backup completed: backup_\$DATE.db\"
EOF

chmod +x /home/\$USER/backup.sh

# Add cron jobs
(crontab -l 2>/dev/null; echo \"0 * * * * /home/\$USER/backup.sh >> /home/\$USER/backup.log 2>&1\") | crontab -
(crontab -l 2>/dev/null; echo \"0 2 * * * find /home/\$USER/trading_system/backend/logs -name '*.log' -mtime +30 -delete\") | crontab -

echo 'Monitoring and backup setup complete'
" --quiet

# --- Deployment Summary ---
echo -e "${GREEN}========================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo -e "========================================${NC}"
echo ""
echo -e "${BLUE}System URLs:${NC}"
echo "Dashboard: http://$VM_IP"
echo "API: http://$VM_IP/api/"
echo ""
echo -e "${BLUE}MT4 Configuration:${NC}"
echo "Backend URL: http://$VM_IP"
echo "API Key: Configure in MT4 EA settings"
echo ""
echo -e "${BLUE}Services Status:${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
echo 'API Service:'; sudo systemctl is-active trading-api.service
echo 'Feature Engine:'; sudo systemctl is-active feature-engine.service
echo 'Signal Generator:'; sudo systemctl is-active signal-generator.service
echo 'Nginx:'; sudo systemctl is-active nginx
" --quiet
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update your MT4 EA with the backend URL: http://$VM_IP"
echo "2. Configure API authentication key in both MT4 and backend"
echo "3. Access dashboard at: http://$VM_IP"
echo "4. Monitor logs: gcloud compute ssh $VM_NAME --zone=$ZONE --command='tail -f ~/trading_system/backend/logs/api.log'"
echo ""
echo -e "${GREEN}VM Name: $VM_NAME${NC}"
echo -e "${GREEN}Zone: $ZONE${NC}"
echo -e "${GREEN}External IP: $VM_IP${NC}"