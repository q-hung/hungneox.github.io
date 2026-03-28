# hungneox.github.io

Personal blog built with [Astro](https://astro.build/) (static site, content collections, i18n). Styling uses Sass; code blocks use [Shiki](https://shiki.style/) (GitHub light / dimmed dark themes).

Live site: [https://butchiso.com](https://butchiso.com)

## Prerequisites

- [Node.js](https://nodejs.org/) **>= 22.12.0** (required by Astro 6)

## Setup

```bash
npm install
```

For a clean install matching CI:

```bash
npm ci
```

## Development

```bash
npm run dev
```

Open the URL shown in the terminal (typically [http://localhost:4321](http://localhost:4321)).

Other scripts:

- `npm run build` — typecheck (`astro check`) and production build to `dist/`
- `npm run preview` — serve the `dist/` output locally

## Project layout

- `src/content/blog/` — Markdown posts under locale folders, e.g. `vi/`, `en/`
- `src/pages/` — Astro routes (`[lang]/`, blog pagination, about, category indexes)
- `src/styles/` — global and partial SCSS (`main.scss` imports the rest)
- `public/` — static assets served as-is

Internationalization is configured in `astro.config.mjs`: default locale `vi`, also `en`. URLs use locale prefixes where applicable (see existing pages).

## Writing a new post

Add a file under `src/content/blog/vi/` or `src/content/blog/en/` named `YYYY-MM-DD-slug.md`.

Example frontmatter (fields match `src/content.config.ts`):

```markdown
---
title: "Post title"
date: 2026-03-28
description: "Short summary for listings and SEO"
author: Q-Hung
categories: programming
tags:
  - optional-tag
image: /path/to/cover.jpg
published: true
comments: true
---

Post body in Markdown…
```

Use a single **topic** value in `categories` (slug style), for example: `search-data`, `web-backend`, `programming`, `systems`, `data-science`, `security`. Locale labels such as `vi` / `en` are treated as metadata only and are not shown as topics. `tags` is optional.

## Deployment

[GitHub Actions](.github/workflows/deploy.yml) builds on push to `main` or `master` and deploys the `dist/` folder to **GitHub Pages** (Node 22 on `ubuntu-latest`).

Ensure the repository Pages source is set to **GitHub Actions** in the repo settings.
