# Azure Deployment Guide

## Step 1: Install Azure CLI
```bash
# Windows: Download from Microsoft
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

## Step 2: Login to Azure
```bash
az login
```

## Step 3: Create Resources
```bash
# Create resource group
az group create --name "hmi-agent-rg" --location "East US"

# Create app service plan (FREE tier)
az appservice plan create --name "hmi-agent-plan" --resource-group "hmi-agent-rg" --sku F1 --is-linux

# Create web app
az webapp create --name "hmi-agent-backend" --resource-group "hmi-agent-rg" --plan "hmi-agent-plan" --runtime "NODE|18-lts"

# Create storage account (FREE tier)
az storage account create --name "hmiappstorage" --resource-group "hmi-agent-rg" --location "East US" --sku Standard_LRS --min-tls-version TLS1_2

# Create blob container
az storage container create --name "hmi-images" --account-name "hmiappstorage"
```

## Step 4: Configure Environment
```bash
# Get storage connection string
az storage account show-connection-string --name "hmiappstorage" --resource-group "hmi-agent-rg"

# Set environment variables
az webapp config appsettings set --name "hmi-agent-backend" --resource-group "hmi-agent-rg" --settings \
  OPENAI_API_KEY="your_key" \
  NODE_ENV="production" \
  AZURE_STORAGE_CONNECTION_STRING="your_connection_string"
```

## Step 5: Deploy
```bash
# Deploy backend
cd backend
az webapp deployment source config-local-git --name "hmi-agent-backend" --resource-group "hmi-agent-rg"
git remote add azure <git-url>
git push azure main
```

## Step 6: Deploy Frontend
```bash
# Create static web app
az staticwebapp create --name "hmi-agent-frontend" --resource-group "hmi-agent-rg" --source https://github.com/yourusername/yourrepo --location "East US" --branch main --app-location "/frontend" --output-location "build"
``` 