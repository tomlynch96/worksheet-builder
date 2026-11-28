-- Rollback for 028_mcp_connector.sql.
--
-- Removes the connector tokens (every Claude connection stops working) and the review columns.
-- Worksheets saved from Claude stay in teachers' libraries; they just lose their "from Claude"
-- and "needs review" markers.

begin;

drop index if exists public.worksheets_needs_review;

alter table public.worksheets
  drop column if exists reviewed_at,
  drop column if exists first_opened_at,
  drop column if exists needs_review,
  drop column if exists source;

drop table if exists public.mcp_tokens;

commit;
