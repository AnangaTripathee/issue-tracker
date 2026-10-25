# Scripts

## `api-smoke-test.ps1`: API smoke test

An end-to-end check of the issue API. It starts the production build against a
**separate test database**, sends real HTTP requests, and checks status codes and
response bodies. This includes creation, list and detail, partial updates, every
status and priority, assigning and unassigning, deletion, invalid input, and
invalid IDs. It also covers search and status filtering on `GET /api/issues`
(see [docs/api.md](../docs/api.md)):

- each status filter,
- title and description-only matches,
- search combined with status,
- whitespace trimming,
- empty values meaning no filter,
- empty results,
- case-insensitivity,
- literal `%` and `_`,
- invalid and oversized parameters.

This script is the project's automated test suite. There is no separate
unit-test framework.

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

From the project root. These npm scripts run the same commands:

```powershell
npm run build
npm run test:api:setup     # same as: ... api-smoke-test.ps1 -Setup
npm run test:api           # same as: ... api-smoke-test.ps1
npm run test:api:db-down   # same as: ... api-smoke-test.ps1 -DatabaseDown
```

Or call the script directly, for example to pass `-Port`:

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
fails or the script stops with an error. Server output goes to a log file in
your temp folder, and the script prints its path.

### Test data and cleanup

- The checks do not need an empty test database. The search checks put a random
  marker, such as `smk1a2b3c4d5e`, into the issues they create. They then compare
  exact issue IDs, so other issues in the database cannot affect the results.
- Test issues have titles starting with `[TEMP smoke-search]` or the fixed
  titles used by the CRUD checks.
- The script records the ID of every issue it creates. At the end it deletes any
  that are still there, including after a failed check or an early stop. It then
  prints `Cleanup: deleted N remaining test issue(s)...`. It never deletes issues
  it did not create.
- If the script is killed outright (for example, the terminal is closed), cleanup
  cannot run. Its server may then still be listening on the port, and its test
  issues may remain in the test database.
- Users created by `-Setup` stay in the test database.
