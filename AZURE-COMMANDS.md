# Azure Commands - Driver Schedule API

Scope: Driver Schedule backend only.

Do not run these until the Azure subscription, region, and names are confirmed.

## Variables

```powershell
$location = "australiaeast"
$resourceGroup = "rg-elx-loadiq-dev"
$storageAccount = "stelxloadiqdev001"
$functionApp = "func-elx-loadiq-driver-schedule-dev"
$sqlServer = "sql-elx-loadiq-dev"
$sqlDatabase = "sqldb-elx-driver-schedule-dev"
$sqlAdmin = "<sql-admin-user>"
```

## Resource group

```powershell
az group create `
  --name $resourceGroup `
  --location $location
```

## Storage account for Azure Functions

```powershell
az storage account create `
  --name $storageAccount `
  --resource-group $resourceGroup `
  --location $location `
  --sku Standard_LRS `
  --kind StorageV2 `
  --https-only true `
  --min-tls-version TLS1_2
```

## Function App Consumption Plan

```powershell
az functionapp create `
  --name $functionApp `
  --resource-group $resourceGroup `
  --storage-account $storageAccount `
  --consumption-plan-location $location `
  --runtime node `
  --runtime-version 20 `
  --functions-version 4 `
  --os-type Windows
```

## Azure SQL Server and database

```powershell
az sql server create `
  --name $sqlServer `
  --resource-group $resourceGroup `
  --location $location `
  --admin-user $sqlAdmin `
  --admin-password "<temporary-password>"
```

```powershell
az sql db create `
  --resource-group $resourceGroup `
  --server $sqlServer `
  --name $sqlDatabase `
  --service-objective Basic `
  --backup-storage-redundancy Local
```

## Function App settings

```powershell
az functionapp config appsettings set `
  --name $functionApp `
  --resource-group $resourceGroup `
  --settings `
    FUNCTIONS_WORKER_RUNTIME=node `
    WEBSITE_NODE_DEFAULT_VERSION=~20 `
    ALLOWED_ORIGIN="https://your-approved-frontend-domain.example" `
    REQUIRE_AUTH=true
```

Set `SQL_CONNECTION_STRING` as a secure app setting or Key Vault reference after the SQL connection string is created.

## Deploy API

From the `api/driver-schedule-api` folder:

```powershell
npm.cmd ci
npm.cmd run build
func azure functionapp publish $functionApp
```

## Validate

```powershell
Invoke-WebRequest -Uri "https://$functionApp.azurewebsites.net/api/health" -UseBasicParsing
```

Expected:

```json
{
  "status": "ok",
  "environment": {
    "dataSourceMode": "azure-sql",
    "isSqlConfigured": true,
    "isAuthRequired": true
  }
}
```

## Cost guardrails

- Use Consumption Plan for Functions.
- Use Basic or lowest practical Azure SQL tier for prototype.
- Stop before adding Key Vault if cost needs review.
- Do not add App Service Plan, VM, AKS, or Application Gateway.
- Keep this resource group Driver Schedule only.
