// kitchen.js — the warung floor plan: stations, crates, solids, and proximity.
// One clear job: where things are and which station the chef can reach.
// No game rules here; main.js decides what an interaction does.

export const FLOOR = { x: 8, y: 138, w: 1264, h: 654 };

// Ingredient crates: 3 x 3 grid on the left wall.
const CRATE_INGS = ['nasi', 'mie', 'ayam', 'telur', 'sayur', 'sambal', 'teh', 'gula', 'es'];
export const CRATES = CRATE_INGS.map((ing, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  return {
    id: 'crate-' + ing, kind: 'crate', ing,
    x: 28 + col * 96, y: 250 + row * 84, w: 88, h: 72,
  };
});

export const STATIONS = [
  ...CRATES,
  { id: 'board',    kind: 'board',    label: 'TALENAN',      sub: 'potong ayam & sayur', x: 430, y: 300, w: 190, h: 116 },
  { id: 'wok',      kind: 'wok',      label: 'WOK',          sub: 'masak nasi, mie, telur', x: 660, y: 300, w: 190, h: 116 },
  { id: 'stove',    kind: 'stove',    label: 'PANGGANGAN',   sub: 'panggang ayam', x: 890, y: 300, w: 190, h: 116 },
  { id: 'drink',    kind: 'drink',    label: 'TEKO TEH',     sub: 'seduh teh', x: 1120, y: 300, w: 140, h: 116 },
  { id: 'assembly', kind: 'assembly', label: 'MEJA RACIK',   sub: 'rakit pesanan di sini', x: 430, y: 158, w: 360, h: 66 },
  { id: 'serve',    kind: 'serve',    label: 'JENDELA SAJI', sub: 'antar piring jadi', x: 900, y: 158, w: 350, h: 66 },
];

// Counters the chef cannot walk through (crates row, work stations, top counters).
export const SOLIDS = [
  ...CRATES.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
  { x: 430, y: 300, w: 190, h: 116 },
  { x: 660, y: 300, w: 190, h: 116 },
  { x: 890, y: 300, w: 190, h: 116 },
  { x: 1120, y: 300, w: 140, h: 116 },
  { x: 430, y: 158, w: 360, h: 66 },
  { x: 900, y: 158, w: 350, h: 66 },
];

function distToRect(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

// Nearest station within reach, or null. Crates are reachable from the front.
export function stationNear(px, py, reach = 96) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const d = distToRect(px, py, s);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD <= reach ? best : null;
}

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) || null;
}

export function stationCenter(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}
