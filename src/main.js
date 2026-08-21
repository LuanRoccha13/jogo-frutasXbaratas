import { SplitScreenRenderer } from './engine/Renderer.js';
import { GameSession } from './game/GameSession.js';
import { WaveManager } from './game/WaveManager.js';
import { InputHandler } from './game/InputHandler.js';
import { audio } from './engine/AudioManager.js';

class GameController {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.renderer = new SplitScreenRenderer(this.canvas);

    this.isPlaying = false;
    this.isGameOver = false;

    // Render initial 3D background view behind the start modal
    this.p1Session = new GameSession(this.renderer.p1Scene, true);
    this.p2Session = new GameSession(this.renderer.p2Scene, false);
    this.renderer.render();

    this.initUI();
  }

  initUI() {
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        if (e && e.target) e.target.blur();
        this.startGame();
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', (e) => {
        if (e && e.target) e.target.blur();
        this.restartGame();
      });
    }

    // Space / Enter on Start Modal starts game
    window.addEventListener('keydown', (e) => {
      if (!this.isPlaying && !this.isGameOver) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.startGame();
        }
      }
    });
  }

  startGame() {
    const startModal = document.getElementById('start-modal');
    if (startModal) {
      startModal.classList.add('modal-hidden');
    }

    try {
      audio.init();
      audio.playPhaseAlert();
    } catch (err) {
      console.warn('Audio init warning:', err);
    }

    // Create fresh Game Sessions for P1 (Blue) and P2 (Green)
    this.p1Session = new GameSession(this.renderer.p1Scene, true);
    this.p2Session = new GameSession(this.renderer.p2Scene, false);

    this.waveManager = new WaveManager(this.p1Session, this.p2Session);
    this.inputHandler = new InputHandler(this.p1Session, this.p2Session);

    this.isPlaying = true;
    this.isGameOver = false;

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  restartGame() {
    const gameOverModal = document.getElementById('gameover-modal');
    if (gameOverModal) {
      gameOverModal.classList.add('modal-hidden');
    }

    // Clear Scenes
    while (this.renderer.p1Scene.children.length > 0) {
      this.renderer.p1Scene.remove(this.renderer.p1Scene.children[0]);
    }
    while (this.renderer.p2Scene.children.length > 0) {
      this.renderer.p2Scene.remove(this.renderer.p2Scene.children[0]);
    }

    // Re-add lights
    this.renderer.setupLighting(this.renderer.p1Scene, 0x93c5fd);
    this.renderer.setupLighting(this.renderer.p2Scene, 0x6ee7b7);

    this.startGame();
  }

  handleGameOver(winningPlayerNumber) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isPlaying = false;

    // Play Stingers per GDD
    audio.playDefeat();
    setTimeout(() => {
      audio.playVictory();
    }, 400);

    const gameOverModal = document.getElementById('gameover-modal');
    const winnerBadge = document.getElementById('winner-badge');
    const gameOverTitle = document.getElementById('gameover-title');
    const gameOverDesc = document.getElementById('gameover-desc');

    const losingPlayerNumber = winningPlayerNumber === 1 ? 2 : 1;

    if (winnerBadge) {
      winnerBadge.innerText = `🏆 JOGADOR ${winningPlayerNumber} VENCEU!`;
      winnerBadge.style.borderColor = winningPlayerNumber === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
    }

    if (gameOverTitle && gameOverDesc) {
      gameOverTitle.innerText = `BANCADA DO JOGADOR ${losingPlayerNumber} FOI INVADIDA!`;
      gameOverDesc.innerText = `As pragas gourmet atravessaram a despensa do Jogador ${losingPlayerNumber}.`;
    }

    if (gameOverModal) {
      gameOverModal.classList.remove('modal-hidden');
    }
  }

  gameLoop(time) {
    if (!this.isPlaying) return;

    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1); // Cap delta time at 100ms
    this.lastTime = time;

    // 1. Update Input Handler (Key movement debounce)
    this.inputHandler.update(deltaTime);

    // 2. Update Wave Manager
    this.waveManager.update(deltaTime);

    // 3. Update P1 & P2 Game Sessions
    this.p1Session.update(deltaTime, (winner) => this.handleGameOver(winner));
    this.p2Session.update(deltaTime, (winner) => this.handleGameOver(winner));

    // 4. Render Split-Screen Dual Viewports
    this.renderer.render();

    if (!this.isGameOver) {
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }
}

// Robust Application Initialization (handles deferred ES modules timing)
function initApp() {
  if (!window.gameController) {
    window.gameController = new GameController();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
