# Migration notes

## One-time repair: table casing in `add_resolved_status` (2026-10-24)

`20261019025636_create_issue` creates `` `Issue` ``, but
`20261019030806_add_resolved_status` altered `` `issue` ``. That works on
case-insensitive MySQL (Windows/macOS defaults) but fails on Linux, where
table names are case-sensitive by default. The second migration now uses
`` `Issue` ``; nothing else in it changed.

Because the file changed after being applied, its stored Prisma checksum was
updated on the original development database only (one row in
`_prisma_migrations`, no data or schema changes).

**Other databases:**

- **Fresh databases:** nothing to do.
- **A database that applied the old file** (created before 2026-10-24):
  `prisma migrate dev` will report the migration as modified. **Do not accept
  a reset.** Run this instead:

  ```sql
  UPDATE _prisma_migrations
  SET checksum = 'd46e2c7f5a4b34b08b3857838777b039173fc1156bdf8aad1c2272c28a7edafb'
  WHERE migration_name = '20261019030806_add_resolved_status'
    AND checksum = '76e13f3d511934c95835ece741c34d9a3e8c1a9dda877969e73bc7005db59bd1';
  ```

**Verification:**

- Done: fresh database on local Windows MySQL 8.0, no schema drift.
- **Pending:** a case-sensitive MySQL server (`lower_case_table_names=0`).
  Not yet run.

`.gitattributes` keeps migration SQL files LF so checksums match on every platform.
