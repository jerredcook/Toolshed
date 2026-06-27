# Toolshed

A small, growing collection of self-hosted tools — served as one static site with a landing page and a sub-page per tool. No accounts, no uploads, no subscriptions; everything runs on your machine. The unifying idea: each tool routes around some bit of everyday SaaS friction.

Open [`index.html`](./index.html) directly in a browser, or serve the whole site locally (below).

## The tools

| Tool | What it does | Kind |
| --- | --- | --- |
| **Email Extractor** — [`tools/email-extractor/`](./tools/email-extractor/) | Pull every email address out of a file or pasted text — deduplicated, filterable, exportable as `.txt`/`.csv`. | Browser |
| **Par Avion** — [`tools/par-avion/`](./tools/par-avion/) | Mail a file that's too big to mail: split it into email-sized `.eml` parts and reassemble them, bit-for-bit, on the other end. | Browser |
| **loom-grab** — [`tools/loom-grab/`](./tools/loom-grab/) | Save a Loom video you're authorized to view as a clean MP4, without a Loom account. (Needs `yt-dlp` + `ffmpeg`.) | CLI |

Each browser tool is a single self-contained HTML file — it works opened directly (`file://`) or served. loom-grab is a bash script with a documentation page.

## Quick start

```bash
npm test            # run the Par Avion round-trip tests (no install needed)
npm run serve       # serve the whole site at http://localhost:5179
```

Then open http://localhost:5179 for the Toolshed landing page, or just double-click [`index.html`](./index.html).

## Dev scripts

| Command | What it does |
| --- | --- |
| `npm test` | Run the chunk-core test suite (Node's built-in runner). |
| `npm run build` | Re-inline `tools/par-avion/lib/chunk-core.mjs` into its `index.html`. |
| `npm run serve` | Serve the site on localhost (set `PORT` to change). |

Node.js 18+ is used only for the dev scripts and tests — not to use the tools.

## Adding a tool

1. Create `tools/<your-tool>/index.html` — self-contained, working via `file://` and when served.
2. Add one entry to the `TOOLS` array near the bottom of the root [`index.html`](./index.html).
3. Add a `← Toolshed` back-link to the new page's header for consistency.

See [`CLAUDE.md`](./CLAUDE.md) for the layout, commands, and the invariants worth respecting.

## License

MIT — see [`LICENSE`](./LICENSE).
