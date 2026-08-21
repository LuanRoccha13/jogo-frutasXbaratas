import { ENEMY_TYPES } from './Enemies.js';
import { audio } from '../engine/AudioManager.js';

export class WaveManager {
  constructor(p1Session, p2Session) {
    this.p1Session = p1Session;
    this.p2Session = p2Session;

    this.currentPhase = 1; // 1, 2, 3 (Sudden Death)
    this.phaseTime = 0;
    this.spawnTimer = 0;
    this.phase1Duration = 40; // 40s
    this.phase2Duration = 50; // 50s
    this.isSuddenDeath = false;

    // Recurring survival timer during Phase 3 (Morte Súbita)
    this.phase3SurvivalTimer = 0;

    // Ramping System & Heavy Enemy Staggering State
    this.currentCooldown = 5.0; // Starts at 5.0s in Phase 1
    this.staggerPenalty = 0;   // Added when heavy enemies (Rato/Barata) spawn

    this.p1Session.setPhaseBadge('FASE 1: O APERITIVO');
  }

  update(deltaTime) {
    this.phaseTime += deltaTime;
    this.spawnTimer += deltaTime;

    // --- Phase Transitions ---
    if (this.currentPhase === 1 && this.phaseTime >= this.phase1Duration) {
      this.transitionToPhase(2, 'FASE 2: O PRATO PRINCIPAL', 'Bônus de +20 Ingredientes! Moscas Mutantes surgiram!');
      this.grantWaveBonus(20);
    } else if (this.currentPhase === 2 && this.phaseTime >= this.phase2Duration) {
      this.transitionToPhase(3, 'FASE 3: A CONTA (MORTE SÚBITA)', 'Bônus de +40 Ingredientes! Horda em crescendo contínuo!');
      this.grantWaveBonus(40);
      this.isSuddenDeath = true;
    }

    // Recurring survival bonus during Phase 3 (+20 Ingredients every 30s)
    if (this.isSuddenDeath) {
      this.phase3SurvivalTimer += deltaTime;
      if (this.phase3SurvivalTimer >= 30.0) {
        this.phase3SurvivalTimer = 0;
        this.grantWaveBonus(20);
      }
    }

    // --- 1. Ramping System: Suave Redução de Cooldown ---
    if (this.currentPhase === 1) {
      // Phase 1: Start at 5.0s, reduce 0.2s every 10s, min cap 2.5s
      const reductions = Math.floor(this.phaseTime / 10.0);
      this.currentCooldown = Math.max(2.5, 5.0 - (reductions * 0.2));
    } else if (this.currentPhase === 2) {
      // Phase 2: Start at 2.5s, reduce 0.1s every 10s, min cap 1.5s
      const reductions = Math.floor(this.phaseTime / 10.0);
      this.currentCooldown = Math.max(1.5, 2.5 - (reductions * 0.1));
    } else if (this.currentPhase === 3) {
      // Phase 3: Start at 1.5s, reduce 0.05s every 10s, hard min cap 0.8s
      const reductions = Math.floor(this.phaseTime / 10.0);
      this.currentCooldown = Math.max(0.8, 1.5 - (reductions * 0.05));
    }

    // Effective cooldown combining ramping speed + heavy enemy stagger penalty
    const effectiveCooldown = this.currentCooldown + this.staggerPenalty;

    // --- Spawn Trigger ---
    if (this.spawnTimer >= effectiveCooldown) {
      this.spawnTimer = 0;
      this.staggerPenalty = 0; // Reset stagger penalty after wait completes

      const targetRow = Math.floor(Math.random() * 5);
      const enemyType = this.selectEnemyTypeForCurrentPhase();

      this.spawnSymmetricEnemy(enemyType, targetRow);

      // --- 2. Heavy Enemy Staggering Rule ---
      // Heavy threats (Rato Glutão or Barata Blindada) add +2.0s penalty to give breathing room
      if (enemyType === ENEMY_TYPES.RATO || enemyType === ENEMY_TYPES.BARATA) {
        this.staggerPenalty = 2.0;
      }
    }

    // Update Wave Progress Bar UI
    this.updateProgressBar();
  }

