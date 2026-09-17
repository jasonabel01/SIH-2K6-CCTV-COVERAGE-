import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Camera, 
  Layers, 
  RotateCcw, 
  Eye, 
  Sliders, 
  Crosshair, 
  Play, 
  Pause, 
  FastForward, 
  Car, 
  Bike, 
  Truck, 
  Zap, 
  Radio, 
  Compass, 
  Scan,
  Maximize2
} from 'lucide-react';

/**
 * UasGantryWireframe3D (Realistic 3D Sensor Gantry with Live Vehicle Motion & 2-Wheeler Support)
 * 
 * Features:
 * 1. Live Vehicle Movement Animation along the highway corridor with wheel rotation and gantry transit.
 * 2. Dedicated 3D 2-Wheeler (Motorcycle / Bike) and 4-Wheeler (Sedan / SUV) models.
 * 3. Dynamic Laser Tracking & Camera Frustum that tracks moving front HSRP license plates in real time.
 * 4. Strobe Flash triggers when the vehicle crosses the ANPR optical capture zone.
 * 5. Interactive driving playback controls: Play/Pause, 0.5x Slow-Mo, 1x Highway, 2x Fast-Forward.
 * 6. Full OrbitControls with 4 instant camera presets: ISO, Cockpit, Boresight, Top-Down.
 */
