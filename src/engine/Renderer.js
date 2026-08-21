import * as THREE from 'three';

export class SplitScreenRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;

    // Single WebGLRenderer for optimal performance
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Setup Scenes for P1 (Blue Counter) and P2 (Green Counter)
    this.p1Scene = new THREE.Scene();
    this.p2Scene = new THREE.Scene();

    // Background colors
    this.p1Scene.background = new THREE.Color(0x0f172a);
    this.p2Scene.background = new THREE.Color(0x0a192f);

    // Setup Cameras (Isometric Perspective for 5x9 Grid view)
    const aspect = (window.innerWidth / 2) / window.innerHeight;
    this.p1Camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.p2Camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);

    // Position cameras to look down at the 5x9 grid (Row 0..4, Col 0..8)
    // Grid center is approx (x: 4.5, y: 0, z: 2.5)
    this.p1Camera.position.set(4.5, 11, 10.5);
    this.p1Camera.lookAt(4.5, 0, 2.2);

    this.p2Camera.position.set(4.5, 11, 10.5);
    this.p2Camera.lookAt(4.5, 0, 2.2);

    this.setupLighting(this.p1Scene, 0x93c5fd); // Soft blue tint
    this.setupLighting(this.p2Scene, 0x6ee7b7); // Soft green tint

    this.onWindowResize();
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting(scene, lightColor) {
    // Ambient Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);

    // Directional Light (Kitchen Overhead Spotlight)
    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
    dirLight.position.set(4.5, 15, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -7;
    dirLight.shadow.camera.right = 7;
    dirLight.shadow.camera.top = 7;
    dirLight.shadow.camera.bottom = -7;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Subtle colored rim light
    const rimLight = new THREE.DirectionalLight(lightColor, 0.4);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height, false);

    const halfWidth = width / 2;
    const aspect = halfWidth / height;

    this.p1Camera.aspect = aspect;
    this.p1Camera.updateProjectionMatrix();

    this.p2Camera.aspect = aspect;
    this.p2Camera.updateProjectionMatrix();
  }

  render() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfWidth = Math.floor(width / 2);

    this.renderer.setScissorTest(true);

    // --- Render Left Viewport: Player 1 ---
    this.renderer.setViewport(0, 0, halfWidth, height);
    this.renderer.setScissor(0, 0, halfWidth, height);
    this.renderer.render(this.p1Scene, this.p1Camera);

    // --- Render Right Viewport: Player 2 ---
    this.renderer.setViewport(halfWidth, 0, width - halfWidth, height);
    this.renderer.setScissor(halfWidth, 0, width - halfWidth, height);
    this.renderer.render(this.p2Scene, this.p2Camera);

    this.renderer.setScissorTest(false);
  }
}
