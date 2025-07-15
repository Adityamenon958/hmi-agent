# 🆓 Azure Free Tier Deployment Guide

## Overview
This guide deploys your HMI Agent using **100% FREE Azure resources**.

## 🆓 Free Resources We'll Use

| Service | Free Tier | Limits |
|---------|-----------|---------|
| **App Service Plan** | F1 (Free) | 1GB RAM, 60 minutes/day CPU |
| **Static Web Apps** | Free | 100GB bandwidth/month |
| **Storage Account** | Free | 5GB storage, 20K transactions/month |

## ⚠️ Free Tier Limitations

### App Service (F1) Limitations:
- **CPU**: 60 minutes per day
- **Memory**: 1GB RAM
- **Storage**: 1GB
- **Custom domains**: Not supported
- **SSL**: Shared certificates only

### Storage Account Limitations:
- **Storage**: 5GB
- **Transactions**: 20,000/month
- **Bandwidth**: 5GB/month

## 🚀 Step-by-Step Free Deployment

### Step 1: Install Azure CLI
```bash
# Windows: Download from Microsoft
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Step 2: Login to Azure
```bash
az login
```

### Step 3: Create Free Resources
```bash
# Create resource group
az group create --name "hmi-agent-free-rg" --location "East US"

# Create FREE app service plan
az appservice plan create --name "hmi-agent-free-plan" --resource-group "hmi-agent-free-rg" --sku F1 --is-linux

# Create web app
az webapp create --name "hmi-agent-backend-free" --resource-group "hmi-agent-free-rg" --plan "hmi-agent-free-plan" --runtime "NODE|18-lts"

# Create FREE storage account
az storage account create --name "hmiappstoragefree" --resource-group "hmi-agent-free-rg" --location "East US" --sku Standard_LRS --min-tls-version TLS1_2

# Create blob container
az storage container create --name "hmi-images" --account-name "hmiappstoragefree"
```

### Step 4: Configure Environment
```bash
# Get storage connection string
az storage account show-connection-string --name "hmiappstoragefree" --resource-group "hmi-agent-free-rg"

# Set environment variables
az webapp config appsettings set --name "hmi-agent-backend-free" --resource-group "hmi-agent-free-rg" --settings \
  OPENAI_API_KEY="your_openai_api_key" \
  NODE_ENV="production" \
  AZURE_STORAGE_CONNECTION_STRING="your_storage_connection_string" \
  AZURE_STORAGE_CONTAINER_NAME="hmi-images" \
  SESSION_SECRET="your_session_secret"
```

### Step 5: Deploy Backend
```bash
# Navigate to backend directory
cd backend

# Deploy to Azure
az webapp deployment source config-local-git --name "hmi-agent-backend-free" --resource-group "hmi-agent-free-rg"
git remote add azure <git-url-from-above-command>
git push azure main
```

### Step 6: Deploy Frontend (Free)
```bash
# Create static web app (FREE tier)
az staticwebapp create --name "hmi-agent-frontend-free" --resource-group "hmi-agent-free-rg" --source https://github.com/yourusername/yourrepo --location "East US" --branch main --app-location "/frontend" --output-location "build"
```

## 🔧 Optimizations for Free Tier

### Backend Optimizations:
```javascript
// Add to your server.js
const compression = require('compression');
app.use(compression()); // Reduce bandwidth usage

// Optimize image storage
const sharp = require('sharp'); // Compress images before storing
```

### Frontend Optimizations:
```javascript
// Use lazy loading for images
// Minimize bundle size
// Use CDN for static assets
```

## 📊 Monitoring Free Tier Usage

### Check App Service Usage:
```bash
# Check CPU usage
az webapp log show --name "hmi-agent-backend-free" --resource-group "hmi-agent-free-rg"

# Check storage usage
az storage account show --name "hmiappstoragefree" --resource-group "hmi-agent-free-rg" --query "usageInBytes"
```

### Azure Portal Monitoring:
1. Go to Azure Portal
2. Navigate to your resources
3. Check "Metrics" for usage
4. Set up alerts for approaching limits

## ⚠️ Important Free Tier Notes

### App Service (F1):
- **Auto-sleep**: App sleeps after 20 minutes of inactivity
- **Cold start**: First request after sleep takes longer
- **CPU limits**: 60 minutes/day shared across all apps in subscription
- **No custom domains**: Only azurewebsites.net subdomain

### Storage Account:
- **5GB limit**: Monitor usage closely
- **20K transactions**: Each API call counts as a transaction
- **5GB bandwidth**: Monitor data transfer

## 🚨 When You Hit Limits

### If you exceed free limits:
1. **App Service**: Upgrade to B1 ($13/month)
2. **Storage**: Upgrade to Standard_LRS (pay per use)
3. **Static Web Apps**: Still free for most use cases

### Cost-effective upgrades:
- **B1 App Service**: $13/month (1GB RAM, always on)
- **Standard Storage**: ~$0.02/GB/month

## 🎯 URLs After Deployment

- **Backend**: `https://hmi-agent-backend-free.azurewebsites.net`
- **Frontend**: `https://hmi-agent-frontend-free.azurestaticapps.net`

## 🔍 Troubleshooting Free Tier Issues

### Common Issues:
1. **App not responding**: Check if it's sleeping (F1 limitation)
2. **Storage errors**: Check if you've hit 5GB limit
3. **Slow performance**: F1 has limited CPU/memory
4. **Cold starts**: Normal for F1 tier

### Solutions:
```bash
# Wake up sleeping app
curl https://hmi-agent-backend-free.azurewebsites.net

# Check app status
az webapp show --name "hmi-agent-backend-free" --resource-group "hmi-agent-free-rg"

# Restart if needed
az webapp restart --name "hmi-agent-backend-free" --resource-group "hmi-agent-free-rg"
```

## 💡 Tips for Free Tier Success

1. **Monitor usage regularly**
2. **Optimize image sizes**
3. **Use compression**
4. **Implement caching**
5. **Consider upgrading when you hit limits**

## 🎉 You're Ready!

Your HMI Agent will run completely free on Azure! Just run the deployment script and you're good to go. 