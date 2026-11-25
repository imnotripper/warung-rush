// chef.js — the chef: keyboard movement, click-to-move, carrying, collisions.
// One clear job: where the chef is and what they hold.

import { FLOOR, SOLIDS } from './kitchen.js';

export class Chef {
  constructor() {
    this.x = 640;
    this.y = 620;
    this.tx = 640; // click-to-move target
    this.ty = 620;
    this.speed = 300;
    this.radius = 26;
    this.facing = 1; // 1 right, -1 left
    this.moving = false;
    this.carry = null; // { ing, stage } or { dish, recipeId }
  }

  reset() {
    this.x = 640; this.y = 620; this.tx = 640; this.ty = 620;
    this.facing = 1; this.moving = false; this.carry = null;
  }

  setTarget(x, y) {
    this.tx = Math.max(FLOOR.x + this.radius, Math.min(FLOOR.x + FLOOR.w - this.radius, x));
    this.ty = Math.max(FLOOR.y + this.radius, Math.min(FLOOR.y + FLOOR.h - this.radius, y));
  }

  // keys: {up,down,left,right} booleans. Keyboard overrides click target.
  update(dt, keys) {
    let dx = 0;
    let dy = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this.x += (dx / len) * this.speed * dt;
      this.y += (dy / len) * this.speed * dt;
      this.tx = this.x;
      this.ty = this.y;
      this.facing = dx !== 0 ? Math.sign(dx) : this.facing;
      this.moving = true;
    } else {
      const ddx = this.tx - this.x;
      const ddy = this.ty - this.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist > 4) {
        const step = Math.min(dist, this.speed * dt);
        this.x += (ddx / dist) * step;
        this.y += (ddy / dist) * step;
        this.facing = ddx !== 0 ? Math.sign(ddx) : this.facing;
        this.moving = true;
      } else {
        this.moving = false;
      }
    }
    this.clampToFloor();
    this.resolveSolids();
  }

  clampToFloor() {
    this.x = Math.max(FLOOR.x + this.radius, Math.min(FLOOR.x + FLOOR.w - this.radius, this.x));
    this.y = Math.max(FLOOR.y + this.radius, Math.min(FLOOR.y + FLOOR.h - this.radius, this.y));
  }

  // Push the chef circle out of counter rectangles, axis by axis.
  resolveSolids() {
    for (const s of SOLIDS) {
      const cx = Math.max(s.x, Math.min(this.x, s.x + s.w));
      const cy = Math.max(s.y, Math.min(this.y, s.y + s.h));
      const dx = this.x - cx;
      const dy = this.y - cy;
      const d = Math.hypot(dx, dy);
      if (d < this.radius && d > 0.001) {
        this.x = cx + (dx / d) * this.radius;
        this.y = cy + (dy / d) * this.radius;
      } else if (d <= 0.001) {
        this.y = s.y + s.h + this.radius;
      }
    }
    this.clampToFloor();
  }

  carryingDish() {
    return this.carry && this.carry.dish ? this.carry : null;
  }

  carryingIngredient() {
    return this.carry && !this.carry.dish ? this.carry : null;
  }
}
