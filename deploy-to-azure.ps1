# Azure Deployment Script for HMI Agent
# Run this script in PowerShell

Write-Host "🚀 Starting Azure Deployment for HMI Agent..." -ForegroundColor Green

# Check if Azure CLI is installed
try {
    az --version | Out-Null
    Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows" -ForegroundColor Yellow
    exit 1
}

# Login to Azure
Write-Host "🔐 Logging into Azure..." -ForegroundColor Yellow
az login

# Get subscription info
$subscription = az account show --query "name" -o tsv
Write-Host "📋 Using subscription: $subscription" -ForegroundColor Cyan

# Set variables (FREE tier)
$resourceGroup = "hmi-agent-free-rg"
$location = "East US"
$appServicePlan = "hmi-agent-free-plan"
$webAppName = "hmi-agent-backend-free"
$storageAccount = "hmiappstoragefree$(Get-Random -Minimum 1000 -Maximum 9999)"
$containerName = "hmi-images"

Write-Host "📦 Creating Azure resources..." -ForegroundColor Yellow

# Create resource group
Write-Host "Creating resource group..." -ForegroundColor Cyan
az group create --name $resourceGroup --location $location

# Create app service plan (FREE tier)
Write-Host "Creating app service plan (FREE tier)..." -ForegroundColor Cyan
az appservice plan create --name $appServicePlan --resource-group $resourceGroup --sku F1 --is-linux

# Create web app
Write-Host "Creating web app..." -ForegroundColor Cyan
az webapp create --name $webAppName --resource-group $resourceGroup --plan $appServicePlan --runtime "NODE|18-lts"

# Create storage account (FREE tier)
Write-Host "Creating storage account (FREE tier)..." -ForegroundColor Cyan
az storage account create --name $storageAccount --resource-group $resourceGroup --location $location --sku Standard_LRS --min-tls-version TLS1_2

# Create blob container
Write-Host "Creating blob container..." -ForegroundColor Cyan
az storage container create --name $containerName --account-name $storageAccount

# Get storage connection string
Write-Host "Getting storage connection string..." -ForegroundColor Cyan
$connectionString = az storage account show-connection-string --name $storageAccount --resource-group $resourceGroup --query "connectionString" -o tsv

Write-Host "🔧 Configuring environment variables..." -ForegroundColor Yellow

# Prompt for OpenAI API key
$openaiKey = Read-Host "Enter your OpenAI API key"

# Set environment variables
az webapp config appsettings set --name $webAppName --resource-group $resourceGroup --settings `
    OPENAI_API_KEY="$openaiKey" `
    NODE_ENV="production" `
    AZURE_STORAGE_CONNECTION_STRING="$connectionString" `
    AZURE_STORAGE_CONTAINER_NAME="$containerName"

Write-Host "🚀 Deploying backend..." -ForegroundColor Yellow

# Deploy backend
cd backend
az webapp deployment source config-local-git --name $webAppName --resource-group $resourceGroup
$gitUrl = az webapp deployment source config-local-git --name $webAppName --resource-group $resourceGroup --query "url" -o tsv

Write-Host "📋 Git URL for deployment: $gitUrl" -ForegroundColor Cyan

# Add Azure remote and deploy
git remote add azure $gitUrl
git push azure main

Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
Write-Host "🌐 Your backend URL: https://$webAppName.azurewebsites.net" -ForegroundColor Green

Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy frontend to Azure Static Web Apps" -ForegroundColor White
Write-Host "2. Update frontend API endpoint to point to your backend" -ForegroundColor White
Write-Host "3. Configure CORS settings" -ForegroundColor White
Write-Host "4. Test your application" -ForegroundColor White

Write-Host "🎉 Deployment completed!" -ForegroundColor Green 