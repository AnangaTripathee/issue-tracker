# Engineering Notes

## 1. Why did I choose this technology stack?

I chose **Next.js with TypeScript** because it let me build the interface and REST API in one project. For this assessment, that kept the setup manageable: there is one application to run, and the pages and API can share database functions.

I was still building confidence with the stack, so I started with a tutorial to establish a working foundation. Extending that foundation helped me understand how the form, validation, API, and database fit together. TypeScript was useful when changing the issue model and connecting those changes to the interface, although runtime validation was still necessary.

I used **MySQL with Prisma** because the data is relational: an issue can belong to an assignee, and that assignee must exist. I already had MySQL and Workbench available locally, which made it easier to inspect records while testing. Prisma provided typed queries, a readable schema, versioned migrations, and a repeatable seed script.

**Zod and React Hook Form** helped me share validation rules between the API and browser forms. The list page and API also share query validation for search and filtering. This reduces duplicated rules while keeping validation on the server.

For the interface, I used **Radix UI Themes and Tailwind CSS**. They provided consistent components and styling so I could spend more time on application behavior. I still manually checked keyboard interaction and narrow-screen layouts rather than assuming the component library handled everything.

## 2. How did I structure the application, and why?

I separated HTTP handling, database operations, and interface code so I could work on each without putting most of the application in one file.

- **`app/api/`** contains the REST route handlers. They parse requests, validate input, call shared database functions, and return appropriate responses.
- **`lib/issues.ts` and `lib/users.ts`** contain the database operations. The API and Server Components reuse these functions, including the issue search and filtering logic.
- **`lib/api.ts` and `lib/ids.ts`** contain shared request helpers, error formatting, and strict ID parsing.
- **`app/validationSchemas.ts`** contains the validation schemas for issue fields and list query parameters.
- **`app/issues/`** contains the list, detail, create, and edit pages, along with their supporting components.
- **`prisma/`** contains the schema, migrations, database client, and seed script.
- **`scripts/`** contains the automated API smoke tests and instructions for running them.

Server Components read data through the shared database functions. Interactive components, such as the create/edit form and delete button, use the API for writes.

The create and edit pages share one form because they use the same fields and much of the same behavior. This means a validation or error-display improvement can apply to both.

Search and status filters are stored in the URL. That makes the filtered view refreshable and shareable, and lets browser back and forward navigation restore previous selections.

I wanted the structure to be easy to follow without adding layers that this application did not need.

## 3. What was the most difficult part of the task?

The hardest part was moving from following a tutorial to checking whether I had actually met the assessment requirements.

The initial create-issue flow gave me a working starting point. After that, I had to identify the missing functionality, extend the data model, and verify that the features worked together. Breaking the work into phases helped me focus on the API first, then the interface, and then search and filtering.

A few specific problems changed how I approached testing:

### Migration portability

The first migration created a table named `Issue`, but a later migration referred to `issue`. This worked on my Windows MySQL setup, but could fail on a case-sensitive MySQL server.

Correcting an already-applied migration also changed its checksum. The development database needed a one-time repair, which is documented in `docs/migrations.md`. This was an exception to handle an early development mistake, rather than a pattern I would use for future schema changes.

The experience taught me to check migration files and think about a fresh setup on another machine. Verification on a case-sensitive Linux MySQL server is still outstanding.

### Literal search characters

Ordinary searches worked, but `%` and `_` were being treated as SQL wildcard characters. That meant searching for `50%` could return results that did not contain that text.

Testing against MySQL exposed the problem. The search now escapes those characters, with the database assumptions documented in `docs/api.md`. I also checked the column collation instead of assuming how case sensitivity would behave.

### Not-found responses

The detail page displayed a not-found message but initially returned HTTP `200`. A shared loading boundary had already started streaming the response before the missing issue was detected.

Moving the list and its loading boundary into a route group allowed detail and edit pages to return `404` without changing their URLs. This reminded me to check both what appears in the browser and what the server actually returns.

## 4. What would I improve with another two days?

My first priority would be making verification easier to repeat across environments.

- **Cross-platform tests and CI:** Keep the existing API coverage, but make it easier to run outside Windows PowerShell. Add focused tests for query validation, strict ID parsing, and search escaping, then run checks automatically in CI.
- **Browser automation:** Automate the create, edit, assignment, filtering, and deletion flows that I currently check manually. API tests cannot confirm that a form is populated correctly or that navigation updates the visible page.
- **Linux setup verification:** Apply the migrations to a fresh, case-sensitive MySQL database and follow the README from a clean checkout.
- **Pagination:** Avoid returning every matching issue as the dataset grows.
- **Conflicting edits:** Detect when an issue has changed since someone opened the edit form, rather than silently allowing the last save to overwrite earlier changes.
- **Small usability improvements:** Display dates in the viewer’s time zone and omit empty filter values from the URL.

I would prioritize these improvements before adding more features.

## 5. What would I reconsider if the application grew to 100,000 users?

I would first measure actual usage. The number of accounts, the number of issues, and the number of simultaneous requests create different demands. I would use query timings and application metrics to decide what to change.

The main areas I would revisit are:

- **Authentication and authorization:** The current application has seeded assignees rather than login accounts. A shared application would need identities and permissions controlling who can view, edit, assign, and delete issues.
- **Bounded data retrieval:** The issue list currently returns all matching records, and the assignee selector loads all users. I would introduce pagination and a searchable user picker.
- **Search and indexes:** Substring search with a leading wildcard becomes expensive as the dataset grows. I would inspect query plans, add indexes for common filter and ordering patterns, and evaluate MySQL full-text search before introducing a separate search service.
- **User and project modeling:** Unique names currently make the seed script repeatable. Real users should be allowed to share names and have separate stable identities. Projects or teams would also provide a useful boundary for issues and permissions.
- **Concurrent updates:** I would introduce optimistic concurrency control, using a version or update timestamp to detect conflicting edits.
- **Database connections and deployment:** Multiple application instances create multiple connection pools. I would review connection limits, pooling, and deployment behavior before increasing server instances.
- **Operations:** Structured logs, monitoring, rate limiting, backups, and a controlled migration process would become necessary. I would consider caching where measurements show it would help, with clear rules for keeping issue data current.

These are future considerations, not capabilities implemented in this submission.

## AI and External Resources

I used a tutorial to establish the initial project setup, database configuration, and create-issue flow. I then extended that foundation to address the remaining assessment requirements.

I used **ChatGPT and Claude Code** for explanations, syntax questions, troubleshooting, implementation assistance, and automated test development. 

I checked the application through automated API tests, manual Postman requests, and browser testing. Manual checks included creating and editing issues, changing assignments, combining search with status filters, and confirming deletion behavior.

Using these resources helped me make progress while learning the stack. I remain responsible for the submitted code, the decisions described here, and explaining the implementation and its limitations.