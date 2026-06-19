# Driver Schedule API Deployment Notes

Scope: Driver Schedule backend only.

## Required app settings

```text
FUNCTIONS_WORKER_RUNTIME=node
WEBSITE_NODE_DEFAULT_VERSION=~20
ALLOWED_ORIGIN=<approved frontend URL>
SQL_CONNECTION_STRING=<server-side Azure SQL connection string>
REQUIRE_AUTH=true
```

For local mock mode, omit `SQL_CONNECTION_STRING`.
For local unauthenticated development, keep `REQUIRE_AUTH=false`.

## Database setup order

1. Run `database/schema.sql`.
2. Run `database/seed.sql`.
3. Start the Function App.
4. Confirm API responses show `meta.source = "azure-sql"`.

## Local validation commands

```powershell
npm.cmd run build
.\node_modules\.bin\func.cmd start --typescript --port 7071
```

Then test:

```text
GET http://127.0.0.1:7071/api/health
GET http://127.0.0.1:7071/api/driver-schedule/lookups
GET http://127.0.0.1:7071/api/driver-schedule/schedules?start=2026-06-18&end=2026-06-25
```

Or run the repeatable smoke test while the Functions host is running:

```powershell
npm.cmd run test:api
```

## Cost control

- Use Azure Functions Consumption Plan.
- Use the lowest practical Azure SQL option for the prototype.
- Avoid VMs, AKS, and always-on App Service.
- Keep only Driver Schedule backend tables in scope.

## Azure commands

See `AZURE-COMMANDS.md`.

## Current API mode behavior

- No `SQL_CONNECTION_STRING`: API uses `static-mock`.
- `SQL_CONNECTION_STRING` set: API uses `azure-sql`.

## Deployment package preparation

Build before packaging:

```powershell
npm.cmd ci
npm.cmd run build
```

The `.funcignore` file excludes local-only and source-only files from Azure deployment packages.

Expected deployable runtime files:

- `dist`
- `host.json`
- `package.json`
- `package-lock.json`

Do not deploy:

- `local.settings.json`
- raw secrets
- local `node_modules`
- frontend files

## Planned staff roles

- `Admin`: read/write schedules and audit.
- `Scheduler`: read/write schedules and audit.
- `Viewer`: read schedules and lookup data only.
