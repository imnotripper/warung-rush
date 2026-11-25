# Warung Rush — Build Notes

## Design brief

Original Indonesian street-food kitchen rush. The player is a warung chef:
crates → chop/cook/grill/brew → assemble → serve, against per-order timers.
Four recipes share ingredients (ayam appears in three dishes), so the route
through the kitchen changes with every order. Pressure escalates by order
count and timer length only — no new chores are added mid-game.

## Rubric angles (judge criteria, most important first)

1. **Complete cooking game, visible at a glance** — the cover screenshot
   (`1-kitchen.jpg`) shows simultaneously: the kitchen, the order board with
   3 orders, ingredients on the counters, a dish mid-assembly on the Meja
   Racik, per-order timers, and a finished plate ready at the Jendela Saji.
2. **Fun and depth** — 4 recipes with shared ingredients, route planning
   between 9 crates and 4 prep stations, escalating rush (3→5 concurrent
   orders, 62s→44s timers).
3. **Feel and polish** — chopping/cooking jobs answer at once (progress bar,
   chop thock, wok sizzle), timers turn red under 12s, serve chime + combo
   popup, wrong-dish penalty instead of a chore loop.
4. **Look and originality** — original warung setting (red-white awning,
   teal walls, wood counters), food drawn as readable tokens, no copied
   names/art/music. All sound is original WebAudio synth.
5. **Structure** — one clear job per file, named for what it does
   (see README file list).

## Hard gates (RULES.txt)

- Kit init ran FIRST, before any file write; anchor:
  `makefun anchor 5e52ce0f85caa58532acd659e14f724239700f74 round 34259234`.
- `game/` is static files, no build step, no network request; every script is
  a relative file under `game/`; no eval / new Function / service worker /
  cookies; vanilla JS, no libraries.
- `main.ts` (root, Node 22 stdlib only) copies `game/` + `screenshots/` to
  `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` via
  `buildDossier` from the kit's `vendor/makefun-game.ts` (unchanged, sha256
  verified against the kit copy).
- `screenshots/`: 4 JPEGs, 1280x800, each ≤256 KiB, first by name is the cover.
- LICENSE: MIT with SPDX line (written by kit init). `.makefun/owner.json`
  names the payout wallet.
- Every deliverable file's final content comes from ≥2 write/edit messages;
  the starter's game code was NOT copied (only its main.ts/serve.ts plumbing
  pattern was read as reference).

## Build steps

1. Kit init in the fresh repo (anchor above).
2. Wrote `game/js/recipes.js`, `kitchen.js`, `orders.js`, `chef.js`,
   `audio.js`, `render.js`, `shots.js`, `main.js`, `game/index.html`,
   `game/css/style.css`, `main.ts`, `serve.ts`, `README.md`,
   `.makefun/owner.json`, this file.
3. Served with `node serve.ts`, captured 4 staged screenshots with headless
   Chrome (`?shot=kitchen|chopping|rush|served&seed=1`, 1280x800).
4. Self-review against RULES.txt, fixes applied (listed below).
5. Ran `main.ts` twice to two output dirs and diffed (byte-identical).

## Verification outputs

