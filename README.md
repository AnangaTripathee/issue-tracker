# Mini Issue Tracker

A small web application for creating, tracking and managing software issues.
It is built with Next.js (App Router), TypeScript, Prisma and MySQL. It has a
REST API and a browser UI.

## Features

- **Issues:** create, list, view, edit and delete issues. Each issue has a
  title, a description (Markdown), a status, a priority, an optional assignee,
  and created/updated dates.
- **Statuses:** `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` (default `OPEN`).
- **Priorities:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (default `MEDIUM`).
- **Assignment:** assign an issue to an existing user, change the assignee, or
  remove the assignee.
- **Search and filter:** search titles and descriptions, filter by status, or do
  both, in the API and on the issues page (`/issues?q=login&status=OPEN`).
- **Validation and errors:** the API and the form validate input. The API
  returns `400` for invalid input or IDs, `404` for missing issues, and a generic
  `500` for unexpected failures. Database details are only logged on the server.
- **Storage:** MySQL, so data persists across restarts. The schema is managed by
  Prisma migrations.

### REST API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/issues` | List issues, newest first. Optional `?q=` and `?status=` (see [docs/api.md](docs/api.md)). |
| `POST` | `/api/issues` | Create an issue (`201`). |
| `GET` | `/api/issues/:id` | Get one issue. |
| `PATCH` | `/api/issues/:id` | Update only the fields sent (`title`, `description`, `status`, `priority`, `assigneeId`; `null` unassigns). |
| `DELETE` | `/api/issues/:id` | Delete an issue (`204`, no body). |
| `GET` | `/api/users` | List users that issues can be assigned to. |

## Technologies

- **Next.js 16** (App Router; route handlers for the API) with **React 19** and **TypeScript**
- **Prisma 5** with **MySQL 8**
- **Zod**, for validation schemas shared by the API and the form
- **React Hook Form**, **Radix UI Themes** and **Tailwind CSS 3**, for the UI
- **EasyMDE** (`react-simplemde-editor`), the Markdown editor
- **react-markdown**, which renders descriptions safely: raw HTML is not rendered
- **axios**, for browser requests to the API
- **ESLint 9** with `eslint-config-next`

Exact versions are in `package.json` and `package-lock.json`.

## Prerequisites

- **Node.js 20.9 or newer**, which is Next.js 16's minimum. The project was
  developed and tested with Node.js **24.14.1** and npm **11.11.0**.
- **MySQL 8.** It was tested with MySQL **8.0.46 on Windows**.
- **Windows PowerShell 5.1** (or PowerShell 7), for the API test script. The
  setup commands below are written for PowerShell; on macOS or Linux use `cp`
  instead of `Copy-Item`.

## Setup (fresh clone)

```powershell
git clone <repository-url>
cd issue-tracker
npm ci                                  # installs exact versions; also generates the Prisma client
Copy-Item .env.example .env             # then edit .env (see below)
npx prisma migrate deploy               # creates the database if needed and applies all migrations
npx prisma generate                     # (re)generates the Prisma client from the schema
npx prisma db seed                      # adds sample users for assignment
npm run dev                             # http://localhost:3000
```

### Environment variables

Defined in `.env`. Copy it from `.env.example`. `.env` is ignored by Git, so never commit it.

| Variable | Required | Example (placeholder) | Used by |
|---|---|---|---|
| `DATABASE_URL` | yes | `mysql://USER:PASSWORD@localhost:3306/issue-tracker` | the app and the Prisma CLI |
| `TEST_DATABASE_URL` | only for the API tests | `mysql://USER:PASSWORD@localhost:3306/issue_tracker_test` | `scripts/api-smoke-test.ps1` |
| `TEST_API_PORT` | no (default `3100`) | `3100` | `scripts/api-smoke-test.ps1` (can also be set in the environment) |

If the username or password contains special characters, **URL-encode them** in
the connection URL. For example, `p@ss#word` becomes `p%40ss%23word`. Characters
such as `@`, `:`, `/`, `#`, `?` and `%` would otherwise break the URL.

### MySQL database and permissions

- `npx prisma migrate deploy` **creates the database named in `DATABASE_URL` if
  it does not exist**. It then applies every migration in `prisma/migrations`.
  It never resets or drops data.
- The MySQL account therefore needs permission to create that database and to
  create, alter and index tables in it. Seeding and running the app need
  `SELECT`, `INSERT`, `UPDATE` and `DELETE`. The project was tested with an
  account that could create databases.
