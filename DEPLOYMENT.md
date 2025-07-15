# 🚀 Azure Deployment Guide for HMI Agent

## Overview
This guide will walk you through deploying your HMI Agent to Azure step by step.

## Prerequisites
- Azure subscription
- GitHub repository
- Node.js 18+ installed locally
- Azure CLI installed

## Step 1: Azure CLI Setup

```bash
# Install Azure CLI (if not already installed)
# Windows: Download from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"
```

## Step 2: Create Azure Resources

### 2.1 Create Resource Group
```bash
az group create --name "hmi-agent-rg" --location "East US"
```

### 2.2 Create App Service Plan
```bash
az appservice plan create --name "hmi-agent-plan" --resource-group "hmi-agent-rg" --sku B1 --is-linux
```

### 2.3 Create Backend App Service
```bash
az webapp create --name "hmi-agent-backend" --resource-group "hmi-agent-rg" --plan "hmi-agent-plan" --runtime "NODE|18-lts"
```

### 2.4 Create Storage Account (for images)
```bash
az storage account create --name "hmiappstorage" --resource-group "hmi-agent-rg" --location "East US" --sku Standard_LRS
```

### 2.5 Create Blob Container
```bash
az storage container create --name "hmi-images" --account-name "hmiappstorage"
```

## Step 3: Configure Environment Variables

### 3.1 Set Backend Environment Variables
```bash
az webapp config appsettings set --name "hmi-agent-backend" --resource-group "hmi-agent-rg" --settings \
  OPENAI_API_KEY="your_openai_api_key" \
  NODE_ENV="production" \
  AZURE_STORAGE_CONNECTION_STRING="your_storage_connection_string" \
  AZURE_STORAGE_CONTAINER_NAME="hmi-images" \
  SESSION_SECRET="your_session_secret"
```

### 3.2 Get Storage Connection String
```bash
az storage account show-connection-string --name "hmiappstorage" --resource-group "hmi-agent-rg"
```

## Step 4: Deploy Backend

### 4.1 Using Azure CLI
```bash
# Navigate to backend directory
cd backend

# Deploy to Azure
az webapp deployment source config-local-git --name "hmi-agent-backend" --resource-group "hmi-agent-rg"
git remote add azure <git-url-from-above-command>
git push azure main
```

### 4.2 Using GitHub Actions (Recommended)
1. Go to your GitHub repository
2. Add these secrets:
   - `AZURE_WEBAPP_PUBLISH_PROFILE`
   - `OPENAI_API_KEY`
3. Push to main branch to trigger deployment

## Step 5: Deploy Frontend

### 5.1 Create Static Web App
```bash
az staticwebapp create --name "hmi-agent-frontend" --resource-group "hmi-agent-rg" --source https://github.com/yourusername/yourrepo --location "East US" --branch main --app-location "/frontend" --output-location "build"
```

### 5.2 Configure Frontend Environment
Update your frontend API endpoint to point to your Azure backend:
```javascript
// In your frontend config
const API_BASE_URL = 'https://hmi-agent-backend.azurewebsites.net';
```

## Step 6: Update CORS Settings

```bash
# Allow your frontend domain
az webapp cors add --name "hmi-agent-backend" --resource-group "hmi-agent-rg" --allowed-origins "https://hmi-agent-frontend.azurestaticapps.net"
```

## Step 7: Test Your Deployment

1. **Backend**: Visit `https://hmi-agent-backend.azurewebsites.net`
2. **Frontend**: Visit `https://hmi-agent-frontend.azurestaticapps.net`

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure CORS is configured correctly
2. **Environment Variables**: Check Azure App Service Configuration
3. **Build Failures**: Check GitHub Actions logs
4. **Storage Issues**: Verify connection string and permissions

### Useful Commands:
```bash
# View app logs
az webapp log tail --name "hmi-agent-backend" --resource-group "hmi-agent-rg"

# Restart app
az webapp restart --name "hmi-agent-backend" --resource-group "hmi-agent-rg"

# Check app status
az webapp show --name "hmi-agent-backend" --resource-group "hmi-agent-rg"
```

## Cost Optimization

- Use **B1** App Service Plan for development
- Consider **F1** (Free) for testing
- Use **Standard_LRS** storage for cost efficiency
- Monitor usage in Azure Portal

## Security Best Practices

1. Store secrets in Azure Key Vault
2. Use HTTPS only
3. Configure proper CORS
4. Regular security updates
5. Monitor for suspicious activity

## Next Steps

1. Set up monitoring with Application Insights
2. Configure custom domain
3. Set up SSL certificates
4. Implement CI/CD pipeline
5. Add backup strategies 