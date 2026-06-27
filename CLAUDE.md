# CLAUDE.md

Guidance for working in this repo. Keep this file short and current — it loads into every Claude Code session.

## What this is

**Toolshed** — a growing collection of small, self-hosted tools, served as one static site: a landing page (`index.html`) linking to a sub-page per tool under `tools/`. Shared ethos: local-first, no accounts, no uploads — each tool routes around some bit of SaaS friction.

No backend. No framework. No bundler. Node 18+ is only needed for the dev scripts and tests, not to use the tools.

## Repo map

```
index.html                      landing page — the TOOLS array near the bottom is the registry
tools/
  email-extractor/index.html    extract email addresses from text/files (browser)
  par-avion/                     split a big file into email-sized .eml parts + reassemble (browser)
    index.html                   self-contained app
    lib/chunk-core.mjs           SOURCE OF TRUTH for the pure chunking logic (tested)
    test/chunk-core.test.js      round-trip + invariant tests
  loom-grab/                     save an authorized Loom video as MP4 (CLI)
    loom-grab.sh                 yt-dlp wrapper (POSIX bash, set -euo pipefail)
    index.html                   docs page for the CLI
scripts/
  build.mjs                      inlines chunk-core.mjs into tools/par-avion/index.html
  serve.mjs                      static dev server for the whole site
```

## Commands

- `npm test` — run the chunk-core test suite (Node's built-in runner).
- `npm run build` — regenerate the inlined core inside `tools/par-avion/index.html`.
- `npm run serve` — serve the whole site at http://localhost:5179.

After any change to the chunking logic: `npm run build && npm test`.

## Adding a tool

1. Create `tools/<tool>/index.html` — self-contained, working via `file://` and when served.
2. Add one entry to the `TOOLS` array in the root `index.html`.
3. Add a `← Toolshed` back-link to the new page's header for consistency.

## Invariants — don't break these

1. **Every page is self-contained.** Each tool's `index.html` must keep working opened directly (`file://`) or served. No bundler, no build step required *to use it*, no runtime `import`/module loading. Vanilla JS only. **Never use `localStorage`/`sessionStorage`** — keep all state in memory. Link between pages with explicit `index.html` paths (e.g. `tools/par-avion/index.html`, back-links as `../../index.html`) so `file://` double-click navigation works.

2. **Par Avion's core has one source of truth.** Pure, environment-agnostic functions live in `tools/par-avion/lib/chunk-core.mjs`. The copy in `index.html` between the `// ==CHUNK-CORE:START==` and `// ==CHUNK-CORE:END==` markers is **generated** — never hand-edit it. Edit the `.mjs`, then `npm run build`. Only browser-specific code (`sha256Hex` via WebCrypto, `rndHex`, DOM wiring) lives outside the markers.

3. **Par Avion's email-size bound is the whole point.** `rawChunkSizeForEmailLimit` works backward from the user's limit, accounting for base64's ~37% expansion plus headers and a safety margin, so the *encoded* `.eml` stays under the cap. The round-trip test asserts the largest `.eml` ≤ limit for several sizes — keep it green if you touch the math.

4. **The `.eml` wire format is a contract between split and reassemble.** Parts are `multipart/mixed` with a base64 `application/octet-stream` attachment named `<file>.partNNNofMMM`, plus `X-ChunkMail-Original` and `X-ChunkMail-Part` headers the receiver reads. Changing the format means updating `buildEml` **and** `parseEml` together, then re-running the round-trip test.

5. **`loom-grab.sh` stays portable.** Keep `set -euo pipefail`, the dependency checks, and the password→cookies→manual fallback chain. Avoid bashisms that break on macOS's stock bash 3.2 where there's an easy alternative.

## Scope and boundaries

`loom-grab` is for downloading videos the user is **authorized** to access — e.g. a video shared with them, with the password, or their own content. It works by using that legitimate access: the supplied `--video-password`, or the authenticated session from the user's browser via `--cookies-from-browser`. Do not turn it into something that guesses or brute-forces passwords, or that strips DRM. That boundary is deliberate; keep it.

## Style

Prefer editing existing files over adding new ones. Don't introduce dependencies or a build toolchain without a clear reason — the no-deps, no-bundler property is a feature. Match the existing terse, comment-light-but-not-absent style.
