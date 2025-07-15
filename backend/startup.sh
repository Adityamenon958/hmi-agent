#!/bin/bash

# ✅ HMI Agent Startup Script for Azure
echo "🚀 Starting HMI Agent Backend..."

# ✅ Check if we're in the right directory
echo "📁 Current directory: $(pwd)"
echo "📄 Files in current directory:"
ls -la

# ✅ Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    echo "📦 Installing dependencies..."
    npm install --production
    echo "🚀 Starting server with: npm start"
    npm start
else
    echo "❌ package.json not found in current directory"
    echo "📁 Checking subdirectories..."
    ls -la */
    exit 1
fi 