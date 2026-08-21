import { ModelFactory } from './Models.js';
import { audio } from '../engine/AudioManager.js';

export const DEFENDER_TYPES = {
  PIMENTAO: 'pimentao',
  MEL: 'mel',
  ALHO: 'alho',
  FACA: 'faca',
  MANJERICAO: 'manjricao'
};

export const DEFENDER_CATALOG = [
  {
    id: DEFENDER_TYPES.PIMENTAO,
    name: 'Pimentão Atirador',
    cost: 100,
    icon: '🍅',
    desc: 'Atira sementes na linha inteira.',
    hp: 4
  },
  {
    id: DEFENDER_TYPES.MEL,
    name: 'Pote de Mel',
    cost: 50,
    icon: '🍯',
    desc: 'Desacelera inimigos na célula em 50%.',
    hp: 8
  },
  {
    id: DEFENDER_TYPES.ALHO,
    name: 'Dente de Alho',
    cost: 75,
    icon: '🧄',
    desc: 'Barreira resistente com alto HP.',
    hp: 24
  },
  {
    id: DEFENDER_TYPES.FACA,
    name: 'Faca Giratória',
    cost: 150,
    icon: '🔪',
    desc: 'Dano constante de 2/s na área 3x3.',
    hp: 4
  },
  {
    id: DEFENDER_TYPES.MANJERICAO,
    name: 'Vaso de Manjericão',
    cost: 50,
    icon: '🌿',
    desc: 'Gera +25 ingredientes a cada 10s.',
    hp: 4
  }
];

export class Defender {
  constructor(type, row, col) {
    this.type = type;
    this.row = row;
    this.col = col;

    const catalogData = DEFENDER_CATALOG.find(d => d.id === type);
    this.name = catalogData.name;
    this.hp = catalogData.hp;
    this.maxHp = catalogData.hp;

    this.mesh = this.createMeshForType(type);

    // Timers
    this.shootTimer = 0;
    this.shootInterval = 1.2; // 1.2s rate for Pimentão
    this.manjricaoTimer = 0;
    this.manjricaoInterval = 10.0; // 10s for +25 bonus
    this.facaTimer = 0;
  }

  createMeshForType(type) {
    switch (type) {
      case DEFENDER_TYPES.PIMENTAO:
        return ModelFactory.createChiliShooter();
      case DEFENDER_TYPES.MEL:
        return ModelFactory.createHoneyPot();
      case DEFENDER_TYPES.ALHO:
        return ModelFactory.createGarlicClove();
      case DEFENDER_TYPES.FACA:
        return ModelFactory.createSpinningKnife();
      case DEFENDER_TYPES.MANJERICAO:
        return ModelFactory.createBasilPot();
      default:
        return ModelFactory.createChiliShooter();
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }

  update(deltaTime, session) {
    // 🍅 Pimentão Atirador shooting logic
    if (this.type === DEFENDER_TYPES.PIMENTAO) {
      this.shootTimer += deltaTime;
      if (this.shootTimer >= this.shootInterval) {
        // Check if there are enemies in the same row ahead (col >= this.col)
        const enemyAhead = session.enemies.some(e => e.row === this.row && e.col >= this.col && e.hp > 0);
        if (enemyAhead) {
          this.shootTimer = 0;
          session.spawnBullet(this.row, this.col);
          audio.playShoot();
        }
      }
    }

    // 🔪 Faca Giratória area damage (2/s in surrounding 3x3 cells)
    if (this.type === DEFENDER_TYPES.FACA) {
      const blades = this.mesh.getObjectByName('blades');
      if (blades) {
        blades.rotation.y += deltaTime * 12; // Fast spinning visual
      }

      this.facaTimer += deltaTime;
      if (this.facaTimer >= 0.5) { // Deal 1 damage every 0.5s (2/s total)
        this.facaTimer = 0;
        let hitAny = false;

        for (let i = session.enemies.length - 1; i >= 0; i--) {
          const enemy = session.enemies[i];
          if (Math.abs(enemy.row - this.row) <= 1 && Math.abs(enemy.col - this.col) <= 1 && enemy.hp > 0) {
            hitAny = true;
            const isDead = enemy.takeDamage(1, session);
            if (isDead) {
              const reward = enemy.killReward || 2;
              session.addIngredients(reward);
              session.spawnFloatingText(`+${reward}`, enemy.mesh.position);
              session.removeEnemy(enemy);
            }
          }
        }
        if (hitAny) {
          audio.playSlice();
        }
      }
    }

    // 🌿 Vaso de Manjericão resource generation (+25 every 10s)
    if (this.type === DEFENDER_TYPES.MANJERICAO) {
      this.manjricaoTimer += deltaTime;
      if (this.manjricaoTimer >= this.manjricaoInterval) {
        this.manjricaoTimer = 0;
        session.addIngredients(25);
        audio.playPlop();
        session.particles.createCollectBurst(this.mesh.position, 0x22c55e);
      }
    }
  }

  destroy() {
    if (this.mesh.geometry) this.mesh.geometry.dispose();
  }
}
