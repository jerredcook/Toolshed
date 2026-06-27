# loom-grab

Save a Loom video you're authorized to view as a clean, universally-playable MP4 — without creating a Loom account. A thin wrapper around [`yt-dlp`](https://github.com/yt-dlp/yt-dlp).

## When to use it

For videos you have legitimate access to: one shared with you (with the password), or your own content. It works by *using* that access — your password, or your already-authenticated browser session — not by getting around anything. It is not a tool for guessing passwords or stripping DRM; don't repurpose it that way.

## Install dependencies

You need `yt-dlp` and `ffmpeg` on your PATH. `ffmpeg` matters because Loom sometimes serves audio and video as separate streams — without it, the download can come out silent.

- **macOS:** `brew install yt-dlp ffmpeg`
- **Linux:** `pipx install yt-dlp` (or `pip install -U yt-dlp`) and `sudo apt install ffmpeg`
- **Windows:** run the `yt-dlp` commands directly, or use WSL / Git Bash.

## Usage

```bash
./loom-grab.sh "https://www.loom.com/share/<id>" "the-password"
./loom-grab.sh "https://www.loom.com/share/<id>"      # prompts for the password privately
./loom-grab.sh                                        # prompts for both
```

The script prefers Loom's transcoded MP4, remuxes to `.mp4` with `+faststart`, and names the file after the video title.

## What it tries, in order

1. **Direct, with your password** — `yt-dlp --video-password ...`.
2. **Your browser session** — if Loom's gate doesn't honor the password flag, it reuses the cookies from your browser (where you've already entered the password). Defaults to Chrome; override with `LOOM_BROWSER=firefox ./loom-grab.sh ...` (also `edge`, `brave`, etc.).
3. **Manual** — if both miss, it prints the DevTools route: play the video, grab the `.m3u8`/`.mp4` URL from the Network tab, and feed it to `yt-dlp` directly.

One of the three reliably gets it.

## Raw one-liner

If you'd rather skip the script:

```bash
yt-dlp --video-password 'the-password' \
  -f "http-transcoded/bv*+ba/b" --remux-video mp4 \
  "https://www.loom.com/share/<id>"
```
