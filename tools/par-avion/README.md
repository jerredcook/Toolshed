# Par Avion

Mail a file that's too big to mail. A single self-contained HTML page that splits a large file into email-sized parts, turns each into a ready-to-send draft, and reassembles them on the receiving end. No server, no upload — everything happens in your browser.

## Run it

- **Simplest:** open `index.html` in your browser.
- **Recommended for dev:** `npm run serve` (from the repo root) and visit http://localhost:5179. Serving over localhost guarantees a secure context for the WebCrypto hashing.

## How it works

**Sizing.** Your attachment limit applies to the *encoded* email, not the raw file. base64 expands binary by ~4/3, a line break is added every 76 characters, and the MIME headers add a little more. `rawChunkSizeForEmailLimit()` inverts all of that — plus a safety margin for providers that count loosely — so the resulting `.eml` stays under your cap. A 10 MB limit yields ~6.7 MB raw parts; the largest email lands near 9.2 MB.

**Drafts.** Each part becomes a `multipart/mixed` `.eml` with the chunk base64-encoded as an `application/octet-stream` attachment named `<file>.partNNNofMMM`. Two custom headers, `X-ChunkMail-Original` and `X-ChunkMail-Part`, let the receiver identify and order parts even if filenames change. A `manifest.json` carries per-part SHA-256 checksums.

**Reassembly.** Drop in the saved attachments *or* the `.eml` files (it can decode either) plus the manifest. The app checks that all parts are present, verifies each checksum against the manifest, concatenates the parts in order, and downloads the original file — bit-for-bit identical. Out-of-order parts are fine; missing parts are reported instead of producing a corrupt file.

## Editing the logic

The pure, testable functions live in **`lib/chunk-core.mjs`** — this is the source of truth. The copy inside `index.html`, between the `// ==CHUNK-CORE:START==` and `// ==CHUNK-CORE:END==` markers, is **generated**:

```bash
# edit lib/chunk-core.mjs, then:
npm run build     # re-inline it into index.html
npm test          # verify the round-trip + size invariants still hold
```

Don't hand-edit the marked region in `index.html`. Browser-only code (WebCrypto hashing, random boundaries, DOM wiring) lives outside the markers and is edited directly.

## Sending notes

`.eml` files open and send cleanly from desktop mail clients (Apple Mail, Outlook, Thunderbird). Gmail's web app won't import them as drafts — there, attach the saved part files to separate emails manually, or send the `.eml` files from a desktop client.
