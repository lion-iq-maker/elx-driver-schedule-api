# Driver Schedule Database Setup

Scope: Driver Schedule backend only.

## Step 1: Create Azure SQL database

Use the lowest practical Azure SQL tier for the prototype. Do not expose SQL credentials to the frontend.

## Step 2: Run schema

Run `schema.sql` first.

Expected result:
- `drivers`
- `trucks`
- `trailers`
- `driver_schedules`
- `audit_events`

## Step 3: Run seed data

Run `seed.sql` after `schema.sql`.

Expected result:
- 8 drivers
- 8 trucks
- 8 trailers
- 8 starter schedules

## Step 4: Configure Azure Functions

Set this Function App application setting:

```text
SQL_CONNECTION_STRING=<Azure SQL connection string from Key Vault or secure app setting>
```

Do not put this value in:
- frontend code
- GitHub Pages
- committed files
- `local.settings.example.json`

## Step 5: Validate API source

Call:

```text
GET /api/driver-schedule/lookups
GET /api/driver-schedule/schedules?start=2026-06-18&end=2026-06-25
```

Expected result when SQL is configured:

```json
{
  "meta": {
    "source": "azure-sql"
  }
}
```

Expected result without SQL configured:

```json
{
  "meta": {
    "source": "static-mock"
  }
}
```

## Security checklist

- Keep SQL credentials server-side only.
- Prefer Managed Identity and Key Vault when moving beyond local prototype settings.
- Lock CORS to the approved frontend domain.
- Keep SQL user permissions limited to Driver Schedule tables only.
- Use soft delete for schedules.
- Audit create, update, and delete actions.
