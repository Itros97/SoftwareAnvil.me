# SoftwareAnvil.me

[![Deploy](https://github.com/Itros97/SoftwareAnvil.me/actions/workflows/deploy.yaml/badge.svg)](https://github.com/Itros97/SoftwareAnvil.me/actions/workflows/deploy.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-ES2021-3178C6?logo=typescript&logoColor=white)

Personal website of **Itros97**, built as a lightweight single-page application in vanilla TypeScript, with no framework, and deployed to GitHub Pages.

**Live site:** <https://softwareanvil.me/>

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Writing content](#writing-content)
- [Deployment](#deployment)
- [License](#license)

## Features

- Hash-based client-side routing
- Light and dark themes, toggled at runtime
- Markdown content rendered in the browser
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
│   ├── lib/                # In-house micro-framework (router, dom, signals, i18n, markdown…)
│   ├── services/           # Theme and markdown services
│   └── views/              # Page views (home)
├── styles/src/             # CSS sources (master.css imports components and views)
├── resources/
│   ├── icons/              # Logo and icon sets (JSON)
│   └── markdowns/          # Markdown content shown on the site
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
npm install -g typescript

# 3. Compile in watch mode (outputs to ./scripts)
tsc --watch

# 4. In another terminal, start the no-cache dev server
python server-n-cache.py 8000
```

Then open <http://localhost:8000>.

## Configuration

The app reads `gtdf.config.json` at startup:

| Key         | Description                                         |
| ----------- | --------------------------------------------------- |
| `base`      | App name, version, environment and author           |
| `path`      | Locations of resources, icons, i18n and markdowns   |
| `views`     | Route identifiers                                   |
| `variables` | Defaults such as theme, language and animations     |

## Writing content

The home page renders `resources/markdowns/doc.MD`. Edit that file to change what the site shows. No rebuild is needed.

## Deployment

Every push to `main` triggers the [deploy workflow](.github/workflows/deploy.yaml), which:

1. Compiles the TypeScript with `tsc`
2. Bundles `scripts/start.js` with Rollup
3. Minifies the CSS with `bin/lit`
4. Removes the source files and publishes the result to the `gh-pages` branch

## License

Distributed under the [MIT License](LICENSE). © 2025 Itros97
