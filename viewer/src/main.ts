import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createTradeItHardCaseModel } from './models/tradeItCase';
import { createHyper3dBadgeModel } from './models/hyper3dbadgeModel';
import { createKitchenModel, KitchenRuntime } from './models/kitchenModel';
import { createBasinFaucetModel, FaucetRuntime } from './models/basinFaucetModel';

// Raw TypeScript source imports for direct .TS code export
import kitchenModelSource from './models/kitchenModel.ts?raw';
import tradeItCaseSource from './models/tradeItCase.ts?raw';
import hyper3dBadgeSource from './models/hyper3dbadgeModel.ts?raw';
import basinFaucetSource from './models/basinFaucetModel.ts?raw';

class ThreeJsWorkbench {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private gridHelper: THREE.GridHelper;
  private groundPlane: THREE.Mesh;
  
  private currentModel: THREE.Group | null = null;
  private currentModelKey = 'kitchen';
  private isWireframe = false;
  private isRotating = false;
  private drawersOpen = false;
  private clock = new THREE.Clock();

  constructor() {
    this.container = document.getElementById('viewport-container') as HTMLElement;
    this.canvas = document.getElementById('three-canvas') as HTMLCanvasElement;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0f14);

    // 2. Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(2.4, 1.8, 2.6);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true, // Needed for screenshot capture
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Controls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 15;
    this.controls.minDistance = 0.2;

