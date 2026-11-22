# Rollbacks

Down scripts for migrations that change existing data. They are **not** applied
automatically: run one by hand (Supabase SQL editor) to undo its migration.
**Run them in reverse order** (027 before 026).

| Migration | Rollback | What it undoes |
|---|---|---|
| `027_spec_ref_notice_and_flags.sql` | `027_spec_ref_notice_and_flags_down.sql` | the in-app notice switch, per-user undo function, acknowledgements; keeps `spec_ref_flags` if it has reports in it |
| `026_remap_alevel_spec_refs.sql` | `026_alevel_spec_refs_down.sql` | restores every remapped spec tag (worksheets, header blocks, scheme topics, diagram tags) from the log; never overwrites a value edited since |

Teachers can also undo their own retags one row at a time from the notice (and re-apply them).

`026` is generated from `scripts/spec-ref-map-alevel.json` + `scripts/spec-ref-old-titles.json`
(`node scripts/gen-spec-ref-migration.mjs`) and validated with
`npx tsx scripts/validate-spec-ref-map.mts`. Both migrations and both rollbacks are tested
against a real Postgres, with a schema that mirrors production (row level security, no
`updated_at` trigger), by:

    npm i --no-save @electric-sql/pglite && node scripts/test-spec-ref-migration.mjs

To switch the notice off for everyone without rolling anything back:

    update public.app_config set value = '' where key = 'spec_ref_notice';
