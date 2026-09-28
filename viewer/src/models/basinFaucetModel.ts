import * as THREE from 'three';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

export type FaucetRuntime = {
  root: THREE.Group;
  spoutPivot: THREE.Group;
  leverPivot: THREE.Group;
  wandHead: THREE.Group;
  hoseMesh: THREE.Mesh;
  waterStream: THREE.Mesh;
  isPulledOut: boolean;
  isWaterOn: boolean;
  togglePullOut: () => void;
  toggleWater: () => void;
  swivel: (angleRad: number) => void;
  setLever: (flow01: number, temp01: number) => void;
};

export function createBasinFaucetModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Basin Gooseneck Water Head Pipe';

  const castShadow = options.castShadow ?? true;
  const receiveShadow = options.receiveShadow ?? true;
  const wireframe = options.wireframe ?? false;

  // -------------------------------------------------------------
  // PBR Materials (Matched to Japanese Basin Faucet Photo)
  // -------------------------------------------------------------
  
  // 1. Mirror Polished Electroplated Chrome
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.06,
    metalness: 0.98,
    wireframe,
  });

  // 2. Brushed Joint / Reveal Gap Accent
  const matBrushed = new THREE.MeshStandardMaterial({
    color: 0xd8dcde,
    roughness: 0.24,
    metalness: 0.88,
    wireframe,
  });

  // 3. Dark Anthracite Rocker Toggle Button
  const matButton = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.55,
    metalness: 0.15,
    wireframe,
  });

  // 4. Aerator Face
  const matAerator = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.45,
    metalness: 0.35,
    wireframe,
  });

  // 5. Braided Steel Flexible Hose (revealed when pull-out wand is extended)
  const matHose = new THREE.MeshStandardMaterial({
    color: 0xa8b0b8,
    roughness: 0.42,
    metalness: 0.82,
    wireframe,
  });

  // 6. Basin Mounting Deck Pedestal (Crisp White Ceramic/Quartz)
  const matDeck = new THREE.MeshStandardMaterial({
    color: 0xf5f7fa,
    roughness: 0.16,
    metalness: 0.02,
    wireframe,
  });

  // 7. Translucent Water Stream
  const matWater = new THREE.MeshStandardMaterial({
    color: 0x99ddff,
    roughness: 0.04,
    metalness: 0.08,
    transparent: true,
    opacity: 0.60,
    wireframe,
  });

  // -------------------------------------------------------------
  // 1. Basin Mounting Deck Pedestal (Context Stand)
  // -------------------------------------------------------------
  const deckRadius = 0.10;
  const deckH = 0.018;
  const deckGeo = new THREE.CylinderGeometry(deckRadius, deckRadius + 0.008, deckH, 48);
  const deckMesh = new THREE.Mesh(deckGeo, matDeck);
  deckMesh.position.y = deckH / 2;
  deckMesh.receiveShadow = receiveShadow;
  deckMesh.name = 'Basin_Deck_Mount';
  root.add(deckMesh);

  // -------------------------------------------------------------
  // 2. Base Escutcheon Flange & Vertical Mounting Pillar
  // -------------------------------------------------------------
  const baseY = deckH;
  
  // Bottom Escutcheon Collar Ring (flange with slight chamfer)
  const flangeGeo = new THREE.CylinderGeometry(0.026, 0.028, 0.010, 36);
  const flangeMesh = new THREE.Mesh(flangeGeo, matChrome);
  flangeMesh.position.y = baseY + 0.005;
  flangeMesh.castShadow = castShadow;
  flangeMesh.receiveShadow = receiveShadow;
  flangeMesh.name = 'Deck_Flange_Collar';
  root.add(flangeMesh);

  // Main Vertical Pillar Column (diameter ~46mm, height ~75mm)
  const pillarRadius = 0.0225;
  const pillarH = 0.075;
  const pillarGeo = new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarH, 36);
  const pillarMesh = new THREE.Mesh(pillarGeo, matChrome);
  pillarMesh.position.y = baseY + 0.010 + pillarH / 2;
  pillarMesh.castShadow = castShadow;
  pillarMesh.receiveShadow = receiveShadow;
  pillarMesh.name = 'Vertical_Pillar_Base';
  root.add(pillarMesh);

  // -------------------------------------------------------------
  // 3. Transverse Valve Cartridge T-Hub & Single Lever Mixer Handle
  // -------------------------------------------------------------
  const hubCenterY = baseY + 0.010 + pillarH;
  const hubRadius = 0.0225;

  // Horizontal Valve Hub Housing
  const hubGrp = new THREE.Group();
  hubGrp.position.set(0, hubCenterY, 0);

  // Center Intersection Sphere for seamless joint
  const centerSphereGeo = new THREE.SphereGeometry(hubRadius, 32, 24);
  const centerSphere = new THREE.Mesh(centerSphereGeo, matChrome);
  hubGrp.add(centerSphere);

  // Left Cartridge Cap (extends ~28mm to the left)
  const capLength = 0.030;
  const capGeo = new THREE.CylinderGeometry(hubRadius, hubRadius, capLength, 32);
  capGeo.rotateZ(Math.PI / 2);
  const capMesh = new THREE.Mesh(capGeo, matChrome);
  capMesh.position.set(-capLength / 2, 0, 0);
  capMesh.castShadow = castShadow;
  const capDomeGeo = new THREE.SphereGeometry(hubRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  capDomeGeo.rotateZ(Math.PI / 2);
  const capDome = new THREE.Mesh(capDomeGeo, matChrome);
  capDome.position.set(-capLength, 0, 0);
  hubGrp.add(capMesh, capDome);

  // Right Valve Housing Collar (extends ~25mm to the right)
  const rightCollarLen = 0.022;
  const rightCollarGeo = new THREE.CylinderGeometry(hubRadius, hubRadius, rightCollarLen, 32);
  rightCollarGeo.rotateZ(Math.PI / 2);
  const rightCollar = new THREE.Mesh(rightCollarGeo, matChrome);
  rightCollar.position.set(rightCollarLen / 2, 0, 0);
  rightCollar.castShadow = castShadow;
  hubGrp.add(rightCollar);

  // Rotatable Mixer Handle Pivot (Right Side)
  const leverPivot = new THREE.Group();
  leverPivot.position.set(rightCollarLen, 0, 0);
  leverPivot.name = 'Mixer_Lever_Pivot';

  // Handle Hub Ring
  const handleHubLen = 0.024;
  const handleHubRadius = 0.021;
  const handleHubGeo = new THREE.CylinderGeometry(handleHubRadius, handleHubRadius, handleHubLen, 32);
  handleHubGeo.rotateZ(Math.PI / 2);
  const handleHub = new THREE.Mesh(handleHubGeo, matChrome);
  handleHub.position.set(handleHubLen / 2, 0, 0);
  handleHub.castShadow = castShadow;

  // Handle Outer End Face Disk
  const endDiskGeo = new THREE.CylinderGeometry(handleHubRadius, handleHubRadius, 0.003, 32);
  endDiskGeo.rotateZ(Math.PI / 2);
  const endDisk = new THREE.Mesh(endDiskGeo, matChrome);
  endDisk.position.set(handleHubLen + 0.0015, 0, 0);

  // Slender Pin Lever Handle (extends vertically with a slight forward tilt)
  const pinRadius = 0.0035;
  const pinLength = 0.082;
  const pinGeo = new THREE.CylinderGeometry(pinRadius, pinRadius * 0.9, pinLength, 20);
  const pinMesh = new THREE.Mesh(pinGeo, matChrome);
  pinMesh.position.set(handleHubLen / 2, pinLength / 2 + handleHubRadius - 0.002, 0);
  pinMesh.rotation.z = -0.05; // slight ergonomic outward angle
  pinMesh.castShadow = castShadow;

  // Pin Top Rounded Cap
  const pinCapGeo = new THREE.SphereGeometry(pinRadius, 16, 12);
  const pinCap = new THREE.Mesh(pinCapGeo, matChrome);
  pinCap.position.set(pinMesh.position.x - 0.002, pinMesh.position.y + pinLength / 2, 0);

  leverPivot.add(handleHub, endDisk, pinMesh, pinCap);
  hubGrp.add(leverPivot);
  root.add(hubGrp);

  // -------------------------------------------------------------
  // 4. Swiveling High-Arc Tubular Gooseneck Spout (Water Head Pipe)
  // -------------------------------------------------------------
  const spoutPivot = new THREE.Group();
  spoutPivot.position.set(0, hubCenterY, 0);
  spoutPivot.name = 'Spout_Swivel_Assembly';

  // Swivel Ring Base Bushing
  const swivelRingGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.015, 32);
  const swivelRing = new THREE.Mesh(swivelRingGeo, matBrushed);
  swivelRing.position.y = hubRadius + 0.005;
  spoutPivot.add(swivelRing);

  // High-Arc Curve Path (from vertical riser to smooth 180° arch bend)
  const pipeRadius = 0.013; // 26mm diameter pipe
  const archForwardReach = 0.155; // 155mm forward reach
  const archPeakY = 0.320; // 320mm above hub (~420mm above deck)
  const wandStartY = 0.220; // point where fixed pipe ends and pull-out wand begins

  // CatmullRomCurve creates perfectly smooth continuous curvature
  const curvePoints = [
    new THREE.Vector3(0, hubRadius + 0.012, 0),
    new THREE.Vector3(0, 0.120, 0),
    new THREE.Vector3(0, 0.220, 0),
    new THREE.Vector3(0, 0.290, 0.025),
    new THREE.Vector3(0, archPeakY, archForwardReach * 0.50),
    new THREE.Vector3(0, 0.290, archForwardReach * 0.90),
    new THREE.Vector3(0, wandStartY, archForwardReach),
  ];
  const spoutCurve = new THREE.CatmullRomCurve3(curvePoints);
  const spoutTubeGeo = new THREE.TubeGeometry(spoutCurve, 64, pipeRadius, 32, false);
  const spoutTube = new THREE.Mesh(spoutTubeGeo, matChrome);
  spoutTube.castShadow = castShadow;
  spoutTube.receiveShadow = receiveShadow;
  spoutTube.name = 'Gooseneck_Pipe_Curve';
  spoutPivot.add(spoutTube);

  // Seam Coupling Collar Ring at Wand Connection
  const couplingGeo = new THREE.CylinderGeometry(pipeRadius + 0.001, pipeRadius + 0.001, 0.004, 32);
  const couplingMesh = new THREE.Mesh(couplingGeo, matBrushed);
  couplingMesh.position.set(0, wandStartY, archForwardReach);
  spoutPivot.add(couplingMesh);

  // -------------------------------------------------------------
  // 5. Pull-out Spray Head / Nozzle Wand
  // -------------------------------------------------------------
  const wandGrp = new THREE.Group();
  wandGrp.position.set(0, wandStartY, archForwardReach);
  wandGrp.name = 'PullOut_Spray_Wand';

  // Flexible Braided Hose (inside the spout, revealed when pulled out)
  const hoseLen = 0.22;
  const hoseGeo = new THREE.CylinderGeometry(0.007, 0.007, hoseLen, 24);
  const hoseMesh = new THREE.Mesh(hoseGeo, matHose);
  hoseMesh.position.set(0, hoseLen / 2, 0);
  hoseMesh.visible = false;
  wandGrp.add(hoseMesh);

  // Pull-Out Head Wand Body
  // Slightly tapered ergonomic profile: 26mm at top joint -> 22mm middle -> 24mm at nozzle flare
  const wandH = 0.095;
  const wandUpperH = 0.055;
  const wandLowerH = 0.040;

  // Upper Body with Rocker Switch
  const wandUpperGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius * 0.92, wandUpperH, 32);
  const wandUpper = new THREE.Mesh(wandUpperGeo, matChrome);
  wandUpper.position.set(0, -wandUpperH / 2, 0);
  wandUpper.castShadow = castShadow;

  // Lower Body (Flared Aerator Grip)
  const wandLowerGeo = new THREE.CylinderGeometry(pipeRadius * 0.92, pipeRadius * 0.96, wandLowerH, 32);
  const wandLower = new THREE.Mesh(wandLowerGeo, matChrome);
  wandLower.position.set(0, -wandUpperH - wandLowerH / 2, 0);
  wandLower.castShadow = castShadow;

  // Dual-Mode Spray Rocker Button on Front Face of Wand
  const btnW = 0.008;
  const btnH = 0.022;
  const btnD = 0.004;
  const btnGeo = new THREE.BoxGeometry(btnW, btnH, btnD);
  const btnMesh = new THREE.Mesh(btnGeo, matButton);
  // Position on the front (+Z) face of the wand
  btnMesh.position.set(0, -0.028, pipeRadius - 0.001);
  btnMesh.name = 'Rocker_Toggle_Button';

  // Button Dot Indicator (Stream mode dot)
  const dotGeo = new THREE.CylinderGeometry(0.0015, 0.0015, 0.002, 12);
  dotGeo.rotateX(Math.PI / 2);
  const dotMesh = new THREE.Mesh(dotGeo, matChrome);
  dotMesh.position.set(0, -0.022, pipeRadius + 0.0015);

  // Bottom Aerator Face Plate & Spray Nozzles
  const aeratorRadius = pipeRadius * 0.94;
  const aeratorFaceGeo = new THREE.CylinderGeometry(aeratorRadius - 0.001, aeratorRadius - 0.001, 0.003, 24);
  const aeratorFace = new THREE.Mesh(aeratorFaceGeo, matAerator);
  aeratorFace.position.set(0, -wandH + 0.001, 0);

  // Central Stream Micro-Hole
  const nozzleCenterGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.004, 16);
  const nozzleCenter = new THREE.Mesh(nozzleCenterGeo, matButton);
  nozzleCenter.position.set(0, -wandH, 0);

  // Concentric Shower Spray Ring
  const sprayRingGeo = new THREE.RingGeometry(0.006, 0.0085, 24);
  sprayRingGeo.rotateX(Math.PI / 2);
  const sprayRing = new THREE.Mesh(sprayRingGeo, matButton);
  sprayRing.position.set(0, -wandH - 0.0005, 0);

  // -------------------------------------------------------------
  // 6. Animated Translucent Flowing Water Stream
  // -------------------------------------------------------------
  const streamH = 0.16;
  const streamGeo = new THREE.CylinderGeometry(0.004, 0.007, streamH, 16);
  const waterStream = new THREE.Mesh(streamGeo, matWater);
  waterStream.position.set(0, -wandH - streamH / 2, 0);
  waterStream.visible = true; // active by default for showcase
  waterStream.name = 'Water_Flow_Stream';

  wandGrp.add(wandUpper, wandLower, btnMesh, dotMesh, aeratorFace, nozzleCenter, sprayRing, waterStream);
  spoutPivot.add(wandGrp);
  root.add(spoutPivot);

  // -------------------------------------------------------------
  // Runtime Interactions & Animation Hooks
  // -------------------------------------------------------------
  let isPulled = false;
  let isWater = true;
  let currentSwivel = 0;
  let leverAngle = 0.22; // open water flow position

  leverPivot.rotation.x = leverAngle;

  const runtime: FaucetRuntime = {
    root,
    spoutPivot,
    leverPivot,
    wandHead: wandGrp,
    hoseMesh,
    waterStream,
    isPulledOut: isPulled,
    isWaterOn: isWater,
    togglePullOut: () => {
      isPulled = !isPulled;
      runtime.isPulledOut = isPulled;
      if (isPulled) {
        wandGrp.position.y = wandStartY - 0.12;
        wandGrp.position.z = archForwardReach + 0.03;
        wandGrp.rotation.x = 0.2;
        hoseMesh.visible = true;
      } else {
        wandGrp.position.set(0, wandStartY, archForwardReach);
        wandGrp.rotation.set(0, 0, 0);
        hoseMesh.visible = false;
      }
    },
    toggleWater: () => {
      isWater = !isWater;
      runtime.isWaterOn = isWater;
      waterStream.visible = isWater;
      // Animate lever handle position matching flow state
      leverPivot.rotation.x = isWater ? 0.25 : 0.0;
    },
    swivel: (angleRad: number) => {
      currentSwivel = angleRad;
      spoutPivot.rotation.y = currentSwivel;
    },
    setLever: (flow01: number, temp01: number) => {
      // Flow controls X rotation (forward/back)
      leverPivot.rotation.x = flow01 * 0.35;
      // Temp controls Y rotation (left=hot, right=cold)
      leverPivot.rotation.y = (temp01 - 0.5) * 0.5;
    },
  };

  root.userData.faucetRuntime = runtime;

  // Animated Water and Reflection Tick
  let timeAccum = 0;
  root.userData.tick = (delta: number) => {
    timeAccum += delta;
    if (waterStream.visible) {
      // Gentle realistic water stream ripple
      const scaleX = 1.0 + Math.sin(timeAccum * 12) * 0.08;
      const scaleZ = 1.0 + Math.cos(timeAccum * 14) * 0.08;
      waterStream.scale.set(scaleX, 1.0, scaleZ);
    }
  };

  return root;
}
