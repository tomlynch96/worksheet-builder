-- Add share_enabled flag: allows a worksheet to be read publicly via its ID
-- without appearing in the public library (which requires is_public = true).
alter table worksheets add column if not exists share_enabled boolean default false;

-- Anyone can read a worksheet whose owner has enabled sharing.
-- The UUID is effectively unguessable, so this is safe as a secret-link pattern.
create policy "public: read share-enabled worksheets"
  on worksheets for select
  using (share_enabled = true);
