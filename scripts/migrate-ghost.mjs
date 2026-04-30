#!/usr/bin/env node
// One-shot ETL: Ghost JSON export -> AstroPaper Markdown + local images.
//
// Target schema (src/content.config.ts):
//   title: string                (required)
//   pubDatetime: Date            (required)
//   description: string          (required)
//   modDatetime?: Date | null
//   author?: string              (default SITE.author)
//   featured?: boolean
//   draft?: boolean
//   tags?: string[]              (default ["others"])
//   ogImage?: image() | string
//   canonicalURL?: string
//   timezone?: string
//
// Usage: node scripts/migrate-ghost.mjs [--force]

import fs from "node:fs/promises";
import fss from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXPORT_PATH = path.join(ROOT, "ghost-export.json");
const BLOG_DIR = path.join(ROOT, "src", "data", "blog");
const ASSETS_DIR = path.join(ROOT, "src", "assets", "images", "posts");
const SITE_BASE = "https://www.millerdatabases.com";

const FORCE = process.argv.includes("--force");

function log(...a) { console.log(...a); }
function warn(...a) { console.warn("WARN:", ...a); }

function decodeEntities(s) {
  return String(s)
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

function kebab(s) {
  return String(s).toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function resolveGhostUrl(u) {
  if (!u) return u;
  if (u.startsWith("__GHOST_URL__")) return SITE_BASE + u.slice("__GHOST_URL__".length);
  return u;
}

function isImageUrl(u) {
  return /\.(jpe?g|png|gif|webp|svg|avif|ico|bmp)(\?|$)/i.test(u);
}

function basenameFromUrl(u, fallback = "image") {
  try {
    const url = new URL(u);
    const base = path.basename(url.pathname).split("?")[0] || fallback;
    return base.replace(/[^\w.\-]/g, "_") || fallback;
  } catch {
    return fallback;
  }
}

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function fetchWithRetry(url, dest, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await ensureDir(path.dirname(dest));
      await fs.writeFile(dest, buf);
      return true;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  return false;
}

function makeTurndown() {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    bulletListMarker: "-",
    fence: "```",
  });
  td.use(gfm);

  // Code blocks with language hint from <pre><code class="language-X">.
  td.addRule("fenced-code-with-lang", {
    filter: (node) => node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE",
    replacement: (_content, node) => {
      const code = node.firstChild;
      const cls = code.getAttribute("class") || "";
      const m = cls.match(/language-([\w-]+)/);
      const lang = m ? m[1] : "";
      const text = code.textContent.replace(/\n+$/g, "");
      return `\n\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
    },
  });

  // Image cards with caption: <figure class="kg-image-card"><img...><figcaption>...</figcaption></figure>
  td.addRule("kg-image-card", {
    filter: (node) =>
      node.nodeName === "FIGURE" &&
      /kg-image-card|kg-card/.test(node.getAttribute("class") || "") &&
      node.querySelector("img"),
    replacement: (_content, node) => {
      const img = node.querySelector("img");
      const src = img.getAttribute("src") || "";
      const alt = img.getAttribute("alt") || "";
      const fig = node.querySelector("figcaption");
      const caption = fig ? fig.textContent.trim() : "";
      let out = `\n\n![${alt}](${src})\n`;
      if (caption) out += `\n_${caption}_\n`;
      return out + "\n";
    },
  });

  // Bookmark cards: replace with plain link.
  td.addRule("kg-bookmark-card", {
    filter: (node) =>
      node.nodeName === "FIGURE" &&
      /kg-bookmark-card/.test(node.getAttribute("class") || ""),
    replacement: (_content, node) => {
      const a = node.querySelector("a.kg-bookmark-container") || node.querySelector("a");
      const href = a?.getAttribute("href") || "";
      const titleEl = node.querySelector(".kg-bookmark-title");
      const title = (titleEl?.textContent || a?.textContent || href).trim();
      return `\n\n[${title}](${href})\n\n`;
    },
  });

  // Callout cards: <div class="kg-callout-card"><div emoji><div text></div></div>
  td.addRule("kg-callout-card", {
    filter: (node) =>
      (node.nodeName === "DIV" || node.nodeName === "BLOCKQUOTE") &&
      /kg-callout-card/.test(node.getAttribute("class") || ""),
    replacement: (_content, node) => {
      const emoji = node.querySelector(".kg-callout-emoji")?.textContent.trim() || "";
      const text = node.querySelector(".kg-callout-text")?.textContent.trim() || node.textContent.trim();
      const prefix = emoji ? `${emoji} ` : "";
      const lines = text.split(/\n+/).map((l) => `> ${prefix}${l}`.trim()).join("\n> ");
      return `\n\n> ${prefix}${text}\n\n`;
    },
  });

  // Embed cards (YouTube, twitter, etc.) -> link.
  td.addRule("kg-embed-card", {
    filter: (node) =>
      node.nodeName === "FIGURE" &&
      /kg-embed-card/.test(node.getAttribute("class") || ""),
    replacement: (_content, node) => {
      const iframe = node.querySelector("iframe");
      const url = iframe?.getAttribute("src") || node.querySelector("a")?.getAttribute("href") || "";
      EMBED_NOTES.push(url);
      return `\n\n[Embedded media](${url})\n\n`;
    },
  });

  // HR cards
  td.addRule("kg-hr", {
    filter: (node) =>
      node.nodeName === "HR" || (node.nodeName === "DIV" && /kg-hr|kg-divider/.test(node.getAttribute("class") || "")),
    replacement: () => "\n\n---\n\n",
  });

  return td;
}

const EMBED_NOTES = [];

function pickFirst(...vals) {
  for (const v of vals) if (v != null && String(v).trim() !== "") return v;
  return null;
}

function htmlToText(html) {
  return decodeEntities(String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function makeDescription(post) {
  const raw = pickFirst(post.custom_excerpt, post.meta_description);
  const text = raw ? htmlToText(raw) : htmlToText(post.plaintext || post.html || "");
  if (!text) return "(no description)";
  if (text.length <= 160) return text;
  return text.slice(0, 157).replace(/\s+\S*$/, "") + "…";
}

async function main() {
  const raw = await fs.readFile(EXPORT_PATH, "utf8");
  const data = JSON.parse(raw);
  const d = data.db[0].data;

  const tagsById = new Map(d.tags.map((t) => [t.id, t]));
  const tagsByPost = new Map();
  for (const pt of d.posts_tags) {
    if (!tagsByPost.has(pt.post_id)) tagsByPost.set(pt.post_id, []);
    tagsByPost.get(pt.post_id).push({ tag: tagsById.get(pt.tag_id), sort: pt.sort_order });
  }

  if (!FORCE) {
    const existing = (await fs.readdir(BLOG_DIR).catch(() => [])).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
    const isDefault = existing.length > 0 && existing.every((f) =>
      [
        "adding-new-post.md",
        "customizing-astropaper-theme-color-schemes.md",
        "dynamic-og-images.md",
        "how-to-add-latex-equations-in-blog-posts.md",
        "how-to-configure-astropaper-theme.md",
        "how-to-integrate-giscus-comments.md",
        "how-to-update-dependencies.md",
        "predefined-color-schemes.md",
        "setting-dates-via-git-hooks.md",
      ].includes(f)
    );
    if (existing.length && !isDefault) {
      console.error(`Refusing to run: ${BLOG_DIR} contains posts that aren't the AstroPaper defaults. Pass --force to overwrite.`);
      process.exit(1);
    }
  }

  await ensureDir(BLOG_DIR);

  const td = makeTurndown();
  const downloads = []; // {url, dest, slug}
  const failed = [];
  const summary = { posts: 0, skipped: 0, images: 0, embeds: 0 };

  const published = d.posts.filter((p) => p.status === "published" && p.type === "post");

  for (const post of published) {
    if (post.visibility && post.visibility !== "public") {
      warn(`Skipping non-public post: ${post.slug} (visibility=${post.visibility})`);
      summary.skipped++;
      continue;
    }

    const slug = post.slug;
    const slugAssetsDir = path.join(ASSETS_DIR, slug);

    let html = post.html || "";
    if (!html) {
      warn(`Empty html for ${slug}; falling back to plaintext`);
      html = `<p>${(post.plaintext || "").replace(/\n\n+/g, "</p><p>")}</p>`;
    }

    // Resolve __GHOST_URL__ throughout HTML so Turndown sees real URLs.
    html = html.replace(/__GHOST_URL__/g, SITE_BASE);

    // Find images in HTML and queue downloads.
    const imgRe = /<img[^>]+src="([^"]+)"/g;
    const seen = new Set();
    let m;
    while ((m = imgRe.exec(html))) {
      const url = decodeEntities(m[1]);
      if (seen.has(url)) continue;
      seen.add(url);
      if (!/^https?:/i.test(url)) continue;
      const filename = basenameFromUrl(url, "image");
      const dest = path.join(slugAssetsDir, filename);
      downloads.push({ url, dest, slug });
    }

    // Feature image (for ogImage).
    let ogImagePath = null;
    const featureUrl = resolveGhostUrl(post.feature_image || post.og_image);
    if (featureUrl) {
      let featBase = basenameFromUrl(featureUrl, "cover");
      if (!/\.[a-z0-9]+$/i.test(featBase)) featBase += ".jpg";
      const dest = path.join(slugAssetsDir, featBase);
      downloads.push({ url: featureUrl, dest, slug });
      ogImagePath = `../../assets/images/posts/${slug}/${featBase}`;
    }

    // Convert.
    let md;
    try {
      md = td.turndown(html);
    } catch (e) {
      warn(`Turndown failed for ${slug}: ${e.message}`);
      failed.push({ slug, reason: e.message });
      continue;
    }

    // Rewrite remote image URLs to local relative paths.
    const rel = `../../assets/images/posts/${slug}`;
    for (const url of seen) {
      const filename = basenameFromUrl(url, "image");
      // Escape for regex.
      const esc = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      md = md.replace(new RegExp(esc, "g"), `${rel}/${filename}`);
    }

    // Tags.
    const postTags = (tagsByPost.get(post.id) || [])
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.tag)
      .filter(Boolean)
      .map((t) => kebab(t.name));
    const tags = postTags.length ? postTags : ["others"];

    // Frontmatter.
    const fm = {
      title: post.title,
      author: "Daniel Miller",
      pubDatetime: new Date(post.published_at),
      ...(post.updated_at && post.updated_at !== post.published_at
        ? { modDatetime: new Date(post.updated_at) }
        : {}),
      featured: !!post.featured,
      draft: false,
      tags,
      ...(ogImagePath ? { ogImage: ogImagePath } : {}),
      description: makeDescription(post),
      ...(post.canonical_url ? { canonicalURL: post.canonical_url } : {}),
    };

    const yamlStr = yaml.dump(fm, { lineWidth: 1000, noRefs: true });
    const fileBody = `---\n${yamlStr}---\n\n${md.trim()}\n`;
    const outPath = path.join(BLOG_DIR, `${slug}.md`);
    await fs.writeFile(outPath, fileBody, "utf8");
    summary.posts++;
    log(`✓ ${slug}.md`);
  }

  // Download all queued images. Dedupe by dest path.
  const byDest = new Map();
  for (const d of downloads) if (!byDest.has(d.dest)) byDest.set(d.dest, d);
  log(`\nDownloading ${byDest.size} images…`);
  for (const { url, dest, slug } of byDest.values()) {
    if (fss.existsSync(dest)) { summary.images++; continue; }
    try {
      await fetchWithRetry(url, dest);
      summary.images++;
    } catch (e) {
      warn(`Failed: ${url} -> ${dest}: ${e.message}`);
      failed.push({ slug, url, reason: e.message });
    }
  }

  log("\nSummary:");
  log(`  posts written:   ${summary.posts}`);
  log(`  posts skipped:   ${summary.skipped}`);
  log(`  images saved:    ${summary.images}/${byDest.size}`);
  log(`  embeds flagged:  ${EMBED_NOTES.length}`);
  if (EMBED_NOTES.length) EMBED_NOTES.forEach((u) => log(`    embed: ${u}`));
  if (failed.length) {
    log(`  failures:        ${failed.length}`);
    failed.forEach((f) => log(`    ${f.slug || ""} ${f.url || ""}: ${f.reason}`));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