    // 5. Lighting Rig
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xfff5ea, 1.5);
    this.keyLight.position.set(4, 6, 4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xdbeafe, 0.6);
    this.fillLight.position.set(-4, 3, -3);
    this.scene.add(this.fillLight);

    // 6. Ground & Environment Helpers
    this.gridHelper = new THREE.GridHelper(10, 20, 0x3b82f6, 0x1e293b);
    this.gridHelper.position.y = -0.001;
    this.scene.add(this.gridHelper);

    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    this.groundPlane = new THREE.Mesh(groundGeo, groundMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);

    // 7. Load Initial Demo Model
    this.loadModel('kitchen');

    // 8. Event Listeners & UI Binding
    this.initEvents();
    this.animate();
  }

  public loadModel(modelKey: string): void {
    this.currentModelKey = modelKey;
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }

    if (modelKey === 'faucet') {
      try {
        const model = createBasinFaucetModel({
          castShadow: true,
          receiveShadow: true,
          wireframe: this.isWireframe,
        });
        this.currentModel = model;
        this.scene.add(model);
        this.frameObject(model);
        this.populateInspector(model);
        this.updateModelMetadata(
          'Stage 4 Procedural PBR',
          'CatmullRom Spout, Chrome Cylinders, Rocker Wand',
          'Spout Swivel + Wand Pull + Water Stream + Lever'
        );
        this.showToast('Loaded Japanese Basin Gooseneck Faucet 3D Model');
        this.setReferenceImage('/basin_faucet.png');
      } catch (err) {
        console.error('Failed to load Basin Faucet model:', err);
      }
    } else if (modelKey === 'kitchen') {
      try {
        const model = createKitchenModel({
          castShadow: true,
          receiveShadow: true,
          wireframe: this.isWireframe,
        });
        this.currentModel = model;
        this.scene.add(model);
        this.frameObject(model);
        this.populateInspector(model);
        this.updateModelMetadata(
          'Stage 4 Procedural PBR (Verified)',
          'Brushed Pedestal, Modular Drawers, Triple Wide IH, Sugopika Sink',
          'Drawers + 6 Dining Doors + Swivel Faucet + Wand + IH Burners'
        );
        this.showToast('Loaded Panasonic L-Class System Kitchen 3D Model');
        this.setReferenceImage('/system_kitchen.png');
      } catch (err) {
        console.error('Failed to load Kitchen model:', err);
      }
    } else if (modelKey === 'tradeItCase') {
      try {
        const model = createTradeItHardCaseModel({
          castShadow: true,
          receiveShadow: true,
          wireframe: this.isWireframe,
        });
        this.currentModel = model;
        this.scene.add(model);
        this.frameObject(model);
        this.populateInspector(model);
        this.updateModelMetadata('Blockout / Form', 'Procedural Boxes & Fillets', 'Hinge Lid Pivot Exposed');
        this.showToast('Loaded TradeIt Hard Case procedural model');
      } catch (err) {
        console.error('Failed to load TradeIt model:', err);
      }
    } else if (modelKey === 'hyper3d') {
      try {
        const model = createHyper3dBadgeModel({
          castShadow: true,
          receiveShadow: true,
          wireframe: this.isWireframe,
        });
        this.currentModel = model;
        this.scene.add(model);
        this.frameObject(model);
        this.populateInspector(model);
        this.updateModelMetadata('Rebuilt Stage 3', 'Procedural Box Geometry', 'Root Action Profile');
        this.showToast('Loaded Hyper3D Badge procedural model');
      } catch (err) {
        console.error('Failed to load Hyper3D model:', err);
      }
    }
  }

  private setReferenceImage(src: string): void {
    const imgPreview = document.getElementById('ref-image-preview') as HTMLImageElement;
    const dropHint = document.getElementById('drop-hint');
    if (imgPreview) {
      imgPreview.src = src;
      imgPreview.classList.remove('hidden');
      dropHint?.classList.add('hidden');
    }
  }

  private updateModelMetadata(pass: string, primitives: string, pivots: string): void {
    const elPass = document.getElementById('model-pass');
    const elPrim = document.getElementById('model-primitives');
    const elPivots = document.getElementById('model-pivots');
    if (elPass) elPass.textContent = pass;
    if (elPrim) elPrim.textContent = primitives;
    if (elPivots) elPivots.textContent = pivots;
  }

  private frameObject(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (this.camera.fov * Math.PI) / 180;
    let cameraZ = (maxDim / 2) / Math.tan(fov / 2) * 1.5;

    this.camera.position.set(center.x + cameraZ * 0.7, center.y + cameraZ * 0.5, center.z + cameraZ * 0.8);
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
  }

  private populateInspector(root: THREE.Object3D): void {
    const container = document.getElementById('hierarchy-tree');
    if (!container) return;
    container.innerHTML = '';

    const buildTree = (obj: THREE.Object3D, depth = 0) => {
      const row = document.createElement('div');
      row.className = 'tree-node';
      row.style.paddingLeft = `${depth * 14 + 6}px`;

      const typeSpan = document.createElement('span');
      typeSpan.className = 'node-type';
      typeSpan.textContent = obj instanceof THREE.Mesh ? '[Mesh]' : '[Node]';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = obj.name || `Object3D (${obj.id})`;

      row.appendChild(typeSpan);
      row.appendChild(nameSpan);

      row.addEventListener('click', () => {
        this.showToast(`Selected: ${obj.name || obj.id}`);
      });

      container.appendChild(row);

      for (const child of obj.children) {
        buildTree(child, depth + 1);
      }
    };

    buildTree(root);
  }

  private initEvents(): void {
    window.addEventListener('resize', () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    // Wireframe toggle
    const btnWireframe = document.getElementById('tool-wireframe');
    btnWireframe?.addEventListener('click', () => {
      this.isWireframe = !this.isWireframe;
      btnWireframe.classList.toggle('active', this.isWireframe);
      if (this.currentModel) {
        this.currentModel.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => (m.wireframe = this.isWireframe));
            } else {
              child.material.wireframe = this.isWireframe;
            }
          }
        });
      }
    });

    // Faucet Pull-Out Wand toggle
    const btnPullout = document.getElementById('tool-pullout');
    btnPullout?.addEventListener('click', () => {
      const faucetRuntime = this.currentModel?.userData?.faucetRuntime as FaucetRuntime | undefined;
      const kitchenRuntime = this.currentModel?.userData?.kitchenRuntime as KitchenRuntime | undefined;
      if (faucetRuntime) {
        faucetRuntime.togglePullOut();
        btnPullout.classList.toggle('active', faucetRuntime.isPulledOut);
        this.showToast(faucetRuntime.isPulledOut ? '🚿 Pulled Out Spray Head & Braided Hose' : '🚿 Docked Spray Wand in Gooseneck Spout');
      } else if (kitchenRuntime) {
        const isPulled = kitchenRuntime.faucet.togglePullOut();
        btnPullout.classList.toggle('active', isPulled);
        this.showToast(isPulled ? '🚿 Pulled Out Spray Head on Kitchen Faucet' : '🚿 Docked Spray Wand in Gooseneck Spout');
      } else {
        this.showToast('Pull wand is not supported on this model.');
      }
    });

    // Faucet Water Flow toggle
    const btnWater = document.getElementById('tool-water');
    btnWater?.addEventListener('click', () => {
      const faucetRuntime = this.currentModel?.userData?.faucetRuntime as FaucetRuntime | undefined;
      const kitchenRuntime = this.currentModel?.userData?.kitchenRuntime as KitchenRuntime | undefined;
      if (faucetRuntime) {
        faucetRuntime.toggleWater();
        btnWater.classList.toggle('active', faucetRuntime.isWaterOn);
        this.showToast(faucetRuntime.isWaterOn ? '💧 Water Stream Activated (Single-Lever Open)' : '💧 Water Shut Off (Lever Closed)');
      } else if (kitchenRuntime) {
        const isWaterOn = kitchenRuntime.faucet.toggleWater();
        btnWater.classList.toggle('active', isWaterOn);
        this.showToast(isWaterOn ? '💧 Kitchen Faucet Stream Flowing' : '💧 Kitchen Faucet Water Shut Off');
      } else {
        this.showToast('Water flow is not supported on this model.');
      }
    });

    // Drawers interactive open/close toggle
    const btnDrawers = document.getElementById('tool-drawers');
    btnDrawers?.addEventListener('click', () => {
      this.drawersOpen = !this.drawersOpen;
      btnDrawers.classList.toggle('active', this.drawersOpen);
      const runtime = this.currentModel?.userData?.kitchenRuntime as KitchenRuntime | undefined;
      if (runtime) {
        if (this.drawersOpen) {
          runtime.openDrawer('cooktopLower', 0.36);
          runtime.openDrawer('centerUpper', 0.24);
          runtime.openDrawer('centerLower', 0.30);
          runtime.openDrawer('sinkLower', 0.38);
          this.showToast('🗄️ Opened Panasonic Modular Storage Drawers');
        } else {
          runtime.closeAllDrawers();
          this.showToast('🗄️ Closed all drawers flush');
        }
      }
    });

    // Dining Side Doors toggle
    const btnDiningDoors = document.getElementById('tool-dining-doors');
    btnDiningDoors?.addEventListener('click', () => {
      const runtime = this.currentModel?.userData?.kitchenRuntime as KitchenRuntime | undefined;
      if (runtime) {
        const isOpen = runtime.toggleDiningDoors();
        btnDiningDoors.classList.toggle('active', isOpen);
        this.showToast(isOpen ? '🚪 Opened Dining-Side Cabinet Doors' : '🚪 Closed Dining-Side Doors Flush');
      } else {
        this.showToast('Dining doors are only on the Panasonic Kitchen model.');
      }
    });

    // Triple Wide IH Burners toggle
    const btnBurners = document.getElementById('tool-burners');
    btnBurners?.addEventListener('click', () => {
      const runtime = this.currentModel?.userData?.kitchenRuntime as KitchenRuntime | undefined;
      if (runtime) {
        const isPowered = runtime.cooktop.togglePower();
        btnBurners.classList.toggle('active', isPowered);
        this.showToast(isPowered ? '🔥 Panasonic Triple Wide IH Induction Zones Activated' : '🔥 Induction Cooktop Switched Off');
      } else {
        this.showToast('IH Burners are only on the Panasonic Kitchen model.');
      }
    });

    // Orbit auto-rotate toggle
    const btnRotate = document.getElementById('tool-rotate');
    btnRotate?.addEventListener('click', () => {
      this.isRotating = !this.isRotating;
      this.controls.autoRotate = this.isRotating;
      this.controls.autoRotateSpeed = 2.0;
      btnRotate.classList.toggle('active', this.isRotating);
    });

    // Reset camera focus
    document.getElementById('tool-reset-cam')?.addEventListener('click', () => {
      if (this.currentModel) {
        this.frameObject(this.currentModel);
      }
    });

    // Toggle Grid
    const btnGrid = document.getElementById('tool-grid');
    btnGrid?.addEventListener('click', () => {
      this.gridHelper.visible = !this.gridHelper.visible;
      btnGrid.classList.toggle('active', this.gridHelper.visible);
    });

    // Lighting controls
    const keySlider = document.getElementById('light-key') as HTMLInputElement;
    keySlider?.addEventListener('input', (e) => {
      this.keyLight.intensity = parseFloat((e.target as HTMLInputElement).value);
    });

    const ambientSlider = document.getElementById('light-ambient') as HTMLInputElement;
    ambientSlider?.addEventListener('input', (e) => {
      this.ambientLight.intensity = parseFloat((e.target as HTMLInputElement).value);
    });

    // Background Theme Selector
    const bgSelect = document.getElementById('bg-selector') as HTMLSelectElement;
    bgSelect?.addEventListener('change', () => {
      const colors: Record<string, number> = {
        dark: 0x0c0f14,
        slate: 0x1a202c,
        neutral: 0x2d3238,
      };
      const col = colors[bgSelect.value] ?? 0x0c0f14;
      this.scene.background = new THREE.Color(col);
    });

    // Model Selector
    const modelSelect = document.getElementById('model-selector') as HTMLSelectElement;
    modelSelect?.addEventListener('change', () => {
      this.loadModel(modelSelect.value);
    });

    // Export GLB Button
    document.getElementById('btn-export-glb')?.addEventListener('click', () => {
      this.exportGLB();
    });

    // Export TS Script Button
    document.getElementById('btn-export-ts')?.addEventListener('click', () => {
      this.exportTS();
    });

    // Screenshot Capture (Visual Review Gate)
    document.getElementById('btn-screenshot')?.addEventListener('click', () => {
      this.captureScreenshot();
    });

    // Reference Comparison Split View Toggle
    const btnSplit = document.getElementById('tool-split');
    const refPane = document.getElementById('ref-split-pane');
    btnSplit?.addEventListener('click', () => {
      refPane?.classList.toggle('hidden');
      btnSplit.classList.toggle('active', !refPane?.classList.contains('hidden'));
    });

    document.getElementById('btn-close-ref')?.addEventListener('click', () => {
      refPane?.classList.add('hidden');
      btnSplit?.classList.remove('active');
    });

    // Ref Image Upload & Drag/Drop
    const fileInput = document.getElementById('ref-file-input') as HTMLInputElement;
    const dropzone = document.getElementById('ref-dropzone');
    const imgPreview = document.getElementById('ref-image-preview') as HTMLImageElement;
    const dropHint = document.getElementById('drop-hint');

    const handleFile = (file: File) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (imgPreview && e.target?.result) {
            imgPreview.src = e.target.result as string;
            imgPreview.classList.remove('hidden');
            dropHint?.classList.add('hidden');
            this.showToast('Reference image loaded for comparison');
          }
        };
        reader.readAsDataURL(file);
      }
    };

    fileInput?.addEventListener('change', () => {
      if (fileInput.files?.[0]) handleFile(fileInput.files[0]);
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#3b82f6';
    });

    dropzone?.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
    });

    // Opacity slider for reference comparison
    const opacitySlider = document.getElementById('ref-opacity') as HTMLInputElement;
    opacitySlider?.addEventListener('input', () => {
      if (imgPreview) {
        imgPreview.style.opacity = `${parseFloat(opacitySlider.value) / 100}`;
      }
    });

    // Pre-populate with current basin faucet reference image
    if (imgPreview && dropHint) {
      imgPreview.src = '/basin_faucet.png';
      imgPreview.classList.remove('hidden');
      dropHint.classList.add('hidden');
    }

    // Pipeline Guide Modal
    const guideModal = document.getElementById('guide-modal');
    document.getElementById('btn-toggle-guide')?.addEventListener('click', () => {
      guideModal?.classList.remove('hidden');
    });

    document.getElementById('btn-close-modal')?.addEventListener('click', () => {
      guideModal?.classList.add('hidden');
    });

    guideModal?.addEventListener('click', (e) => {
      if (e.target === guideModal) guideModal.classList.add('hidden');
    });
  }

  private exportGLB(): void {
    if (!this.currentModel) {
      this.showToast('No active model loaded to export.');
      return;
    }

    try {
      this.showToast('Generating GLB file...');
      
      // Ensure world transforms are computed on the active model root
      this.currentModel.updateMatrixWorld(true);

      const exporter = new GLTFExporter();
      const options = {
        binary: true,
      };

      exporter.parse(
        this.currentModel,
        (result) => {
          if (result instanceof ArrayBuffer) {
            const blob = new Blob([result], { type: 'model/gltf-binary' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            const rawName = this.currentModel?.name || this.currentModelKey || 'model';
            let cleanName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'model';
            if (!cleanName.endsWith('.glb')) {
              cleanName = `${cleanName}.glb`;
            }
            link.download = cleanName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            this.showToast(`Exported ${cleanName} successfully!`);
          } else {
            console.error('Expected ArrayBuffer for binary GLB export, got:', result);
            this.showToast('Export failed: Invalid GLB data format.');
          }
        },
        (error) => {
          console.error('An error occurred during GLTF export:', error);
          this.showToast('Failed to export GLB model.');
          alert(`Error exporting GLB: ${error instanceof Error ? error.message : error}`);
        },
        options
      );
    } catch (err) {
      console.error('Exception during GLB export:', err);
      this.showToast('Export error: see console.');
      alert(`GLB Export Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private exportTS(): void {
    if (!this.currentModel) {
      this.showToast('No active model loaded to export.');
      return;
    }

    try {
      this.showToast('Preparing TypeScript factory code...');

      const sourceMap: Record<string, string> = {
        faucet: basinFaucetSource,
        kitchen: kitchenModelSource,
        tradeItCase: tradeItCaseSource,
        hyper3d: hyper3dBadgeSource,
      };

      let sourceCode = sourceMap[this.currentModelKey];

      if (!sourceCode && this.currentModel) {
        sourceCode = this.generateFallbackTSSource(this.currentModel);
      }

      if (!sourceCode) {
        this.showToast('No source code available for this model.');
        return;
      }

      const blob = new Blob([sourceCode], { type: 'text/typescript;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      const rawName = this.currentModel?.name || this.currentModelKey || 'proceduralModel';
      let cleanName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'proceduralModel';
      if (!cleanName.endsWith('.ts')) {
        cleanName = `${cleanName}.ts`;
      }
      link.download = cleanName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      this.showToast(`Exported ${cleanName} successfully!`);
    } catch (err) {
      console.error('Error exporting TypeScript source:', err);
      this.showToast('Error exporting .TS file: see console.');
      alert(`TS Export Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private generateFallbackTSSource(model: THREE.Object3D): string {
    const rawName = model.name || this.currentModelKey || 'ProceduralModel';
    const functionName = 'create' + rawName.replace(/[^a-zA-Z0-9]/g, '') + 'Model';

    let meshDeclarations = '';
    let nodeIndex = 0;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        nodeIndex++;
        const p = child.position;
        const r = child.rotation;
        const s = child.scale;
        const color = child.material && 'color' in child.material && child.material.color
          ? '0x' + child.material.color.getHexString()
          : '0x888888';
        const roughness = child.material && 'roughness' in child.material ? child.material.roughness : 0.5;
        const metalness = child.material && 'metalness' in child.material ? child.material.metalness : 0.1;

        meshDeclarations += `
  // Node ${nodeIndex}: ${child.name || 'Mesh'}
  {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        color: ${color},
        roughness: ${roughness},
        metalness: ${metalness},
      })
    );
    mesh.name = ${JSON.stringify(child.name || `mesh_${nodeIndex}`)};
    mesh.position.set(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)});
    mesh.rotation.set(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)});
    mesh.scale.set(${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)});
    root.add(mesh);
  }`;
      }
    });

    return `import * as THREE from 'three';

/**
 * Procedural model factory for ${rawName}.
 * Reconstructed procedural Three.js code generated by img2threejs.
 */
export function ${functionName}(options: { wireframe?: boolean } = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = ${JSON.stringify(rawName)};
${meshDeclarations || `
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x76787a, roughness: 0.6 })
  );
  root.add(mesh);`}

  if (options.wireframe) {
    root.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material.wireframe = true;
      }
    });
  }

  return root;
}
`;
  }

  private captureScreenshot(): void {
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `review-render-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    this.showToast('Screenshot saved! Use for stage 4 comparison review.');
  }

  public showToast(msg: string): void {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    this.currentModel?.userData?.tick?.(delta);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  new ThreeJsWorkbench();
});
