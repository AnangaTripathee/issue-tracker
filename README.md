# Mini Issue Tracker

A small issue tracker that supports creating, assigning, updating, searching, and closing software issues through a browser interface and a REST API.

I started with a tutorial for the project foundation and initial create-issue flow, then extended it to meet the assessment requirements. I checked the API manually with Postman, tested the browser workflows, and used an automated API suite for repeatable checks.


## Features

- Create, list, view, edit, and delete issues, with confirmation before deletion.
- Track a title, Markdown description, status, priority, optional assignee, and created/updated dates.
- Change status between **Open**, **In Progress**, **Resolved**, and **Closed**.
- Choose **Low**, **Medium**, **High**, or **Critical** priority.
- Assign an existing user, change the assignee, or leave an issue unassigned.
- Search titles and descriptions, filter by status, or combine both. Applied filters stay in the URL.
- Validate requests on the server and show useful form errors in the browser.
- Persist records in MySQL across application restarts.

New issues default to `OPEN`, `MEDIUM`, and no assignee when those fields are omitted.

## Technologies

| Area | Tools |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Database | MySQL 8, Prisma 5 |
| Validation and forms | Zod, React Hook Form |
| Interface | Radix UI Themes, Tailwind CSS 3 |
| Markdown | EasyMDE editor through `react-simplemde-editor`; `react-markdown` for display |
| Browser API requests | Axios |
| Verification | ESLint 9, TypeScript, PowerShell API smoke tests, manual Postman and browser checks |

Exact dependency versions are recorded in `package.json` and `package-lock.json`.

## Prerequisites

- **Node.js 20.9 or newer.** The documented development environment used Node.js **24.14.1** and npm **11.11.0**.
- **MySQL 8**, running locally or accessible through a connection URL. Verification was performed with MySQL **8.0.46 on Windows**.
- **Git**, to clone the repository.
- **Windows PowerShell 5.1**, for the automated API test commands. PowerShell 7 and other platforms have not been verified.

The commands below use PowerShell. MySQL Workbench is optional; I used it to inspect records during development.

## Local setup

### 1. Clone and install

```powershell
git clone https://github.com/AnangaTripathee/issue-tracker.git
cd issue-tracker
npm ci
Copy-Item .env.example .env
```

### 2. Configure the database connection

Edit `.env` and replace the placeholders with your MySQL credentials:

```dotenv
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/issue-tracker"
```

Keep `.env` private. It is ignored by Git; `.env.example` contains the shareable placeholders.

Special characters in the username or password must be URL-encoded **inside the connection URL**. For example, `$` becomes `%24`, and `p@ss#word` becomes `p%40ss%23word`. Your actual MySQL password does not change.

The MySQL server must already be running. The configured account needs permission to apply the migrations and read/write application data. If the database does not exist, `migrate deploy` can create it when the account has the necessary permissions.

If your account cannot create databases, ask an administrator to create the database and grant access first. The following is an optional SQL example for an **already-existing MySQL user**; it was not part of the verified setup sequence:

```sql
CREATE DATABASE `issue-tracker`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON `issue-tracker`.*
  TO 'your_user'@'localhost';
```

### 3. Apply migrations and seed users

```powershell
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

The seed adds four sample assignees: Alex Morgan, Jordan Lee, Sam Patel, and Taylor Kim. It can be run again without duplicating those users.

These are assignment records, **not login accounts**. The application has no authentication or registration flow.

For a fresh clone, use the commands above. The [migration repair notes](docs/migrations.md) describe an earlier development repair and are not additional setup steps. `prisma migrate dev` is for making new schema changes and may require a shadow database.

### 4. Start the application

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The homepage redirects to `/issues`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MySQL connection used by the application and Prisma CLI. |
| `TEST_DATABASE_URL` | For automated API tests | Connection to a separate database whose name contains `test`. |
| `TEST_API_PORT` | No | Test server port; defaults to `3100`. |

Example test settings:

```dotenv
TEST_DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/issue_tracker_test"
TEST_API_PORT=3100
```

Use credentials with permission to migrate and seed the test database. Do not point `TEST_DATABASE_URL` at your application database.

## Commands

| Task | Command |
| --- | --- |
| Development server | `npm run dev` |
| Production build | `npm run build` |
| Start the production build | `npm start` |
| Lint | `npm run lint` |
| TypeScript check | `npm run typecheck` |
| Set up test database and run API tests | `npm run test:api:setup` |
| Run API tests with an existing test database | `npm run test:api` |
| Check safe responses to database failures | `npm run test:api:db-down` |

Run `npm run build` before `npm start` or the API tests.

## REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/issues` | List issues, newest first; accepts `q` and `status`. |
| `POST` | `/api/issues` | Create an issue; returns `201`. |
| `GET` | `/api/issues/:id` | Retrieve one issue. |
| `PATCH` | `/api/issues/:id` | Update the supplied fields; omitted fields stay unchanged. |
| `DELETE` | `/api/issues/:id` | Delete an issue; returns `204` with no response body. |
| `GET` | `/api/users` | List available assignees. |

