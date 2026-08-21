import * as THREE from 'three';
import { Grid } from './Grid.js';
import { DEFENDER_CATALOG, Defender } from './Defenders.js';
import { Enemy } from './Enemies.js';
import { ModelFactory } from './Models.js';
import { ParticleSystem } from '../engine/ParticleSystem.js';
import { audio } from '../engine/AudioManager.js';

export class GameSession {
  constructor(scene, isPlayer1) {
    this.scene = scene;
    this.isPlayer1 = isPlayer1;

    this.grid = new Grid(this.scene, this.isPlayer1);
    this.particles = new ParticleSystem(this.scene);

    this.ingredients = 100; // Starting ingredients
    this.pantryHp = 100;    // Pantry HP (Max 100)
    this.maxPantryHp = 100;

    this.selectedDeckIndex = 0;

    this.defenders = [];
    this.enemies = [];
    this.bullets = [];
    this.drops = [];        // Fresh Ingredient drops on the grid
    this.floatingTexts = []; // Green "+2", "+4", "+6", "+10" floaters

    this.dropTimer = 0;
    this.nextDropInterval = 5.0; // 4 to 6s interval

    this.isGameOver = false;

    this.initDeckUI();
    this.updateIngredientUI();
    this.updatePantryHpUI();
  }

  initDeckUI() {
    const deckContainerId = this.isPlayer1 ? 'p1-deck' : 'p2-deck';
    const deckContainer = document.getElementById(deckContainerId);
    if (!deckContainer) return;

    deckContainer.innerHTML = '';
    DEFENDER_CATALOG.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `card-item ${index === this.selectedDeckIndex ? 'selected' : ''}`;
      card.dataset.index = index;

      card.innerHTML = `
        <span class="card-index">${index + 1}</span>
        <span class="card-icon">${item.icon}</span>
        <span class="card-name">${item.name}</span>
        <span class="card-cost">${item.cost}</span>
      `;

      deckContainer.appendChild(card);
    });
  }

  updateDeckUI() {
    const deckContainerId = this.isPlayer1 ? 'p1-deck' : 'p2-deck';
    const deckContainer = document.getElementById(deckContainerId);
    if (!deckContainer) return;

    const cards = deckContainer.querySelectorAll('.card-item');
    cards.forEach((card, idx) => {
      const catalogData = DEFENDER_CATALOG[idx];
      const canAfford = this.ingredients >= catalogData.cost;

      card.classList.toggle('selected', idx === this.selectedDeckIndex);
      card.classList.toggle('cannot-afford', !canAfford);
    });
  }

  selectDeckIndex(index) {
    if (index >= 0 && index < DEFENDER_CATALOG.length) {
      this.selectedDeckIndex = index;
      this.updateDeckUI();
    }
  }

  cycleDeck(direction) {
    this.selectedDeckIndex = (this.selectedDeckIndex + direction + DEFENDER_CATALOG.length) % DEFENDER_CATALOG.length;
    this.updateDeckUI();
  }

  addIngredients(amount) {
    this.ingredients += amount;
    this.updateIngredientUI();
    this.updateDeckUI();
  }

  updateIngredientUI() {
    const countId = this.isPlayer1 ? 'p1-ingredients-count' : 'p2-ingredients-count';
    const el = document.getElementById(countId);
    if (el) el.innerText = this.ingredients;
  }

  updatePantryHpUI() {
    const hpBarId = this.isPlayer1 ? 'p1-hp-bar' : 'p2-hp-bar';
    const hpTextId = this.isPlayer1 ? 'p1-hp-text' : 'p2-hp-text';

    const hpBar = document.getElementById(hpBarId);
    const hpText = document.getElementById(hpTextId);

    const pct = Math.max(0, (this.pantryHp / this.maxPantryHp) * 100);

    if (hpBar) {
      hpBar.style.width = `${pct}%`;
      if (pct <= 35) {
        hpBar.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';
      } else {
        hpBar.style.background = this.isPlayer1
          ? 'linear-gradient(90deg, #2563eb, #60a5fa)'
          : 'linear-gradient(90deg, #059669, #34d399)';
      }
    }

    if (hpText) {
      hpText.innerText = `${Math.max(0, Math.ceil(this.pantryHp))} HP`;
    }
  }

  triggerDamageFlash() {
    const overlayId = this.isPlayer1 ? 'p1-damage-overlay' : 'p2-damage-overlay';
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.classList.add('flash-active');
      setTimeout(() => {
        overlay.classList.remove('flash-active');
      }, 250);
    }
  }

  spawnFloatingText(text, worldPos) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '900 42px Outfit, sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(worldPos);
    sprite.position.y += 0.8;
    sprite.scale.set(1.4, 0.7, 1);

    this.scene.add(sprite);
    this.floatingTexts.push({ sprite, texture, life: 0.8, maxLife: 0.8 });
  }

  executeAction() {
    const r = this.grid.cursorRow;
    const c = this.grid.cursorCol;

    // 1. Check if there is a Fresh Ingredient Drop at cursor cell -> Collect it!
    const dropIndex = this.drops.findIndex(d => d.row === r && d.col === c);
    if (dropIndex !== -1) {
      const drop = this.drops[dropIndex];
      this.scene.remove(drop.mesh);
      this.drops.splice(dropIndex, 1);

      this.addIngredients(75); // Buffed from 25 to 75 points!
      this.spawnFloatingText('+75', this.grid.getCellWorldPos(r, c));
      audio.playPlop();
      this.particles.createCollectBurst(this.grid.getCellWorldPos(r, c), 0xef4444);
      return;
    }

    // 2. Otherwise, plant selected Defender
    const selectedCard = DEFENDER_CATALOG[this.selectedDeckIndex];
    if (this.ingredients < selectedCard.cost) {
      return; // Not enough ingredients
    }

    if (this.grid.isCellOccupied(r, c)) {
      return; // Cell already occupied!
    }

    // Spend ingredients & place defender
    this.addIngredients(-selectedCard.cost);
    const newDefender = new Defender(selectedCard.id, r, c);
    this.grid.placeDefender(r, c, newDefender);
    this.defenders.push(newDefender);

    audio.playPlop();
    this.particles.createSplash(this.grid.getCellWorldPos(r, c), 0x22c55e, 10);
  }

  spawnEnemy(type, row) {
    const enemy = new Enemy(type, row);
    this.scene.add(enemy.mesh);
    this.enemies.push(enemy);
  }

  spawnBullet(row, col) {
    const bulletMesh = ModelFactory.createSeedBullet();
    bulletMesh.position.set(col + 0.3, 0.4, row);
    this.scene.add(bulletMesh);

    this.bullets.push({
      mesh: bulletMesh,
      row: row,
      col: col + 0.3,
      speed: 7.0 // cols per second
    });
  }

  spawnRandomIngredientDrop() {
    const r = Math.floor(Math.random() * 5);
    const c = Math.floor(Math.random() * 9);

    const mesh = ModelFactory.createIngredientDrop();
    mesh.position.set(c, 0.1, r);
    this.scene.add(mesh);

    this.drops.push({
      mesh: mesh,
      row: r,
      col: c,
      life: 10.0 // Despawns after 10 seconds if uncollected
    });
  }

  setPhaseBadge(text) {
    const badge = document.getElementById('wave-phase-badge');
    if (badge) badge.innerText = text;
  }

  update(deltaTime, onGameOverTrigger) {
    if (this.isGameOver) return;

    // 1. Grid cursor reticle update
    this.grid.update(deltaTime);

    // 2. Particle updates
    this.particles.update(deltaTime);

    // 3. Floating text updates
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= deltaTime;
      ft.sprite.position.y += deltaTime * 1.5;
      ft.sprite.material.opacity = ft.life / ft.maxLife;

      if (ft.life <= 0) {
        this.scene.remove(ft.sprite);
        ft.texture.dispose();
        ft.sprite.material.dispose();
        this.floatingTexts.splice(i, 1);
      }
    }

    // 4. Passive Ingredient Drop Spawner (every 4..6s)
    this.dropTimer += deltaTime;
    if (this.dropTimer >= this.nextDropInterval) {
      this.dropTimer = 0;
      this.nextDropInterval = 4.0 + Math.random() * 2.0; // 4 to 6s
      this.spawnRandomIngredientDrop();
    }

    // Update floating drops bobbing & lifetime
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.life -= deltaTime;
      drop.mesh.rotation.y += deltaTime * 2;
      drop.mesh.position.y = 0.1 + Math.sin(Date.now() * 0.004) * 0.08;

      if (drop.life <= 0) {
        this.scene.remove(drop.mesh);
        this.drops.splice(i, 1);
      }
    }

    // 5. Update Defenders
    for (let i = this.defenders.length - 1; i >= 0; i--) {
      const def = this.defenders[i];
      def.update(deltaTime, this);
      if (def.hp <= 0) {
        this.grid.removeDefender(def.row, def.col);
        this.defenders.splice(i, 1);
      }
    }

    // 6. Update Seed Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.col += bullet.speed * deltaTime;
      bullet.mesh.position.x = bullet.col;

      // Check collision with enemies on the same row
      const targetEnemy = this.enemies.find(e => e.row === bullet.row && Math.abs(e.col - bullet.col) < 0.4 && e.hp > 0);
      if (targetEnemy) {
        const isDead = targetEnemy.takeDamage(1, this);
        this.particles.createSplash(bullet.mesh.position, 0xef4444, 8);

        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);

        if (isDead) {
          const reward = targetEnemy.killReward || 2;
          this.addIngredients(reward);
          this.spawnFloatingText(`+${reward}`, targetEnemy.mesh.position);
          this.removeEnemy(targetEnemy);
        }
      } else if (bullet.col > 9.5) {
        // Out of bounds
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }

    // 7. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(deltaTime, this);

      // Check Pantry Invasions (Pest reaches col < -0.2)
      if (enemy.col < -0.2) {
        const dmg = enemy.baseDamage || 10;
        this.pantryHp = Math.max(0, this.pantryHp - dmg);
        this.updatePantryHpUI();

        audio.playPantryDamage();
        this.triggerDamageFlash();
        this.particles.createSplash(enemy.mesh.position, 0xef4444, 20);

        // Self-destruct pest upon reaching pantry (No kill reward awarded!)
        this.removeEnemy(enemy);

        // Check Defeat
        if (this.pantryHp <= 0) {
          this.isGameOver = true;
          onGameOverTrigger(this.isPlayer1 ? 2 : 1);
          return;
        }
      }
    }
  }

  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.scene.remove(enemy.mesh);
      enemy.destroy();
      this.enemies.splice(idx, 1);
    }
  }
}
