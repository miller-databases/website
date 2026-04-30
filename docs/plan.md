# Migration Plan: Ghost → AstroPaper for millerdatabases.com

## Goal

Migrate the existing Ghost-hosted blog at `www.millerdatabases.com` to a static
site built on AstroPaper, deployed to GitHub Pages. The Ghost JSON export is the
source of truth for content; the existing live site is the visual reference.

Success looks like: a local Astro project that builds clean, contains every post
from the export with content, dates, tags, and images intact, preserves the
existing URL slugs, and is ready to push to GitHub Pages with a custom domain.

## Inputs

- `ghost-export.json` — full Ghost content export. Place at the repo root
  (gitignored). Structure: `db[0].data.posts`, `db[0].data.tags`,
  `db[0].data.posts_tags`, `db[0].data.users`, `db[0].data.posts_authors`.
- The existing site at `https://www.millerdatabases.com` for visual reference
  when verifying converted output.
- AstroPaper repo: `https://github.com/satnaing/astro-paper`.

## Outputs

- An Astro project named `millerdatabases-site` (or similar) at the repo root.
- One Markdown file per post under `src/data/blog/` (verify path against
  AstroPaper's current `src/content/config.ts` — the directory has changed
  between AstroPaper versions; do not assume).
- All post images downloaded into `src/assets/images/posts/<slug>/` and
  referenced by relative path from each post.
- A GitHub Actions workflow that builds and deploys to GitHub Pages.
- A `CNAME` file in `public/` containing `www.millerdatabases.com`.

## Constraints

- **Slug preservation is non-negotiable.** Existing URLs like
  `/build-your-own-c-code-analyzer/` must still resolve at the same path after
  migration. AstroPaper's default `/posts/[slug]/` routing must be modified to
  serve posts at the root.
- Do not commit `ghost-export.json` to the repo — it contains member emails and
  internal IDs.
- Use Node.js for the migration script (same toolchain as the Astro project,
  avoids polyglot complexity).
- All commits should be small and named per phase below so progress can be
  reviewed before the next phase runs.

---

## Phase 1 — Scaffold AstroPaper

1. Run `npm create astro@latest` and select the AstroPaper theme, or clone
   `satnaing/astro-paper` directly and remove its `.git` directory.
2. Install dependencies and verify the site builds (`npm run dev`, then
   `npm run build`). Confirm the demo content renders before touching anything.
3. Read `src/content/config.ts` (or `src/content.config.ts` in newer
   versions) and **document the exact frontmatter schema in a comment at the
   top of the migration script**. The Phase 3 frontmatter mapping must conform
   to whatever the schema actually says, not what this plan assumes.
4. Read one of the bundled example posts end-to-end to understand image
   conventions, code-fence style, and how `ogImage` is referenced.
5. Delete the bundled example posts only after migration succeeds — keep them
   as reference until then.
6. Update `src/config.ts` with site metadata: site title "Miller Databases",
   author "Daniel Miller", site URL `https://www.millerdatabases.com`,
   description matching the current site, social links pointing to the
   existing GitHub org `miller-databases`.

**Commit:** `chore: scaffold AstroPaper site`

## Phase 2 — Build the migration script

Create `scripts/migrate-ghost.mjs`. It is a one-shot ETL: reads the Ghost JSON,
writes Markdown files plus downloads images. It does not need to be elegant; it
needs to be correct and re-runnable.

Required dependencies:
- `turndown` for HTML → Markdown conversion
- `turndown-plugin-gfm` for table and strikethrough support
- Node 20+ built-in `fetch` for image downloads
- `js-yaml` for YAML frontmatter serialization (avoids quoting bugs)

Script responsibilities, in order:

1. Parse `ghost-export.json`. Build lookup maps:
   - `tagsById` from `db[0].data.tags`
   - `postTagsByPostId` from `db[0].data.posts_tags`
   - `usersById` from `db[0].data.users`
2. For each post in `db[0].data.posts` where `status === "published"` and
   `type === "post"`:
   - Map frontmatter (see Phase 3).
   - Convert `html` field to Markdown (see Phase 4).
   - Identify all `<img src="...">` and `<a href="...">` URLs pointing at
     `storage.ghost.io` or `static.ghost.org`. Add to a global download queue.
   - Rewrite those URLs in the Markdown body to local paths.
   - Write file to `src/data/blog/<slug>.md` (path verified in Phase 1).
