# HTML Port

Static browser-game port of the patched pachinko prototype.

## Entry Points

- `index.html`: playable vertical mobile version.
- `compare.html`: side-by-side Unity reference and HTML port.

## Current Scope

- iPhone-style portrait layout.
- Canvas-rendered reels using the finished front/back symbol images.
- Patched game rules:
  - Initial points: 200
  - Time limit: 150 seconds
  - Normal hit rate: 1/6
  - RUSH hit rate: 1/1.5
  - Uniform 1-9 hit symbols in normal mode
  - RUSH odd symbols weighted 1.2x against even symbols
  - 7 hit: 600 points
  - Other hits: 300 points
  - Odd hit enters or continues RUSH
  - Even hit returns to normal
- Reach flip-to-back and normal return behavior.
- Result screen.
- WebAudio placeholder SE at spin, stop, flip, win, and lose timings.

## Asset Notes

No extracted audio files were found under `C:\Codex\pachinko` at the time this port was created. The current SE are generated placeholders and are intentionally isolated in `audio` inside `game.js` so they can be replaced with Unity-extracted sounds later.
