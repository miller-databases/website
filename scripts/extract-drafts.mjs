#!/usr/bin/env node
// Extract draft posts from Ghost export to src/data/draft/.
// Mirrors migrate-ghost.mjs frontmatter shape but skips image downloads —
// drafts may never publish, and src/data/draft/ is outside the blog
// collection's glob, so these files are never built into the site.
//
// Usage: node scripts/extract-drafts.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXPORT_PATH = path.join(ROOT, "ghost-export.json");
const OUT_DIR = path.join(ROOT, "src", "data", "draft");
const SITE_BASE = "https://www.millerdatabases.com";

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

function htmlToText(html) {
  return decodeEntities(String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function makeDescription(post) {
  const raw = post.custom_excerpt || post.meta_description || "";
  const text = raw ? htmlToText(raw) : htmlToText(post.plaintext || post.html || "");
  if (!text) return "(draft — no description yet)";
  if (text.length <= 160) return text;
  return text.slice(0, 157).replace(/\s+\S*$/, "") + "…";
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

  return td;
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

  await fs.mkdir(OUT_DIR, { recursive: true });

  const td = makeTurndown();
  const drafts = d.posts.filter((p) => p.status === "draft" && p.type === "post");
  console.log(`Found ${drafts.length} draft posts.`);

  for (const post of drafts) {
    let html = post.html || "";
    if (!html && post.plaintext) {
      html = `<p>${post.plaintext.replace(/\n\n+/g, "</p><p>")}</p>`;
    }
    html = html.replace(/__GHOST_URL__/g, SITE_BASE);
    const md = html ? td.turndown(html) : "_Draft body is empty in the Ghost export._";

    const postTags = (tagsByPost.get(post.id) || [])
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.tag)
      .filter(Boolean)
      .map((t) => kebab(t.name));
    const tags = postTags.length ? postTags : ["others"];

    const pubIso = (post.published_at || post.updated_at || post.created_at || new Date().toISOString());
    const fm = {
      title: post.title || "(untitled draft)",
      author: "Daniel Miller",
      pubDatetime: new Date(pubIso),
      modDatetime: new Date(post.updated_at || pubIso),
      featured: false,
      draft: true,
      tags,
      description: makeDescription(post),
    };

    const yamlStr = yaml.dump(fm, { lineWidth: 1000, noRefs: true });
    const fileBody = `---\n${yamlStr}---\n\n${md.trim()}\n`;
    const outPath = path.join(OUT_DIR, `${post.slug}.md`);
    await fs.writeFile(outPath, fileBody, "utf8");
    console.log(`✓ ${post.slug}.md`);
  }

  console.log(`\nWrote ${drafts.length} drafts to ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
