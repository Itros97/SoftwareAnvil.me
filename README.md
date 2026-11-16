# SoftwareAnvil.me

[![Deploy](https://github.com/Itros97/SoftwareAnvil.me/actions/workflows/deploy.yaml/badge.svg)](https://github.com/Itros97/SoftwareAnvil.me/actions/workflows/deploy.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-ES2021-3178C6?logo=typescript&logoColor=white)

Personal website of **Itros97**, built as a lightweight single-page application in vanilla TypeScript, with no framework, and deployed to GitHub Pages.

**Live site:** <https://softwareanvil.me/>

> **Note:** the November 2026 redesign was written with an AI assistant and is pending thorough review. See the [AI disclosure](#ai-disclosure).

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Writing content](#writing-content)
- [Deployment](#deployment)
- [AI disclosure](#ai-disclosure)
- [License](#license)

## Features

- Home, projects, blog and post pages with hash-based routing
- Light and dark themes that follow the system and remember the visitor's choice
- Content written in JSON and Markdown, no code changes needed to update it
- Material and social SVG icon sets loaded from JSON
- Responsive layout that adapts to the display type
- Zero runtime dependencies

## Tech stack

| Area      | Tool                                                        |
| --------- | ----------------------------------------------------------- |
| Language  | [TypeScript](https://www.typescriptlang.org/) (target ES2021) |
| Bundling  | [Rollup](https://rollupjs.org/) (IIFE output)               |
| Styles    | Plain CSS + BubbleUI v3, minified with `bin/lit`            |
| Hosting   | GitHub Pages via GitHub Actions                             |

## Project structure

```text
.
├── index.html              # App entry point
├── gtdf.config.json        # Runtime configuration (app name, paths, views…)
├── src/
│   ├── start.ts            # Bootstrap: config, icons, routes
│   ├── lib/                # In-house micro-framework and pure content logic
│   ├── services/           # Content, theme and markdown services
│   └── views/              # Pages (home, projects, blog, post, 404) and shared components
├── styles/src/             # CSS sources (master.css imports components and views)
├── resources/
│   ├── icons/              # Logo and icon sets (JSON)
│   └── content/            # Profile, projects, posts and about text
├── tests/                  # Unit tests (node --test)
├── bin/lit                 # CSS minifier used in CI
├── server-n-cache.py       # Local dev server with caching disabled
└── .github/workflows/      # Deployment pipeline
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- Python 3, for the local server

### Run locally

```bash
# 1. Clone the repository
git clone https://github.com/Itros97/SoftwareAnvil.me.git
cd SoftwareAnvil.me

# 2. Install the TypeScript compiler
npm install

# 3. Compile in watch mode (outputs to ./scripts)
npm run dev

# 4. In another terminal, start the no-cache dev server
npm run serve
```

Run the unit tests with `npm test`.

Then open <http://localhost:8000>.

## Configuration

The app reads `gtdf.config.json` at startup:

| Key         | Description                                         |
| ----------- | --------------------------------------------------- |
| `base`      | App name, version, environment and author           |
| `path`      | Locations of resources, icons, i18n and content     |
| `views`     | Route identifiers                                   |
| `variables` | Defaults such as theme, language and animations     |

## Writing content

All the content lives in `resources/content/`. Editing it needs no rebuild.

| File                 | What it controls                                                    |
| -------------------- | ------------------------------------------------------------------- |
| `profile.json`       | Name, headline, tagline and the social links in the footer          |
| `about.md`           | The "about me" text on the home page                                |
| `projects.json`      | Projects list. Set `"featured": true` to show one on the home page  |
| `posts.json`         | Posts index: `slug`, `title`, `date` (`YYYY-MM-DD`) and `summary`   |
| `posts/<slug>.md`    | The body of each post                                               |

To publish a post, add its Markdown file to `posts/` and an entry with the same `slug` to `posts.json`. Posts are sorted by date automatically.

## Deployment

Every push to `main` triggers the [deploy workflow](.github/workflows/deploy.yaml), which:

1. Compiles the TypeScript with `tsc`
2. Bundles `scripts/start.js` with Rollup
3. Minifies the CSS with `bin/lit`
4. Removes the source files and publishes the result to the `gh-pages` branch

## AI disclosure

I write most of my code by hand, so I want to be clear about this project: **the November 2026 redesign was written by an AI assistant (Claude, by Anthropic) under my direction.** I decided what to build and how it should behave. The AI wrote:

- The new styles in `styles/src/`
- The pages and components in `src/views/`
- `src/services/contentservice.ts`, `src/services/theme.ts`, `src/lib/content.ts` and `src/start.ts`
- The unit tests in `tests/`, plus this README

Every commit made this way carries a `Co-Authored-By: Claude` line.

**Status: pending thorough review.** It compiles, the unit tests pass, and every page was checked in a headless browser in light and dark themes at desktop and phone widths. I have not yet reviewed it line by line. Treat it as a working draft, not as code I vouch for.

## License

Distributed under the [MIT License](LICENSE). © 2025 Itros97
