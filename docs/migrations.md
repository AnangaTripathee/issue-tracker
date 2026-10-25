# Migration notes

## One-time repair: table name casing in `add_resolved_status` (2026-10-24)

### What was wrong

- `20261019025636_create_issue` creates the table as `` `Issue` ``.
- `20261019030806_add_resolved_status` originally altered `` `issue` `` (lowercase).

MySQL on Windows (and macOS by default) ignores table-name case
(`lower_case_table_names` = 1 or 2), so this worked locally. MySQL on Linux
defaults to `lower_case_table_names=0`, where table names are case-sensitive,
so the second migration would fail there with "table doesn't exist".

### What changed

The second migration now alters `` `Issue` ``. The SQL is otherwise unchanged.

Prisma stores a SHA-256 checksum of every applied `migration.sql` in the
`_prisma_migrations` table. Editing an applied file makes `prisma migrate dev`
report a modified migration and offer to reset the database. To avoid that,
the stored checksum of this one migration was updated to match the edited file
on the original development database (one row, `20261019030806_add_resolved_status`):

- Old: `76e13f3d511934c95835ece741c34d9a3e8c1a9dda877969e73bc7005db59bd1`
- New: `d46e2c7f5a4b34b08b3857838777b039173fc1156bdf8aad1c2272c28a7edafb`

This was safe because, on a case-insensitive server, `` `Issue` `` and
`` `issue` `` name the same table, so the SQL that was applied is identical in
effect to the edited SQL. No table data, schema, or migration history was changed.

### Which databases are affected

- **Fresh databases (any new clone):** not affected. `prisma migrate deploy`
  or `prisma migrate dev` applies the corrected SQL. Nothing to do.
- **The original development database:** already repaired as described above.
- **Any other database that applied the old version of this migration**
  (for example, a copy made before 2026-10-24): its stored checksum is still the
  old one, so `prisma migrate dev` will report the migration as modified.
  **Do not accept a reset.** Update that one row instead:

  ```sql
  UPDATE _prisma_migrations
  SET checksum = 'd46e2c7f5a4b34b08b3857838777b039173fc1156bdf8aad1c2272c28a7edafb'
  WHERE migration_name = '20261019030806_add_resolved_status'
    AND checksum = '76e13f3d511934c95835ece741c34d9a3e8c1a9dda877969e73bc7005db59bd1';
  ```

  This only applies to a case-insensitive server, since the old migration could
  not have succeeded on a case-sensitive one.

### Verification status

- Verified: both migrations apply cleanly to a fresh database on the local
  Windows MySQL 8.0 server, and the result matches `schema.prisma` with no drift.
- **Pending:** verification on a case-sensitive MySQL server
  (`lower_case_table_names=0`, e.g. the official `mysql:8` Docker image).

### Line endings

Prisma checksums are computed from the file bytes, so `.gitattributes` keeps
migration SQL files LF-normalized on every platform.