3. Download every queued image to
   `src/assets/images/posts/<slug>/<original-filename>`.
   Skip files that already exist (makes the script idempotent).
4. Print a summary: posts written, images downloaded, any URLs that failed to
   convert, any frontmatter fields that were null/missing.

**Commit:** `feat: add ghost migration script`

## Phase 3 — Frontmatter mapping

Map Ghost fields → AstroPaper schema fields. Verify each name against the
actual schema before relying on this table.

| Ghost field                                       | AstroPaper field   | Notes                                                              |
| ------------------------------------------------- | ------------------ | ------------------------------------------------------------------ |
| `title`                                           | `title`            | Direct copy                                                        |
| `published_at`                                    | `pubDatetime`      | ISO 8601, parse to Date                                            |
| `updated_at`                                      | `modDatetime`      | Omit if equal to `published_at`                                    |
| `custom_excerpt` ?? `meta_description`            | `description`      | Strip HTML, collapse whitespace, max ~160 chars                    |
| `feature_image` ?? `og_image`                     | `ogImage`          | Local path after Phase 5 download, e.g. `../../assets/images/posts/<slug>/cover.jpg` |
| (joined from `posts_tags`/`tags`)                 | `tags`             | Array of tag `name` values, lowercased, kebab-cased                |
| `featured`                                        | `featured`         | Boolean                                                            |
| (Daniel Miller, hardcoded)                        | `author`           | Single author site                                                 |
| —                                                 | `draft`            | Always `false` for published posts                                 |

Slug → filename: `<slug>.md` exactly. Do not alter slugs.

## Phase 4 — HTML → Markdown conversion

Turndown handles standard HTML well but Ghost emits several non-standard "card"
patterns that need custom rules. Add Turndown rules for each:

1. **Code blocks.** Ghost wraps as `<pre><code class="language-csharp">…</code></pre>`.
   Default Turndown rule loses the language hint. Add a custom rule that emits
   triple-backtick fences with the language extracted from the `class`
   attribute.
2. **Image cards with captions.** Ghost wraps as
   `<figure class="kg-card kg-image-card"><img …><figcaption>…</figcaption></figure>`.
   Convert to standard Markdown image, and emit the caption as italic text on
   the next line.
3. **Bookmark cards.** Ghost wraps external link previews in
   `<figure class="kg-bookmark-card">`. Convert to a plain Markdown link using
   the bookmark title and URL; discard the preview metadata.
4. **Callout cards.** `<blockquote class="kg-callout-card …">` → standard
   blockquote with the emoji prefix preserved.
5. **Embed cards** (YouTube, tweets, etc.). Replace with a Markdown link to the
   embed URL. Notify in the summary log so they can be reviewed manually.
6. **HR cards.** `<hr>` → `---`.

Verify a sample of conversions against the live site before doing all 14 at
once. The post `automate-your-website-content-migration-with-the-ghost-admin-api`
is a good test case — it has code blocks, images, and is technical enough to
expose conversion bugs.

## Phase 5 — Image migration

For each unique image URL queued during Phase 2:

1. Derive a local filename from the URL's basename. Ghost URLs contain a
   content-addressed path; strip query parameters and use the original filename.
2. Download to `src/assets/images/posts/<slug>/<filename>`. Use exponential
   backoff on transient failures, max 3 retries.
3. Compute the relative path the Markdown file will need to reference the image
   (typically `../../assets/images/posts/<slug>/<filename>` from
   `src/data/blog/<slug>.md`).
4. After all downloads succeed, run a second pass over each Markdown file to
   replace remote URLs with the relative paths.

If AstroPaper's content collection schema validates `ogImage` as an `image()`
helper, the path must be relative and the file must exist at build time — a
broken `ogImage` will fail the whole build. Test build after this phase.

**Commit:** `feat: import posts and images from ghost export`

## Phase 6 — Preserve URL slugs

AstroPaper routes posts at `/posts/[slug]/` by default. Existing live URLs are
at the root. Required changes:

1. Locate the dynamic route file, typically `src/pages/posts/[slug].astro`.
2. Move it (and any related route files like the posts index) so posts render
   at `/[slug]/` instead. Test that `/build-your-own-c-code-analyzer/` resolves
   locally.
