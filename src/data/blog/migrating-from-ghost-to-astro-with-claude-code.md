---
title: We moved this site from Ghost to Astro — in an afternoon, with an AI agent
author: Daniel Miller
pubDatetime: 2026-04-30T18:00:00.000Z
modDatetime: 2026-04-30T18:00:00.000Z
featured: true
draft: false
tags:
  - news
  - software-development
description: Today we migrated millerdatabases.com from Ghost to a static Astro site, with a Claude Code agent doing most of the keystroking. Here's how it went.
---

If you're a regular reader, you may notice the site looks a little different today. We've moved millerdatabases.com off of [Ghost](https://ghost.org/) and onto a static site built with [Astro](https://astro.build/). The content is the same; the plumbing is simpler, faster, and cheaper to operate.

What might surprise you: most of the migration work wasn't done by hand. We handed the job to an AI coding agent — [Claude Code](https://www.anthropic.com/claude-code) — and supervised.

## The procedure, in plain terms

We approached this like any other client engagement. The work broke down into eight phases, each ending in a reviewable commit:

1. **Scaffold.** Stand up a fresh Astro site using the [AstroPaper](https://github.com/satnaing/astro-paper) theme. Verify the empty site builds.
2. **Build a one-shot migration script.** Read Ghost's JSON export, convert each post's HTML to Markdown, queue every embedded image for download.
3. **Map the metadata.** Translate Ghost's post fields (title, publish date, tags, feature image) into the frontmatter Astro expects.
4. **Convert the bodies.** Handle Ghost's custom "card" patterns — code blocks with language hints, image figures with captions, callouts, embeds — so the new Markdown reads cleanly.
5. **Migrate the images.** Download every Ghost-hosted image to the new repo, rewrite each post to point at the local copy.
6. **Preserve the URLs.** Move the post route from `/posts/<slug>/` to `/<slug>/` so existing links — and Google's index — keep working.
7. **Wire up deployment.** Add a GitHub Actions workflow that builds and publishes to GitHub Pages on every push, with a `CNAME` for the custom domain.
8. **Verify.** Build the site clean, check the post count matches the export, spot-check three articles side-by-side with the live Ghost site, validate every internal link.

We wrote the plan first — a single Markdown document — then asked Claude Code to follow it. The agent did the typing: reading the Ghost export, writing the migration script, running it, fixing the broken edges, committing each phase, building, and re-running until everything was green.

Total wall-clock time, from "let's do this" to "site is built and ready to deploy": a few hours. The agent flagged decisions that needed a human (which header text to use, which 23 LinkedIn-hosted images had expired signed URLs we'd need to replace by hand) and kept moving on the rest.

## What's under the hood

Every article on this site — including the one you're reading — is a plain [Markdown](https://en.wikipedia.org/wiki/Markdown) file in a Git repository. No database, no admin panel, no login screen. Editing a post is just editing a text file.

When we push a change to the `main` branch, [GitHub Actions](https://github.com/features/actions) automatically builds the site and publishes the new version to [GitHub Pages](https://pages.github.com/). No manual deploy step. No "did I remember to click publish?" The article you're reading went live the same way.

The whole repository is public. If you'd like to see how the site is built, browse the source, or borrow the migration script for your own move off Ghost, the code is at [github.com/miller-databases/website](https://github.com/miller-databases/website). Pull requests welcome.

## Why this matters for our clients

This wasn't a stunt. It was a small, real example of how we're working now.

Miller Databases is increasingly leaning on **agentic programming** — AI agents that don't just suggest snippets but actually execute the boring, structured parts of software work — to deliver faster and at lower cost for our clients. Database migrations, ETL utilities, code analyzers, schema audits, integration scripts: the kind of work that used to mean a week of careful keystrokes can often now be planned, executed, and reviewed in a fraction of the time.

The role of the consultant doesn't go away. It shifts. We spend less time typing boilerplate and more time on the parts that actually require judgement: understanding the business problem, designing the right approach, and verifying that the result holds up.

If you have a database project that's been sitting in the "someday" column because it looked like too much effort, this is a good moment to ask us about it. The math has changed.

— Daniel
