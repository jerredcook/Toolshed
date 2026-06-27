#!/usr/bin/env bash
# loom-grab.sh — save a Loom video you have access to as a clean MP4.
#
# Use this only for videos you're authorized to view (e.g. one shared with you,
# with the password). It uses your legitimate access; it does not bypass anything.
#
# Requires: yt-dlp and ffmpeg on your PATH.
#   macOS:   brew install yt-dlp ffmpeg
#   Linux:   pipx install yt-dlp   (or: pip install -U yt-dlp) ; sudo apt install ffmpeg
#   Windows: run the same yt-dlp commands directly, or use WSL/Git Bash.
#
# Usage:
#   ./loom-grab.sh "https://www.loom.com/share/<id>" "the-password"
#   ./loom-grab.sh "https://www.loom.com/share/<id>"        # prompts for password
#   ./loom-grab.sh                                          # prompts for both
#
# If the password gate isn't honored by yt-dlp's Loom extractor, the script falls
# back to reusing your browser session. Open the link in your browser, enter the
# password once, then re-run. Override the browser with: LOOM_BROWSER=firefox ./loom-grab.sh ...

set -euo pipefail

URL="${1:-}"
PASS="${2:-}"

[[ -z "$URL" ]] && read -rp "Loom share URL: " URL
if [[ -z "${2+set}" ]]; then
  read -rsp "Video password (press Enter if none): " PASS; echo
fi

# --- dependency check ---
missing=0
for bin in yt-dlp ffmpeg; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Missing dependency: $bin" >&2
    missing=1
  fi
done
if [[ "$missing" -eq 1 ]]; then
  echo "Install the missing tool(s) and try again (see the header of this script)." >&2
  exit 1
fi

# Prefer Loom's transcoded MP4; fall back to best video+audio, then best single file.
# Always remux to MP4 with faststart so it plays everywhere and seeks instantly.
COMMON_ARGS=(
  -f "http-transcoded/bv*+ba/b"
  --remux-video mp4
  --merge-output-format mp4
  --postprocessor-args "ffmpeg:-movflags +faststart"
  -o "%(title)s [%(id)s].%(ext)s"
  --no-playlist
)

run_direct() {
  local args=("${COMMON_ARGS[@]}")
  [[ -n "$PASS" ]] && args+=(--video-password "$PASS")
  yt-dlp "${args[@]}" "$URL"
}

run_with_cookies() {
  local browser="${LOOM_BROWSER:-chrome}"
  echo "→ Falling back to your '$browser' session."
  echo "  Make sure you've opened the link in that browser and entered the password."
  yt-dlp "${COMMON_ARGS[@]}" --cookies-from-browser "$browser" "$URL"
}

echo "→ Attempt 1: download with your password / direct access"
if run_direct; then
  echo "✓ Done."
  exit 0
fi

echo "→ Attempt 1 didn't succeed; trying the browser-session route."
if run_with_cookies; then
  echo "✓ Done."
  exit 0
fi

cat >&2 <<'EOF'

Both attempts failed. Last-resort manual route:
  1. Open the Loom link in your browser and enter the password so the video plays.
  2. Open DevTools (F12) → Network tab → filter for ".m3u8" or ".mp4".
  3. Copy the media URL, then run:
       yt-dlp --referer "https://www.loom.com/" \
         -f "http-transcoded/bv*+ba/b" --remux-video mp4 \
         "<PASTE_MEDIA_URL_HERE>"
EOF
exit 1
