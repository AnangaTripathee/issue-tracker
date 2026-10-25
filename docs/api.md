# API reference: listing, searching and filtering issues

## `GET /api/issues`

Returns issues newest first (by `createdAt`, then `id`). Each issue has the same
shape as the other issue endpoints, including `assignee: { id, name } | null`.

### Query parameters

Both parameters are optional. Unknown parameters are ignored.

| Parameter | Meaning | Rules |
|---|---|---|
| `q` | Search text. An issue matches if its **title or description** contains it. | Surrounding whitespace is trimmed. Empty or whitespace-only means no search. At most **100 characters** after trimming. |
| `status` | Only issues with this status. | One of `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, in upper case. Empty means no status filter. |

Each parameter may appear only once. Repeating one, for example
`?status=OPEN&status=CLOSED`, is rejected.

When both are given, the filter is:

```
(title contains q OR description contains q) AND status = <status>
```

With neither parameter, or with empty values such as `?q=&status=`, the full list
is returned.

### Search behaviour

- **Substring match.** `login` matches "Login page broken" and "after login".
  `%` and `_` are matched literally, not as SQL wildcards.
- **Case- and accent-insensitive.** The `Issue.title` and `Issue.description`
  columns use the MySQL collation `utf8mb4_unicode_ci`, set by the first
  migration. Prisma 5's MySQL connector has no case-insensitive `mode` option, so
  the comparison follows the column collation: `LOGIN` matches "login", and
  `resume` also matches "résumé". If the collation is changed, this behaviour
  changes with it.
- The literal `%`/`_` handling escapes them with a backslash. This relies on
  MySQL's default `sql_mode`, which does not include `NO_BACKSLASH_ESCAPES`.
- The search runs in the database (SQL `LIKE '%…%'`) and cannot use an index. That
  is fine for a small tracker, but a large table would need full-text search.

### Responses

- `200` with a JSON array. The array may be empty (`[]`) when nothing matches.
- `400` for an invalid query, in the same error format as other validation errors:

  ```json
  {
    "error": "Validation failed.",
    "details": {
      "formErrors": [],
      "fieldErrors": { "status": ["Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED."] }
    }
  }
  ```

  Other messages: `"Search must be 100 characters or fewer."` and
  `"Search (q) can only be given once."`.
- `500` with `{ "error": "Could not load issues. Please try again later." }` if
  the database fails. Details are only logged on the server.

### Examples

```
GET /api/issues
GET /api/issues?q=login
GET /api/issues?status=OPEN
GET /api/issues?q=login&status=OPEN
GET /api/issues?q=login%20page          (spaces must be URL-encoded)
GET /api/issues?q=&status=              (same as no parameters)
GET /api/issues?status=DONE             -> 400
```

## Issues page

The `/issues` page uses the same parameters and the same validation, for example
`/issues?q=login&status=OPEN`. Invalid values typed into the address bar show a
message and a "Clear filters" link instead of a list.