  // --- 3. Gradual Enemy Type Pool Progression ---
  selectEnemyTypeForCurrentPhase() {
    if (this.currentPhase === 1) {
      // Phase 1: Formigas Operárias apenas
      return ENEMY_TYPES.FORMIGA;
    } else if (this.currentPhase === 2) {
      if (this.phaseTime < 20.0) {
        // Primeiros 20s da Fase 2: Introdução apenas da Mosca Mutante (junto com Formigas)
        return Math.random() < 0.6 ? ENEMY_TYPES.FORMIGA : ENEMY_TYPES.MOSCA;
      } else {
        // Após 20s da Fase 2: Introdução do Rato Glutão
        const rand = Math.random();
        if (rand < 0.45) return ENEMY_TYPES.FORMIGA;
        if (rand < 0.80) return ENEMY_TYPES.MOSCA;
        return ENEMY_TYPES.RATO;
      }
    } else {
      // Fase 3 (Morte Súbita): Todos os 4 tipos disponíveis, incluindo Barata Blindada
      const rand = Math.random();
      if (rand < 0.35) return ENEMY_TYPES.FORMIGA;
      if (rand < 0.65) return ENEMY_TYPES.MOSCA;
      if (rand < 0.85) return ENEMY_TYPES.RATO;
      return ENEMY_TYPES.BARATA;
    }
  }

  grantWaveBonus(amount) {
    this.p1Session.addIngredients(amount);
    this.p2Session.addIngredients(amount);

    // Floating text indicator at grid center for bonus
    this.p1Session.spawnFloatingText(`+${amount} BÔNUS`, { x: 4, y: 0.2, z: 2 });
    this.p2Session.spawnFloatingText(`+${amount} BÔNUS`, { x: 4, y: 0.2, z: 2 });

    audio.playBonusCash();
  }

  spawnSymmetricEnemy(type, row) {
    this.p1Session.spawnEnemy(type, row);
    this.p2Session.spawnEnemy(type, row);
  }

  transitionToPhase(phaseNum, title, subtitle) {
    this.currentPhase = phaseNum;
    this.phaseTime = 0;
    this.spawnTimer = 0;

    audio.playPhaseAlert();

    // Show Phase Banner
    const banner = document.getElementById('phase-banner');
    const bannerTitle = document.getElementById('phase-banner-title');
    const bannerSubtitle = document.getElementById('phase-banner-subtitle');
    const badge = document.getElementById('wave-phase-badge');

    if (banner && bannerTitle && bannerSubtitle) {
      bannerTitle.innerText = title;
      bannerSubtitle.innerText = subtitle;
      banner.classList.remove('banner-hidden');

      setTimeout(() => {
        banner.classList.add('banner-hidden');
      }, 4000);
    }

    if (badge) {
      badge.innerText = title;
    }
  }

  updateProgressBar() {
    const fill = document.getElementById('wave-bar-fill');
    const timerText = document.getElementById('wave-timer');
    if (!fill || !timerText) return;

    if (this.currentPhase === 1) {
      const pct = Math.min(100, (this.phaseTime / this.phase1Duration) * 100);
      fill.style.width = `${pct}%`;
      timerText.innerText = `Aperitivo (${Math.ceil(this.phase1Duration - this.phaseTime)}s)`;
    } else if (this.currentPhase === 2) {
      const pct = Math.min(100, (this.phaseTime / this.phase2Duration) * 100);
      fill.style.width = `${pct}%`;
      timerText.innerText = `Prato Principal (${Math.ceil(this.phase2Duration - this.phaseTime)}s)`;
    } else {
      fill.style.width = '100%';
      fill.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
      timerText.innerText = `MORTE SÚBITA ⚔️ (+20 em ${Math.ceil(30 - this.phase3SurvivalTimer)}s)`;
    }
  }
}
