# Use Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs models

# Create database and initialize schema
RUN python3 -c "\
import sqlite3, os; \
os.makedirs('logs', exist_ok=True); \
conn = sqlite3.connect('trading_system.db'); \
with open('scripts/init_db.sql', 'r') as f: \
    conn.executescript(f.read()); \
conn.commit(); \
conn.close(); \
print('Database initialized')"

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Default command (can be overridden for different services)
CMD ["python3", "app.py"]