- If your account cannot create databases, create them first as an
  administrator, then grant the app's account access. Backticks are needed
  because of the hyphen. This is an example, not a step that was run for this
  project:

  ```sql
  CREATE DATABASE `issue-tracker` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  GRANT ALL PRIVILEGES ON `issue-tracker`.* TO 'your_user'@'localhost';
  ```

- `npx prisma migrate dev` is only needed when changing `schema.prisma`. It also
  needs permission to create a temporary "shadow" database.

### Seeded users

`npx prisma db seed` creates four sample users (Alex Morgan, Jordan Lee, Sam
Patel, Taylor Kim). You can run it again safely: existing users are left as
they are and nothing is deleted.

These users exist **only so that issues can be assigned**. They are **not login
accounts**. Authentication and user management are outside this project's scope.

## Running

| Task | Command |
|---|---|
| Development server | `npm run dev`, then open http://localhost:3000 (redirects to `/issues`) |
| Production build | `npm run build` |
| Start the production build | `npm start` (port 3000) |
| Lint | `npm run lint` |
| TypeScript check | `npm run typecheck` |

## Tests

The automated tests are an end-to-end API smoke test,
[`scripts/api-smoke-test.ps1`](scripts/api-smoke-test.ps1). It starts the
production build against a **separate test database** and sends real HTTP
requests. It then checks status codes and response bodies for:

- creation, reading and partial updates,
- every status and priority,
- assigning and unassigning,
- deleting,
- invalid input and IDs,
- search and status filtering.

Full details are in [scripts/README.md](scripts/README.md).

1. Add `TEST_DATABASE_URL` to `.env`. It must point at a **different** database
   whose name contains `test`. The script refuses to run otherwise, and it
   never uses `DATABASE_URL`'s database.
2. Run:

```powershell
npm run build              # the tests run the production build
npm run test:api:setup     # first time: migrates + seeds the test database, then runs all checks
npm run test:api           # later runs
npm run test:api:db-down   # checks that a database failure returns a generic 500
```

The script prints `PASS`/`FAIL` for each check and a summary. It exits with
code `1` if any check fails. It deletes only the issues it created, including
after a failed check.

The `npm run test:api*` scripts call `powershell`, so they need Windows (or a
`powershell` command on the PATH). The script has been run only with Windows
PowerShell 5.1.

## Project structure

```
app/
  api/issues/route.ts, api/issues/[id]/route.ts, api/users/route.ts   REST API (thin route handlers)
  issues/(list)/      issues list page with search/filter form
  issues/[id]/        issue detail, edit page, delete button, not-found page
  issues/new/         create page
  issues/_components/ shared form, badges, labels
  validationSchemas.ts  Zod schemas shared by the API, the form and the list page
lib/
  issues.ts, users.ts   data access (Prisma queries)
  api.ts, ids.ts        shared API helpers (error responses, JSON/ID parsing)
prisma/
  schema.prisma, migrations/, seed.mjs, client.ts (shared Prisma client)
scripts/                API smoke test and its README
docs/                   API query reference and migration history notes
```

## Assumptions

- There is no authentication. Anyone who can open the app can create, edit,
  delete and assign issues.
- Users exist only to be assignees and are created by the seed script. User
  names are unique so that the seed can be re-run safely.
- Descriptions are Markdown. They are stored as plain text and rendered safely.
- Search is case-insensitive and accent-insensitive, because the text columns
  use the `utf8mb4_unicode_ci` collation (see [docs/api.md](docs/api.md)).

## Known limitations

- No pagination. The list and the API return every matching issue.
- Search uses SQL `LIKE '%…%'`, which cannot use an index. This is fine for a
  small tracker, but not for large tables.
- Concurrent edits are last-write-wins. There is no conflict detection.
- Dates are formatted in the server's time zone.
- There is no user management UI or API beyond listing users.
- The automated tests are a PowerShell smoke test, run only on Windows. There is
  no unit-test suite or CI pipeline.
- The migrations have not been verified on a case-sensitive MySQL server, such
  as Linux with the default `lower_case_table_names=0`. All migrations use the
  table name `Issue` consistently.
- Submitting the search form with empty fields leaves `?q=&status=` in the URL.
  This is treated the same as no filter.

## Further documentation

- [docs/api.md](docs/api.md): query parameters, search behaviour and examples for `GET /api/issues`.
- [scripts/README.md](scripts/README.md): API smoke test configuration, safety rules and cleanup.
- [ENGINEERING.md](ENGINEERING.md): technical decisions.
- [docs/migrations.md](docs/migrations.md): a historical note about a migration
  repair made during development. It only matters for a database created
  **before 2026-10-24**. Fresh clones need no extra steps.
