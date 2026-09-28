import * as THREE from 'three';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

export type KitchenRuntime = {
  root: THREE.Group;
  nodes: Record<string, THREE.Object3D>;
  drawers: Record<string, THREE.Group>;
  diningDoors: THREE.Group[];
  faucet: {
    base: THREE.Group;
    spout: THREE.Group;
    wand: THREE.Group;
    handle: THREE.Group;
    hose: THREE.Mesh;
    waterStream: THREE.Mesh;
    isPulledOut: boolean;
    isWaterOn: boolean;
    togglePullOut: () => boolean;
    toggleWater: () => boolean;
    swivelSpout: (angleRad: number) => void;
  };
  cooktop: {
    isPowered: boolean;
    burnerLights: THREE.PointLight[];
    burnerRings: THREE.Mesh[];
    togglePower: () => boolean;
    setPower: (on: boolean) => void;
  };
  openDrawer: (name: string, distance?: number) => void;
  closeAllDrawers: () => void;
  toggleDiningDoors: () => boolean;
  areDiningDoorsOpen: boolean;
};

/**
 * Creates procedural canvas-based normal / bump textures
 * for realistic micro-roughness without external image assets.
 */
function createFineNoiseTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const imgData = ctx.createImageData(size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = 120 + Math.floor(Math.random() * 45);
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}

function createBrushedMetalTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 700; i++) {
      const y = Math.random() * height;
      const len = 30 + Math.random() * 120;
      const x = Math.random() * width;
      const shade = 110 + Math.floor(Math.random() * 60);
      ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
      ctx.lineWidth = 0.5 + Math.random() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 2);
  return tex;
}

/**
 * Creates the high-fidelity Panasonic S-Class System Kitchen Island 3D Model.
 * Built to the exact architectural specifications from the Panasonic quotation & drawing PDF:
 * - Overall dimensions: 2573 mm W x 933 mm D x 900 mm H (Countertop t40 Granule White)
 * - Sink: JUA36SZBSU スキマレスステンレスシンク Mタイプ スラくるネット付 (787 X 480 X 195 mm)
 * - Countertop has a real physical cutout for the sink so the 195mm deep cavity is fully visible!
 * - Brushed satin stainless steel basin with internal stepped accessory tier (スラくる段差)
 * - Recessed rear-left detergent & sponge pocket with soap dispenser and sponge
 * - Slidable wire dish-drying rack (スラくるネット) with stacked ceramic plates & tumblers
 * - Deep circular stainless drain strainer with removable cover lid
 * - Signature Panasonic Triple Wide IH Cooktop with 3 inline burners & 3 downdraft exhaust grilles
 * - Floating cantilever recessed brushed stainless steel plinth pedestal with bay seams
 * - Dark matte charcoal/scratch metal cabinetry with 3 modular working bays & 6 rear dining doors
 * - Front-sensor swan neck faucet in mirror chrome with pull-out wand, flexible hose & water stream
 */
