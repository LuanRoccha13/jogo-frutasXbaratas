import * as THREE from 'three';

export class Grid {
  constructor(scene, isPlayer1) {
    this.scene = scene;
    this.isPlayer1 = isPlayer1;
    this.rows = 5;
    this.cols = 9;

    // 5x9 Array to hold defender references
    this.cells = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));

    // Player Selection Cursor Position
    this.cursorRow = 2; // Start center
    this.cursorCol = 4;

    this.createCounterMesh();
    this.createCursorMesh();
  }

  createCounterMesh() {
    this.group = new THREE.Group();

    // Base Kitchen Counter Top (Marble / Granite block)
    const counterWidth = 9.8;
    const counterDepth = 5.8;
    const counterHeight = 0.6;

    const counterGeo = new THREE.BoxGeometry(counterWidth, counterHeight, counterDepth);
    const counterMat = new THREE.MeshStandardMaterial({
      color: this.isPlayer1 ? 0x1e293b : 0x0f291e,
      roughness: 0.3,
      metalness: 0.1
    });

    const counterMesh = new THREE.Mesh(counterGeo, counterMat);
    // Center counter so grid cells 0..8 (x) and 0..4 (z) sit on top
    counterMesh.position.set(4, -counterHeight / 2, 2);
    counterMesh.receiveShadow = true;
    this.group.add(counterMesh);

    // Pantry Door (Right on the left boundary at x = -0.6)
    const doorGeo = new THREE.BoxGeometry(0.3, 2.5, 5.6);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x7f1d1d,
      roughness: 0.4
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(-0.65, 1.0, 2);
    doorMesh.castShadow = true;
    this.group.add(doorMesh);

    // Pantry Text Label / Icon
    const pantryFrameGeo = new THREE.BoxGeometry(0.05, 0.8, 4.8);
    const pantryFrameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const pantryFrame = new THREE.Mesh(pantryFrameGeo, pantryFrameMat);
    pantryFrame.position.set(-0.45, 1.0, 2);
    this.group.add(pantryFrame);

    // Grid Tiles (5x9)
    const tileGeo = new THREE.BoxGeometry(0.92, 0.05, 0.92);
    this.tileMeshes = [];

    for (let r = 0; r < this.rows; r++) {
      this.tileMeshes[r] = [];
      for (let c = 0; c < this.cols; c++) {
        // Alternating checkered tile colors
        const isEven = (r + c) % 2 === 0;
        let tileColor;
        if (this.isPlayer1) {
          tileColor = isEven ? 0x2563eb : 0x1d4ed8; // P1 Blue tiles
        } else {
          tileColor = isEven ? 0x059669 : 0x047857; // P2 Green tiles
        }

        const tileMat = new THREE.MeshStandardMaterial({
          color: tileColor,
          roughness: 0.6,
          metalness: 0.1
        });

        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.position.set(c, 0.025, r);
        tile.receiveShadow = true;
        this.group.add(tile);
        this.tileMeshes[r][c] = tile;
      }
    }

    this.scene.add(this.group);
  }

  createCursorMesh() {
    // Glowing Reticle for active cell selection
    const cursorGeo = new THREE.RingGeometry(0.35, 0.45, 32);
    cursorGeo.rotateX(-Math.PI / 2);

    const cursorMat = new THREE.MeshBasicMaterial({
      color: this.isPlayer1 ? 0x60a5fa : 0x34d399,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    this.cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);

    // Adding glowing border box around cell
    const boxGeo = new THREE.BoxGeometry(0.96, 0.1, 0.96);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: this.isPlayer1 ? 0x93c5fd : 0xa7f3d0,
      linewidth: 3
    });
    this.cursorBox = new THREE.LineSegments(edges, lineMat);

    this.cursorGroup = new THREE.Group();
    this.cursorGroup.add(this.cursorMesh);
    this.cursorGroup.add(this.cursorBox);

    this.scene.add(this.cursorGroup);
    this.updateCursorPosition();
  }

  moveCursor(dRow, dCol) {
    this.cursorRow = Math.max(0, Math.min(this.rows - 1, this.cursorRow + dRow));
    this.cursorCol = Math.max(0, Math.min(this.cols - 1, this.cursorCol + dCol));
    this.updateCursorPosition();
  }

  updateCursorPosition() {
    this.cursorGroup.position.set(this.cursorCol, 0.08, this.cursorRow);
  }

  getCellWorldPos(row, col) {
    return new THREE.Vector3(col, 0.1, row);
  }

  isCellOccupied(row, col) {
    return this.cells[row][col] !== null;
  }

  placeDefender(row, col, defender) {
    if (this.isCellOccupied(row, col)) return false;
    this.cells[row][col] = defender;
    defender.mesh.position.copy(this.getCellWorldPos(row, col));
    this.scene.add(defender.mesh);
    return true;
  }

  removeDefender(row, col) {
    const def = this.cells[row][col];
    if (def) {
      this.scene.remove(def.mesh);
      def.destroy();
      this.cells[row][col] = null;
    }
  }

  update(deltaTime) {
    // Pulse animation for cursor reticle
    const time = Date.now() * 0.005;
    this.cursorMesh.scale.setScalar(1 + Math.sin(time) * 0.08);
  }
}
