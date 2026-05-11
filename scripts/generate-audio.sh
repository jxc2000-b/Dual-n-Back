#!/usr/bin/env bash
# Generate the 8 letter clips in public/audio/.
# Tries macOS `say`, then `espeak-ng`, then `espeak`. Encodes to mp3 with ffmpeg.
# Run once and commit the output — clips are tiny (~5–10 KB each).

set -euo pipefail

LETTERS=(c h k l q r s t)
OUT="public/audio"
mkdir -p "$OUT"

have() { command -v "$1" >/dev/null 2>&1; }

if have say; then
  ENGINE="say"
elif have espeak-ng; then
  ENGINE="espeak-ng"
elif have espeak; then
  ENGINE="espeak"
else
  echo "ERR: need 'say' (macOS), 'espeak-ng', or 'espeak' on PATH" >&2
  exit 1
fi

if ! have ffmpeg; then
  echo "ERR: need 'ffmpeg' on PATH for mp3 encoding" >&2
  exit 1
fi

echo "Using $ENGINE -> ffmpeg"

for L in "${LETTERS[@]}"; do
  WAV="$(mktemp -t dnb_${L}_XXXXXX).aiff"
  case "$ENGINE" in
    say)
      say -o "$WAV" "$L"
      ;;
    espeak-ng)
      espeak-ng -v en-us -s 140 -p 35 -w "$WAV" "$L"
      ;;
    espeak)
      espeak -v en-us -s 140 -p 35 -w "$WAV" "$L"
      ;;
  esac
  ffmpeg -y -loglevel error -i "$WAV" -ac 1 -ar 22050 -b:a 64k "$OUT/${L}.mp3"
  rm -f "$WAV"
  printf '  wrote %s/%s.mp3\n' "$OUT" "$L"
done

echo "Done. Letters in $OUT: $(ls -1 $OUT | tr '\n' ' ')"
