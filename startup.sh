#!/bin/bash

# ✅ Azure startup script for HMI Agent with Canvas support
echo "🚀 Starting HMI Agent on Azure with Canvas support..."

# ✅ Set environment
export NODE_ENV=production
export PORT=8080

# ✅ Install system dependencies for canvas
echo "📦 Installing system dependencies for canvas..."
apt-get update -qq
apt-get install -y -qq \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    pkg-config

# ✅ Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Installing dependencies..."
    npm install --production --no-optional
fi

# ✅ Check if frontend build exists
if [ ! -d "frontend/build" ]; then
    echo "❌ Frontend build not found. Building frontend..."
    cd frontend
    npm install --no-optional
    npm run build
    cd ..
fi

# ✅ Start the server
echo "✅ Starting server on port $PORT..."
node server.js 