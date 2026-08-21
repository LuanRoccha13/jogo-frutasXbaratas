import * as THREE from 'three';
import { ModelFactory } from './Models.js';
import { DEFENDER_TYPES } from './Defenders.js';
import { audio } from '../engine/AudioManager.js';

export const ENEMY_TYPES = {
  FORMIGA: 'formiga',
  MOSCA: 'mosca',
  RATO: 'rato',
  BARATA: 'barata'
};

export class Enemy {
  constructor(type, row) {
    this.type = type;
    this.row = row;
    this.col = 8.5; // Spawns on right boundary

    this.mesh = this.createMeshForType(type);
    this.mesh.position.set(this.col, 0, this.row);

    this.initAttributes(type);

    // Hit Flash state (~50ms material flash in white)
    this.hitFlashTimer = 0;
    this.originalMaterials = new Map();
    this.saveOriginalMaterials(this.mesh);

    this.whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  }

  initAttributes(type) {
    switch (type) {
      case ENEMY_TYPES.FORMIGA:
        this.name = 'Formiga Gigante';
        this.hp = 3;
        this.maxHp = 3;
        this.baseSpeed = 0.72; // Reduzido em 20% adicionais (0.9 * 0.8)
        this.isFlying = false;
        this.baseDamage = 13;   // Aumentado em ~30% (de 10 para 13)
        this.killReward = 4;
        break;
      case ENEMY_TYPES.MOSCA:
        this.name = 'Mosca Mutante';
        this.hp = 3;
        this.maxHp = 3;
        this.baseSpeed = 1.15; // Reduzido em 20% adicionais (1.44 * 0.8)
        this.isFlying = true;  // Flies over ground slow
        this.baseDamage = 20;   // Aumentado em ~33% (de 15 para 20)
        this.killReward = 6;
        break;
      case ENEMY_TYPES.RATO:
        this.name = 'Rato Glutão';
        this.hp = 14;
        this.maxHp = 14;
        this.baseSpeed = 0.36; // Reduzido em 20% adicionais (0.45 * 0.8)
        this.isFlying = false;
        this.baseDamage = 32;   // Aumentado em ~28% (de 25 para 32)
        this.killReward = 10;
        break;
      case ENEMY_TYPES.BARATA:
        this.name = 'Barata Blindada';
        this.hp = 20;
        this.maxHp = 20;
        this.baseSpeed = 0.43; // Reduzido em 20% adicionais (0.54 * 0.8)
        this.isFlying = false;
        this.hasShell = true;
        this.baseDamage = 40;   // Aumentado em ~33% (de 30 para 40)
        this.killReward = 15;
        break;
    }
    this.speed = this.baseSpeed;
    this.biteTimer = 0;
  }

  createMeshForType(type) {
    switch (type) {
      case ENEMY_TYPES.FORMIGA:
        return ModelFactory.createGiantAnt();
      case ENEMY_TYPES.MOSCA:
        return ModelFactory.createMutantFly();
      case ENEMY_TYPES.RATO:
        return ModelFactory.createGluttonRat();
      case ENEMY_TYPES.BARATA:
        return ModelFactory.createArmoredCockroach();
      default:
        return ModelFactory.createGiantAnt();
    }
  }

  saveOriginalMaterials(object) {
    object.traverse((child) => {
      if (child.isMesh) {
        this.originalMaterials.set(child, child.material);
      }
    });
  }

  takeDamage(amount, session) {
    this.hp -= amount;
    audio.playHit();
    this.triggerHitFlash();

    // Check Barata Blindada shell break at <= 50% HP
    if (this.type === ENEMY_TYPES.BARATA && this.hasShell && this.hp <= this.maxHp / 2) {
      this.hasShell = false;
      const shellMesh = this.mesh.getObjectByName('shell');
      if (shellMesh) {
        shellMesh.visible = false;
        session.particles.createSplash(this.mesh.position, 0x78350f, 15);
      }
    }

    if (this.hp <= 0) {
      session.particles.createSplash(this.mesh.position, 0xef4444, 18);
    }
    return this.hp <= 0;
  }

  triggerHitFlash() {
    this.hitFlashTimer = 0.06; // ~60ms white flash
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.material = this.whiteMaterial;
      }
    });
  }

  resetHitFlash() {
    this.mesh.traverse((child) => {
      if (child.isMesh && this.originalMaterials.has(child)) {
        child.material = this.originalMaterials.get(child);
      }
    });
  }

  update(deltaTime, session) {
    // Handle Hit Flash timer
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaTime;
      if (this.hitFlashTimer <= 0) {
        this.resetHitFlash();
      }
    }

    // Mutant Fly Wing Animation
    if (this.type === ENEMY_TYPES.MOSCA) {
      const wingL = this.mesh.getObjectByName('wingL');
      const wingR = this.mesh.getObjectByName('wingR');
      if (wingL && wingR) {
        wingL.rotation.z = Math.sin(Date.now() * 0.05) * 0.4;
        wingR.rotation.z = -Math.sin(Date.now() * 0.05) * 0.4;
      }
    }

    // Grid distance logic & slow calculation
    const gridCellCol = Math.round(this.col);
    const defenderAhead = session.grid.cells[this.row]?.[gridCellCol];

    let currentSpeed = this.baseSpeed;

    // Check Honey Pot Slow Debuff (50% reduction)
    if (!this.isFlying) {
      const isHoneyOnCell = defenderAhead?.type === DEFENDER_TYPES.MEL;
      // Barata blindada is immune to slow while shell is intact!
      const isImmuneToSlow = (this.type === ENEMY_TYPES.BARATA && this.hasShell);
      if (isHoneyOnCell && !isImmuneToSlow) {
        currentSpeed *= 0.5;
      }
    }

    // Check if stopped by Garlic or other defender barrier (Garlic / non-flying obstacle)
    const isBlockedByDefender = defenderAhead && defenderAhead.type !== DEFENDER_TYPES.MEL && !this.isFlying;

    if (isBlockedByDefender && Math.abs(this.col - gridCellCol) < 0.3) {
      // Pest stops to devour defender
      this.biteTimer += deltaTime;
      if (this.biteTimer >= 0.5) { // Bite every 0.5s
        this.biteTimer = 0;
        const destroyed = defenderAhead.takeDamage(1);
        if (destroyed) {
          session.grid.removeDefender(this.row, gridCellCol);
        }
      }
    } else {
      // Advance left towards pantry
      this.col -= currentSpeed * deltaTime * 0.8;
      this.mesh.position.x = this.col;
    }
  }

  destroy() {
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
    });
  }
}
