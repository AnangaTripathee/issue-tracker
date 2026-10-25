# Scripts

## `api-smoke-test.ps1`: API smoke test

An end-to-end check of the issue API. It starts the production build against a
**separate test database**, sends real HTTP requests, and checks status codes and
response bodies. This includes creation, list and detail, partial updates, every
status and priority, assigning and unassigning, deletion, invalid input, and
invalid IDs.

This is a temporary manual check. The project's automated test suite will
replace it.

### Prerequisites

- Windows PowerShell 5.1 or PowerShell 7. It was tested on Windows PowerShell 5.1.
- Node.js and installed dependencies (`npm install`).
- A local MySQL server, plus a database user that can create databases (or an
  existing empty test database).
- A production build. Run `npm run build` after any code change.
- A free port. The default is 3100.

### Configuration

| Setting | Required | Where | Meaning |
|---|---|---|---|
| `TEST_DATABASE_URL` | yes | environment variable or `.env` | Connection URL of the test database |
| `TEST_API_PORT` | no | environment variable, or `-Port` | Port for the temporary server (default 3100) |

Add the test database to your `.env` (never commit it):

```
TEST_DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/issue_tracker_test"
```

### Safety rules

The script stops before doing anything if:

- `TEST_DATABASE_URL` is missing, or
- it points at the same host, port and database as `DATABASE_URL`, or
- the database name does not contain `test`, or
- something is already listening on the chosen port.

The script sets `DATABASE_URL` to the test database only for the server and the
Prisma commands it starts, so your development database is never touched. It never
prints connection URLs.

The script runs its own server rather than using one that is already running,
because otherwise it could not be sure which database that server uses.

### Running it

From the project root:

```powershell
npm run build

# First run: apply migrations and seed users in the test database, then test
powershell -ExecutionPolicy Bypass -File scripts/api-smoke-test.ps1 -Setup

# Later runs
powershell -ExecutionPolicy Bypass -File scripts/api-smoke-test.ps1

# Check that database failures return a generic 500 (uses a database name that does not exist)
powershell -ExecutionPolicy Bypass -File scripts/api-smoke-test.ps1 -DatabaseDown

# Use a different port
powershell -ExecutionPolicy Bypass -File scripts/api-smoke-test.ps1 -Port 3200
```

Each check prints `PASS` or `FAIL`. The script exits with code 1 if any check
fails. Server output goes to a log file in your temp folder, and the script
prints its path.

The script deletes only the issues it creates. Users created by `-Setup` stay
in the test database.
