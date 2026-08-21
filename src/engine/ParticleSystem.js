import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  createSplash(position, colorHex = 0xef4444, count = 12) {
    const geometry = new THREE.SphereGeometry(0.08, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 1
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh: mesh,
        velocity: velocity,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8
      });
    }
  }

  createCollectBurst(position, colorHex = 0xf59e0b) {
    this.createSplash(position, colorHex, 15);
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      } else {
        // Physics update
        p.velocity.y -= 9.8 * deltaTime; // Gravity
        p.mesh.position.addScaledVector(p.velocity, deltaTime);
        p.mesh.material.opacity = p.life / p.maxLife;
        p.mesh.scale.multiplyScalar(0.96);
      }
    }
  }
}
