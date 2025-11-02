#!/bin/bash

# ==============================================================================
# AI SCALPING SYSTEM - VM DEPLOYMENT SCRIPT
# ==============================================================================
# This script runs on the GCP VM to deploy the trading system
# ==============================================================================

set -e

# --- Configuration ---
REPO_URL="https://github.com/inaradesignsindia/Money.git"
PROJECT_DIR="/home/$USER/trading_system"

echo "========================================"
echo "Deploying AI Scalping System to VM"
echo "========================================"

# --- 1. Update system ---
echo "[1/6] Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# --- 2. Install dependencies ---
echo "[2/6] Installing system dependencies..."
sudo apt-get install -y python3.10-venv python3-pip sqlite3 nginx curl git unzip

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# --- 3. Clone and setup project ---
echo "[3/6] Setting up project directory..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Clone repository
if [ ! -d ".git" ]; then
    git clone "$REPO_URL" .
else
    git pull origin master
fi

# --- 4. Setup Python backend ---
echo "[4/6] Setting up Python backend..."
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Initialize database
python3 -c "
import sqlite3, os
os.makedirs('logs', exist_ok=True)
conn = sqlite3.connect('trading_system.db')
with open('scripts/init_db.sql', 'r') as f:
    conn.executescript(f.read())
conn.commit()
conn.close()
print('Database initialized')
"

# Create models directory
mkdir -p models

# Create a basic fallback model for testing
python3 -c "
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier

# Create sample model
X_sample = np.random.rand(100, 20)
y_sample = np.random.choice([0, 1, 2], 100)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_sample, y_sample)

with open('models/scalping_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print('Sample AI model created')
"

deactivate

# --- 5. Setup frontend ---
echo "[5/6] Setting up frontend..."
cd ../

# Build React app (if Node.js is available)
if command -v node &> /dev/null; then
    cd frontend
    npm install
    npm run build
    cd ..
else
    echo "Node.js not available - skipping frontend build"
    # Create basic HTML placeholder
    mkdir -p frontend/build
    cat > frontend/build/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>AI Scalping System</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .status { color: green; font-size: 24px; }
    </style>
</head>
<body>
    <h1>AI Scalping System</h1>
    <p class="status">Backend is running - Frontend deployment pending</p>
    <p>API Status: <span id="status">Checking...</span></p>

    <script>
        fetch('/api/health')
            .then(r => r.json())
            .then(data => {
                document.getElementById('status').textContent = data.status;
            })
            .catch(() => {
                document.getElementById('status').textContent = 'Backend not responding';
            });
    </script>
</body>
</html>
EOF
fi

# --- 6. Start services ---
echo "[6/6] Starting services..."

# Start backend services using docker-compose
docker-compose up -d

# Alternative: Start services manually
# cd backend
# source venv/bin/activate
# nohup python3 app.py > logs/api.log 2>&1 &
# nohup python3 feature_engine.py > logs/feature_engine.log 2>&1 &
# nohup python3 signal_generator.py > logs/signal_generator.log 2>&1 &
# deactivate

# --- Configure Nginx ---
echo "[7/7] Configuring Nginx..."

sudo tee /etc/nginx/sites-available/trading-system > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    root $PROJECT_DIR/frontend/build;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

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
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# --- Deployment complete ---
PUBLIC_IP=$(curl -s ifconfig.me)

echo "========================================"
echo "✅ VM Deployment Complete!"
echo "========================================"
echo ""
echo "Dashboard: http://$PUBLIC_IP"
echo "API: http://$PUBLIC_IP/api/"
echo ""
echo "Services:"
docker-compose ps
echo ""
echo "Logs:"
echo "API: docker-compose logs api"
echo "Feature Engine: docker-compose logs feature-engine"
echo "Signal Generator: docker-compose logs signal-generator"
echo ""
echo "Next steps:"
echo "1. Configure your MT4 EA with backend URL: http://$PUBLIC_IP"
echo "2. Set API authentication key"
echo "3. Test the system with the dashboard"
echo "========================================"