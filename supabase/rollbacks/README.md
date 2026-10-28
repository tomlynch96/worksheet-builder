# Rollbacks

Down scripts for migrations that change existing data. They are **not** applied
automatically: run one by hand (Supabase SQL editor) to undo its migration.

| Migration | Rollback |
|---|---|
| `026_remap_alevel_spec_refs.sql` | `026_alevel_spec_refs_down.sql` |

`026` is generated from `scripts/spec-ref-map-alevel.json`
(`node scripts/gen-spec-ref-migration.mjs`), validated with
`npx tsx scripts/validate-spec-ref-map.mts`, and tested against a real Postgres with
`npm i --no-save @electric-sql/pglite && node scripts/test-spec-ref-migration.mjs`.