export function createKitchenModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Panasonic S-Class System Kitchen Island';

  const castShadow = options.castShadow ?? true;
  const receiveShadow = options.receiveShadow ?? true;
  const wireframe = options.wireframe ?? false;

  // -------------------------------------------------------------
  // 1. Procedural PBR Material Palette
  // -------------------------------------------------------------
  const noiseBump = createFineNoiseTexture();
  const brushedBump = createBrushedMetalTexture();

  // Dark matte charcoal / scratch metal finish (CH20 スクラッチメタル柄)
  const matCabinetMatte = new THREE.MeshStandardMaterial({
    color: 0x242628,
    roughness: 0.68,
    metalness: 0.08,
    bumpMap: noiseBump,
    bumpScale: 0.0008,
    wireframe,
  });

  // Floating pedestal base: Brushed metallic stainless steel
  const matPlinthStainless = new THREE.MeshStandardMaterial({
    color: 0xd0d5da,
    roughness: 0.28,
    metalness: 0.88,
    bumpMap: brushedBump,
    bumpScale: 0.002,
    wireframe,
  });

  // Countertop: 人造大理石 グラニュールホワイト (Granule White YS)
  const matCountertopWhite = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    roughness: 0.18,
    metalness: 0.02,
    wireframe,
  });

  // Japanese Satin Brushed Stainless Steel Sink Basin (スキマレスステンレス)
  const matStainlessSink = new THREE.MeshStandardMaterial({
    color: 0xc8ccd1,
    roughness: 0.22,
    metalness: 0.92,
    bumpMap: brushedBump,
    bumpScale: 0.001,
    wireframe,
  });

  // Front drawer handles: Anodized matte black / dark gold metal (MJG)
  const matHandleBlack = new THREE.MeshStandardMaterial({
    color: 0x16181a,
    roughness: 0.42,
    metalness: 0.45,
    wireframe,
  });

  // Wire racks, faucet, and drain rim: Mirror-polished electroplated chrome
  const matChromeMirror = new THREE.MeshStandardMaterial({
    color: 0xf5f7fa,
    roughness: 0.06,
    metalness: 0.98,
    wireframe,
  });

  // Triple Wide IH Cooktop Glass: Deep reflective black ceramic glass
  const matCooktopGlass = new THREE.MeshStandardMaterial({
    color: 0x080a0d,
    roughness: 0.04,
    metalness: 0.92,
    wireframe,
  });

  // Silk-screened burner ring graphic lines on induction glass
  const matBurnerGraphic = new THREE.MeshStandardMaterial({
    color: 0x8a9096,
    roughness: 0.4,
    metalness: 0.2,
    wireframe,
  });

  // Glowing induction element (activated by toggle)
  const matBurnerActive = new THREE.MeshStandardMaterial({
    color: 0xff3b10,
    emissive: 0xff2200,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.1,
    wireframe,
  });

  // Exhaust vent grilles behind cooktop: Dark gunmetal slotted metal
  const matVentGrille = new THREE.MeshStandardMaterial({
    color: 0x1c1e21,
    roughness: 0.5,
    metalness: 0.7,
    wireframe,
  });

  // Stainless steel drain strainer plate
  const matStrainerSteel = new THREE.MeshStandardMaterial({
    color: 0xdde2e6,
    roughness: 0.22,
    metalness: 0.92,
    wireframe,
  });

  // Faucet touchless sensor black infrared lens
  const matSensorLens = new THREE.MeshBasicMaterial({ color: 0x050505 });

  // Braided flexible metal pull-out hose
  const matBraidedHose = new THREE.MeshStandardMaterial({
    color: 0x6e747a,
    roughness: 0.55,
    metalness: 0.65,
    wireframe,
  });

  // Flowing water stream
  const matWater = new THREE.MeshStandardMaterial({
    color: 0xe6f7ff,
    transparent: true,
    opacity: 0.65,
    roughness: 0.05,
    metalness: 0.1,
    wireframe,
  });

  // White porcelain ceramic plates
  const matCeramicPlate = new THREE.MeshStandardMaterial({
    color: 0xfafcff,
    roughness: 0.12,
    metalness: 0.04,
    wireframe,
  });

  // Clear glass tumblers
  const matGlassCup = new THREE.MeshStandardMaterial({
    color: 0xf0f7fc,
    transparent: true,
    opacity: 0.42,
    roughness: 0.05,
    metalness: 0.08,
    wireframe,
  });

  // Soap dispenser bottle
  const matSoapBottle = new THREE.MeshStandardMaterial({
    color: 0xf3f5f7,
    roughness: 0.28,
    metalness: 0.02,
    wireframe,
  });

  // Dish sponge (foam + green scouring pad)
  const matSpongeFoam = new THREE.MeshStandardMaterial({
    color: 0xffd29d,
    roughness: 0.9,
    metalness: 0.0,
    wireframe,
  });
  const matSpongePad = new THREE.MeshStandardMaterial({
    color: 0x2e6650,
    roughness: 0.85,
    metalness: 0.0,
    wireframe,
  });

  // Shadow reveal channel trim (dark interior gaps)
  const matShadowGap = new THREE.MeshBasicMaterial({ color: 0x111214 });

  // -------------------------------------------------------------
  // 2. Exact Island Proportions & Dimensions (From PDF Quotation)
  // Overall Island: 2573 mm W x 933 mm D x 900 mm H (Counter t40)
  // -------------------------------------------------------------
  const islandW = 2.573;
  const islandD = 0.933;
  const counterH = 0.900;
  const counterThick = 0.040; // t40 per PDF
  const plinthH = 0.220;       // 220mm elevated floating plinth
  const plinthSetbackFront = 0.130;
  const plinthSetbackSide = 0.140;
  const cabinetH = counterH - counterThick - plinthH; // 0.640m
  const frontZ = islandD / 2;
  const backZ = -islandD / 2;

  const nodes: Record<string, THREE.Object3D> = {};
  const drawers: Record<string, THREE.Group> = {};
  const diningDoors: THREE.Group[] = [];

  // Sink positioning (Sukimaless M-Type: 787 x 480 x 195 mm)
  // Bay 1 (Left): 1050mm wide module. Sink is centered inside Bay 1.
  const sinkW = 0.787;
  const sinkD = 0.480;
  const sinkDepth = 0.195; // 195 mm deep cavity!
  const sinkX = -islandW / 2 + 1.050 / 2; // -0.7615 m
  const sinkFrontMargin = 0.085;
  const sinkZ = frontZ - sinkFrontMargin - sinkD / 2; // 0.1415 m

  const sinkMinX = sinkX - sinkW / 2;
  const sinkMaxX = sinkX + sinkW / 2;
  const sinkMinZ = sinkZ - sinkD / 2;
  const sinkMaxZ = sinkZ + sinkD / 2;

  // -------------------------------------------------------------
  // 3. Recessed Floating Plinth Pedestal (Brushed Stainless Steel)
  // -------------------------------------------------------------
  const plinthW = islandW - plinthSetbackSide * 2; // 2.293m
  const plinthD = islandD - plinthSetbackFront * 2; // 0.673m
  const plinthGrp = new THREE.Group();
  plinthGrp.name = 'Plinth_Brushed_Stainless_Pedestal';

  // Bay 1 Plinth Segment (Left, 1050mm module minus side setback)
  const p1W = 1.050 - plinthSetbackSide;
  const p1Geo = new THREE.BoxGeometry(p1W, plinthH, plinthD);
  const p1Mesh = new THREE.Mesh(p1Geo, matPlinthStainless);
  p1Mesh.position.set(-plinthW / 2 + p1W / 2, plinthH / 2, 0);
  p1Mesh.castShadow = castShadow;
  p1Mesh.receiveShadow = receiveShadow;
  p1Mesh.name = 'Plinth_Segment_Left';

  // Bay 2 Plinth Segment (Center 450mm module)
  const p2W = 0.450;
  const p2Geo = new THREE.BoxGeometry(p2W, plinthH, plinthD);
  const p2Mesh = new THREE.Mesh(p2Geo, matPlinthStainless);
  p2Mesh.position.set(-plinthW / 2 + p1W + 0.004 + p2W / 2, plinthH / 2, 0);
  p2Mesh.castShadow = castShadow;
  p2Mesh.receiveShadow = receiveShadow;
  p2Mesh.name = 'Plinth_Segment_Center';

  // Bay 3 Plinth Segment (Right, 1050mm module minus side setback)
  const p3W = plinthW - p1W - p2W - 0.008;
  const p3Geo = new THREE.BoxGeometry(p3W, plinthH, plinthD);
  const p3Mesh = new THREE.Mesh(p3Geo, matPlinthStainless);
  p3Mesh.position.set(plinthW / 2 - p3W / 2, plinthH / 2, 0);
  p3Mesh.castShadow = castShadow;
  p3Mesh.receiveShadow = receiveShadow;
  p3Mesh.name = 'Plinth_Segment_Right';

  // Vertical division reveal seams on the plinth face
  const seam1Geo = new THREE.BoxGeometry(0.004, plinthH, plinthD + 0.002);
  const seam1 = new THREE.Mesh(seam1Geo, matShadowGap);
  seam1.position.set(-plinthW / 2 + p1W + 0.002, plinthH / 2, 0);

  const seam2Geo = new THREE.BoxGeometry(0.004, plinthH, plinthD + 0.002);
  const seam2 = new THREE.Mesh(seam2Geo, matShadowGap);
  seam2.position.set(-plinthW / 2 + p1W + p2W + 0.006, plinthH / 2, 0);

  plinthGrp.add(p1Mesh, p2Mesh, p3Mesh, seam1, seam2);
  root.add(plinthGrp);
  nodes.plinth = plinthGrp;

  // -------------------------------------------------------------
  // 4. Main Cabinet Carcass & Side End Panels
  // -------------------------------------------------------------
  const carcassGrp = new THREE.Group();
  carcassGrp.name = 'Cabinet_Carcass_Core';
  const carcassY = plinthH + cabinetH / 2;

  // Central Structural Box Core
  const coreGeo = new THREE.BoxGeometry(islandW - 0.03, cabinetH - 0.02, islandD - 0.04);
  const coreMesh = new THREE.Mesh(coreGeo, matCabinetMatte);
  coreMesh.position.set(0, carcassY, 0);
  coreMesh.castShadow = castShadow;
  coreMesh.receiveShadow = receiveShadow;
  carcassGrp.add(coreMesh);

  // Left End Panel (Flush Charcoal Matte Slab)
  const endLGeo = new THREE.BoxGeometry(0.02, cabinetH, islandD);
  const endLMesh = new THREE.Mesh(endLGeo, matCabinetMatte);
  endLMesh.position.set(-islandW / 2 + 0.01, carcassY, 0);
  endLMesh.castShadow = castShadow;
  endLMesh.receiveShadow = receiveShadow;
  endLMesh.name = 'End_Panel_Left';

  // Right End Panel (Flush Charcoal Matte Slab)
  const endRGeo = new THREE.BoxGeometry(0.02, cabinetH, islandD);
  const endRMesh = new THREE.Mesh(endRGeo, matCabinetMatte);
  endRMesh.position.set(islandW / 2 - 0.01, carcassY, 0);
  endRMesh.castShadow = castShadow;
  endRMesh.receiveShadow = receiveShadow;
  endRMesh.name = 'End_Panel_Right';

  // Recessed Continuous Shadow Gap Channel under Countertop Lip
  const gapUnderCounterGeo = new THREE.BoxGeometry(islandW, 0.02, islandD);
  const gapUnderCounter = new THREE.Mesh(gapUnderCounterGeo, matShadowGap);
  gapUnderCounter.position.set(0, counterH - counterThick - 0.01, 0);

  carcassGrp.add(endLMesh, endRMesh, gapUnderCounter);
  root.add(carcassGrp);
  nodes.carcass = carcassGrp;

  // -------------------------------------------------------------
  // 5. Front Working Elevation: 3 Modular Bays & Drawers
  // -------------------------------------------------------------
  const frontFaceZ = frontZ - 0.01;

  function createBlackBarHandle(barLength = 0.28): THREE.Group {
    const handle = new THREE.Group();
    handle.name = 'Bar_Handle_Black';

    const barGeo = new THREE.BoxGeometry(barLength, 0.014, 0.012);
    const bar = new THREE.Mesh(barGeo, matHandleBlack);
    bar.castShadow = castShadow;
    bar.position.set(0, 0, 0.026);

    const postGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.026, 14);
    postGeo.rotateX(Math.PI / 2);
    const postSpan = barLength * 0.38;

    const postL = new THREE.Mesh(postGeo, matHandleBlack);
    postL.position.set(-postSpan, 0, 0.013);
    postL.castShadow = castShadow;

    const postR = postL.clone();
    postR.position.x = postSpan;

    handle.add(bar, postL, postR);
    return handle;
  }

  // --- Bay 1 (Left - Sink Bay, 1050mm module) ---
  const bay1W = 1.04;
  const bay1X = -islandW / 2 + 0.02 + bay1W / 2;
  const upperH = 0.24;
  const lowerH = 0.36;

  // Bay 1 Upper Sink Drawer
  const d1Upper = new THREE.Group();
  d1Upper.name = 'Drawer_Bay1_Upper_Sink';
  const d1UFrontGeo = new THREE.BoxGeometry(bay1W, upperH, 0.018);
  const d1UFront = new THREE.Mesh(d1UFrontGeo, matCabinetMatte);
  d1UFront.castShadow = castShadow;
  d1UFront.receiveShadow = receiveShadow;
  d1Upper.add(d1UFront);
  d1Upper.position.set(bay1X, plinthH + lowerH + 0.015 + upperH / 2, frontFaceZ);
  root.add(d1Upper);
  drawers.sinkUpper = d1Upper;

  // Bay 1 Lower Deep Pan Drawer (With centered horizontal black bar handle)
  const d1Lower = new THREE.Group();
  d1Lower.name = 'Drawer_Bay1_Lower_Sink';
  const d1LFrontGeo = new THREE.BoxGeometry(bay1W, lowerH, 0.018);
  const d1LFront = new THREE.Mesh(d1LFrontGeo, matCabinetMatte);
  d1LFront.castShadow = castShadow;
  d1LFront.receiveShadow = receiveShadow;
  const h1L = createBlackBarHandle(0.34);
  h1L.position.set(0, 0.06, 0.009);
  d1Lower.add(d1LFront, h1L);
  d1Lower.position.set(bay1X, plinthH + lowerH / 2 + 0.005, frontFaceZ);
  root.add(d1Lower);
  drawers.sinkLower = d1Lower;

  // --- Bay 2 (Center - Dishwasher / Utility Bay, 450mm module) ---
  const bay2W = 0.44;
  const bay2X = bay1X + bay1W / 2 + 0.01 + bay2W / 2;

  // Bay 2 Upper Drawer
  const d2Upper = new THREE.Group();
  d2Upper.name = 'Drawer_Bay2_Upper_Utility';
  const d2UFrontGeo = new THREE.BoxGeometry(bay2W, upperH, 0.018);
  const d2UFront = new THREE.Mesh(d2UFrontGeo, matCabinetMatte);
  d2UFront.castShadow = castShadow;
  d2UFront.receiveShadow = receiveShadow;
  const h2U = createBlackBarHandle(0.24);
  h2U.position.set(0, 0.03, 0.009);
  d2Upper.add(d2UFront, h2U);
  d2Upper.position.set(bay2X, plinthH + lowerH + 0.015 + upperH / 2, frontFaceZ);
  root.add(d2Upper);
  drawers.centerUpper = d2Upper;

  // Bay 2 Lower Drawer
  const d2Lower = new THREE.Group();
  d2Lower.name = 'Drawer_Bay2_Lower_Utility';
  const d2LFrontGeo = new THREE.BoxGeometry(bay2W, lowerH, 0.018);
  const d2LFront = new THREE.Mesh(d2LFrontGeo, matCabinetMatte);
  d2LFront.castShadow = castShadow;
  d2LFront.receiveShadow = receiveShadow;
  const h2L = createBlackBarHandle(0.24);
  h2L.position.set(0, 0.06, 0.009);
  d2Lower.add(d2LFront, h2L);
  d2Lower.position.set(bay2X, plinthH + lowerH / 2 + 0.005, frontFaceZ);
  root.add(d2Lower);
  drawers.centerLower = d2Lower;

  // --- Bay 3 (Right - Cooktop Bay, 1050mm module) ---
  const bay3W = islandW - bay1W - bay2W - 0.07;
  const bay3X = bay2X + bay2W / 2 + 0.01 + bay3W / 2;

  // Bay 3 Top Slim Black Strip (Control Trim)
  const ctrlStripH = 0.045;
  const ctrlStripGeo = new THREE.BoxGeometry(bay3W, ctrlStripH, 0.02);
  const ctrlStrip = new THREE.Mesh(ctrlStripGeo, matCooktopGlass);
  ctrlStrip.position.set(bay3X, counterH - counterThick - ctrlStripH / 2 - 0.012, frontFaceZ + 0.001);
  ctrlStrip.name = 'Cooktop_Control_Trim';
  root.add(ctrlStrip);

  const badgeGeo = new THREE.BoxGeometry(0.045, 0.008, 0.002);
  const matBadge = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
  const badge = new THREE.Mesh(badgeGeo, matBadge);
  badge.position.set(-bay3W / 2 + 0.05, 0, 0.011);
  ctrlStrip.add(badge);

  // Bay 3 Upper Drawer
  const d3UpperH = upperH - ctrlStripH - 0.005;
  const d3Upper = new THREE.Group();
  d3Upper.name = 'Drawer_Bay3_Upper_Cooktop';
  const d3UFrontGeo = new THREE.BoxGeometry(bay3W, d3UpperH, 0.018);
  const d3UFront = new THREE.Mesh(d3UFrontGeo, matCabinetMatte);
  d3UFront.castShadow = castShadow;
  d3UFront.receiveShadow = receiveShadow;
  d3Upper.add(d3UFront);
  d3Upper.position.set(bay3X, plinthH + lowerH + 0.015 + d3UpperH / 2, frontFaceZ);
  root.add(d3Upper);
  drawers.cooktopUpper = d3Upper;

  // Bay 3 Lower Deep Pan Drawer
  const d3Lower = new THREE.Group();
  d3Lower.name = 'Drawer_Bay3_Lower_Cooktop';
  const d3LFrontGeo = new THREE.BoxGeometry(bay3W, lowerH, 0.018);
  const d3LFront = new THREE.Mesh(d3LFrontGeo, matCabinetMatte);
  d3LFront.castShadow = castShadow;
  d3LFront.receiveShadow = receiveShadow;
  const h3L = createBlackBarHandle(0.36);
  h3L.position.set(0, 0.06, 0.009);
  d3Lower.add(d3LFront, h3L);
  d3Lower.position.set(bay3X, plinthH + lowerH / 2 + 0.005, frontFaceZ);
  root.add(d3Lower);
  drawers.cooktopLower = d3Lower;

  // -------------------------------------------------------------
  // 6. Dining / Living Room Side (Rear): 6 Full-Height Slab Doors
  // -------------------------------------------------------------
  const diningDoorsGrp = new THREE.Group();
  diningDoorsGrp.name = 'Dining_Side_Slab_Doors';
  const doorCount = 6;
  const diningDoorW = (islandW - 0.04 - (doorCount - 1) * 0.004) / doorCount;
  const diningDoorH = cabinetH - 0.025;
  const diningFaceZ = backZ + 0.01;

  for (let i = 0; i < doorCount; i++) {
    const doorPivot = new THREE.Group();
    doorPivot.name = `Dining_Door_Pivot_${i + 1}`;
    
    const startX = -islandW / 2 + 0.02 + diningDoorW / 2;
    const doorX = startX + i * (diningDoorW + 0.004);

    const doorGeo = new THREE.BoxGeometry(diningDoorW, diningDoorH, 0.018);
    const doorMesh = new THREE.Mesh(doorGeo, matCabinetMatte);
    doorMesh.castShadow = castShadow;
    doorMesh.receiveShadow = receiveShadow;
    doorMesh.position.set(diningDoorW / 2, 0, 0);

    doorPivot.add(doorMesh);
    doorPivot.position.set(doorX - diningDoorW / 2, plinthH + diningDoorH / 2 + 0.008, diningFaceZ);
    diningDoorsGrp.add(doorPivot);
    diningDoors.push(doorPivot);
  }
  root.add(diningDoorsGrp);
  nodes.diningDoors = diningDoorsGrp;

  // -------------------------------------------------------------
  // 7. Countertop with REAL Physical Sink Opening (No Solid Box Over Cavity!)
  // Built from contiguous quartz slab sections that frame the sink opening:
  // - Left bridge, Right field, Front rail, Rear faucet deck
  // -------------------------------------------------------------
  const counterGrp = new THREE.Group();
  counterGrp.name = 'Countertop_Quartz_Cutout_Assembly';
  const cY = counterH - counterThick / 2;

  // 1. Left Countertop Section (To the left of the sink cutout)
  const cLeftW = sinkMinX - (-islandW / 2);
  const cLeftGeo = new THREE.BoxGeometry(cLeftW, counterThick, islandD + 0.016);
  const cLeftMesh = new THREE.Mesh(cLeftGeo, matCountertopWhite);
  cLeftMesh.position.set(-islandW / 2 + cLeftW / 2, cY, 0);
  cLeftMesh.castShadow = castShadow;
  cLeftMesh.receiveShadow = receiveShadow;

  // 2. Right Countertop Section (To the right of the sink cutout, spanning all the way to right end)
  const cRightW = islandW / 2 - sinkMaxX;
  const cRightGeo = new THREE.BoxGeometry(cRightW, counterThick, islandD + 0.016);
  const cRightMesh = new THREE.Mesh(cRightGeo, matCountertopWhite);
  cRightMesh.position.set(islandW / 2 - cRightW / 2, cY, 0);
  cRightMesh.castShadow = castShadow;
  cRightMesh.receiveShadow = receiveShadow;

  // 3. Front Rail (In front of the sink cutout)
  const cFrontD = frontZ - sinkMaxZ;
  const cFrontGeo = new THREE.BoxGeometry(sinkW, counterThick, cFrontD + 0.008);
  const cFrontMesh = new THREE.Mesh(cFrontGeo, matCountertopWhite);
  cFrontMesh.position.set(sinkX, cY, sinkMaxZ + cFrontD / 2 + 0.004);
  cFrontMesh.castShadow = castShadow;
  cFrontMesh.receiveShadow = receiveShadow;

  // 4. Rear Deck (Behind the sink cutout, supporting faucet and dining side)
  const cRearD = sinkMinZ - backZ;
  const cRearGeo = new THREE.BoxGeometry(sinkW, counterThick, cRearD + 0.008);
  const cRearMesh = new THREE.Mesh(cRearGeo, matCountertopWhite);
  cRearMesh.position.set(sinkX, cY, sinkMinZ - cRearD / 2 - 0.004);
  cRearMesh.castShadow = castShadow;
  cRearMesh.receiveShadow = receiveShadow;

  counterGrp.add(cLeftMesh, cRightMesh, cFrontMesh, cRearMesh);
  root.add(counterGrp);
  nodes.countertop = counterGrp;

  // -------------------------------------------------------------
  // 8. Panasonic Sukimaless Stainless Sink M-Type (JUA36SZBSU)
  // Exact Dimensions: 787 mm W x 480 mm D x 195 mm Deep Cavity!
  // Features:
  // - Deep real 3D stainless steel sink cavity recessed 195mm below counter!
  // - Internal stepped perimeter track tier (スラくる段差, 28mm depth)
  // - Rear-left molded recess pocket with stainless detergent & sponge rack
  // - Soap dispenser pump bottle & kitchen sponge
  // - Slidable wire dish-drying rack (スラくるネット) with dinner plates & glasses!
  // - Large circular stainless drain strainer with removable cover lid
  // -------------------------------------------------------------
  const sinkAssembly = new THREE.Group();
  sinkAssembly.name = 'Panasonic_Sukimaless_Stainless_Sink_M';

  // 1. Gapless Beveled Collar Rim (Transitions from Granule White counter into stainless)
  const collarRimThick = 0.016;
  const rimMat = matStainlessSink;

  // Top Collar Left, Right, Front, Back
  const rimLGeo = new THREE.BoxGeometry(collarRimThick, 0.004, sinkD);
  const rimL = new THREE.Mesh(rimLGeo, rimMat);
  rimL.position.set(-sinkW / 2 + collarRimThick / 2, 0.002, 0);

  const rimR = rimL.clone();
  rimR.position.x = sinkW / 2 - collarRimThick / 2;

  const rimFGeo = new THREE.BoxGeometry(sinkW, 0.004, collarRimThick);
  const rimF = new THREE.Mesh(rimFGeo, rimMat);
  rimF.position.set(0, 0.002, sinkD / 2 - collarRimThick / 2);

  const rimB = rimF.clone();
  rimB.position.z = -sinkD / 2 + collarRimThick / 2;

  sinkAssembly.add(rimL, rimR, rimF, rimB);

  // 2. Upper Stepped Accessory Track Tier (スラくる段差, at Y = -0.028m)
  const tierY = -0.028;
  const tierStepW = 0.015; // 15mm ledge width for slidable net
  const wallThick = 0.003;

  // Upper walls (from Y = 0 to tierY)
  const upWallL = new THREE.Mesh(new THREE.BoxGeometry(wallThick, -tierY, sinkD), matStainlessSink);
  upWallL.position.set(-sinkW / 2 + wallThick / 2, tierY / 2, 0);

  const upWallR = upWallL.clone();
  upWallR.position.x = sinkW / 2 - wallThick / 2;

  const upWallF = new THREE.Mesh(new THREE.BoxGeometry(sinkW, -tierY, wallThick), matStainlessSink);
  upWallF.position.set(0, tierY / 2, sinkD / 2 - wallThick / 2);

  const upWallB = upWallF.clone();
  upWallB.position.z = -sinkD / 2 + wallThick / 2;

  // Horizontal Step Ledge (Perimeter shelf where Sla-kuru net slides)
  const ledgeL = new THREE.Mesh(new THREE.BoxGeometry(tierStepW, wallThick, sinkD - tierStepW * 2), matStainlessSink);
  ledgeL.position.set(-sinkW / 2 + tierStepW / 2, tierY, 0);

  const ledgeR = ledgeL.clone();
  ledgeR.position.x = sinkW / 2 - tierStepW / 2;

  const ledgeF = new THREE.Mesh(new THREE.BoxGeometry(sinkW, wallThick, tierStepW), matStainlessSink);
  ledgeF.position.set(0, tierY, sinkD / 2 - tierStepW / 2);

  const ledgeB = ledgeF.clone();
  ledgeB.position.z = -sinkD / 2 + tierStepW / 2;

  sinkAssembly.add(upWallL, upWallR, upWallF, upWallB, ledgeL, ledgeR, ledgeF, ledgeB);

  // 3. Main Deep Basin Walls (from tierY down to -sinkDepth = -0.195m!)
  const innerW = sinkW - tierStepW * 2;
  const innerD = sinkD - tierStepW * 2;
  const sinkLowerH = sinkDepth + tierY; // ~0.167m

  const lowWallL = new THREE.Mesh(new THREE.BoxGeometry(wallThick, sinkLowerH, innerD), matStainlessSink);
  lowWallL.position.set(-innerW / 2 + wallThick / 2, tierY - sinkLowerH / 2, 0);

  const lowWallR = lowWallL.clone();
  lowWallR.position.x = innerW / 2 - wallThick / 2;

  const lowWallF = new THREE.Mesh(new THREE.BoxGeometry(innerW, sinkLowerH, wallThick), matStainlessSink);
  lowWallF.position.set(0, tierY - sinkLowerH / 2, innerD / 2 - wallThick / 2);

  const lowWallB = lowWallF.clone();
  lowWallB.position.z = -innerD / 2 + wallThick / 2;

  // 4. Basin Floor at Deep 195mm Level (With realistic metallic sheen and drainage pitch)
  const floorGeo = new THREE.BoxGeometry(innerW - wallThick * 2, 0.005, innerD - wallThick * 2);
  const floorMesh = new THREE.Mesh(floorGeo, matStainlessSink);
  floorMesh.position.set(0, -sinkDepth + 0.0025, 0);
  floorMesh.receiveShadow = receiveShadow;

  sinkAssembly.add(lowWallL, lowWallR, lowWallF, lowWallB, floorMesh);

  // 5. Large Circular Drain Strainer Cavity (Centered in rear-mid floor)
  const drainX = 0.06;
  const drainZ = -0.04;
  const drainR = 0.07; // 140mm diameter

  // Recessed drain well cup
  const drainWellGeo = new THREE.CylinderGeometry(drainR, drainR * 0.95, 0.025, 32);
  const drainWell = new THREE.Mesh(drainWellGeo, matStrainerSteel);
  drainWell.position.set(drainX, -sinkDepth - 0.0125, drainZ);

  // Circular stainless steel strainer cover lid
  const drainLidGeo = new THREE.CylinderGeometry(drainR - 0.004, drainR - 0.004, 0.004, 32);
  const drainLid = new THREE.Mesh(drainLidGeo, matStrainerSteel);
  drainLid.position.set(drainX, -sinkDepth + 0.003, drainZ);

  // Crescent water intake cutout slit on drain lid
  const intakeGeo = new THREE.RingGeometry(drainR * 0.45, drainR * 0.75, 24, 1, 0, Math.PI);
  intakeGeo.rotateX(-Math.PI / 2);
  const matIntakeDark = new THREE.MeshBasicMaterial({ color: 0x111316 });
  const intakeMesh = new THREE.Mesh(intakeGeo, matIntakeDark);
  intakeMesh.position.set(drainX, -sinkDepth + 0.0055, drainZ);

  sinkAssembly.add(drainWell, drainLid, intakeMesh);

  // 6. Rear-Left Dedicated Recess Pocket for Detergent Rack (洗剤ラック専用ポケット)
  const pocketW = 0.22;
  const pocketD = 0.075;
  const pocketH = 0.11;
  const pocketX = -innerW / 2 + pocketW / 2 + 0.02;
  const pocketZ = -innerD / 2 + pocketD / 2;

  // Pocket Stainless Recess Frame
  const pocketBoxGeo = new THREE.BoxGeometry(pocketW, pocketH, pocketD);
  const pocketBox = new THREE.Mesh(pocketBoxGeo, matStainlessSink);
  pocketBox.position.set(pocketX, tierY - pocketH / 2, pocketZ);

  // Chrome Wire Sponge & Detergent Basket (洗剤ラック)
  const rackGrp = new THREE.Group();
  rackGrp.name = 'Detergent_Sponge_Wire_Rack';
  const wireR = 0.002;

  // Wire Basket Outer Rails
  const rwFrontGeo = new THREE.CylinderGeometry(wireR, wireR, pocketW - 0.01, 8);
  rwFrontGeo.rotateZ(Math.PI / 2);
  const rwFront = new THREE.Mesh(rwFrontGeo, matChromeMirror);
  rwFront.position.set(0, 0.025, pocketD / 2 - 0.005);

  const rwBack = rwFront.clone();
  rwBack.position.z = -pocketD / 2 + 0.005;

  const rwSideGeo = new THREE.CylinderGeometry(wireR, wireR, pocketD - 0.01, 8);
  rwSideGeo.rotateX(Math.PI / 2);
  const rwLeft = new THREE.Mesh(rwSideGeo, matChromeMirror);
  rwLeft.position.set(-pocketW / 2 + 0.005, 0.025, 0);

  const rwRight = rwLeft.clone();
  rwRight.position.x = pocketW / 2 - 0.005;

  // Bottom wires
  const rwFloorGeo = new THREE.BoxGeometry(pocketW - 0.01, 0.002, pocketD - 0.01);
  const rwFloor = new THREE.Mesh(rwFloorGeo, matChromeMirror);
  rwFloor.position.set(0, -0.025, 0);

  rackGrp.add(rwFront, rwBack, rwLeft, rwRight, rwFloor);
  rackGrp.position.set(pocketX, tierY - 0.035, pocketZ);

  // --- Accessories Inside Detergent Rack ---
  // A. Soap Dispenser Pump Bottle
  const soapBottleGrp = new THREE.Group();
  soapBottleGrp.name = 'Soap_Dispenser_Bottle';
  const bottleBody = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.075, 0.048), matSoapBottle);
  bottleBody.position.y = 0.0375;
  bottleBody.castShadow = castShadow;

  const pumpNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.010, 0.016, 16), matChromeMirror);
  pumpNeck.position.y = 0.083;

  const pumpHead = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.010, 16), matChromeMirror);
  pumpHead.position.set(0, 0.094, 0);

  const pumpSpoutGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.024, 12);
  pumpSpoutGeo.rotateX(Math.PI / 2);
  const pumpSpout = new THREE.Mesh(pumpSpoutGeo, matChromeMirror);
  pumpSpout.position.set(0, 0.094, 0.014);

  soapBottleGrp.add(bottleBody, pumpNeck, pumpHead, pumpSpout);
  soapBottleGrp.position.set(pocketX + 0.05, tierY - 0.055, pocketZ);

  // B. Kitchen Sponge (Yellow Foam with Green Scrub Pad, tilted)
  const spongeGrp = new THREE.Group();
  spongeGrp.name = 'Kitchen_Dish_Sponge';
  const spongeFoam = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.022, 0.038), matSpongeFoam);
  const spongePad = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.006, 0.038), matSpongePad);
  spongePad.position.y = 0.014;
  spongeGrp.add(spongeFoam, spongePad);
  spongeGrp.position.set(pocketX - 0.045, tierY - 0.035, pocketZ);
  spongeGrp.rotation.z = 0.25;

  sinkAssembly.add(rackGrp, soapBottleGrp, spongeGrp);

  // -------------------------------------------------------------
  // 7. Sla-kuru Net Wire Dish-Drying Rack with Plates & Glasses
  // (スラくるネット: Rested on the upper stepped tier on the right side!)
  // -------------------------------------------------------------
  const slakuruGrp = new THREE.Group();
  slakuruGrp.name = 'Slakuru_Net_Dish_Drying_Rack';
  const netW = 0.38;
  const netD = innerD + 0.02; // Spans across the tier ledges
  const netH = 0.08;
  const netX = innerW / 2 - netW / 2 - 0.01;
  const netZ = 0;

  // Sturdy Perimeter Wire Frame (Chrome)
  const fFront = new THREE.Mesh(new THREE.CylinderGeometry(wireR * 1.5, wireR * 1.5, netW, 12), matChromeMirror);
  fFront.rotation.z = Math.PI / 2;
  fFront.position.set(0, 0, netD / 2);

  const fRear = fFront.clone();
  fRear.position.z = -netD / 2;

  const fL = new THREE.Mesh(new THREE.CylinderGeometry(wireR * 1.5, wireR * 1.5, netD, 12), matChromeMirror);
  fL.rotation.x = Math.PI / 2;
  fL.position.set(-netW / 2, 0, 0);

  const fR = fL.clone();
  fR.position.x = netW / 2;

  slakuruGrp.add(fFront, fRear, fL, fR);

  // Transverse Grid Wires for cup & utensil drying
  const wireSpans = 14;
  for (let w = 0; w < wireSpans; w++) {
    const tW = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, netW - 0.005, 8), matChromeMirror);
    tW.rotation.z = Math.PI / 2;
    tW.position.set(0, 0, -netD / 2 + 0.015 + w * ((netD - 0.03) / (wireSpans - 1)));
    slakuruGrp.add(tW);
  }

  // Vertical Wire Loops for Plate Rack
  const plateCount = 5;
  const plateStartX = -netW / 2 + 0.06;
  const plateSpacing = 0.045;

  for (let p = 0; p < plateCount; p++) {
    const pX = plateStartX + p * plateSpacing;

    // Upright U-loop wire
    const loopH = 0.07;
    const loopGeo = new THREE.TorusGeometry(0.025, 0.0015, 8, 16, Math.PI);
    loopGeo.rotateZ(Math.PI);
    const loopMesh = new THREE.Mesh(loopGeo, matChromeMirror);
    loopMesh.position.set(pX, loopH, 0);
    slakuruGrp.add(loopMesh);

    // Porcelain Ceramic White Dinner Plate (Standing vertically)
    const plateGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.012, 32);
    plateGeo.rotateZ(Math.PI / 2); // Orient vertically
    const plateMesh = new THREE.Mesh(plateGeo, matCeramicPlate);
    plateMesh.position.set(pX, 0.095, 0);
    plateMesh.rotation.y = 0.08; // Subtle natural tilt
    plateMesh.castShadow = castShadow;
    slakuruGrp.add(plateMesh);
  }

  // Clear Drinking Glasses (Resting upside down on the drying grid)
  const tumblerGeo = new THREE.CylinderGeometry(0.032, 0.025, 0.085, 24);
  tumblerGeo.rotateX(Math.PI); // Upside down
  const glass1 = new THREE.Mesh(tumblerGeo, matGlassCup);
  glass1.position.set(netW / 2 - 0.05, 0.045, -0.09);
  glass1.castShadow = castShadow;

  const glass2 = glass1.clone();
  glass2.position.set(netW / 2 - 0.05, 0.045, 0.07);

  slakuruGrp.add(glass1, glass2);

  // Position Sla-kuru Net directly on the upper tier ledge
  slakuruGrp.position.set(netX, tierY + 0.002, netZ);
  sinkAssembly.add(slakuruGrp);

  // Mount the complete sink assembly into the countertop cutout!
  sinkAssembly.position.set(sinkX, counterH, sinkZ);
  root.add(sinkAssembly);
  nodes.sinkBasin = sinkAssembly;

  // -------------------------------------------------------------
  // 9. Panasonic Front-Sensor Swan-Neck Faucet (JUA08FPSTDA2)
  // Mounted securely on the rear countertop deck behind the sink!
  // -------------------------------------------------------------
  const faucetRoot = new THREE.Group();
  faucetRoot.name = 'Panasonic_Front_Sensor_Faucet';
  const faucetX = sinkX + 0.05; // Aligned with the center/spout deck
  const faucetZ = sinkMinZ - 0.065; // On the rear quartz deck

  // Base Deck Mounting Flange Collar
  const collarGeo = new THREE.CylinderGeometry(0.026, 0.028, 0.015, 24);
  const collar = new THREE.Mesh(collarGeo, matChromeMirror);
  collar.position.y = 0.0075;
  collar.castShadow = castShadow;

  // Vertical Pillar Column
  const pillarGeo = new THREE.CylinderGeometry(0.021, 0.023, 0.10, 24);
  const pillar = new THREE.Mesh(pillarGeo, matChromeMirror);
  pillar.position.y = 0.065;
  pillar.castShadow = castShadow;

  // Transverse Cartridge Hub
  const hubGeo = new THREE.CylinderGeometry(0.023, 0.023, 0.045, 24);
  const hub = new THREE.Mesh(hubGeo, matChromeMirror);
  hub.position.y = 0.135;

  // Touchless Infrared Sensor Window on front face
  const sensorGeo = new THREE.BoxGeometry(0.012, 0.018, 0.004);
  const sensor = new THREE.Mesh(sensorGeo, matSensorLens);
  sensor.position.set(0, 0.11, 0.022);

  // Side Single-Lever Mixer Handle
  const handlePivot = new THREE.Group();
  handlePivot.name = 'Mixer_Lever_Handle';
  const hCylGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 16);
  hCylGeo.rotateZ(Math.PI / 2);
  const hCyl = new THREE.Mesh(hCylGeo, matChromeMirror);
  hCyl.position.set(0.026, 0, 0);

  const pinGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.075, 16);
  const pin = new THREE.Mesh(pinGeo, matChromeMirror);
  pin.position.set(0.038, 0.035, 0);
  pin.rotation.z = -0.32;

  handlePivot.add(hCyl, pin);
  handlePivot.position.set(0, 0.135, 0);

  // Spout Assembly Group (Swivels left/right)
  const spoutGrp = new THREE.Group();
  spoutGrp.name = 'Spout_Swivel_Assembly';

  // High-Arc Swan Neck Tube using Catmull-Rom Curve
  const curvePoints = [
    new THREE.Vector3(0, 0.15, 0),
    new THREE.Vector3(0, 0.32, 0.01),
    new THREE.Vector3(0, 0.40, 0.05),
    new THREE.Vector3(0, 0.42, 0.11),
    new THREE.Vector3(0, 0.38, 0.17),
    new THREE.Vector3(0, 0.30, 0.19),
  ];
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const spoutTubeGeo = new THREE.TubeGeometry(curve, 48, 0.013, 20, false);
  const spoutTube = new THREE.Mesh(spoutTubeGeo, matChromeMirror);
  spoutTube.castShadow = castShadow;
  spoutGrp.add(spoutTube);

  // Pull-Out Spray Head Wand (Docked in the end of spout)
  const wandPivot = new THREE.Group();
  wandPivot.name = 'Spray_Wand_Nozzle';
  const wandDockedPos = new THREE.Vector3(0, 0.25, 0.19);
  wandPivot.position.copy(wandDockedPos);

  const wandGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.065, 24);
  const wandMesh = new THREE.Mesh(wandGeo, matChromeMirror);
  wandMesh.castShadow = castShadow;

  const rockerGeo = new THREE.BoxGeometry(0.007, 0.018, 0.004);
  const rocker = new THREE.Mesh(rockerGeo, matHandleBlack);
  rocker.position.set(0, 0.005, 0.016);

  const aeratorGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.004, 20);
  const aerator = new THREE.Mesh(aeratorGeo, matPlinthStainless);
  aerator.position.y = -0.033;

  wandPivot.add(wandMesh, rocker, aerator);
  spoutGrp.add(wandPivot);

  // Flexible Braided Hose (Shown when wand is pulled out)
  const hoseCurve = new THREE.LineCurve3(new THREE.Vector3(0, 0.30, 0.19), new THREE.Vector3(0, 0.25, 0.19));
  const hoseGeo = new THREE.TubeGeometry(hoseCurve, 16, 0.006, 12, false);
  const hoseMesh = new THREE.Mesh(hoseGeo, matBraidedHose);
  hoseMesh.visible = false;
  spoutGrp.add(hoseMesh);

  // Flowing Water Stream directly into the deep sink basin!
  const waterGeo = new THREE.CylinderGeometry(0.005, 0.009, 0.38, 16);
  const waterStream = new THREE.Mesh(waterGeo, matWater);
  waterStream.position.set(0, -0.22, 0);
  waterStream.visible = true;
  wandPivot.add(waterStream);

  faucetRoot.add(collar, pillar, hub, sensor, handlePivot, spoutGrp);
  faucetRoot.position.set(faucetX, counterH, faucetZ);
  root.add(faucetRoot);
  nodes.faucet = faucetRoot;

  // -------------------------------------------------------------
  // 10. Panasonic Triple Wide IH Cooktop (Right Side, 900 x 637 mm per PDF)
  // -------------------------------------------------------------
  const cooktopGrp = new THREE.Group();
  cooktopGrp.name = 'Panasonic_Triple_Wide_IH';
  const cooktopW = 0.900;
  const cooktopD = 0.380;
  const cooktopX = bay3X;
  const cooktopZ = 0.03;

  const frameGeo = new THREE.BoxGeometry(cooktopW + 0.012, 0.004, cooktopD + 0.012);
  const matCooktopTrim = new THREE.MeshStandardMaterial({ color: 0x44484d, roughness: 0.3, metalness: 0.8 });
  const cooktopFrame = new THREE.Mesh(frameGeo, matCooktopTrim);
  cooktopFrame.position.y = 0.002;
  cooktopGrp.add(cooktopFrame);

  const glassGeo = new THREE.BoxGeometry(cooktopW, 0.005, cooktopD);
  const glassMesh = new THREE.Mesh(glassGeo, matCooktopGlass);
  glassMesh.position.y = 0.003;
  glassMesh.castShadow = castShadow;
  glassMesh.receiveShadow = receiveShadow;
  cooktopGrp.add(glassMesh);

  // 3 Burners in a Single Horizontal Row!
  const burnerSpacing = 0.28;
  const burnerRadius = 0.088;
  const burnerLights: THREE.PointLight[] = [];
  const burnerRings: THREE.Mesh[] = [];

  for (let b = -1; b <= 1; b++) {
    const bX = b * burnerSpacing;
    const bZ = 0.01;

    const outerRingGeo = new THREE.RingGeometry(burnerRadius - 0.006, burnerRadius, 48);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRing = new THREE.Mesh(outerRingGeo, matBurnerGraphic);
    outerRing.position.set(bX, 0.006, bZ);

    const innerRingGeo = new THREE.RingGeometry(burnerRadius * 0.45, burnerRadius * 0.50, 36);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRing = new THREE.Mesh(innerRingGeo, matBurnerGraphic);
    innerRing.position.set(bX, 0.006, bZ);

    const crossHGeo = new THREE.BoxGeometry(0.024, 0.001, 0.002);
    const crossH = new THREE.Mesh(crossHGeo, matBurnerGraphic);
    crossH.position.set(bX, 0.006, bZ);

    const crossVGeo = new THREE.BoxGeometry(0.002, 0.001, 0.024);
    const crossV = new THREE.Mesh(crossVGeo, matBurnerGraphic);
    crossV.position.set(bX, 0.006, bZ);

    const burnerLight = new THREE.PointLight(0xff4500, 0, 0.6);
    burnerLight.position.set(bX, 0.04, bZ);

    cooktopGrp.add(outerRing, innerRing, crossH, crossV, burnerLight);
    burnerLights.push(burnerLight);
    burnerRings.push(outerRing, innerRing);
  }

  const ctrlStripGlassGeo = new THREE.BoxGeometry(0.42, 0.001, 0.035);
  const ctrlStripGlass = new THREE.Mesh(ctrlStripGlassGeo, matBurnerGraphic);
  ctrlStripGlass.position.set(0, 0.006, cooktopD / 2 - 0.03);
  cooktopGrp.add(ctrlStripGlass);

  const logoGeo = new THREE.BoxGeometry(0.035, 0.001, 0.007);
  const logoMesh = new THREE.Mesh(logoGeo, matBurnerGraphic);
  logoMesh.position.set(-cooktopW / 2 + 0.04, 0.006, cooktopD / 2 - 0.03);
  cooktopGrp.add(logoMesh);

  cooktopGrp.position.set(cooktopX, counterH, cooktopZ);
  root.add(cooktopGrp);
  nodes.cooktop = cooktopGrp;

  // -------------------------------------------------------------
  // 11. Three Flush Downdraft Exhaust Ventilation Grilles
  // -------------------------------------------------------------
  const ventGrp = new THREE.Group();
  ventGrp.name = 'Cooktop_Downdraft_Exhaust_Grilles';
  const ventW = 0.27;
  const ventD = 0.042;
  const ventZ = cooktopZ - cooktopD / 2 - 0.038;

  for (let v = -1; v <= 1; v++) {
    const vX = cooktopX + v * burnerSpacing;
    const singleVent = new THREE.Group();
    singleVent.name = `Vent_Grille_${v + 2}`;

    const bezelGeo = new THREE.BoxGeometry(ventW, 0.004, ventD);
    const bezel = new THREE.Mesh(bezelGeo, matVentGrille);
    bezel.position.y = 0.002;
    singleVent.add(bezel);

    const slatCount = 4;
    for (let s = 0; s < slatCount; s++) {
      const slatGeo = new THREE.BoxGeometry(ventW - 0.012, 0.002, 0.004);
      const slat = new THREE.Mesh(slatGeo, matShadowGap);
      const slatZ = -ventD / 2 + 0.009 + s * 0.008;
      slat.position.set(0, 0.004, slatZ);
      singleVent.add(slat);
    }

    singleVent.position.set(vX, counterH, ventZ);
    ventGrp.add(singleVent);
  }
  root.add(ventGrp);
  nodes.ventGrilles = ventGrp;

  // -------------------------------------------------------------
  // 12. Interactive Runtime Methods & Animations
  // -------------------------------------------------------------
  let isWandPulled = false;
  let isWaterFlowing = true;
  let areDiningDoorsOpen = false;
  let isIHActive = false;

  const runtime: KitchenRuntime = {
    root,
    nodes,
    drawers,
    diningDoors,
    faucet: {
      base: faucetRoot,
      spout: spoutGrp,
      wand: wandPivot,
      handle: handlePivot,
      hose: hoseMesh,
      waterStream,
      isPulledOut: false,
      isWaterOn: true,
      togglePullOut: () => {
        isWandPulled = !isWandPulled;
        runtime.faucet.isPulledOut = isWandPulled;
        if (isWandPulled) {
          wandPivot.position.set(0, 0.06, 0.22);
          wandPivot.rotation.x = 0.25;
          hoseMesh.visible = true;
          const p1 = new THREE.Vector3(0, 0.30, 0.19);
          const p2 = wandPivot.position.clone().add(new THREE.Vector3(0, 0.03, 0));
          const newHoseCurve = new THREE.CatmullRomCurve3([
            p1,
            new THREE.Vector3(0, 0.20, 0.20),
            p2,
          ]);
          hoseMesh.geometry.dispose();
          hoseMesh.geometry = new THREE.TubeGeometry(newHoseCurve, 20, 0.006, 12, false);
        } else {
          wandPivot.position.copy(wandDockedPos);
          wandPivot.rotation.x = 0;
          hoseMesh.visible = false;
        }
        return isWandPulled;
      },
      toggleWater: () => {
        isWaterFlowing = !isWaterFlowing;
        runtime.faucet.isWaterOn = isWaterFlowing;
        waterStream.visible = isWaterFlowing;
        handlePivot.rotation.z = isWaterFlowing ? 0 : 0.25;
        return isWaterFlowing;
      },
      swivelSpout: (rad: number) => {
        spoutGrp.rotation.y = rad;
      },
    },
    cooktop: {
      isPowered: false,
      burnerLights,
      burnerRings,
      setPower: (on: boolean) => {
        isIHActive = on;
        runtime.cooktop.isPowered = on;
        burnerLights.forEach((light) => {
          light.intensity = on ? 1.4 : 0;
        });
        burnerRings.forEach((ring) => {
          ring.material = on ? matBurnerActive : matBurnerGraphic;
        });
      },
      togglePower: () => {
        runtime.cooktop.setPower(!isIHActive);
        return isIHActive;
      },
    },
    openDrawer: (name: string, dist = 0.34) => {
      const d = drawers[name];
      if (d) {
        d.position.z = frontFaceZ + dist;
      }
    },
    closeAllDrawers: () => {
      Object.values(drawers).forEach((d) => {
        d.position.z = frontFaceZ;
      });
    },
    areDiningDoorsOpen: false,
    toggleDiningDoors: () => {
      areDiningDoorsOpen = !areDiningDoorsOpen;
      runtime.areDiningDoorsOpen = areDiningDoorsOpen;
      diningDoors.forEach((door, idx) => {
        const angle = areDiningDoorsOpen ? (idx % 2 === 0 ? -1.3 : 1.3) : 0;
        door.rotation.y = angle;
      });
      return areDiningDoorsOpen;
    },
  };

  root.userData.kitchenRuntime = runtime;

  let timeAcc = 0;
  root.userData.tick = (delta: number) => {
    timeAcc += delta;
    if (isWaterFlowing) {
      waterStream.scale.x = 1.0 + Math.sin(timeAcc * 20) * 0.08;
      waterStream.scale.z = 1.0 + Math.cos(timeAcc * 20) * 0.08;
    }
  };

  return root;
}
