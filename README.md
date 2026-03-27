# hungneox.github.io

Personal blog built with [Jekyll](https://jekyllrb.com/) using the [EasyBook](https://github.com/laobubu/jekyll-theme-EasyBook/wiki) theme.

Live at [https://butchiso.com](https://butchiso.com)

## Prerequisites

- [Homebrew](https://brew.sh/)
- [rbenv](https://github.com/rbenv/rbenv)
- Ruby 3.4.7

## Setup

Install rbenv and ruby-build:

```bash
brew install rbenv ruby-build
```

Add rbenv to your shell (add to `~/.zshrc`):

```bash
eval "$(rbenv init - zsh)"
```

Install the required Ruby version:

```bash
rbenv install 3.4.7
```

Install dependencies:

```bash
bundle install
```

## Development

```bash
bundle exec jekyll serve
```

Then open [http://localhost:4000](http://localhost:4000).

## Writing a new post

Create a new file in `_posts/` with the format `YYYY-MM-DD-slug.md`:

```markdown
---
layout: post
title: "Post Title"
date: 2026-01-01 12:00
categories: [category1, category2]
author: hungneox
tags: [tag1, tag2]
description: "Short description"
image: /assets/images/cover.jpg
comments: true
published: true
---

Your content here...
```
