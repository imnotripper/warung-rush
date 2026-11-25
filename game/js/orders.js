// orders.js — the order queue: spawning, timers, rush escalation, matching.
// One clear job: which orders are open and how long each has left.

import { RECIPES } from './recipes.js';

export class OrderQueue {
  constructor() {
    this.orders = [];
    this.spawnTimer = 4;
    this.nextId = 1;
    this.elapsed = 0;
    this.maxConcurrent = 3;
  }

  reset() {
    this.orders = [];
    this.spawnTimer = 4;
    this.nextId = 1;
    this.elapsed = 0;
    this.maxConcurrent = 3;
  }

  // Pressure grows without adding chores: more concurrent orders and
  // shorter timers as the shift goes on, never new mechanics.
  rushLevel() {
    if (this.elapsed > 120) return 2;
    if (this.elapsed > 60) return 1;
    return 0;
  }

  orderTimeMax() {
    return [62, 52, 44][this.rushLevel()];
  }

  spawnInterval() {
    return [13, 11, 9][this.rushLevel()];
  }

  pickRecipe(rng) {
    const pool = this.rushLevel() === 0
      ? RECIPES.filter((r) => r.needs.length === 2)
      : RECIPES;
    return pool[Math.floor(rng() * pool.length)];
  }

  spawn(rng) {
    const recipe = this.pickRecipe(rng);
    const tMax = this.orderTimeMax();
    const order = { id: this.nextId++, recipeId: recipe.id, tLeft: tMax, tMax };
    this.orders.push(order);
    return order;
  }

  // Returns the list of orders that expired this tick.
  update(dt, rng) {
    this.elapsed += dt;
    this.maxConcurrent = 3 + this.rushLevel();
    const expired = [];
    for (const o of this.orders) o.tLeft -= dt;
    for (let i = this.orders.length - 1; i >= 0; i--) {
      if (this.orders[i].tLeft <= 0) expired.push(this.orders.splice(i, 1)[0]);
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.orders.length < this.maxConcurrent) {
      this.spawn(rng);
      this.spawnTimer = this.spawnInterval();
    }
    return expired;
  }

  findForRecipe(recipeId) {
    return this.orders.find((o) => o.recipeId === recipeId) || null;
  }

  remove(order) {
    const i = this.orders.indexOf(order);
    if (i >= 0) this.orders.splice(i, 1);
  }

  // Fraction of time left, 0..1, for the timer bar.
  fraction(order) {
    return Math.max(0, Math.min(1, order.tLeft / order.tMax));
  }

  isUrgent(order) {
    return order.tLeft <= 12;
  }
}
