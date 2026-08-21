export class InputHandler {
  constructor(p1Session, p2Session) {
    this.p1 = p1Session;
    this.p2 = p2Session;

    // Movement Debounce Timers (Rhythmic Grid Navigation)
    this.p1MoveDelay = 0;
    this.p2MoveDelay = 0;
    this.MOVE_COOLDOWN = 0.14; // 140ms tick delay between grid steps

    this.keysPressed = new Set();
    
    // Key Lock Flags for Single-Fire Action Triggering (Require KeyUp before re-fire)
    this.actionLockP1 = false;
    this.actionLockP2 = false;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    // Prevent default browser behavior for game controls (scrolling, button re-click)
    const gameControlKeys = [
      'Space', 'Enter', 'NumpadEnter',
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Comma', 'Period', 'Numpad1', 'Numpad3',
      'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'
    ];

    if (gameControlKeys.includes(e.code)) {
      e.preventDefault();
    }

    if (e.repeat) return; // Block browser auto-repeat
    this.keysPressed.add(e.code);

    // Single-fire actions per keypress
    this.handleSingleFireActions(e.code);
  }

  onKeyUp(e) {
    this.keysPressed.delete(e.code);

    // Release Action Locks on KeyUp
    if (e.code === 'Space') {
      this.actionLockP1 = false;
    }

    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      this.actionLockP2 = false;
    }
  }

  handleSingleFireActions(code) {
    // --- Player 1 (Left) Actions ---
    if (code === 'Space') {
      if (!this.actionLockP1) {
        this.actionLockP1 = true;
        this.p1.executeAction();
      }
    } else if (code === 'KeyQ') {
      this.p1.cycleDeck(-1);
    } else if (code === 'KeyE') {
      this.p1.cycleDeck(1);
    } else if (code === 'Digit1') this.p1.selectDeckIndex(0);
    else if (code === 'Digit2') this.p1.selectDeckIndex(1);
    else if (code === 'Digit3') this.p1.selectDeckIndex(2);
    else if (code === 'Digit4') this.p1.selectDeckIndex(3);
    else if (code === 'Digit5') this.p1.selectDeckIndex(4);

    // --- Player 2 (Right) Actions ---
    if (code === 'Enter' || code === 'NumpadEnter') {
      if (!this.actionLockP2) {
        this.actionLockP2 = true;
        this.p2.executeAction();
      }
    } else if (code === 'Comma' || code === 'Numpad1') {
      this.p2.cycleDeck(-1);
    } else if (code === 'Period' || code === 'Numpad3') {
      this.p2.cycleDeck(1);
    }
  }

  update(deltaTime) {
    // Update movement debounce timers
    if (this.p1MoveDelay > 0) this.p1MoveDelay -= deltaTime;
    if (this.p2MoveDelay > 0) this.p2MoveDelay -= deltaTime;

    // --- Player 1 Grid Navigation (WASD) ---
    if (this.p1MoveDelay <= 0) {
      let dRow = 0, dCol = 0;
      if (this.keysPressed.has('KeyW')) dRow = -1;
      else if (this.keysPressed.has('KeyS')) dRow = 1;
      else if (this.keysPressed.has('KeyA')) dCol = -1;
      else if (this.keysPressed.has('KeyD')) dCol = 1;

      if (dRow !== 0 || dCol !== 0) {
        this.p1.grid.moveCursor(dRow, dCol);
        this.p1MoveDelay = this.MOVE_COOLDOWN;
      }
    }

    // --- Player 2 Grid Navigation (Arrows) ---
    if (this.p2MoveDelay <= 0) {
      let dRow = 0, dCol = 0;
      if (this.keysPressed.has('ArrowUp')) dRow = -1;
      else if (this.keysPressed.has('ArrowDown')) dRow = 1;
      else if (this.keysPressed.has('ArrowLeft')) dCol = -1;
      else if (this.keysPressed.has('ArrowRight')) dCol = 1;

      if (dRow !== 0 || dCol !== 0) {
        this.p2.grid.moveCursor(dRow, dCol);
        this.p2MoveDelay = this.MOVE_COOLDOWN;
      }
    }
  }
}
