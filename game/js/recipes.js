// recipes.js — every ingredient, its prep step, and the four house recipes.
// One clear job: data + pure matching helpers. No rendering, no state.

export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',   color: '#f7ecd0', prep: 'cook', prepTime: 3.0, prepLabel: 'Masak di wok' },
  mie:    { id: 'mie',    name: 'Mie',    color: '#f2c94c', prep: 'cook', prepTime: 3.0, prepLabel: 'Masak di wok' },
  ayam:   { id: 'ayam',   name: 'Ayam',   color: '#e07856', prep: 'chop', prepTime: 2.0, prepLabel: 'Potong di talenan' },
  telur:  { id: 'telur',  name: 'Telur',  color: '#fde68a', prep: 'cook', prepTime: 2.0, prepLabel: 'Goreng di wok' },
  sayur:  { id: 'sayur',  name: 'Sayur',  color: '#4ade80', prep: 'chop', prepTime: 2.0, prepLabel: 'Potong di talenan' },
  sambal: { id: 'sambal', name: 'Sambal', color: '#dc2626', prep: 'none', prepTime: 0,   prepLabel: 'Siap pakai' },
  teh:    { id: 'teh',    name: 'Teh',    color: '#92400e', prep: 'brew', prepTime: 2.0, prepLabel: 'Seduh di teko' },
  gula:   { id: 'gula',   name: 'Gula',   color: '#f8fafc', prep: 'none', prepTime: 0,   prepLabel: 'Siap pakai' },
  es:     { id: 'es',     name: 'Es',     color: '#bae6fd', prep: 'none', prepTime: 0,   prepLabel: 'Siap pakai' },
};

// A carried item is { ing, stage } where stage is 'raw', 'chopped' or 'ready'.
// Prep path per ingredient: chop (ayam raw -> chopped, sayur raw -> ready),
// cook (nasi/mie/telur raw -> ready), grill (ayam chopped -> ready),
// brew (teh raw -> ready). 'none' ingredients are ready straight from the crate.
export function prepResult(ing, stationKind) {
  if (ing === 'ayam' && stationKind === 'board') return 'chopped';
  if (ing === 'sayur' && stationKind === 'board') return 'ready';
  if ((ing === 'nasi' || ing === 'mie' || ing === 'telur') && stationKind === 'wok') return 'ready';
  if (ing === 'ayam' && stationKind === 'stove') return 'ready';
  if (ing === 'teh' && stationKind === 'drink') return 'ready';
  return null;
}

export function prepStationFor(item) {
  const def = INGREDIENTS[item.ing];
  if (item.stage === 'ready') return null;
  if (item.ing === 'ayam' && item.stage === 'chopped') return 'stove';
  if (def.prep === 'chop') return 'board';
  if (def.prep === 'cook') return 'wok';
  if (def.prep === 'brew') return 'drink';
  return null;
}

export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', needs: ['nasi', 'telur', 'ayam'], base: 120, color: '#b45309' },
  { id: 'mie-ayam',    name: 'Mie Ayam',    needs: ['mie', 'ayam', 'sayur'],  base: 120, color: '#ca8a04' },
  { id: 'sate-ayam',   name: 'Sate Ayam',   needs: ['ayam', 'sambal'],         base: 90,  color: '#b91c1c' },
  { id: 'es-teh',      name: 'Es Teh',      needs: ['teh', 'gula', 'es'],     base: 70,  color: '#0369a1' },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// Exact match: the assembled component ids (each once) equal a recipe's needs.
export function recipeFor(componentIds) {
  const key = [...componentIds].sort().join('+');
  return RECIPES.find((r) => [...r.needs].sort().join('+') === key) || null;
}

// Still possible: every assembled component belongs to at least one recipe
// that also contains all the others assembled so far.
export function recipeCanStillMatch(componentIds) {
  if (componentIds.length === 0) return true;
  return RECIPES.some((r) => componentIds.every((c) => r.needs.includes(c)));
}

export function dishLabel(recipe) {
  return recipe ? recipe.name : 'Racikan';
}
