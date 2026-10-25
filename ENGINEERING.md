# Engineering notes

## 1. Why this technology stack?

- **Next.js (App Router) with TypeScript.** One project holds both the REST API
  (route handlers in `app/api/`) and the UI. Server Components such as the
  issues list read the database directly through the same functions the API
  uses, so there is no second backend to run. TypeScript catches mismatches
  between the database types, the validation schemas and the UI at build time.
- **Prisma with MySQL.** MySQL was one of the suggested databases and I already
  had it running locally. Prisma provides the schema file, versioned SQL
  migrations (committed in `prisma/migrations/`), a repeatable seed script and
  typed queries. The query filters (`contains`, `OR`, `status`) map directly to
  the search and filter requirements.
- **Zod.** One set of schemas (`app/validationSchemas.ts`) validates the API
  requests, the browser form (through React Hook Form) and the list page's query
  parameters, so the rules cannot drift apart.
- **Radix UI Themes and Tailwind.** They provide accessible building blocks
  (select menus, the delete confirmation dialog, tables) without designing
  components from scratch, and they keep the styling small.

## 2. How is the application structured, and why?

- `app/api/**/route.ts`: thin HTTP handlers. Each one parses the ID or JSON,
  validates it with Zod, calls one data function, and maps the result to a status
  code (`400`, `404`, `201`, `204` or `500`).
- `lib/issues.ts`, `lib/users.ts`: all Prisma queries, including the
  search/filter `where` clause, the fields returned, and translating Prisma's
  "record not found" error into `null`/`false`. The API and the Server
  Components share them, so the list page and `GET /api/issues` cannot behave
  differently.
- `lib/api.ts`, `lib/ids.ts`: the shared error format (`{ error, details }`),
  safe JSON reading, and strict ID parsing. `"1abc"`, `-1`, `1.5` and `01` are
  rejected rather than partially parsed.
- `app/issues/**`: the pages. Reads happen in Server Components. Interactive
  parts are small Client Components: the shared create/edit form, the delete
  button and the filters. They call the REST API for writes.
- `scripts/api-smoke-test.ps1`: end-to-end tests against a real server and a
  separate test database. The script has guards so that it cannot run against
  the development database.

The aim was for each layer to do one job, so a reader can follow a request from
the handler to the query in two files.

## 3. What was the most difficult part?

The hardest part was not the CRUD itself but correctness at the edges, where
the tools behave differently from what you would assume:

- **A migration that only worked on Windows.** An early migration altered the
  table `issue` while the first migration created `Issue`. MySQL on Windows
  ignores table-name case, so it ran locally, but on Linux it would fail. Fixing
  the file changed its Prisma checksum. I had to repair the stored checksum
  without resetting the database or losing data, and document it
  (`docs/migrations.md`). A later generated migration had the same lowercase
  name, which I corrected before applying it.
- **Search that looked right but was not.** Prisma's MySQL `contains` has no
  case-insensitive mode, and it does not escape `%` and `_`. A search for "50%"
  matched unrelated issues. Testing against the real database showed both
  problems. The search now escapes those characters, and it relies on the
  columns' `utf8mb4_unicode_ci` collation for case-insensitivity, which is
  documented in `docs/api.md`.
- **404 status codes.** A `loading.tsx` above the detail pages made "not found"
  pages return HTTP 200, because streaming starts before the ID is checked.
  Moving the list into a route group fixed this without changing any URL.

## 4. What would I improve with another two days?

- Replace or complement the PowerShell smoke test with a cross-platform test
  runner. That would mean unit tests for the schemas, ID parsing and
  search-escaping helpers, plus the existing API checks, run by `npm test` in a
  CI pipeline.
- Verify the migrations and the tests on Linux with a case-sensitive MySQL
  server. This has not been done.
- Add pagination to the list and the API.
- Detect conflicting edits, for example by rejecting a `PATCH` whose
  `updatedAt` is out of date, instead of last-write-wins.
- Small UX fixes: show dates in the viewer's time zone, and leave empty filter
  fields out of the URL.

## 5. What would I reconsider at 100,000 users?

Registered users and concurrent load are different problems. 100,000 accounts
with little activity mostly affect data size and the user-facing features.
Thousands of people using it at the same time affect request handling and the
database.

- **Authentication and authorization** would be required. Today there are no
  logins, and anyone can edit or delete any issue.
- **Unbounded queries.** `GET /api/issues` and the list page return every
  matching issue, and the assignee dropdown loads every user. Both need
  pagination, and the user picker needs a server-side search.
- **Search.** `LIKE '%term%'` scans every row. I would add indexes for common
  filters (for example `status` with `createdAt`) and move text search to MySQL
  full-text indexes or a dedicated search service.
- **Data model.** The unique constraint on user names only exists to make the
  seed repeatable, and would have to go. Real users would need stable
  identifiers such as email, plus probably projects or teams to scope issues.
- **Concurrency.** With many people editing the same issues, last-write-wins
  would lose changes. Optimistic locking on `updatedAt` would be needed.
- **Running more than one server.** Database connection limits (the Prisma
  connection pool per instance), caching for read-heavy pages (every page is
  currently rendered on each request), rate limiting, and structured logging and
  monitoring instead of `console.error`.

None of these are implemented. They are the parts of the current design I would
revisit first.
