# Bear & Bird: Dad's Adventure

A small browser fan-game tribute inspired by the Banjo-Kazooie vibe.

## How to turn this into a real game

This build now has a full game loop:
- start screen
- 3 levels of increasing difficulty
- win/lose states
- restartable runs

To keep improving it, focus in this order:
1. **Content**: add more levels/enemies by extending `LEVEL_CONFIGS` in `game.js`.
2. **Feel**: add sound effects/music and particle feedback for collecting notes.
3. **Progression**: add a title menu, difficulty choices, and best-score saving.
4. **Polish**: replace placeholder shapes with original art/animations.
5. **Shipping**: host on itch.io or GitHub Pages and share the link with your dad.

## Play locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Controls

- Move: Arrow keys or WASD
- Goal: Collect all notes in each level
- Win: Beat all 3 levels
- Lose: Run out of feathers or time
