# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static website for CAMINO Honduras (Central American Ministry Outreach) — a faith-based nonprofit building homes and developing communities in Honduras. Deployed via GitHub Pages.

## Deploy

No build step. Push to `main` and GitHub Pages deploys automatically:

```powershell
git add .
git commit -m "message"
git push origin main
```

## Architecture

Single-repo static site (HTML/CSS/JS). No framework, no bundler, no package manager unless added later. Structure will follow a flat GitHub Pages convention:

- `index.html` — homepage
- `about.html`, `programs.html`, `trips.html`, `give.html` — inner pages
- `assets/css/` — stylesheets
- `assets/js/` — scripts
- `assets/images/` — imagery

## Design direction

Warm amber/earth tones with teal accents. Brand color: `#BA7517` (amber). See the homepage mockup established in the initial design session for layout reference (hero, stats bar, programs, trips calendar, giving CTA, footer).

## Organization context

- **Mission**: Housing-first community development in Honduras
- **Key programs**: Home construction ($5,500/home), community infrastructure, church planting, mission trips (4–25 people, week-long)
- **Primary site**: [caminohonduras.com](https://www.caminohonduras.com/) — this repo is a redesign