3. Verify pagination, tag pages, and the homepage post list still work and
   link to the new root-level URLs.
4. Add a sitemap entry verification: every URL in the Ghost site's sitemap
   should resolve to a 200 in the new site. (`npm run build` then check
   `dist/sitemap-0.xml` against the slugs in the JSON.)

**Commit:** `refactor: serve posts at root path to preserve existing slugs`

## Phase 7 — GitHub Pages deploy

1. Configure `astro.config.ts`:
   - `site: "https://www.millerdatabases.com"`
   - `base: "/"` (custom domain, not a project page)
   - Confirm `output: "static"`.
2. Add `public/CNAME` containing `www.millerdatabases.com`.
3. Add `.github/workflows/deploy.yml` based on AstroPaper's bundled example
   (the repo includes one). Trigger on push to `main`. Use
   `actions/configure-pages`, `actions/upload-pages-artifact`, and
   `actions/deploy-pages`.
4. In repo Settings → Pages, set source to "GitHub Actions" and add custom
   domain.
5. DNS changes (Daniel handles these manually, do not attempt):
   - `CNAME www → miller-databases.github.io.`
   - Apex `millerdatabases.com` → GitHub Pages A records (optional, if he
     wants apex to also resolve).

**Commit:** `ci: deploy to github pages`

## Phase 8 — Verification

Before declaring done:

1. `npm run build` produces zero errors and zero warnings.
2. Post count in `dist/` matches post count in `ghost-export.json` (14
   expected, but verify against the actual export — drafts and pages may
   inflate the raw post array).
3. Spot-check three posts side-by-side with the live Ghost site, paying
   attention to: code-block language highlighting, image presence, image
   captions, internal links, blockquotes.
4. Verify the RSS feed renders at `/rss.xml` with all posts in
   reverse-chronological order.
5. Run a link checker (e.g. `npx linkinator dist/`) against the built site.
   Internal 404s should be zero. External links flagged for Daniel's review.
6. Verify that every URL listed in the Ghost sitemap resolves on the new
   build. Any that don't need a redirect added or a slug fix.

## Known gotchas

- **Lexical vs HTML.** Newer Ghost exports may have a `lexical` field with
  structured editor JSON instead of, or alongside, `html`. Use `html`. If
  `html` is empty, fall back to `plaintext`. Do not attempt to parse Lexical
  directly.
- **Date timezones.** Ghost stores UTC. AstroPaper renders in the site's
  configured timezone. Set the timezone in `src/config.ts` to
  `America/Edmonton` to match Daniel's location, or leave at UTC if dates on
  posts are date-only and timezone doesn't matter visually.
- **Tag casing.** Ghost stores tags as display names ("Software Development").
  AstroPaper typically uses kebab-case slugs internally. Generate both a
  `tags` array (slugs) and ensure the display rendering still shows the
  human-readable name. Look at how AstroPaper's tag pages handle this before
  deciding on a representation.
- **Member-only posts.** If any post has `visibility !== "public"`, skip it
  and log a warning. Static sites can't gate content.
- **The "Welcome" post.** The post slug `coming-soon` is a placeholder that
  may not be worth migrating. Ask Daniel before deleting; otherwise migrate
  it like the rest.

## Definition of done

- Local `npm run build` succeeds.
- All 14 published posts appear at their original slugs.
- All images load.
- The site is deployed to GitHub Pages with the custom domain serving HTTPS.
- The `ghost-export.json` file is gitignored.
- The migration script remains in `scripts/` so it can be re-run if Daniel
  finds bugs and wants to re-import without losing manual edits (script
  should refuse to overwrite if `src/data/blog/` is non-empty unless a
  `--force` flag is passed).

---

## What this plan deliberately does not do

- Does not set up comments. If wanted later, Giscus is the right answer
  given the existing GitHub presence.
- Does not migrate or rebuild the `/services/`, `/resources/`, or
  `/about/` static pages. Those are smaller in scope and Daniel can
  hand-author them in `src/pages/` after the blog migration is verified.
- Does not configure analytics. Add GoatCounter or Plausible separately if
  desired.
- Does not handle email subscribers — there are none, per Daniel.
- Does not set up redirects from `/posts/<slug>/` paths because the new site
  never used them. If Ghost emitted any non-slug URLs (date archives, tag
  archives), audit those separately.
