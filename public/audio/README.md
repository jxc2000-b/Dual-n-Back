# Letter audio clips

Run `npm run audio:gen` from the repo root to populate this folder with
`c.mp3 h.mp3 k.mp3 l.mp3 q.mp3 r.mp3 s.mp3 t.mp3`.

Requires `ffmpeg` plus one of: `say` (macOS), `espeak-ng`, or `espeak`.

The generated clips are tiny (~5–10 KB each) — commit them so the deploy
doesn't depend on the user's machine having a TTS engine.
