// render.js — everything the player sees: kitchen, order board, chef, food, HUD.
// One clear job: draw the current state on the canvas. No rules, no input.

import { INGREDIENTS, RECIPES, recipeById } from './recipes.js';
import { STATIONS, CRATES } from './kitchen.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px system-ui, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// A readable little food token: coloured disc + short label.
export function drawIngredient(ctx, ingId, x, y, r) {
  const def = INGREDIENTS[ingId];
  if (!def) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = def.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  text(ctx, def.name.slice(0, 4).toUpperCase(), x, y + r + 13, 10, '#fff7e6');
}

function drawPlate(ctx, x, y, r, recipe) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fafaf9';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#a8a29e';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = recipe ? recipe.color : '#d6d3d1';
  ctx.fill();
  if (recipe) {
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.15, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  }
}

function drawOrderCard(ctx, order, x, y, w, h, queue) {
  const recipe = recipeById(order.recipeId);
  const frac = queue.fraction(order);
  const urgent = queue.isUrgent(order);
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = urgent ? '#7f1d1d' : '#292524';
  ctx.fill();
  ctx.lineWidth = urgent ? 3 : 1.5;
  ctx.strokeStyle = urgent ? '#ef4444' : '#78716c';
  ctx.stroke();
  text(ctx, recipe.name, x + 12, y + 18, 15, '#fef3c7', 'left');
  // Ingredient dots for the recipe.
  let dx = x + 14;
  for (const ing of recipe.needs) {
    ctx.beginPath();
    ctx.arc(dx, y + 44, 9, 0, Math.PI * 2);
    ctx.fillStyle = INGREDIENTS[ing].color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.stroke();
    dx += 24;
  }
  text(ctx, recipe.needs.map((i) => INGREDIENTS[i].name).join(' + '), x + 12, y + 68, 11, '#d6d3d1', 'left', '400');
  // Timer bar + seconds.
  roundRect(ctx, x + 12, y + h - 18, w - 24, 9, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fill();
  if (frac > 0) {
    roundRect(ctx, x + 12, y + h - 18, (w - 24) * frac, 9, 4);
    ctx.fillStyle = urgent ? '#ef4444' : frac < 0.4 ? '#f59e0b' : '#4ade80';
    ctx.fill();
  }
  text(ctx, Math.ceil(order.tLeft) + ' dtk', x + w - 12, y + 18, 15, urgent ? '#fca5a5' : '#e7e5e4', 'right');
  ctx.restore();
}

function drawChef(ctx, chef, now) {
  const bob = chef.moving ? Math.sin(now / 90) * 3 : 0;
  const x = chef.x;
  const y = chef.y + bob;
  // Shadow.
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 24, 26, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  // Body (apron).
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#0f766e';
  ctx.stroke();
  // Head + chef hat.
  ctx.beginPath();
  ctx.arc(x, y - 30, 17, 0, Math.PI * 2);
  ctx.fillStyle = '#fcd9b8';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 18, y - 56, 36, 16, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 54, 13, Math.PI, 0);
  ctx.fill();
  // Eyes look the facing way.
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(x + chef.facing * 5 - 5, y - 32, 2.4, 0, Math.PI * 2);
  ctx.arc(x + chef.facing * 5 + 5, y - 32, 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Carried item above the head.
  const carry = chef.carry;
  if (carry) {
    if (carry.dish) {
      drawPlate(ctx, x, y - 74, 15, recipeById(carry.recipeId));
    } else {
      drawIngredient(ctx, carry.ing, x, y - 74, 13);
      if (carry.stage === 'chopped') text(ctx, 'POTONG', x, y - 96, 9, '#fde68a');
      else if (carry.stage === 'raw') text(ctx, 'MENTAH', x, y - 96, 9, '#e7e5e4');
    }
  }
}

function drawStation(ctx, s, state, now) {
  const near = state.nearStation === s;
  ctx.save();
  // Counter body.
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fillStyle = s.kind === 'serve' ? '#7c2d12' : s.kind === 'assembly' ? '#78350f' : '#57534e';
  ctx.fill();
  ctx.lineWidth = near ? 4 : 2;
  ctx.strokeStyle = near ? '#fbbf24' : 'rgba(0,0,0,0.45)';
  ctx.stroke();
  // Counter top stripe.
  roundRect(ctx, s.x + 4, s.y + 4, s.w - 8, 14, 6);
  ctx.fillStyle = s.kind === 'serve' ? '#c2410c' : s.kind === 'assembly' ? '#b45309' : '#78716c';
  ctx.fill();
  if (s.kind === 'crate') {
    drawIngredient(ctx, s.ing, s.x + s.w / 2, s.y + 34, 16);
    text(ctx, INGREDIENTS[s.ing].name.toUpperCase(), s.x + s.w / 2, s.y + s.h - 10, 11, '#fef3c7');
  } else {
    text(ctx, s.label, s.x + s.w / 2, s.y + 30, 15, '#fef3c7');
    text(ctx, s.sub, s.x + s.w / 2, s.y + 50, 10, '#d6d3d1', 'center', '400');
  }
  // Active job progress bar on this station.
  const job = state.job;
  if (job && job.stationId === s.id) {
    const p = job.progress / job.duration;
    roundRect(ctx, s.x + 10, s.y + s.h - 16, s.w - 20, 10, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    roundRect(ctx, s.x + 10, s.y + s.h - 16, (s.w - 20) * p, 10, 5);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    text(ctx, job.label + ' ' + Math.ceil(p * 100) + '%', s.x + s.w / 2, s.y + s.h - 34, 12, '#fef3c7');
  }
  ctx.restore();
}

function drawAssembly(ctx, state) {
  const s = STATIONS.find((st) => st.id === 'assembly');
  const dish = state.assemblyDish;
  // Components mid-assembly on the left of the counter, finished plate on
  // the right — the cover shot needs both visible at once.
  let ax = s.x + 26;
  for (const ing of state.assembly) {
    drawIngredient(ctx, ing, ax, s.y + s.h / 2 + 20, 14);
    ax += 44;
  }
  // (No text line under the components: the discs already carry their
  // labels, and a second line collided with the finished-plate label.)
  if (dish) {
    drawPlate(ctx, s.x + s.w - 60, s.y + s.h / 2 + 20, 24, recipeById(dish.recipeId));
    text(ctx, recipeById(dish.recipeId).name + ' — SIAP!', s.x + s.w - 60, s.y + s.h + 16, 12, '#fde68a');
  }
}

function drawServeWindow(ctx, state) {
  const s = STATIONS.find((st) => st.id === 'serve');
  const ready = state.servedFlash;
  if (ready && ready.t > 0) {
    // A finished plate waiting at the left end of the serving window,
    // clear of the centred label.
    drawPlate(ctx, s.x + 52, s.y + s.h / 2 + 12, 22, recipeById('sate-ayam'));
    text(ctx, 'SIAP!', s.x + 52, s.y + s.h + 18, 11, '#4ade80');
  }
}

export function drawGame(ctx, state, now) {
  const W = VIEW_W;
  const H = VIEW_H;
  // Wall + floor.
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(0, 0, W, 138);
  ctx.fillStyle = '#134e4a';
  ctx.fillRect(0, 128, W, 10);
  ctx.fillStyle = '#b45309';
  for (let x = 0; x < W; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 48, 0);
    ctx.lineTo(x + 24, 26);
    ctx.lineTo(x - 24, 26);
    ctx.closePath();
    ctx.fillStyle = x % 192 === 0 ? '#dc2626' : '#f8fafc';
    ctx.fill();
  }
  text(ctx, 'WARUNG RUSH', 24, 52, 30, '#fef3c7', 'left');
  text(ctx, 'Dapur jalanan — masak cepat, antar tepat waktu!', 24, 84, 13, '#ccfbf1', 'left', '400');
  // Floor tiles.
  ctx.fillStyle = '#d6a86c';
  ctx.fillRect(0, 138, W, H - 138);
  ctx.strokeStyle = 'rgba(120,53,15,0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 138); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 138; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Floor mat in the middle.
  ctx.fillStyle = 'rgba(180,83,9,0.18)';
  roundRect(ctx, 330, 470, 620, 300, 16);
  ctx.fill();

  // Stations and crates.
  for (const s of STATIONS) drawStation(ctx, s, state, now);
  drawAssembly(ctx, state);
  drawServeWindow(ctx, state);

  // Chef.
  drawChef(ctx, state.chef, now);

  // Order board: right side of the top strip.
  const boardX = 470;
  const cardW = 246;
  const gap = 12;
  const orders = state.queue.orders;
  if (orders.length === 0) {
    text(ctx, 'Belum ada pesanan — siap-siap!', boardX + 40, 66, 14, '#fef3c7', 'left', '400');
  }
  orders.slice(0, 3).forEach((o, i) => {
    drawOrderCard(ctx, o, boardX + i * (cardW + gap), 14, cardW, 104, state.queue);
  });

  // HUD bottom bar.
  ctx.fillStyle = 'rgba(12,10,9,0.82)';
  roundRect(ctx, 12, H - 52, W - 24, 40, 10);
  ctx.fill();
  text(ctx, 'SKOR ' + state.score, 30, H - 32, 18, '#fde68a', 'left');
  text(ctx, 'KOMBO x' + Math.max(1, state.combo), 210, H - 32, 16, state.combo >= 3 ? '#4ade80' : '#e7e5e4', 'left');
  text(ctx, 'TERANTAR ' + state.served + '   GAGAL ' + state.failed, 380, H - 32, 14, '#d6d3d1', 'left', '400');
  const shiftLeft = Math.max(0, Math.ceil(state.shiftLeft));
  const mm = Math.floor(shiftLeft / 60);
  const ss = String(shiftLeft % 60).padStart(2, '0');
  text(ctx, 'SHIFT ' + mm + ':' + ss, W - 260, H - 32, 16, shiftLeft <= 30 ? '#fca5a5' : '#e7e5e4', 'left');
  text(ctx, state.audio.muted ? 'SUARA: MATI (M)' : 'SUARA: NYALA (M)', W - 130, H - 32, 12, '#a8a29e', 'left', '400');

  // Controls hint.
  text(ctx, 'WASD / panah: gerak   •   klik: jalan ke titik   •   E / Spasi: pakai stasiun   •   M: suara', W / 2, H - 66, 12, '#44403c', 'center', '400');

  // Popup message: low on the floor, clear of the counters, sized to fit.
  if (state.popup && state.popup.t > 0) {
    const p = state.popup;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.t);
    ctx.font = '700 24px system-ui, sans-serif';
    const tw = ctx.measureText(p.text).width;
    const bw = tw + 44;
    const bx = W / 2 - bw / 2;
    const by = 626;
    ctx.fillStyle = 'rgba(12,10,9,0.88)';
    roundRect(ctx, bx, by, bw, 52, 12);
    ctx.fill();
    ctx.fillStyle = p.color || '#fde68a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.text, W / 2, by + 26);
    ctx.restore();
  }

  // Title screen.
  if (state.mode === 'title') {
    ctx.fillStyle = 'rgba(12,10,9,0.72)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'WARUNG RUSH', W / 2, 250, 64, '#fde68a');
    text(ctx, 'Dapur jalanan paling sibuk di kota', W / 2, 310, 20, '#e7e5e4', 'center', '400');
    text(ctx, 'Ambil bahan, potong, masak, rakit, antar sebelum timer habis!', W / 2, 348, 16, '#d6d3d1', 'center', '400');
    text(ctx, 'Nasi Goreng  •  Mie Ayam  •  Sate Ayam  •  Es Teh', W / 2, 392, 16, '#fde68a');
    text(ctx, 'WASD / panah bergerak  •  klik untuk jalan  •  E / Spasi memakai stasiun', W / 2, 440, 15, '#e7e5e4', 'center', '400');
    text(ctx, 'Tekan ENTER atau klik untuk mulai', W / 2, 500, 22, '#4ade80');
  }

  // Game over screen.
  if (state.mode === 'over') {
    ctx.fillStyle = 'rgba(12,10,9,0.78)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'SHIFT SELESAI!', W / 2, 280, 52, '#fde68a');
    text(ctx, 'Skor akhir: ' + state.score, W / 2, 350, 28, '#fef3c7');
    text(ctx, 'Pesanan terantar: ' + state.served + '   •   Kombo terbaik: x' + state.bestCombo, W / 2, 396, 18, '#e7e5e4', 'center', '400');
    text(ctx, 'Tekan R untuk main lagi', W / 2, 450, 20, '#4ade80');
  }
}

export { RECIPES };