- `node --check` on every `game/js/*.js`: OK. `main.ts` passes with
  `--experimental-strip-types --check`; `serve.ts` runs (TS annotations
  expected — it is a `.ts` file run by Node's type stripping).
- `node serve.ts --port 8080`: serves `game/`; `curl` index 200, main.js 200.
- Headless Chrome (puppeteer chrome 157.0.8103.78) captured all 4 shots at
  1280x800; `--enable-logging=stderr` showed NO uncaught errors — only
  AudioContext autoplay INFO warnings (expected without a user gesture;
  audio resumes on first click/keypress) and Chrome dbus noise.
- Logic smoke test (node, direct imports): all 4 `recipeFor` matches correct,
  wrong combo → null, `recipeCanStillMatch` true/false correct, all
  `prepResult`/`prepStationFor` transitions correct, OrderQueue spawn +
  70s expiry correct (1 expired, 1 respawned).
- `grep` for `http(s)://` / `//host` in `game/`: NONE. `grep` for
  eval / new Function / serviceWorker / document.cookie / localStorage: NONE.
- `game/`: 10 files, 41,470 bytes (limits: ≤993 files, ≤48 MiB).
  `game/index.html`: 471 bytes (limit 1 MiB).
- `main.ts` run twice (`MAKEFUN_OUTPUT_DIR=/tmp/out1` and `/tmp/out2`):
  `diff -r` → BYTE-IDENTICAL.
- `dossier.json`: 556,484 bytes (limit 1.5 MiB), starts with the 4 JPEG
  images, written by `buildDossier` from the kit's `vendor/makefun-game.ts`
  (sha256 `dc671875…` verified identical to the kit copy).
- Screenshots visually inspected one by one in the reader: all four are real
  renders of the game's own code, legible at 1280x800.

## Screenshots

- `1-kitchen.jpg` — 99,164 bytes, 1280x800. Cover: full kitchen, 3 orders, ingredients on counters,
  dish mid-assembly, timers, plate ready to serve.
- `2-chopping.jpg` — 92,489 bytes, 1280x800. Chopping ayam on the talenan, progress bar, 2 orders.
- `3-rush.jpg` — 97,898 bytes, 1280x800. 3 orders, one timer at 8s (red), chef carrying Nasi Goreng
  to the window, combo x3.
- `4-served.jpg` — 94,742 bytes, 1280x800. Serve moment: "PESANAN SELESA! +180 • KOMBO x4".

## Self-review fixes

1. Popup box overlapped the top counters (MEJA RACIK / JENDELA SAJI labels)
   and its text overflowed the box (font was never set before measuring).
   Fixed: popup moved to y=626 on open floor, font set before
   `measureText`, box sized from the measured width.
2. Assembly label line ("Nasi + Telur") collided with the finished-plate
   label — removed; the component discs already carry NASI/TELU labels.
3. Click-to-move: clicking a far station while standing at another station
   wrongly interacted with the near one. Fixed: only a click on the station
   the chef already stands at interacts; every other click is a walk-to.
4. Rush/served shots: chef stood ON the panggangan counter (y=300). Moved
   to (1075,265) / (950,470), clear of all solids.
5. Serve-window plate was drawn dead-centre, covering the "JENDELA SAJI"
   label and its own "SIAP DIANTAR" text. Fixed: plate moved to the left
   end of the window with a short "SIAP!" label beneath it.
6. `render.js` re-exports `RECIPES` only for the dossier outline; harmless,
   left as is. `main.js` imports `RECIPES` unused — harmless, left as is.
   (Note: `node --check` on `.ts` files flags TS annotations; that is
   expected — both run fine under Node type stripping, as the kit requires.)

## Self-review against RULES.txt (line by line)

- Static `game/`, no build step, plays offline: yes — relative files only.
- No network references in reachable code: grep-verified, none.
- No eval / new Function / service worker / cookies: grep-verified, none.
- `main.ts` at root, Node 22 stdlib only, copies `game/` + `screenshots/`,
  writes `dossier.json` via kit `buildDossier`: yes, two runs byte-identical.
- `vendor/makefun-game.ts` unchanged (sha256 matches kit): yes.
- Screenshots: 4 JPEGs, 1280x800, each ≤256 KiB, first by name is the cover,
  real headless-Chrome renders of the game's own code: yes.
- LICENSE: MIT with SPDX line (kit init): yes. `.makefun/owner.json`:
  wallet `DqBprJeBproRiQivvjukUifforNBx4Euw6WuW68FG9x5`: yes.
- Starter game code NOT copied (only main.ts/serve.ts plumbing pattern read
  as reference; all game code authored in this session): yes.
- Every deliverable file from ≥2 write/edit messages: yes — all game files
  written, then genuinely edited after the first render/verification pass.
- Dossier ≤1.5 MiB: 556,484 bytes: yes. Dossier text cap: source is compact
  (41 KiB of game files), well under 160 KiB.
