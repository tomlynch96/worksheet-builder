-- Allow anyone with the quiz ID to read it (UUID is unguessable — same pattern as share links).
-- Required so the /mark/:quizId/:versionNumber page works without login.
create policy "public: read mc_quizzes by id"
  on mc_quizzes for select
  using (true);
