# Claude connector (MCP server)

Teachers can plan and write worksheets with Claude, and Claude saves them straight into their Worksheet Project library: tagged to the site's spec taxonomy, private, and flagged for review the first time the teacher opens them.

> **Admin accounts only for now.** Enforced in five places:
> - the Profile page only shows the connector to admins
> - the database only lets admins create personal tokens (`mcp_tokens` insert policy)
> - the consent page and `/api/oauth/approve` refuse non-admins
> - `/api/oauth/token` refuses to issue or refresh tokens for non-admins
> - `api/mcp.ts` refuses any token whose owner isn't an admin, with a 403
>
> To open it to every teacher:
> - set `ADMIN_ONLY = false` in `api/mcp.ts`
> - remove the `isAdmin` checks in `api/_lib/oauth.ts` (`approve` and both grants in `token`)
> - remove the admin note and the disabled state in `src/pages/OAuthAuthorizePage.tsx`
> - recreate the insert policy without `and public.is_admin()`
> - drop the `profile?.is_admin &&` guard in `src/pages/ProfilePage.tsx`

- Endpoint: `https://<site>/api/mcp` (stateless Streamable HTTP, POST only)
- Auth: **OAuth sign-in** (claude.ai, the Claude desktop app, Claude Code), or a personal token from the **Profile** page for clients without sign-in
- Code: `api/mcp.ts`, `api/_lib/`

## One-off setup (site owner)

1. **Run the migrations** (all done on the `worksheet-builder` project on 28 Nov 2026). In the Supabase SQL editor, run them in this order: `029_protect_is_admin.sql`, `028_mcp_connector.sql`, `030_mcp_oauth.sql`.
   - **029** stops users from setting `is_admin` on their own profile, which the admin-only gate depends on.
   - **028** adds the `mcp_tokens` table and the `source`, `needs_review`, `first_opened_at` and `reviewed_at` columns on `worksheets`.
   - **030** adds the OAuth tables (`oauth_clients`, `oauth_codes`) and lets `mcp_tokens` hold sign-in connections.

   Rollbacks for all three are in `supabase/rollbacks/`.
2. **Add the service-role key to Vercel.** Project → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY`, copied from Supabase → Project Settings → API. It is server-only: never prefix it with `VITE_`. The server also needs the project URL; it reads `SUPABASE_URL`, falling back to the existing `VITE_SUPABASE_URL`.
   - Preview deployments use the Preview environment's values. If previews point at your live database, testing the connector on a preview writes to live data.
3. *(Optional)* `SITE_URL`, e.g. `https://theworksheetproject.co.uk`, if links in Claude's replies should always use your main domain. Otherwise they use the domain the request came in on.
4. Deploy.

## Connecting Claude (each admin, for now)

**Claude in the browser, or the Claude desktop app** (sign-in, no token):
1. Go to **Customize → Connectors → + Add → Add custom connector** (Team/Enterprise: Organization settings → Connectors → Add → Custom → Web).
2. Set **Name** to The Worksheet Project and **URL** to `https://<site>/api/mcp`. Leave sign-in switched on, and leave the OAuth client on the recommended default.
3. Click **Add**, then **Connect**. Claude sends you to `https://<site>/oauth/authorize`: log in if asked, then click **Allow**, and you're returned to Claude.

**Claude Code:**

```bash
claude mcp add --transport http worksheet-project https://<site>/api/mcp
```

Then type `/mcp` in Claude Code and choose **Authenticate**. It opens the same consent page.

**Anything without sign-in:** on the Profile page, open **Use a personal token instead** to create a token. It's shown once, with setup for Claude Code (`--header "Authorization: Bearer <token>"`), the Claude Desktop config file (via `mcp-remote`), and claude.ai's beta request headers (`x-api-key`). The server accepts the token as `Authorization: Bearer <token>`, or bare in `x-api-key` or `x-auth-token`.

The Profile page lists every connection, both sign-ins and tokens, with when each was last used, and **Disconnect** ends it straight away.

### How sign-in works (`api/oauth.ts`, `api/_lib/oauth.ts`)

It follows the MCP authorization spec (OAuth 2.1 with PKCE). It's a single Vercel function; `vercel.json` rewrites these paths to it:

| Path | Purpose |
|---|---|
| `/.well-known/oauth-protected-resource` | Says which sign-in service protects `/api/mcp`. Linked from the 401's `WWW-Authenticate` header. |
| `/.well-known/oauth-authorization-server` | What the sign-in service supports |
| `/api/oauth/register` | Automatic client registration (Dynamic Client Registration) |
| `/oauth/authorize` | The consent page (React, `src/pages/OAuthAuthorizePage.tsx`) |
| `/api/oauth/authorize-info`, `/api/oauth/approve` | Called by the consent page. `approve` checks the site login and creates a 10-minute, single-use code. |
| `/api/oauth/token` | Code + PKCE → a 1-hour access token and a 90-day refresh token, rotated on every use |
| `/api/oauth/revoke` | Token revocation |

- **Client identity:** clients can identify themselves by registering, or with a published client metadata document (claude.ai's default, "Claude's published identity"). Metadata documents are only fetched from Anthropic domains.
- **Redirect addresses:** while trialling, only Claude (`claude.ai`, `claude.com`) and local apps (`http://localhost`, `127.0.0.1`) can be sent a code. This is `isAllowedRedirect` in `api/_lib/oauth.ts`.
- **Connections:** stored in `mcp_tokens` as `kind = 'oauth'`, with hashed access and refresh tokens. `/api/mcp` checks them exactly like personal tokens.
- **Login caveat:** the consent page sends logged-out teachers to `/onboarding` and back. Google, Microsoft and password sign-in return to the same page. **Magic-link emails currently always open `worksheet-builder-ten.vercel.app`** (`emailRedirectTo` in `src/hooks/useProfile.ts`), so a teacher who signs in by email mid-connection lands on that domain and has to start connecting again.

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

- **Token storage:** only SHA-256 hashes of tokens, refresh tokens and authorization codes are stored. Revoking (Disconnect, or the revocation endpoint) sets `revoked_at`, and the server rejects the connection straight away.
- **OAuth safeguards:**
  - PKCE (S256) is required
  - codes are single-use and expire after 10 minutes
  - redirect addresses must exactly match a registered one and be on the allowed list; errors are only sent back to trusted addresses
  - refresh tokens rotate, so an old one stops working
  - `oauth_clients` and `oauth_codes` have row security with no policies, so only the server can read them
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

```bash
npm run test:oauth   # end-to-end sign-in: discovery, registration, published identity, PKCE, refresh, revocation, admin gate
```

`api/` runs as plain Node ES modules on Vercel, so relative imports there need `.js` extensions and can't import `src/data` directly. That's why the taxonomy and guide are generated into `api/_lib/*.generated.ts`. Commit the regenerated files.

## Not built yet

- **Print-ready PDF and page previews.** The plan is a server-side render of the same print view in headless Chromium, so Claude can check layout and hand back a PDF.
- **Booklet images for diagrams.** Booklets print diagrams from a PNG copy the editor makes in the browser. A diagram from Claude only gets that copy when the teacher changes its labelled values or edits it in the Diagram Studio; until then it may be missing from booklets.
- **Planned-use date and post-use reflection** (priority 7 in CLAUDE.md).
