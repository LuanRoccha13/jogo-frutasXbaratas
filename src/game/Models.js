import * as THREE from 'three';

export class ModelFactory {
  // 🍅 Pimentão Atirador
  static createChiliShooter() {
    const group = new THREE.Group();

    // Pepper Body (Red rounded capsule / sphere scaling)
    const bodyGeo = new THREE.SphereGeometry(0.35, 16, 16);
    bodyGeo.scale(1, 1.2, 0.9);
    const bodyMat = new THREE.MeshToonMaterial({ color: 0xef4444 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);

    // Green Stem Top
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.25, 8);
    const stemMat = new THREE.MeshToonMaterial({ color: 0x22c55e });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, 0.85, 0);
    stem.rotation.z = -0.2;
    stem.castShadow = true;
    group.add(stem);

    // Nozzle / Cannon Mouth (Right facing, direction +X towards col 8)
    const mouthGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.25, 12);
    mouthGeo.rotateZ(-Math.PI / 2);
    const mouth = new THREE.Mesh(mouthGeo, bodyMat);
    mouth.position.set(0.3, 0.5, 0);
    group.add(mouth);

    // Cartoon Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(0.22, 0.58, 0.15);
    const pupilLeft = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), pupilMat);
    pupilLeft.position.set(0.26, 0.58, 0.16);

    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.22, 0.58, -0.15);
    const pupilRight = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), pupilMat);
    pupilRight.position.set(0.26, 0.58, -0.16);

    group.add(eyeLeft, pupilLeft, eyeRight, pupilRight);
    return group;
  }

  // 🍯 Pote de Mel
  static createHoneyPot() {
    const group = new THREE.Group();

    // Ceramic Jar
    const jarGeo = new THREE.CylinderGeometry(0.32, 0.25, 0.6, 16);
    const jarMat = new THREE.MeshToonMaterial({ color: 0xf59e0b });
    const jar = new THREE.Mesh(jarGeo, jarMat);
    jar.position.y = 0.3;
    jar.castShadow = true;
    group.add(jar);

    // Dripping Honey Top
    const honeyGeo = new THREE.CylinderGeometry(0.34, 0.33, 0.15, 16);
    const honeyMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.2
    });
    const honey = new THREE.Mesh(honeyGeo, honeyMat);
    honey.position.y = 0.55;
    group.add(honey);

    return group;
  }

  // 🧄 Dente de Alho
  static createGarlicClove() {
    const group = new THREE.Group();

    // Robust Garlic Clove Body
    const garlicGeo = new THREE.SphereGeometry(0.42, 12, 12);
    garlicGeo.scale(0.9, 1.2, 0.9);
    const garlicMat = new THREE.MeshToonMaterial({ color: 0xf8fafc });
    const garlic = new THREE.Mesh(garlicGeo, garlicMat);
    garlic.position.y = 0.45;
    garlic.castShadow = true;
    group.add(garlic);

    // Garlic Tip
    const tipGeo = new THREE.ConeGeometry(0.12, 0.3, 8);
    const tipMat = new THREE.MeshToonMaterial({ color: 0xe2e8f0 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 0.95;
    group.add(tip);

    // Grumpy Eyebrows
    const browGeo = new THREE.BoxGeometry(0.12, 0.03, 0.03);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const browLeft = new THREE.Mesh(browGeo, browMat);
    browLeft.position.set(0.3, 0.58, 0.12);
    browLeft.rotation.z = -0.3;

    const browRight = new THREE.Mesh(browGeo, browMat);
    browRight.position.set(0.3, 0.58, -0.12);
    browRight.rotation.z = -0.3;

    group.add(browLeft, browRight);
    return group;
  }

  // 🔪 Faca Giratória / Liquidificador
  static createSpinningKnife() {
    const group = new THREE.Group();

    // Metallic Base Stand
    const baseGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.2, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    group.add(base);

    // Blades Assembly (Spinning part)
    const bladeGroup = new THREE.Group();
    bladeGroup.name = 'blades';
    bladeGroup.position.y = 0.35;

    const bladeGeo = new THREE.BoxGeometry(0.75, 0.04, 0.12);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });

    const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    blade1.castShadow = true;

    const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
    blade2.rotation.y = Math.PI / 2;
    blade2.castShadow = true;

    bladeGroup.add(blade1, blade2);
    group.add(bladeGroup);

    return group;
  }

  // 🌿 Vaso de Manjericão
  static createBasilPot() {
    const group = new THREE.Group();

    // Terracotta Clay Pot
    const potGeo = new THREE.CylinderGeometry(0.3, 0.22, 0.45, 16);
    const potMat = new THREE.MeshToonMaterial({ color: 0xc2410c });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.225;
    pot.castShadow = true;
    group.add(pot);

    // Soil Top
    const soilGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16);
    const soilMat = new THREE.MeshToonMaterial({ color: 0x451a03 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.43;
    group.add(soil);

    // Lush Green Leaves
    const leafGeo = new THREE.SphereGeometry(0.14, 8, 8);
    leafGeo.scale(1.4, 0.4, 1.0);
    const leafMat = new THREE.MeshToonMaterial({ color: 0x16a34a });

    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const angle = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(angle) * 0.12, 0.52, Math.sin(angle) * 0.12);
      leaf.rotation.y = angle;
      leaf.rotation.z = 0.3;
      group.add(leaf);
    }

    return group;
  }

  // 🐜 Formiga Gigante
  static createGiantAnt() {
    const group = new THREE.Group();

    const antMat = new THREE.MeshToonMaterial({ color: 0x7f1d1d });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), antMat);
    head.position.set(-0.25, 0.2, 0);

    // Thorax
    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), antMat);
    thorax.position.set(0, 0.2, 0);

    // Abdomen
    const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), antMat);
    abdomen.position.set(0.3, 0.24, 0);

    group.add(head, thorax, abdomen);
    return group;
  }

  // 🪰 Mosca Mutante (Flying)
  static createMutantFly() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshToonMaterial({ color: 0x3b0764 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xe0e7ff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1
    });

    // Elevated Body ($y = 1.0$)
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), bodyMat);
    body.position.y = 1.0;

    // Compound Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    eyeL.position.set(-0.15, 1.05, 0.12);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    eyeR.position.set(-0.15, 1.05, -0.12);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.35, 0.02, 0.18);
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.name = 'wingL';
    wingL.position.set(0, 1.18, 0.18);

    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.name = 'wingR';
    wingR.position.set(0, 1.18, -0.18);

    group.add(body, eyeL, eyeR, wingL, wingR);
    return group;
  }

  // 🐀 Rato Glutão (Tank)
  static createGluttonRat() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshToonMaterial({ color: 0x4b5563 });
    const pinkMat = new THREE.MeshToonMaterial({ color: 0xf472b6 });

    // Chubby Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), bodyMat);
    body.scale.set(1.2, 0.9, 1.0);
    body.position.y = 0.35;
    body.castShadow = true;

    // Ears
    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), pinkMat);
    earL.position.set(-0.25, 0.6, 0.22);
    const earR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), pinkMat);
    earR.position.set(-0.25, 0.6, -0.22);

    // Snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 8), pinkMat);
    snout.rotation.z = Math.PI / 2;
    snout.position.set(-0.45, 0.3, 0);

    group.add(body, earL, earR, snout);
    return group;
  }

  // 🪳 Barata Blindada (Armored Cockroach)
  static createArmoredCockroach() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshToonMaterial({ color: 0x451a03 });
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.6, roughness: 0.2 });

    // Inner Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), bodyMat);
    body.scale.set(1.4, 0.6, 0.9);
    body.position.y = 0.22;
    body.castShadow = true;
    group.add(body);

    // Heavy Outer Shell (Detaches / disappears when HP <= 50%)
    const shellGeo = new THREE.SphereGeometry(0.34, 12, 12);
    shellGeo.scale(1.45, 0.65, 0.95);
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.name = 'shell';
    shell.position.y = 0.24;
    shell.castShadow = true;
    group.add(shell);

    return group;
  }

  // 🔴 Seed Bullet
  static createSeedBullet() {
    const geo = new THREE.SphereGeometry(0.09, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.5;
    return mesh;
  }

  // 🍅 Fresh Ingredient Drop
  static createIngredientDrop() {
    const group = new THREE.Group();

    const tomatoMat = new THREE.MeshToonMaterial({ color: 0xef4444 });
    const leafMat = new THREE.MeshToonMaterial({ color: 0x22c55e });

    const tomato = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), tomatoMat);
    tomato.position.y = 0.4;
    tomato.castShadow = true;

    const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.08, 0.1, 6), leafMat);
    leaf.position.y = 0.65;

    group.add(tomato, leaf);
    return group;
  }
}
