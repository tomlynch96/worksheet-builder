# Claude connector (MCP server)

Teachers can plan and write worksheets with Claude, and Claude saves them straight into their Worksheet Project library: tagged to the site's spec taxonomy, private, and flagged for review the first time the teacher opens them.

> **Admin accounts only for now.** Three layers enforce this:
> - the Profile page only shows the connector to admins
> - the database only lets admins create tokens (`mcp_tokens` insert policy)
> - `api/mcp.ts` refuses tokens whose owner isn't an admin, with a 403
>
> To open it to every teacher, set `ADMIN_ONLY = false` in `api/mcp.ts`, recreate the insert policy without `and public.is_admin()`, and drop the `profile?.is_admin &&` guard in `src/pages/ProfilePage.tsx`.

- Endpoint: `https://<site>/api/mcp` (stateless Streamable HTTP, POST only)
- Auth: a personal token each teacher creates on their **Profile** page, sent as `Authorization: Bearer <token>`
- Code: `api/mcp.ts`, `api/_lib/`

## One-off setup (site owner)

1. **Run the migrations** (done on the `worksheet-builder` project on 28 Nov 2026). In the Supabase SQL editor, run `supabase/migrations/029_protect_is_admin.sql`, then `supabase/migrations/028_mcp_connector.sql`. 029 stops users from setting `is_admin` on their own profile, which the admin-only gate depends on. It adds the `mcp_tokens` table and the `source`, `needs_review`, `first_opened_at` and `reviewed_at` columns on `worksheets`. To undo it, run `supabase/rollbacks/028_mcp_connector_down.sql`.
2. **Add the service-role key to Vercel.** Project → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY`, copied from Supabase → Project Settings → API. It is server-only: never prefix it with `VITE_`. The server also needs the project URL; it reads `SUPABASE_URL`, falling back to the existing `VITE_SUPABASE_URL`.
   - Preview deployments use the Preview environment's values. If previews point at your live database, testing the connector on a preview writes to live data.
3. *(Optional)* `SITE_URL`, e.g. `https://theworksheetproject.co.uk`, if links in Claude's replies should always use your main domain. Otherwise they use the domain the request came in on.
4. Deploy.

## Connecting Claude (each admin, for now)

On the site: **Profile → Claude connector → Connect Claude**. The token is shown once, with ready-to-copy setup for:

- **Claude Code**
  ```bash
  claude mcp add --transport http worksheet-project https://<site>/api/mcp --header "Authorization: Bearer <token>"
  ```
- **Claude Desktop** (needs Node.js): add this to `claude_desktop_config.json` (Settings → Developer → Edit Config), then restart Claude:
  ```json
  { "mcpServers": { "worksheet-project": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<site>/api/mcp", "--header", "Authorization:${AUTH_HEADER}"],
      "env": { "AUTH_HEADER": "Bearer <token>" } } } }
  ```
- **claude.ai on the web:** not yet. Custom connectors there need OAuth sign-in, which is the next step (see *Not built yet*).

Teachers can name, see the last use of, and disconnect each connection on the same page.

## What Claude can do

| Tool | What it does |
|---|---|
| `get_worksheet_guide` | The full format guide (also the `worksheet://guide` resource). Generated from `docs/worksheet-json-prompt.template.md`. |
| `list_my_courses` | The teacher's courses/boards, plus every course the site supports |
| `search_spec` | Find spec points by words or ref, within a course and board |
| `get_spec_topics` | Browse a spec's topics, or the points in one topic |
| `search_library` | Published sheets for a spec point, best-rated first |
| `list_my_worksheets` | The teacher's own sheets |
| `get_worksheet` | Read one sheet in full (own, published or shared) |
| `save_worksheet` | Check and save a sheet (see below) |
| `list_schemes`, `get_scheme` | The teacher's schemes of work, week by week |
| `add_scheme_topic` | Put a spec topic into a scheme for a week or range of weeks |
| `add_worksheet_to_scheme` | Attach a saved sheet to a scheme topic |

It also adds two slash commands: `/make-worksheet` and `/plan-unit`.

### How `save_worksheet` protects the library

- **Checks before saving** (`api/_lib/worksheet-check.ts`). The `qualification`, `examBoard` and `specPoint` must exist in the site's taxonomy; a wrong ref is refused with the closest real refs. The checker also covers:
  - every block's required fields
  - unique ids
  - every table/graph/figure reference
  - linked-graph rules
  - SVG safety (no scripts, external links, images or styles)

  Problems come back as a precise list for Claude to fix. The server never guesses repairs.
- **Saves as an AI draft.** Sheets are saved with `source = 'mcp'`, `needs_review = true`, `ai_generated = true` and `original_blocks` = what Claude wrote. They are private: not public and not shared.
- **No publishing from Claude.** Teachers publish from the site.
- **Limited overwriting.** Claude can replace a sheet it saved only while it is still an unreviewed draft. Once the teacher has reviewed or edited it, or for any sheet it doesn't own, Claude must save a new sheet instead.
- **Diagrams aren't added to the shared library automatically.** The teacher shares them from the figure editor after review.

## What the teacher sees on the site

- **Link:** Claude's reply links to `/share/<id>`. The sheet's owner can open it before sharing is switched on; everyone else still needs the teacher to press **Share**. Logged-out visitors are sent to log in and brought back.
- **First open:** a dialog asks the teacher to check the questions, the mark scheme, the spec tag and any diagrams. **Start reviewing** leaves a slim reminder bar. **Looks good** or **any edit** clears the flag.
- **Edit tracking:** edits are compared with Claude's original version, however the sheet was opened (gallery, link or scheme).
- **Library prompt:** the "add to public library?" question waits until the sheet has been reviewed.
- **Gallery:** shows "From Claude · N worksheets waiting for your review" above the course groups, and a badge on each card.

## Security notes

- **Token storage:** only a SHA-256 hash of each token is stored. Revoking a token sets `revoked_at`, and the server rejects it straight away.
- **Service-role key:** the server uses it, which bypasses row-level security. Every query in `api/_lib/store.ts` therefore filters on the token's teacher explicitly. Keep it that way when adding tools.
- **Library content:** text from library worksheets is returned to Claude as content written by other teachers. The server instructions tell Claude to treat it as data, not instructions.

## Maintaining it

```bash
npm run gen:prompt   # regenerate the chat prompt, the MCP guide and the API taxonomy after changing the guide or specs
```

```bash
npm run check:api    # type-check the MCP server the way Vercel runs it (Node ES modules)
```

```bash
npm run test:mcp     # end-to-end: the real handler + MCP client against an in-memory database
```

`api/` runs as plain Node ES modules on Vercel, so relative imports there need `.js` extensions and can't import `src/data` directly. That's why the taxonomy and guide are generated into `api/_lib/*.generated.ts`. Commit the regenerated files.

## Not built yet

- **OAuth sign-in,** so teachers can add the connector in claude.ai on the web (and Desktop without the config file).
- **Print-ready PDF and page previews.** The plan is a server-side render of the same print view in headless Chromium, so Claude can check layout and hand back a PDF.
- **Booklet images for diagrams.** Booklets print diagrams from a PNG copy the editor makes in the browser. A diagram from Claude only gets that copy when the teacher changes its labelled values or edits it in the Diagram Studio; until then it may be missing from booklets.
- **Planned-use date and post-use reflection** (priority 7 in CLAUDE.md).
