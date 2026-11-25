[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/imnotripper/warung-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/imnotripper/warung-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Warung Rush — Dapur Jalanan

A fast Indonesian street-food kitchen game for the [best-cooking-game-20261125-0137 bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). You are the chef of a busy warung: grab ingredients from the crates, chop and cook them, assemble orders on the counter, and serve them at the window before their timers run out. Pressure grows through the 3-minute shift — more orders, shorter timers — and fast, on-time serves build your combo and tips.

## Live demo

Play it here: https://imnotripper.github.io/warung-rush/game/

## How to play

- **Move:** WASD / arrow keys, or click anywhere on the floor to walk there.
- **Use a station:** walk close to it, then press **E** or **Space** (or click the station).
- **Flow:** crate → chop on the talenan / cook in the wok / grill on the panggangan / brew at the teko → assemble on the Meja Racik → serve at the Jendela Saji.
- **M:** toggle sound. Sounds are synthesized live with WebAudio — no audio files.

## Recipes

| Dish | Needs |
| --- | --- |
| Nasi Goreng | cooked nasi + cooked telur + grilled ayam |
| Mie Ayam | cooked mie + grilled ayam + chopped sayur |
| Sate Ayam | grilled ayam + sambal |
| Es Teh | brewed teh + gula + es |

Wrong combinations cost points, serving a dish nobody ordered costs points, and a timer that runs out loses the order and resets your combo. Serve fast for a time bonus; serve several in a row for a combo multiplier.

## How to run

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies, no network requests — `game/` is plain static files. Screenshots are deterministic staged scenes: open `game/?shot=kitchen&seed=1` (also `chopping`, `rush`, `served`).

## Files

- `game/index.html` — page shell, loads the game
- `game/css/style.css` — page chrome only
- `game/js/main.js` — boot, loop, input, interaction rules
- `game/js/kitchen.js` — floor plan: stations, crates, proximity
- `game/js/recipes.js` — ingredients, prep steps, recipes, matching
- `game/js/orders.js` — order queue, timers, rush escalation
- `game/js/chef.js` — movement, click-to-move, carrying, collisions
- `game/js/render.js` — all drawing: kitchen, board, chef, food, HUD
- `game/js/audio.js` — original WebAudio synth sounds
- `game/js/shots.js` — deterministic staged scenes for screenshots
- `main.ts` — hand-in program: copies `game/` + `screenshots/` to `/output`, writes `dossier.json`
- `serve.ts` — tiny static server for local play

License: MIT.