export default function UasGantryWireframe3D({ 
  activeTargetPlate = 'RJ 14 CA 0639',
  plateInfo = null 
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraMountGroupRef = useRef(null);
  const raycastLineRef = useRef(null);
  const opticalConeRef = useRef(null);
  const plateMeshRef = useRef(null);
  const scanPlaneRef = useRef(null);
  const vehicleGroupRef = useRef(null);
  const wheelsRef = useRef([]);
  const strobeLightRef = useRef(null);

  // Motion & Simulation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1.0); // 0.5x, 1.0x, 2.0x
  const [vehicleZPos, setVehicleZPos] = useState(48); // Z coordinate of vehicle
  const [vehicleType, setVehicleType] = useState('auto'); // 'auto' | 'car' | 'bike' | 'truck'
  const [viewPreset, setViewPreset] = useState('iso'); // 'iso' | 'cockpit' | 'boresight' | 'topdown'
  const [sensorPitch, setSensorPitch] = useState(38.4); // degrees
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [strobeActive, setStrobeActive] = useState(false);

  // Detect if current plate is 2-wheeler or commercial
  const is2W = vehicleType === 'bike' || (vehicleType === 'auto' && (
    activeTargetPlate === 'DL 3S CD 8412' || 
    (plateInfo && plateInfo.is2W) ||
    activeTargetPlate.includes('Bike') ||
    activeTargetPlate.includes('2W')
  ));

  const isCommercial = activeTargetPlate.includes('TA') || 
                      activeTargetPlate.includes('AH') || 
                      (plateInfo && plateInfo.category && plateInfo.category.includes('Commercial'));

  // Texture generator for authentic Indian HSRP License Plate
  const createHSRPPlateTexture = (plateNumber, isCommercialVehicle, isBike) => {
    const canvas = document.createElement('canvas');
    canvas.width = isBike ? 384 : 512;
    canvas.height = isBike ? 160 : 128;
    const ctx = canvas.getContext('2d');

    // Plate Background
    ctx.fillStyle = isCommercialVehicle ? '#FACC15' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer Border
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Left Blue Strip (IND)
    const stripW = isBike ? 42 : 48;
    ctx.fillStyle = '#003399';
    ctx.fillRect(5, 5, stripW, canvas.height - 10);

    // Ashoka Chakra Hologram representation
    ctx.beginPath();
    ctx.arc(stripW / 2 + 5, canvas.height * 0.3, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#60A5FA';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // IND text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('IND', stripW / 2 + 5, canvas.height * 0.75);

    // Embossed Registration String
    ctx.fillStyle = '#111827';
    ctx.font = isBike ? '900 44px monospace' : '900 52px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plateNumber, (canvas.width + stripW) / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  };

  // Main Three.js Lifecycle
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene & Environment
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x080C14);
    scene.fog = new THREE.FogExp2(0x080C14, 0.005);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    camera.position.set(55, 38, 75);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 12;
    controls.maxDistance = 190;
    controls.target.set(0, 10, 15);

    // 5. Lighting Architecture
    const ambientLight = new THREE.AmbientLight(0x1E293B, 1.8);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xd1d5db, 2.2);
    mainSun.position.set(40, 70, 50);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 1024;
    mainSun.shadow.mapSize.height = 1024;
    scene.add(mainSun);

    // Gantry Downward Illuminator
    const gantrySpot = new THREE.SpotLight(0x00E5FF, 3.5, 85, Math.PI / 4, 0.4, 1);
    gantrySpot.position.set(-6, 33, 2);
    gantrySpot.target.position.set(-6, 2, 35);
    scene.add(gantrySpot);
    scene.add(gantrySpot.target);

    // High-Intensity ANPR Flash Strobe (Triggers in capture zone)
    const strobeLight = new THREE.PointLight(0xFFFFFF, 0, 45);
    strobeLight.position.set(-6, 33, 4);
    strobeLightRef.current = strobeLight;
    scene.add(strobeLight);

    // 6. Asphalt Highway Roadway
    const roadGroup = new THREE.Group();
    scene.add(roadGroup);

    const roadGeo = new THREE.PlaneGeometry(64, 200);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0B0F17,
      roughness: 0.85,
      metalness: 0.15
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);

    // Dashed White Lane Lines
    [-10, 10].forEach(posX => {
      for (let z = -90; z <= 90; z += 12) {
        const stripeGeo = new THREE.PlaneGeometry(0.8, 6);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xF8FAFC, transparent: true, opacity: 0.7 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(posX, 0.05, z);
        roadGroup.add(stripe);
      }
    });

    // Outer Yellow Shoulders & Crash Barriers
    [-24, 24].forEach(x => {
      const shoulderGeo = new THREE.PlaneGeometry(0.6, 200);
      const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.8 });
      const shoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulder.rotation.x = -Math.PI / 2;
      shoulder.position.set(x, 0.05, 0);
      roadGroup.add(shoulder);

      // Guardrail
      const railGeo = new THREE.BoxGeometry(0.5, 2.5, 200);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x > 0 ? x + 3 : x - 3, 2, 0);
      rail.castShadow = true;
      roadGroup.add(rail);
    });

    // Tactical Engineering Ground Grid
    const grid = new THREE.GridHelper(200, 40, 0x00E5FF, 0x1E293B);
    grid.position.y = -0.1;
    scene.add(grid);

    // 7. Steel Lattice Highway Sensor Gantry (Overhead Structure)
    const gantryGroup = new THREE.Group();
    scene.add(gantryGroup);

    const steelMaterial = new THREE.MeshStandardMaterial({ color: 0x222730, metalness: 0.85, roughness: 0.25 });
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x9CA3AF, transparent: true, opacity: 0.7 });

    // Concrete Footings
    [-28, 28].forEach(x => {
      const footingGeo = new THREE.BoxGeometry(4, 3, 5);
      const footingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
      const footing = new THREE.Mesh(footingGeo, footingMat);
      footing.position.set(x, 1.5, 0);
      gantryGroup.add(footing);
    });

    // Vertical Columns
    [-28, 28].forEach(sideX => {
      [-1.5, 1.5].forEach(offsetZ => {
        const colGeo = new THREE.CylinderGeometry(0.9, 1.1, 32, 12);
        const colMesh = new THREE.Mesh(colGeo, steelMaterial);
        colMesh.position.set(sideX, 17, offsetZ);
        colMesh.castShadow = true;
        gantryGroup.add(colMesh);

        const colEdges = new THREE.LineSegments(new THREE.EdgesGeometry(colGeo), edgeMaterial);
        colEdges.position.copy(colMesh.position);
        gantryGroup.add(colEdges);
      });
    });

    // Overhead Space Truss (60m Wide)
    const trussLength = 60;
    const trussChords = [
      [-trussLength / 2, 33, -1.8, trussLength / 2, 33, -1.8],
      [-trussLength / 2, 33, 1.8, trussLength / 2, 33, 1.8],
      [-trussLength / 2, 37, -1.8, trussLength / 2, 37, -1.8],
      [-trussLength / 2, 37, 1.8, trussLength / 2, 37, 1.8]
    ];

    trussChords.forEach(([x1, y1, z1, x2, y2, z2]) => {
      const chordGeo = new THREE.CylinderGeometry(0.7, 0.7, trussLength, 8);
      const chord = new THREE.Mesh(chordGeo, steelMaterial);
      chord.rotation.z = Math.PI / 2;
      chord.position.set(0, y1, z1);
      gantryGroup.add(chord);

      const chordWire = new THREE.LineSegments(new THREE.EdgesGeometry(chordGeo), edgeMaterial);
      chordWire.rotation.z = Math.PI / 2;
      chordWire.position.copy(chord.position);
      gantryGroup.add(chordWire);
    });

    // Diagonal Warren Bracing across Gantry
    for (let tx = -26; tx <= 24; tx += 4) {
      const diagGeo = new THREE.CylinderGeometry(0.3, 0.3, 5.8, 6);
      const diag1 = new THREE.Mesh(diagGeo, steelMaterial);
      diag1.rotation.z = Math.PI / 4;
      diag1.position.set(tx + 2, 35, -1.8);
      gantryGroup.add(diag1);

      const diag2 = new THREE.Mesh(diagGeo, steelMaterial);
      diag2.rotation.z = -Math.PI / 4;
      diag2.position.set(tx + 2, 35, 1.8);
      gantryGroup.add(diag2);
    }

    // Catwalk Platform
    const catwalkGeo = new THREE.BoxGeometry(56, 0.4, 4);
    const catwalkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    const catwalk = new THREE.Mesh(catwalkGeo, catwalkMat);
    catwalk.position.set(0, 33.2, 0);
    gantryGroup.add(catwalk);

    // 8. ANPR Sensor Pod & Doppler Radar Unit (Node CAM_01)
    const cameraMountGroup = new THREE.Group();
    cameraMountGroup.position.set(-6, 33, 2.2);
    cameraMountGroupRef.current = cameraMountGroup;
    gantryGroup.add(cameraMountGroup);

    const sensorHead = new THREE.Group();
    sensorHead.position.set(0, -1.2, 1.2);
    cameraMountGroup.add(sensorHead);

    // Weatherproof Camera Enclosure
    const camBodyGeo = new THREE.BoxGeometry(3.6, 2.8, 6.2);
    const camBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
    const camBody = new THREE.Mesh(camBodyGeo, camBodyMat);
    sensorHead.add(camBody);

    const camEdges = new THREE.LineSegments(new THREE.EdgesGeometry(camBodyGeo), new THREE.LineBasicMaterial({ color: 0x00A8FF }));
    sensorHead.add(camEdges);

    // Optical Lens Barrel
    const lensGeo = new THREE.CylinderGeometry(1.1, 1.25, 2.2, 16);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.95 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0, 3.8);
    sensorHead.add(lens);

    // Front Glass Element
    const glassGeo = new THREE.CircleGeometry(0.95, 16);
    const glass = new THREE.Mesh(glassGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    glass.position.set(0, 0, 4.95);
    sensorHead.add(glass);

    // IR LED Matrix & Doppler Radar Pod
    const irStrobeGeo = new THREE.BoxGeometry(3.4, 0.8, 0.5);
    const irStrobe = new THREE.Mesh(irStrobeGeo, new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
    irStrobe.position.set(0, 1.8, 2.5);
    sensorHead.add(irStrobe);

    const radarPodGeo = new THREE.BoxGeometry(2.4, 2.4, 1.0);
    const radarPod = new THREE.Mesh(radarPodGeo, new THREE.MeshStandardMaterial({ color: 0x10B981, metalness: 0.7 }));
    radarPod.position.set(3.2, 0, 1.8);
    sensorHead.add(radarPod);

    sensorHead.rotation.x = THREE.MathUtils.degToRad(sensorPitch);

    // 9. Build Target Vehicle Model (Switches dynamically between 2-Wheeler and 4-Wheeler)
    const vehicleGroup = new THREE.Group();
    vehicleGroup.position.set(-6, 0, 48);
    vehicleGroupRef.current = vehicleGroup;
    scene.add(vehicleGroup);

    const wheelsList = [];

    if (is2W) {
      // ==========================================
      // 3D 2-WHEELER (MOTORCYCLE / HERO SPLENDOR)
      // ==========================================
      const bikeFrameMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.95, roughness: 0.1 });
      const blackRubberMat = new THREE.MeshStandardMaterial({ color: 0x090D16, roughness: 0.9 });
      const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

      // Main Frame Backbone
      const frameGeo = new THREE.BoxGeometry(1.2, 2.2, 12);
      const frame = new THREE.Mesh(frameGeo, darkMetalMat);
      frame.position.set(0, 3.2, 0);
      vehicleGroup.add(frame);

      // Sculpted Fuel Tank
      const tankGeo = new THREE.BoxGeometry(2.4, 2.2, 5.5);
      const tank = new THREE.Mesh(tankGeo, bikeFrameMat);
      tank.position.set(0, 4.8, 1.5);
      tank.castShadow = true;
      vehicleGroup.add(tank);

      // Two-Seater Saddle
      const seatGeo = new THREE.BoxGeometry(2.0, 1.2, 6.0);
      const seatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.set(0, 4.6, -3.2);
      vehicleGroup.add(seat);

      // Engine Block & Chrome Exhaust
      const engineGeo = new THREE.BoxGeometry(1.8, 2.5, 3.2);
      const engine = new THREE.Mesh(engineGeo, chromeMat);
      engine.position.set(0, 2.2, 0.5);
      vehicleGroup.add(engine);

      const exhaustGeo = new THREE.CylinderGeometry(0.35, 0.45, 9, 8);
      const exhaust = new THREE.Mesh(exhaustGeo, chromeMat);
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(1.1, 1.5, -3.5);
      vehicleGroup.add(exhaust);

      // Telescopic Front Forks & Handlebars
      const forkGeo = new THREE.CylinderGeometry(0.25, 0.25, 6.5, 8);
      [-0.7, 0.7].forEach(fx => {
        const fork = new THREE.Mesh(forkGeo, chromeMat);
        fork.rotation.x = THREE.MathUtils.degToRad(22);
        fork.position.set(fx, 3.4, 4.8);
        vehicleGroup.add(fork);
      });

      // Handlebar
      const barGeo = new THREE.CylinderGeometry(0.2, 0.2, 4.5, 8);
      const bar = new THREE.Mesh(barGeo, chromeMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 6.4, 4.0);
      vehicleGroup.add(bar);

      // Front Headlight
      const hlGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.8, 16);
      const hl = new THREE.Mesh(hlGeo, new THREE.MeshBasicMaterial({ color: 0xF8FAFC }));
      hl.rotation.x = Math.PI / 2;
      hl.position.set(0, 5.2, 5.8);
      vehicleGroup.add(hl);

      // Rider Helmet & Torso (Aerodynamic Silhouette)
      const riderMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.4 });
      const torsoGeo = new THREE.BoxGeometry(2.6, 4.0, 2.2);
      const torso = new THREE.Mesh(torsoGeo, riderMat);
      torso.rotation.x = THREE.MathUtils.degToRad(-15);
      torso.position.set(0, 7.2, -1.8);
      vehicleGroup.add(torso);

      const helmetGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const helmetMat = new THREE.MeshStandardMaterial({ color: 0x00A8FF, roughness: 0.2, metalness: 0.7 });
      const helmet = new THREE.Mesh(helmetGeo, helmetMat);
      helmet.position.set(0, 9.8, -1.0);
      vehicleGroup.add(helmet);

      // Rotating Spoked Wheels (Front Z = 6.2, Rear Z = -5.8)
      [6.2, -5.8].forEach(wz => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(0, 2.2, wz);

        const tireGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.8, 16);
        const tire = new THREE.Mesh(tireGeo, blackRubberMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        wheelGroup.add(tire);

        const rimGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.85, 8);
        const rim = new THREE.Mesh(rimGeo, chromeMat);
        rim.rotation.z = Math.PI / 2;
        wheelGroup.add(rim);

        vehicleGroup.add(wheelGroup);
        wheelsList.push(wheelGroup);
      });

      // Front HSRP License Plate on Bike
      const plateGeo = new THREE.PlaneGeometry(3.6, 1.5);
      const plateTexture = createHSRPPlateTexture(activeTargetPlate, isCommercial, true);
      const plateMat = new THREE.MeshBasicMaterial({ map: plateTexture, side: THREE.FrontSide });
      const plateMesh = new THREE.Mesh(plateGeo, plateMat);
      plateMesh.position.set(0, 3.8, 6.8);
      plateMeshRef.current = plateMesh;
      vehicleGroup.add(plateMesh);

    } else {
      // ==========================================
      // 3D 4-WHEELER (CAR / SEDAN / SUV)
      // ==========================================
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isCommercial ? 0x0284c7 : 0x1E293B,
        metalness: 0.75,
        roughness: 0.25
      });

      // Main Chassis Body
      const bodyGeo = new THREE.BoxGeometry(12.5, 4.2, 26);
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 3.6;
      bodyMesh.castShadow = true;
      vehicleGroup.add(bodyMesh);

      const bodyEdges = new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo), new THREE.LineBasicMaterial({ color: 0x00A8FF, transparent: true, opacity: 0.6 }));
      bodyEdges.position.copy(bodyMesh.position);
      vehicleGroup.add(bodyEdges);

      // Cabin / Roof
      const cabinGeo = new THREE.BoxGeometry(10.5, 4.0, 14);
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, metalness: 0.9, roughness: 0.1 });
      const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
      cabinMesh.position.set(0, 7.2, -1.5);
      vehicleGroup.add(cabinMesh);

      // Tinted Windshield
      const windshieldGeo = new THREE.BoxGeometry(10.2, 3.4, 0.4);
      const windshieldMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.05, metalness: 0.95, transparent: true, opacity: 0.7 });
      const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
      windshield.rotation.x = Math.PI / 4;
      windshield.position.set(0, 6.6, 6.2);
      vehicleGroup.add(windshield);

      // Front Headlights
      [-4.5, 4.5].forEach(hx => {
        const hlGeo = new THREE.BoxGeometry(2.0, 1.0, 0.5);
        const hl = new THREE.Mesh(hlGeo, new THREE.MeshBasicMaterial({ color: 0xF8FAFC }));
        hl.position.set(hx, 3.5, 13.1);
        vehicleGroup.add(hl);
      });

      // 4 Wheels with Alloy Rims
      const wheelPos = [
        [-6.2, 2.4, 8], [6.2, 2.4, 8],
        [-6.2, 2.4, -8], [6.2, 2.4, -8]
      ];
      wheelPos.forEach(([wx, wy, wz]) => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(wx, wy, wz);

        const tireGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.6, 16);
        const tire = new THREE.Mesh(tireGeo, new THREE.MeshStandardMaterial({ color: 0x090D16, roughness: 0.9 }));
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        wheelGroup.add(tire);

        const rimGeo = new THREE.CylinderGeometry(1.4, 1.4, 1.65, 8);
        const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.9, roughness: 0.2 }));
        rim.rotation.z = Math.PI / 2;
        wheelGroup.add(rim);

        vehicleGroup.add(wheelGroup);
        wheelsList.push(wheelGroup);
      });

      // Front HSRP License Plate
      const plateGeo = new THREE.PlaneGeometry(5.2, 1.4);
      const plateTexture = createHSRPPlateTexture(activeTargetPlate, isCommercial, false);
      const plateMat = new THREE.MeshBasicMaterial({ map: plateTexture, side: THREE.FrontSide });
      const plateMesh = new THREE.Mesh(plateGeo, plateMat);
      plateMesh.position.set(0, 2.6, 13.35);
      plateMeshRef.current = plateMesh;
      vehicleGroup.add(plateMesh);
    }

    wheelsRef.current = wheelsList;

    // Laser Reticle & Scanline
    const scanPlaneGeo = new THREE.PlaneGeometry(is2W ? 3.6 : 5.2, 0.15);
    const scanPlaneMat = new THREE.MeshBasicMaterial({ color: 0x10B981, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const scanPlane = new THREE.Mesh(scanPlaneGeo, scanPlaneMat);
    scanPlane.position.set(0, is2W ? 3.8 : 2.6, is2W ? 6.85 : 13.4);
    scanPlaneRef.current = scanPlane;
    vehicleGroup.add(scanPlane);

    // 10. Dynamic Volumetric Optical Projection Cone & Laser Sight Ray
    const frustumGeo = new THREE.ConeGeometry(14, 52, 4, 1, true);
    const frustumMat = new THREE.MeshBasicMaterial({
      color: 0x00A8FF,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const opticalCone = new THREE.Mesh(frustumGeo, frustumMat);
    opticalConeRef.current = opticalCone;
    scene.add(opticalCone);

    // Central Laser Raycast Beam (Dynamically links camera to moving plate)
    const laserRayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-6, 31.8, 3.4),
      new THREE.Vector3(-6, is2W ? 3.8 : 2.6, 48)
    ]);
    const laserRayMat = new THREE.LineBasicMaterial({ color: 0x10B981, linewidth: 2, transparent: true, opacity: 0.85 });
    const laserRay = new THREE.Line(laserRayGeo, laserRayMat);
    raycastLineRef.current = laserRay;
    scene.add(laserRay);

    // 11. Physics & Animation Loop (Live Vehicle Movement)
    let animId;
    let clock = new THREE.Clock();
    let currentZ = 75; // Starting position up the road

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update Vehicle Movement down the highway
      if (isPlaying) {
        const speedMultiplier = simSpeed * 22; // units per second
        currentZ -= delta * speedMultiplier;

        // Reset loop when car passes through gantry
        if (currentZ < -45) {
          currentZ = 75;
        }
        setVehicleZPos(Math.round(currentZ));
      }

      if (vehicleGroupRef.current) {
        vehicleGroupRef.current.position.z = currentZ;

        // Wheel Rotation Animation (Proportional to forward travel)
        if (isPlaying && wheelsRef.current.length > 0) {
          const rotationSpeed = (delta * simSpeed * 22) / 2.4;
          wheelsRef.current.forEach(w => {
            w.rotation.x -= rotationSpeed;
          });
        }
      }

      // Plate Target World Position
      const plateZOffset = is2W ? 6.8 : 13.35;
      const plateY = is2W ? 3.8 : 2.6;
      const currentPlateWorld = new THREE.Vector3(-6, plateY, currentZ + plateZOffset);
      const camWorldOrigin = new THREE.Vector3(-6, 31.8, 3.4);

      // Laser Beam updates to moving target
      if (raycastLineRef.current) {
        const positions = raycastLineRef.current.geometry.attributes.position;
        positions.setXYZ(0, camWorldOrigin.x, camWorldOrigin.y, camWorldOrigin.z);
        positions.setXYZ(1, currentPlateWorld.x, currentPlateWorld.y, currentPlateWorld.z);
        positions.needsUpdate = true;
        raycastLineRef.current.material.opacity = 0.5 + 0.5 * Math.sin(elapsedTime * 6);
      }

      // Optical Frustum Cone aligns with moving vehicle
      if (opticalConeRef.current) {
        const midPoint = new THREE.Vector3().addVectors(camWorldOrigin, currentPlateWorld).multiplyScalar(0.5);
        opticalConeRef.current.position.copy(midPoint);
        opticalConeRef.current.lookAt(currentPlateWorld);
        opticalConeRef.current.rotation.x -= Math.PI / 2;
      }

      // ANPR Optical Trigger Flash Zone ($Z \in [20, 36]$)
      const inTriggerZone = currentZ >= 18 && currentZ <= 38;
      setStrobeActive(inTriggerZone);
      if (strobeLightRef.current) {
        strobeLightRef.current.intensity = inTriggerZone ? (Math.sin(elapsedTime * 24) > 0 ? 8.0 : 0.5) : 0;
      }

      // Plate scanline sweep
      if (scanPlaneRef.current) {
        scanPlaneRef.current.position.y = (is2W ? 3.8 : 2.6) + Math.sin(elapsedTime * 8) * 0.4;
      }

      controls.autoRotate = isAutoRotate;
      controls.autoRotateSpeed = 1.2;
      controls.update();

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [is2W, isCommercial, activeTargetPlate, isPlaying, simSpeed]);

  // View Presets Handler
  const setCameraPreset = (preset) => {
    setViewPreset(preset);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    switch (preset) {
      case 'iso':
        cam.position.set(55, 38, 75);
        ctrl.target.set(0, 10, 15);
        break;
      case 'cockpit':
        cam.position.set(-6, 5, 55);
        ctrl.target.set(-6, 32, 2);
        break;
      case 'boresight':
        cam.position.set(-6, 34, 4);
        ctrl.target.set(-6, 2.6, 30);
        break;
      case 'topdown':
        cam.position.set(0, 95, 20);
        ctrl.target.set(0, 0, 20);
        break;
      default:
        break;
    }
    ctrl.update();
  };

  return (
    <div className="relative w-full h-[530px] rounded-none overflow-hidden border border-[#262933] bg-[#0A0B0E] font-mono select-none">
      {/* Top Diagnostics Header */}
      <div className="absolute top-2 left-2 right-2 z-20 flex flex-wrap items-center justify-between gap-2 p-2 bg-[#13151B]/95 border border-[#262933] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-none ${strobeActive ? 'bg-[#FF334B] animate-ping' : 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.8)]'}`} />
          <span className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">
            ANPR HARDWARE TWIN // {is2W ? '2-WHEELER (MCWG)' : '4-WHEELER (LMV)'}
          </span>
          {strobeActive && (
            <span className="text-[10px] bg-[#FF334B] text-[#FFFFFF] px-1.5 py-0.2 font-bold animate-pulse">
              ANPR OPTICAL TRIGGER
            </span>
          )}
        </div>

        {/* Vehicle Class Selector */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setVehicleType('car')}
            className={`px-2.5 py-1 text-[10px] border rounded-none flex items-center gap-1.5 cursor-pointer transition-all ${
              !is2W
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${!is2W ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            <Car className="w-3 h-3" />
            4-WHEELER (CAR)
          </button>
          <button
            onClick={() => setVehicleType('bike')}
            className={`px-2.5 py-1 text-[10px] border rounded-none flex items-center gap-1.5 cursor-pointer transition-all ${
              is2W
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${is2W ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            <Bike className="w-3 h-3" />
            2-WHEELER (BIKE)
          </button>
        </div>

        {/* View Angles */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setCameraPreset('iso')}
            className={`px-2 py-1 text-[10px] border rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
              viewPreset === 'iso'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${viewPreset === 'iso' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            ISO 3D
          </button>
          <button
            onClick={() => setCameraPreset('cockpit')}
            className={`px-2 py-1 text-[10px] border rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
              viewPreset === 'cockpit'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${viewPreset === 'cockpit' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            COCKPIT
          </button>
          <button
            onClick={() => setCameraPreset('boresight')}
            className={`px-2 py-1 text-[10px] border rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
              viewPreset === 'boresight'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${viewPreset === 'boresight' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            BORESIGHT
          </button>
          <button
            onClick={() => setCameraPreset('topdown')}
            className={`px-2 py-1 text-[10px] border rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
              viewPreset === 'topdown'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${viewPreset === 'topdown' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            TOP-DOWN
          </button>
        </div>
      </div>

      {/* Floating Movement Control Bar (Bottom-Center) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-[#13151B]/95 border border-[#262933] p-2 flex items-center gap-3 backdrop-blur-sm text-xs shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-3 py-1.5 font-bold text-xs tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer border ${
            isPlaying
              ? 'bg-[#252A34] text-[#FFFFFF] border-[#10B981] shadow-[inset_0_0_8px_rgba(16,185,129,0.15)]'
              : 'bg-[#1A1D24] hover:bg-[#252A34] text-[#FFFFFF] border-[#374151] hover:border-[#F59E0B]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${isPlaying ? 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.9)]' : 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]'}`} />
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#10B981]" /> : <Play className="w-3.5 h-3.5 text-[#F59E0B]" />}
          <span>{isPlaying ? 'PAUSE' : 'DRIVE'}</span>
        </button>

        {/* Speed Multiplier */}
        <div className="flex items-center gap-1 border-l border-r border-[#262933] px-2">
          <span className="text-[10px] text-[#CBD5E1]">SPEED:</span>
          {[0.5, 1.0, 2.0].map(s => (
            <button
              key={s}
              onClick={() => setSimSpeed(s)}
              className={`px-2 py-0.5 text-[10px] border rounded-none cursor-pointer transition-all ${
                simSpeed === s
                  ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B]'
                  : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Transit Distance Position Indicator */}
        <div className="text-[10px] text-[#CBD5E1] flex items-center gap-1.5">
          <span>GANTRY DISTANCE:</span>
          <span className="text-[#10B981] font-bold">{Math.max(0, vehicleZPos)} m</span>
        </div>
      </div>

      {/* Target Plate Telemetry HUD (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-20 bg-[#13151B]/95 border border-[#262933] p-2.5 text-xs backdrop-blur-sm space-y-1 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="text-[10px] text-[#CBD5E1] uppercase">TARGET:</span>
          <span className="text-sm font-black text-[#FFFFFF] tracking-wider font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {activeTargetPlate}
          </span>
          <span className={`text-[9px] px-1 py-0.2 font-bold ${
            is2W 
              ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40' 
              : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
          }`}>
            {is2W ? '2-WHEELER' : '4-WHEELER'}
          </span>
        </div>
        <div className="text-[10px] text-[#CBD5E1] flex items-center gap-2">
          <span>Laser Lock: <strong className="text-[#10B981]">ACTIVE</strong></span>
          <span>•</span>
          <span>Camera Mount: <strong className="text-[#FFFFFF]">38.4° Pitch</strong></span>
        </div>
      </div>

      {/* Three.js Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