Send JSON bodies for create and update requests. Supported issue fields are `title`, `description`, `status`, `priority`, and `assigneeId`. Set `assigneeId` to `null` to remove an assignment.

Example combined query:

```text
GET /api/issues?q=login&status=OPEN
```

Search matches the title **or** description, and the status filter further restricts those matches. See the [query reference](docs/api.md) for validation limits, literal search characters, and collation behavior.

The API returns `400` for invalid input, `404` for a missing issue, and a generic `500` for unexpected failures. Detailed server errors are not returned to users.

## Testing

### Automated API tests

The suite starts its own production server against a separate MySQL test database and sends real HTTP requests. It covers issue CRUD, partial updates, statuses, priorities, assignment, invalid input, search, and filtering.

After configuring `TEST_DATABASE_URL`:

```powershell
npm run build
npm run test:api:setup
```

For later runs against the prepared test database:

```powershell
npm run test:api
```

The separate database-failure checks run with:

```powershell
npm run test:api:db-down
```

The latest recorded verification run completed **112 API checks** and **7 database-failure checks**, with no failures. These are recorded results; rerun the commands to verify your environment.

The script checks for a separate test database, requires `test` in its name, and refuses an occupied test port. It cleans up the issues it creates and exits with code `1` when checks fail. See [test setup and safety details](scripts/README.md).

The npm aliases invoke `powershell`. The suite has been verified with Windows PowerShell 5.1; macOS, Linux, and PowerShell 7 are not verified.

### Manual testing

I used Postman to inspect requests and responses independently of the interface, then checked the browser workflows for creation, editing, assignment, search, filtering, and deletion.

The [manual testing evidence](docs/testing.md) contains selected screenshots with the request, expected outcome, and observed result. It supplements the automated suite and is not a complete screenshot record of every check.

## Project organization

| Location | Responsibility |
| --- | --- |
| `app/api/` | REST route handlers. |
| `app/issues/(list)/` | Issue list and URL-based search/filter controls. |
| `app/issues/[id]/` | Issue detail, edit, delete, and not-found handling. |
| `app/issues/new/` | Create-issue page. |
| `app/issues/_components/` | Shared form and supporting UI components. |
| `app/validationSchemas.ts` | Shared input and query validation. |
| `lib/` | Database operations, request helpers, and ID parsing. |
| `prisma/` | Schema, migrations, seed script, and shared Prisma client. |
| `scripts/` | Automated API tests and instructions. |
| `docs/` | API reference, manual testing evidence, and migration notes. |

## Assumptions and limitations

- There is no authentication or authorization. Anyone with access to the application can manage issues.
- Seeded users exist only for assignment. There is no user-management interface, and names are unique to support repeatable seeding.
- Descriptions are stored as Markdown text. Raw HTML is not rendered when displaying them.
- Search is case-insensitive and accent-insensitive with the verified `utf8mb4_unicode_ci` column collation. Literal wildcard handling assumes the documented MySQL configuration.
- Lists are not paginated. Substring text search can become expensive on larger datasets; a leading wildcard prevents an efficient B-tree prefix lookup for the text condition.
- Concurrent edits use last-write-wins behavior; there is no conflict detection.
- Dates are displayed in the server's time zone.
- Empty filter submissions may leave `?q=&status=` in the URL; this behaves like an unfiltered list.
- Automated coverage is API-level only. There are no automated browser tests, unit-test suite, or CI pipeline.
- Migrations and setup were checked on Windows MySQL, including a fresh-checkout run. A case-sensitive Linux MySQL environment remains unverified.

## Engineering decisions and resources

I used a tutorial for the initial foundation and ChatGPT and Claude Code for explanations, troubleshooting, implementation assistance, and automated test development. I manually tested the API and browser flows alongside the automated checks.

[ENGINEERING.md](ENGINEERING.md) explains the architecture, difficulties encountered, future improvements, scaling considerations, and resource usage.

## Further documentation

- [Manual testing evidence](docs/testing.md)
- [API query reference](docs/api.md)
- [Automated test instructions](scripts/README.md)
- [Engineering decisions](ENGINEERING.md)
- [Historical migration repair](docs/migrations.md)
