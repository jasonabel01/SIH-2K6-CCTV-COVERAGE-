import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Radio, 
  Clock, 
  MapPin, 
  Gauge, 
  Video, 
  Compass, 
  Crosshair, 
  Eye, 
  Zap, 
  Volume2, 
  VolumeX,
  Camera,
  Car,
  Move3d,
  MousePointer,
  X,
  Shield,
  ZoomIn,
  FileText,
  ExternalLink
} from 'lucide-react';

/**
 * Route3DSimulator - Defense-Grade 3D Highway Corridor & Real Cloned Vehicle Tracker
 * 
 * Implemented using:
 *  - threejs-skills & threejs-fundamentals: Single-instantiation WebGL architecture with 60 FPS animation loop.
 *  - threejs-interaction: Raycasting mouse tracking, 3D cursor crosshairs, and free 360° orbital control.
 *  - threejs-geometry & threejs-materials: Compound realistic vehicle models, spinning rubber tires with alloy rims,
 *    and authentic CanvasTexture Indian HSRP license plates (IND blue bar + Ashok Chakra).
 *  - threejs-lighting: Directional sun/moon shadow casting, 4000K warm LED headlights with forward beam cones, and gantry optical strobes.
 *  - UI/UX & Defense C4ISR Standard: Strict Charcoal (#0A0B0E), Slate Gunmetal (#1A1D24), Tactical Amber (#F59E0B), Crimson (#EF4444).
 */

// Helper to generate realistic high-resolution Indian High Security Registration Plate (HSRP)
function createHSRPPlateTexture(plateNumber) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // White reflective base
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 512, 128);

  // Outer border
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 120);

  // Left Blue 'IND' country bar
  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(4, 4, 68, 120);

  // Hologram Ashok Chakra circle
  ctx.strokeStyle = '#60A5FA';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(38, 48, 18, 0, Math.PI * 2);
  ctx.stroke();

  // 'IND' Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IND', 38, 96);

  // License plate text in bold Indian RTO font
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(plateNumber, 290, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// Builds a realistic 3D vehicle with body, cabin, wheels, headlights, and front/rear HSRP plates
function buildRealisticCarMesh({ bodyColor = 0x1E222B, plateNumber = 'HR 26 DQ 5521', isClone = false }) {
  const carGroup = new THREE.Group();

  // 1. Chassis / Lower Body
  const chassisGeo = new THREE.BoxGeometry(4.2, 1.3, 8.8);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    metalness: 0.8,
    roughness: 0.25
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 1.1;
  chassis.castShadow = true;
  carGroup.add(chassis);

  // Front Hood Slant
  const hoodGeo = new THREE.BoxGeometry(4.0, 0.6, 2.6);
  const hood = new THREE.Mesh(hoodGeo, chassisMat);
  hood.position.set(0, 1.5, 2.9);
  carGroup.add(hood);

  // 2. Cabin / Greenhouse with Tinted Glass
  const cabinGeo = new THREE.BoxGeometry(3.6, 1.4, 4.4);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0A0B0E,
    metalness: 0.95,
    roughness: 0.1,
    transparent: true,
    opacity: 0.92
  });
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 2.2, -0.4);
  cabin.castShadow = true;
  carGroup.add(cabin);

  // 3. Front Grille
  const grilleGeo = new THREE.BoxGeometry(3.0, 0.6, 0.2);
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.6 });
  const grille = new THREE.Mesh(grilleGeo, grilleMat);
  grille.position.set(0, 1.0, 4.42);
  carGroup.add(grille);

  // 4. Wheels with Realistic Rubber Tires and Silver Rims
  const wheels = [];
  const wheelPositions = [
    [-2.1, 0.8, 2.5],
    [2.1, 0.8, 2.5],
    [-2.1, 0.8, -2.5],
    [2.1, 0.8, -2.5]
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wx, wy, wz);

    // Rubber Tire
    const tireGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    // Silver Alloy Rim
    const rimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.62, 12);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xD1D5DB, metalness: 0.9, roughness: 0.2 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    carGroup.add(wheelGroup);
    wheels.push(wheelGroup);
  });

  // 5. Authentic HSRP Number Plates (Front & Rear)
  const plateTexture = createHSRPPlateTexture(plateNumber);
  const plateGeo = new THREE.PlaneGeometry(1.8, 0.5);
  const plateMat = new THREE.MeshBasicMaterial({ map: plateTexture, side: THREE.DoubleSide });

  // Front Plate
  const frontPlate = new THREE.Mesh(plateGeo, plateMat);
  frontPlate.position.set(0, 0.7, 4.43);
  carGroup.add(frontPlate);

  // Rear Plate
  const rearPlate = new THREE.Mesh(plateGeo, plateMat);
  rearPlate.rotation.y = Math.PI;
  rearPlate.position.set(0, 0.9, -4.43);
  carGroup.add(rearPlate);

  // 6. Projector Headlights (4000K Warm White)
  [-1.4, 1.4].forEach(hx => {
    const hlLens = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.3, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xFFF5E0 })
    );
    hlLens.position.set(hx, 1.2, 4.41);
    carGroup.add(hlLens);

    // Forward Light Beam Cone
    const beamGeo = new THREE.CylinderGeometry(0.15, 2.0, 16, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xFFF5E0,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.x = Math.PI / 2;
    beam.position.set(hx, 1.2, 11);
    carGroup.add(beam);

    // Forward Spotlight for ground illumination
    const spot = new THREE.SpotLight(0xFFF5E0, 2.8, 30, Math.PI / 6, 0.4, 1);
    spot.position.set(hx, 1.2, 4.5);
    spot.target.position.set(hx, 0, 20);
    carGroup.add(spot);
    carGroup.add(spot.target);
  });

  // 7. Red LED Taillights
  [-1.4, 1.4].forEach(tx => {
    const tlLens = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.25, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xEF4444 })
    );
    tlLens.position.set(tx, 1.2, -4.41);
    carGroup.add(tlLens);
  });

  // 8. Overhead Tactical HUD Tag Sprite
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 320;
  badgeCanvas.height = 72;
  const bCtx = badgeCanvas.getContext('2d');
  bCtx.fillStyle = isClone ? '#EF4444' : '#10B981';
  bCtx.fillRect(0, 0, 320, 72);
  bCtx.strokeStyle = '#FFFFFF';
  bCtx.lineWidth = 4;
  bCtx.strokeRect(2, 2, 316, 68);
  bCtx.fillStyle = '#FFFFFF';
  bCtx.font = 'bold 24px monospace';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.fillText(isClone ? `[CLONE] ${plateNumber}` : `[TARGET] ${plateNumber}`, 160, 36);

  const badgeSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(badgeCanvas) })
  );
  badgeSprite.position.set(0, 5.4, 0);
  badgeSprite.scale.set(9.5, 2.2, 1);
  carGroup.add(badgeSprite);

  return { 
    carGroup, 
    wheels, 
    frontPlate, 
    rearPlate, 
    badgeSprite,
    updatePlate: (newPlate) => {
      const newTexture = createHSRPPlateTexture(newPlate);
      frontPlate.material.map = newTexture;
      frontPlate.material.needsUpdate = true;
      rearPlate.material.map = newTexture;
      rearPlate.material.needsUpdate = true;

      // Update HUD badge
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 320;
      bCanvas.height = 72;
      const ctx = bCanvas.getContext('2d');
      ctx.fillStyle = isClone ? '#EF4444' : '#10B981';
      ctx.fillRect(0, 0, 320, 72);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 316, 68);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isClone ? `[CLONE] ${newPlate}` : `[TARGET] ${newPlate}`, 160, 36);
      badgeSprite.material.map = new THREE.CanvasTexture(bCanvas);
      badgeSprite.material.needsUpdate = true;
    }
  };
}

export default function Route3DSimulator({ 
  activePlate = 'HR 26 DQ 5521',
  isAnomalyActive = false,
  onToggleAnomaly 
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);

  // References to vehicles and animated elements
  const vehicleARef = useRef(null);
  const vehicleBRef = useRef(null);
  const vehicleAObjRef = useRef(null);
  const vehicleBObjRef = useRef(null);
  const wheelsARef = useRef([]);
  const wheelsBRef = useRef([]);
  
  // Tactical Red Light Ray Elements
  const threatRayGroupRef = useRef(null);
  const threatCoreBeamRef = useRef(null);
  const threatDashedRayRef = useRef(null);
  const threatApexLightRef = useRef(null);
  const threatBadgeRef = useRef(null);
  
  const gantryStrobesRef = useRef([]);
  const cursorRingRef = useRef(null);

  // Spline Curves for Route A and Route B
  const curveARef = useRef(null);
  const curveBRef = useRef(null);

  // Animation Progress Tracker (0 to 1)
  const progressRef = useRef(0.15);
  const [progressState, setProgressState] = useState(15);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [activeCamIndex, setActiveCamIndex] = useState(0);

  // Strict Default: Hidden by default! Only shows when user clicks "TRIGGER CLONED ANOMALY"
  const [clonedAlertActive, setClonedAlertActive] = useState(isAnomalyActive || false);
  const clonedAlertRef = useRef(isAnomalyActive || false);
  const [cameraView, setCameraView] = useState('free'); // 'free' | 'chaseA' | 'chaseB' | 'gantry' | 'overhead'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cursorCoords, setCursorCoords] = useState({ x: 0, z: 0 });
  const [hoveredObject, setHoveredObject] = useState(null);
  const [pcrDispatched, setPcrDispatched] = useState(false);
  const [evidenceZoomImage, setEvidenceZoomImage] = useState(null);

  // Synchronize with isAnomalyActive prop if controlled from parent
  useEffect(() => {
    if (isAnomalyActive !== undefined) {
      setClonedAlertActive(isAnomalyActive);
      clonedAlertRef.current = isAnomalyActive;
      if (vehicleBRef.current) vehicleBRef.current.visible = isAnomalyActive;
      if (threatRayGroupRef.current) threatRayGroupRef.current.visible = isAnomalyActive;
    }
  }, [isAnomalyActive]);

  // Synchronize clonedAlertRef with state and 3D object visibility
  useEffect(() => {
    clonedAlertRef.current = clonedAlertActive;
    if (vehicleBRef.current) vehicleBRef.current.visible = clonedAlertActive;
    if (threatRayGroupRef.current) threatRayGroupRef.current.visible = clonedAlertActive;
  }, [clonedAlertActive]);

  // Synchronize plates on vehicles when activePlate changes
  useEffect(() => {
    if (vehicleAObjRef.current?.updatePlate) {
      vehicleAObjRef.current.updatePlate(activePlate);
    }
    if (vehicleBObjRef.current?.updatePlate) {
      vehicleBObjRef.current.updatePlate(activePlate);
    }
  }, [activePlate]);

  // 4 Delhi NCR Highway Gantries
  const checkpoints = [
    { 
      id: 'CAM_DEL_DND_01', 
      name: 'DND Toll Plaza (Delhi Inbound)', 
      location: 'DND Flyway Corridor',
      time: '14:02:15', 
      speed: '68 km/h', 
      conf: 99.4,
      threshold: 0.12,
      pos: new THREE.Vector3(-75, 0, 42),
      lane: 'Expressway Gantry 1'
    },
    { 
      id: 'CAM_DEL_ASHRAM_07', 
      name: 'Ashram Chowk Elevated Flyover', 
      location: 'Ring Road Arterial',
      time: '14:05:40', 
      speed: '61 km/h', 
      conf: 98.2,
      threshold: 0.38,
      pos: new THREE.Vector3(-22, 10, 14),
      lane: 'Elevated Deck Lane 2'
    },
    { 
      id: 'CAM_DEL_CP_OUTER_19', 
      name: 'Connaught Place Outer Circle', 
      location: 'Barakhamba Radial Junction',
      time: '14:09:10', 
      speed: '48 km/h', 
      conf: 97.9,
      threshold: 0.65,
      pos: new THREE.Vector3(28, 0, -18),
      lane: 'Inbound Sector A'
    },
    { 
      id: 'CAM_DEL_IGI_T3_29', 
      name: 'IGI Airport Terminal 3 Gantry', 
      location: 'Airport Express Corridor',
      time: '14:12:00', 
      speed: '75 km/h', 
      conf: 98.7,
      threshold: 0.90,
      pos: new THREE.Vector3(78, 0, -45),
      lane: 'Aviation Perimeter'
    }
  ];

  // Tactical Web Audio Siren
  const playTacticalAlarmSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  };

  // Initialize Three.js Scene ONCE
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 440;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0A0B0E);
    scene.fog = new THREE.FogExp2(0x0A0B0E, 0.0032);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 85, 130);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls with Free Mouse Movement
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 15;
    controls.maxDistance = 300;
    controls.target.set(0, 4, 0);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x2A303C, 2.2);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xE5E7EB, 2.5);
    sun.position.set(80, 110, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);

    // 6. Tactical Ground Grid
    const groundGrid = new THREE.GridHelper(300, 60, 0x374151, 0x1A1D24);
    groundGrid.position.y = -0.05;
    scene.add(groundGrid);

    // 7. Route A Spline Curve (Primary Highway)
    const curveA = new THREE.CatmullRomCurve3([
      checkpoints[0].pos,
      new THREE.Vector3(-50, 5, 28),
      checkpoints[1].pos,
      new THREE.Vector3(4, 5, -2),
      checkpoints[2].pos,
      new THREE.Vector3(52, 0, -32),
      checkpoints[3].pos
    ]);
    curveARef.current = curveA;

    // Route B Spline Curve (Intersecting / Parallel Arterial Corridor for Cloned Vehicle)
    const curveB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(75, 0, 50),
      new THREE.Vector3(40, 6, 25),
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(-40, 6, -25),
      new THREE.Vector3(-75, 0, -50)
    ]);
    curveBRef.current = curveB;

    // Highway Asphalt Mesh A
    const roadAGeo = new THREE.TubeGeometry(curveA, 140, 3.8, 8, false);
    const roadAMat = new THREE.MeshStandardMaterial({ color: 0x14171F, roughness: 0.85, metalness: 0.15 });
    const roadAMesh = new THREE.Mesh(roadAGeo, roadAMat);
    roadAMesh.receiveShadow = true;
    scene.add(roadAMesh);

    // Highway Asphalt Mesh B
    const roadBGeo = new THREE.TubeGeometry(curveB, 100, 3.8, 8, false);
    const roadBMat = new THREE.MeshStandardMaterial({ color: 0x181C26, roughness: 0.85, metalness: 0.15 });
    const roadBMesh = new THREE.Mesh(roadBGeo, roadBMat);
    roadBMesh.receiveShadow = true;
    scene.add(roadBMesh);

    // Centerline Lane Divider Strips
    const lineAGeo = new THREE.TubeGeometry(curveA, 140, 0.25, 4, false);
    const lineAMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.8 });
    const lineA = new THREE.Mesh(lineAGeo, lineAMat);
    scene.add(lineA);

    const lineBGeo = new THREE.TubeGeometry(curveB, 100, 0.25, 4, false);
    const lineBMat = new THREE.MeshBasicMaterial({ color: 0x10B981, transparent: true, opacity: 0.7 });
    const lineB = new THREE.Mesh(lineBGeo, lineBMat);
    scene.add(lineB);

    // Flyover Concrete Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9 });
    for (let t = 0.2; t <= 0.6; t += 0.08) {
      const ptA = curveA.getPoint(t);
      if (ptA.y > 1.5) {
        const pillarGeo = new THREE.CylinderGeometry(1.2, 1.4, ptA.y, 8);
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(ptA.x, ptA.y / 2, ptA.z);
        scene.add(pillar);
      }
    }

    // 8. Overhead Camera Gantries with Optical Strobes
    const strobes = [];
    checkpoints.forEach((cp) => {
      const gantry = new THREE.Group();
      gantry.position.copy(cp.pos);

      // Columns
      [-5.5, 5.5].forEach(sideOffset => {
        const colGeo = new THREE.CylinderGeometry(0.5, 0.6, 15, 8);
        const colMat = new THREE.MeshStandardMaterial({ color: 0x1F2937, metalness: 0.85 });
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(sideOffset, 7.5, 0);
        gantry.add(col);
      });

      // Overhead Beam
      const beamGeo = new THREE.BoxGeometry(12, 1.2, 1.4);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 14.5, 0);
      gantry.add(beam);

      // Camera Sensor Pod
      const podGeo = new THREE.BoxGeometry(1.8, 1.0, 2.2);
      const podMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 });
      const pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(0, 13.6, 0);
      gantry.add(pod);

      // Status Green LED
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x10B981 })
      );
      led.position.set(0, 13.6, 1.2);
      pod.add(led);

      // Optical Strobe Flash Light
      const strobe = new THREE.PointLight(0xFFFFFF, 0, 40);
      strobe.position.set(0, 13.0, 0);
      gantry.add(strobe);
      strobes.push(strobe);

      scene.add(gantry);
    });
    gantryStrobesRef.current = strobes;

    // 9. Build Realistic Target Vehicle A
    const carAObj = buildRealisticCarMesh({
      bodyColor: 0x1E222B, // Dark Gunmetal SUV
      plateNumber: activePlate,
      isClone: false
    });
    const carA = carAObj.carGroup;
    vehicleARef.current = carA;
    vehicleAObjRef.current = carAObj;
    wheelsARef.current = carAObj.wheels;
    scene.add(carA);

    // 10. Build Real Cloned Vehicle B (Simultaneously driving with IDENTICAL plate!)
    const carBObj = buildRealisticCarMesh({
      bodyColor: 0xE2E8F0, // Pearl Silver Sedan
      plateNumber: activePlate,
      isClone: true
    });
    const carB = carBObj.carGroup;
    carB.visible = false; // Strictly hidden by default until triggered!
    vehicleBRef.current = carB;
    vehicleBObjRef.current = carBObj;
    wheelsBRef.current = carBObj.wheels;
    scene.add(carB);

    // 11. Tactical Threat Red Light Ray System (Connects Vehicle A and Cloned Vehicle B)
    const threatRayGroup = new THREE.Group();
    threatRayGroup.visible = false; // Strictly hidden by default until triggered!
    threatRayGroupRef.current = threatRayGroup;
    scene.add(threatRayGroup);

    // 11a. Core High-Intensity Red Laser Beam Line
    const arcGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 20, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const coreBeamMat = new THREE.LineBasicMaterial({
      color: 0xFF2222,
      linewidth: 3
    });
    const coreBeam = new THREE.Line(arcGeo, coreBeamMat);
    threatRayGroup.add(coreBeam);
    threatCoreBeamRef.current = coreBeam;

    // 11b. Dynamic Dashed Threat Vector Arc
    const dashedRayMat = new THREE.LineDashedMaterial({
      color: 0xEF4444,
      dashSize: 3,
      gapSize: 1.5,
      linewidth: 3
    });
    const dashedRay = new THREE.Line(arcGeo.clone(), dashedRayMat);
    dashedRay.computeLineDistances();
    threatRayGroup.add(dashedRay);
    threatDashedRayRef.current = dashedRay;

    // 11c. Dynamic Crimson Apex Light (casts pulsating red alert glow onto the highway corridor)
    const threatApexLight = new THREE.PointLight(0xEF4444, 4.0, 70, 1.2);
    threatApexLight.position.set(0, 20, 0);
    threatRayGroup.add(threatApexLight);
    threatApexLightRef.current = threatApexLight;

    // 11d. Floating Threat Banner on Arc Apex
    const tBadgeCanvas = document.createElement('canvas');
    tBadgeCanvas.width = 460;
    tBadgeCanvas.height = 84;
    const tbCtx = tBadgeCanvas.getContext('2d');
    tbCtx.fillStyle = '#EF4444';
    tbCtx.fillRect(0, 0, 460, 84);
    tbCtx.strokeStyle = '#FFFFFF';
    tbCtx.lineWidth = 4;
    tbCtx.strokeRect(2, 2, 456, 80);
    tbCtx.fillStyle = '#FFFFFF';
    tbCtx.font = 'bold 22px monospace';
    tbCtx.textAlign = 'center';
    tbCtx.fillText('DEFCON 1: CLONED REGISTRATION', 230, 32);
    tbCtx.font = '15px monospace';
    tbCtx.fillText('24.6 KM APART | V > 2,000 KM/H (IMPOSSIBLE)', 230, 62);

    const threatBadge = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tBadgeCanvas) })
    );
    threatBadge.scale.set(16, 3.0, 1);
    threatBadge.position.set(0, 24, 0);
    threatRayGroup.add(threatBadge);
    threatBadgeRef.current = threatBadge;

    // 12. Movable 3D Tactical Cursor Ring (Follows mouse in real-time)
    const cursorGeo = new THREE.RingGeometry(3.0, 3.4, 32);
    const cursorMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const cursorRing = new THREE.Mesh(cursorGeo, cursorMat);
    cursorRing.rotation.x = -Math.PI / 2;
    cursorRing.position.y = 0.2;
    cursorRingRef.current = cursorRing;
    scene.add(cursorRing);

    // 13. Raycaster & Mouse Move Listener for Movable Cursor Movement
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        if (cursorRingRef.current) {
          cursorRingRef.current.position.x = intersection.x;
          cursorRingRef.current.position.z = intersection.z;
        }
        setCursorCoords({
          x: Math.round(intersection.x * 10) / 10,
          z: Math.round(intersection.z * 10) / 10
        });
      }
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 14. Smooth 60 FPS Render Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Update Vehicle A along Curve A
      if (curveARef.current && vehicleARef.current) {
        const uA = Math.max(0.001, Math.min(0.999, progressRef.current));
        const posA = curveARef.current.getPoint(uA);
        const tanA = curveARef.current.getTangent(uA);

        vehicleARef.current.position.copy(posA);
        vehicleARef.current.lookAt(posA.clone().add(tanA));

        // Spin wheels based on velocity
        wheelsARef.current.forEach(w => {
          w.rotation.x += delta * 18.0;
        });

        // Trigger Optical Gantry Strobes
        checkpoints.forEach((cp, idx) => {
          const dist = Math.abs(progressRef.current - cp.threshold);
          const strobe = gantryStrobesRef.current[idx];
          if (strobe) {
            if (dist < 0.025) {
              strobe.intensity = 10.0 * (Math.sin(elapsed * 40) > 0 ? 1 : 0.2);
            } else {
              strobe.intensity = 0;
            }
          }
        });
      }

      // Update Cloned Vehicle B and Tactical Red Light Ray ONLY if cloned alert is ACTIVE
      const isAlert = clonedAlertRef.current;
      if (vehicleBRef.current) vehicleBRef.current.visible = isAlert;
      if (threatRayGroupRef.current) threatRayGroupRef.current.visible = isAlert;

      if (isAlert) {
        // Update Cloned Vehicle B along Curve B (Offset position)
        if (curveBRef.current && vehicleBRef.current) {
          const uB = Math.max(0.001, Math.min(0.999, (progressRef.current + 0.35) % 1.0));
          const posB = curveBRef.current.getPoint(uB);
          const tanB = curveBRef.current.getTangent(uB);

          vehicleBRef.current.position.copy(posB);
          vehicleBRef.current.lookAt(posB.clone().add(tanB));

          wheelsBRef.current.forEach(w => {
            w.rotation.x += delta * 18.0;
          });
        }

        // Update Red Light Ray Vector Arc between Vehicle A and Vehicle B
        if (vehicleARef.current && vehicleBRef.current) {
          const pA = vehicleARef.current.position;
          const pB = vehicleBRef.current.position;

          const arcPoints = [];
          for (let i = 0; i <= 30; i++) {
            const t = i / 30;
            const x = pA.x + (pB.x - pA.x) * t;
            const z = pA.z + (pB.z - pA.z) * t;
            const y = Math.sin(t * Math.PI) * 28 + Math.max(pA.y, pB.y);
            arcPoints.push(new THREE.Vector3(x, y, z));
          }

          if (threatCoreBeamRef.current) {
            threatCoreBeamRef.current.geometry.setFromPoints(arcPoints);
          }
          if (threatDashedRayRef.current) {
            threatDashedRayRef.current.geometry.setFromPoints(arcPoints);
            threatDashedRayRef.current.computeLineDistances();
          }

          // Apex midpoint of the parabolic ray
          const midPt = arcPoints[15];

          // Center threat banner over the apex of the arc
          if (threatBadgeRef.current) {
            threatBadgeRef.current.position.set(midPt.x, midPt.y + 4.5, midPt.z);
          }

          // Crimson apex alert strobe light illuminating the highway corridor
          if (threatApexLightRef.current) {
            threatApexLightRef.current.position.set(midPt.x, midPt.y + 1.0, midPt.z);
            threatApexLightRef.current.intensity = 4.0 + Math.sin(elapsed * 8.0) * 2.5;
          }
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []); // Initialized ONCE

  // Simulation Timeline Loop (Smooth progress increments)
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        progressRef.current = (progressRef.current + 0.0025 * simSpeed) % 1.0;
        const pct = Math.round(progressRef.current * 100);
        setProgressState(pct);

        // Update active gantry index
        checkpoints.forEach((cp, idx) => {
          if (progressRef.current >= cp.threshold) {
            setActiveCamIndex(idx);
          }
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simSpeed]);

  // Handle Preset Views
  const setPreset = (preset) => {
    setCameraView(preset);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    switch (preset) {
      case 'evidence':
        // Forensic dual capture view active
        break;
      case 'free':
        cam.position.set(0, 85, 130);
        ctrl.target.set(0, 4, 0);
        break;
      case 'chaseA':
        if (vehicleARef.current) {
          const p = vehicleARef.current.position;
          cam.position.set(p.x, p.y + 12, p.z - 26);
          ctrl.target.copy(p);
        }
        break;
      case 'chaseB':
        if (vehicleBRef.current) {
          const p = vehicleBRef.current.position;
          cam.position.set(p.x, p.y + 12, p.z - 26);
          ctrl.target.copy(p);
        }
        break;
      case 'gantry':
        const gPos = checkpoints[activeCamIndex].pos;
        cam.position.set(gPos.x + 14, gPos.y + 18, gPos.z + 24);
        ctrl.target.copy(gPos);
        break;
      case 'overhead':
        cam.position.set(0, 160, 0);
        ctrl.target.set(0, 0, 0);
        break;
      default:
        break;
    }
    ctrl.update();
  };

  const currentCam = checkpoints[activeCamIndex] || checkpoints[0];

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#262933]">
        <div>
          <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#10B981]" />
            <span>3D HIGHWAY CORRIDOR // REAL CLONED VEHICLE TRACKER</span>
          </div>
          <div className="text-base font-bold text-[#FFFFFF] flex items-center gap-2 mt-0.5">
            <span>Spatial Trajectory Engine</span>
            <span className="text-[10px] bg-[#1A1D24] text-[#F59E0B] border border-[#F59E0B]/40 px-2 py-0.5 font-bold">
              APPROACHING: {currentCam.id}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 border rounded-none cursor-pointer transition-all ${
              soundEnabled
                ? 'bg-[#252A34] text-[#F59E0B] border-[#F59E0B]'
                : 'bg-[#1C1F26] text-[#CBD5E1] border-[#374151]'
            }`}
            title="Toggle Tactical Siren"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#F59E0B]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 font-bold text-xs rounded-none transition-all flex items-center gap-1.5 cursor-pointer border ${
              isPlaying
                ? 'bg-[#252A34] text-[#FFFFFF] border-[#10B981]'
                : 'bg-[#1C1F26] hover:bg-[#252A34] text-[#FFFFFF] border-[#374151]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${isPlaying ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              progressRef.current = 0;
              setProgressState(0);
              setActiveCamIndex(0);
            }}
            className="p-1.5 bg-[#1C1F26] hover:bg-[#252A34] text-[#CBD5E1] hover:text-[#FFFFFF] border border-[#374151] cursor-pointer"
            title="Reset to Gantry 01"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Trigger Cloned Anomaly */}
          <button
            onClick={() => {
              const nextVal = !clonedAlertActive;
              setClonedAlertActive(nextVal);
              clonedAlertRef.current = nextVal;
              if (vehicleBRef.current) vehicleBRef.current.visible = nextVal;
              if (threatRayGroupRef.current) threatRayGroupRef.current.visible = nextVal;
              if (onToggleAnomaly) onToggleAnomaly(nextVal);
              if (nextVal) {
                playTacticalAlarmSound();
              }
            }}
            className={`px-3 py-1.5 font-bold text-xs rounded-none border transition-all cursor-pointer flex items-center gap-1.5 ${
              clonedAlertActive
                ? 'bg-[#261618] text-[#EF4444] border-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-[#1C1F26] text-[#CBD5E1] border-[#374151] hover:text-[#EF4444]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>{clonedAlertActive ? 'CLONED ALERT ACTIVE' : 'TRIGGER CLONED ANOMALY'}</span>
          </button>
        </div>
      </div>

      {/* DEFCON 1 Cloned Registration Banner */}
      {clonedAlertActive && (
        <div className="p-3 bg-[#EF4444] text-[#FFFFFF] border border-[#EF4444] flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0A0B0E] border border-[#FFFFFF] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                DEFCON 1: PHYSICAL VELOCITY BREACH // CLONED REGISTRATION DETECTED
              </div>
              <div className="text-xs mt-0.5">
                Chassis A (White Hatchback) & Chassis B (White Ertiga MPV) BOTH displaying plate <strong className="underline">HR 26 DQ 5521</strong> simultaneously.
              </div>
              <div className="text-[11px] opacity-90 mt-0.5">
                • Spatial Separation: <strong>24.6 km</strong> | Implied Transit Velocity: <strong className="underline">2,108 km/h (PHYSICS VIOLATION)</strong>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setPreset('evidence')}
                  className="px-2.5 py-1 bg-[#0A0B0E] hover:bg-[#1A1D24] text-[#FFFFFF] border border-[#FFFFFF]/80 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>VIEW DUAL-LOCATION FEED EVIDENCE (2 NODES)</span>
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setClonedAlertActive(false);
              clonedAlertRef.current = false;
              if (vehicleBRef.current) vehicleBRef.current.visible = false;
              if (threatRayGroupRef.current) threatRayGroupRef.current.visible = false;
              if (onToggleAnomaly) onToggleAnomaly(false);
            }}
            className="px-3 py-1.5 bg-[#1C1F26] hover:bg-[#252A34] text-[#FFFFFF] border border-[#EF4444] text-xs font-bold shrink-0 cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 3D Viewport Stage */}
      <div className="relative w-full h-[440px] bg-[#0A0B0E] border border-[#262933] overflow-hidden select-none">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* View Preset Switcher */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[#13151B]/95 border border-[#262933] p-1 text-[10px]">
          <button
            onClick={() => setPreset('free')}
            className={`px-2 py-1 border cursor-pointer transition-all flex items-center gap-1 ${
              cameraView === 'free'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B]'
                : 'bg-[#1C1F26] text-[#CBD5E1] border-[#374151]'
            }`}
          >
            <Move3d className="w-3 h-3 text-[#F59E0B]" />
            FREE 360° ORBIT
          </button>
          <button
            onClick={() => setPreset('chaseA')}
            className={`px-2 py-1 border cursor-pointer transition-all flex items-center gap-1 ${
              cameraView === 'chaseA'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B]'
                : 'bg-[#1C1F26] text-[#CBD5E1] border-[#374151]'
            }`}
          >
            <Car className="w-3 h-3 text-[#10B981]" />
            CHASE TARGET A
          </button>
          <button
            onClick={() => setPreset('chaseB')}
            className={`px-2 py-1 border cursor-pointer transition-all flex items-center gap-1 ${
              cameraView === 'chaseB'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#EF4444]'
                : 'bg-[#1C1F26] text-[#CBD5E1] border-[#374151]'
            }`}
          >
            <Car className="w-3 h-3 text-[#EF4444]" />
            CHASE CLONE B
          </button>
          <button
            onClick={() => setPreset('gantry')}
            className={`px-2 py-1 border cursor-pointer transition-all flex items-center gap-1 ${
              cameraView === 'gantry'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B]'
                : 'bg-[#1C1F26] text-[#CBD5E1] border-[#374151]'
            }`}
          >
            <Camera className="w-3 h-3" />
            LOCK GANTRY
          </button>
          <button
            onClick={() => setPreset('overhead')}
            className={`px-2 py-1 border cursor-pointer transition-all flex items-center gap-1 ${
              cameraView === 'overhead'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B]'
                : 'bg-[#1C1F26] text-[#CBD5E1] border-[#374151]'
            }`}
          >
            <Compass className="w-3 h-3" />
            OVERHEAD PLAN
          </button>

          {/* Dual Sighting Evidence Option (Active when Cloned Anomaly is triggered) */}
          {clonedAlertActive && (
            <button
              onClick={() => setPreset(cameraView === 'evidence' ? 'free' : 'evidence')}
              className={`px-2.5 py-1 border cursor-pointer transition-all flex items-center gap-1.5 ${
                cameraView === 'evidence'
                  ? 'bg-[#261618] text-[#EF4444] font-bold border-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.7)] ring-1 ring-[#EF4444]'
                  : 'bg-[#1C1F26] text-[#EF4444] border-[#EF4444]/60 hover:bg-[#261618] animate-pulse'
              }`}
              title="Inspect optical evidence captured from two camera feeds with identical cloned plate"
            >
              <Camera className="w-3.5 h-3.5 text-[#EF4444]" />
              <span className="font-black">DUAL SIGHTING EVIDENCE</span>
            </button>
          )}
        </div>

        {/* Live Target Telemetry Overlay */}
        <div className="absolute top-2 left-2 z-20 bg-[#13151B]/95 border border-[#262933] p-2.5 text-xs space-y-1">
          <div className="text-[10px] text-[#CBD5E1] uppercase flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-[#10B981]" />
            <span>AUTHENTIC HSRP PLATE: <strong className="text-[#FFFFFF]">{activePlate}</strong></span>
          </div>
          <div className="text-[11px] text-[#CBD5E1]">
            Next Gantry: <span className="text-[#FFFFFF] font-bold">{currentCam.name}</span>
          </div>
          <div className="text-[11px] text-[#CBD5E1]">
            Segment Speed: <span className="text-[#10B981] font-bold">{currentCam.speed}</span> | Progress: <span className="text-[#FFFFFF] font-bold">{progressState}%</span>
          </div>
        </div>

        {/* Cursor Coordinates Strip (Movable Cursor Movement) */}
        <div className="absolute bottom-12 left-2 z-20 bg-[#13151B]/90 border border-[#262933] px-2 py-1 text-[10px] text-[#CBD5E1] flex items-center gap-2">
          <MousePointer className="w-3 h-3 text-[#F59E0B]" />
          <span>3D TACTICAL CURSOR:</span>
          <span className="text-[#FFFFFF] font-bold">X: {cursorCoords.x}m, Z: {cursorCoords.z}m</span>
          <span className="text-[#374151]">|</span>
          <span className="text-[#10B981]">DRAG MOUSE TO ORBIT 360°</span>
        </div>

        {/* Timeline Scrubber */}
        <div className="absolute bottom-2 left-2 right-2 z-20 bg-[#13151B]/95 border border-[#262933] p-2 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#FFFFFF] font-bold text-[11px]">
            <Clock className="w-3.5 h-3.5 text-[#CBD5E1]" />
            <span>PROGRESS:</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={progressState}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              progressRef.current = val / 100.0;
              setProgressState(val);
            }}
            className="flex-1 h-1.5 bg-[#0A0B0E] rounded-none appearance-none cursor-pointer accent-[#F59E0B] border border-[#262933]"
          />
          <span className="text-[11px] font-bold text-[#FFFFFF]">
            {progressState}% // {currentCam.time}
          </span>
          <div className="flex items-center gap-1 border-l border-[#262933] pl-2">
            {[1.0, 2.0].map(s => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-2 py-0.5 text-[9px] border cursor-pointer ${
                  simSpeed === s 
                    ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B]' 
                    : 'bg-[#1C1F26] text-[#CBD5E1] border-[#374151]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* ================= DUAL SIGHTING EVIDENCE OVERLAY ================= */}
        {cameraView === 'evidence' && (
          <div className="absolute inset-0 z-30 bg-[#0A0B0E]/95 backdrop-blur-md p-3 overflow-y-auto font-mono flex flex-col justify-between border border-[#EF4444]/70 shadow-[inset_0_0_24px_rgba(239,68,68,0.25)]">
            {/* Top Evidence Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#262933]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#261618] border border-[#EF4444] flex items-center justify-center">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#EF4444] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>DEFCON 1 FORENSIC AUDIT</span>
                    <span className="text-[#374151]">•</span>
                    <span>SIMULTANEOUS 2-NODE ARTERIAL CAPTURE</span>
                  </div>
                  <div className="text-xs font-bold text-[#FFFFFF]">
                    TARGET REGISTRATION: <span className="text-[#EF4444] underline font-black">HR 26 DQ 5521</span> (Haryana / Gurugram Commercial RTO)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreset('chaseB')}
                  className="px-2.5 py-1 bg-[#1C1F26] hover:bg-[#252A34] text-[#CBD5E1] hover:text-[#FFFFFF] border border-[#374151] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Car className="w-3 h-3 text-[#EF4444]" />
                  CHASE CLONE B IN 3D
                </button>
                <button
                  onClick={() => setPreset('free')}
                  className="px-2.5 py-1 bg-[#261618] hover:bg-[#341C20] text-[#FFFFFF] border border-[#EF4444] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3 text-[#EF4444]" />
                  RETURN TO 3D VIEW
                </button>
              </div>
            </div>

            {/* Side-by-Side Dual Location Feed Capture Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
              {/* SIGHTING LOCATION 1: FEED 01 (DND TOLL PLAZA) */}
              <div className="bg-[#13151B] border border-[#262933] p-2 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#262933] text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#EF4444] animate-pulse" />
                    <span className="text-[#FFFFFF] font-bold">FEED 01: CAM_DEL_DND_01</span>
                  </div>
                  <span className="bg-[#261618] text-[#EF4444] px-1.5 py-0.5 border border-[#EF4444]/40 font-bold text-[9px]">
                    SIGHTING 1 // 14:02:15
                  </span>
                </div>

                {/* Captured Image with ANPR Target Reticle Overlay */}
                <div 
                  onClick={() => setEvidenceZoomImage('/evidence/dnd_toll_hr26_capture.jpg')}
                  className="relative aspect-video bg-[#000000] border border-[#374151] overflow-hidden group cursor-pointer"
                >
                  <img
                    src="/evidence/dnd_toll_hr26_capture.jpg"
                    alt="DND Toll Plaza Captured Feed"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-[#0A0B0E]/90 px-1.5 py-0.5 text-[8.5px] text-[#CBD5E1] border border-[#262933]">
                    OPTICAL 4K HIGHWAY PTZ // LANE 3
                  </div>
                  <div className="absolute top-1.5 right-1.5 bg-[#261618]/90 text-[#EF4444] px-1.5 py-0.5 text-[8.5px] font-bold border border-[#EF4444]/60">
                    75 km/h • FAST LANE
                  </div>
                  <div className="absolute inset-0 bg-[#000000]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="bg-[#0E1015]/90 text-[#FFFFFF] px-2 py-1 text-[9px] font-bold border border-[#EF4444] flex items-center gap-1">
                      <ZoomIn className="w-3 h-3 text-[#EF4444]" /> CLICK TO ENLARGE
                    </span>
                  </div>
                </div>

                {/* Sighting Metadata & HSRP Plate OCR */}
                <div className="mt-2 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between text-[#CBD5E1]">
                    <span className="text-[#F59E0B] font-bold">LOCATION:</span>
                    <span className="truncate text-[9.5px]">DND Expressway Km 2.4, Inbound Toll Plaza</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#CBD5E1]">VEHICLE CHASSIS:</span>
                    <span className="text-[#FFFFFF] font-bold">White Hatchback (Hyundai i20) • Chassis A (Target)</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#262933]/80">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-[#94A3B8]">HSRP OCR:</span>
                      <img
                        src="/evidence/hr26_plate_crop.jpg"
                        alt="OCR Crop"
                        className="h-5 border border-[#374151]"
                      />
                    </div>
                    <span className="text-[#10B981] font-bold text-[9px]">98.4% MATCH</span>
                  </div>
                </div>
              </div>

              {/* SIGHTING LOCATION 2: FEED 04 (IGI AIRPORT T3) */}
              <div className="bg-[#13151B] border border-[#262933] p-2 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#262933] text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#EF4444] animate-pulse" />
                    <span className="text-[#FFFFFF] font-bold">FEED 04: CAM_DEL_IGI_T3_29</span>
                  </div>
                  <span className="bg-[#261618] text-[#EF4444] px-1.5 py-0.5 border border-[#EF4444]/40 font-bold text-[9px]">
                    SIGHTING 2 // 14:02:57
                  </span>
                </div>

                {/* Captured Image with ANPR Target Reticle Overlay */}
                <div 
                  onClick={() => setEvidenceZoomImage('/evidence/igi_airport_hr26_capture.jpg')}
                  className="relative aspect-video bg-[#000000] border border-[#374151] overflow-hidden group cursor-pointer"
                >
                  <img
                    src="/evidence/igi_airport_hr26_capture.jpg"
                    alt="IGI Airport Captured Feed"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-[#0A0B0E]/90 px-1.5 py-0.5 text-[8.5px] text-[#CBD5E1] border border-[#262933]">
                    ELEVATED VIADUCT OPTICAL PTZ
                  </div>
                  <div className="absolute top-1.5 right-1.5 bg-[#261618]/90 text-[#EF4444] px-1.5 py-0.5 text-[8.5px] font-bold border border-[#EF4444]/60">
                    80 km/h • DEPARTURE
                  </div>
                  <div className="absolute inset-0 bg-[#000000]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="bg-[#0E1015]/90 text-[#FFFFFF] px-2 py-1 text-[9px] font-bold border border-[#EF4444] flex items-center gap-1">
                      <ZoomIn className="w-3 h-3 text-[#EF4444]" /> CLICK TO ENLARGE
                    </span>
                  </div>
                </div>

                {/* Sighting Metadata & HSRP Plate OCR */}
                <div className="mt-2 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between text-[#CBD5E1]">
                    <span className="text-[#10B981] font-bold">LOCATION:</span>
                    <span className="truncate text-[9.5px]">IGI Airport Terminal 3 Elevated Viaduct</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#CBD5E1]">VEHICLE CHASSIS:</span>
                    <span className="text-[#FFFFFF] font-bold">White MPV (Maruti Ertiga) • Chassis B (Clone)</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#262933]/80">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-[#94A3B8]">HSRP OCR:</span>
                      <img
                        src="/evidence/hr26_plate_crop.jpg"
                        alt="OCR Crop"
                        className="h-5 border border-[#374151]"
                      />
                    </div>
                    <span className="text-[#10B981] font-bold text-[9px]">97.9% MATCH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Forensic Physical Breach Analysis & Actions */}
            <div className="bg-[#0E1015] border border-[#262933] p-2.5 flex flex-wrap items-center justify-between gap-3 text-[10px]">
              <div className="flex flex-wrap items-center gap-4 text-[#CBD5E1]">
                <div>
                  <span className="text-[#94A3B8]">SPATIAL SEPARATION:</span>{' '}
                  <strong className="text-[#FFFFFF]">24.6 km</strong>
                </div>
                <div className="text-[#374151]">•</div>
                <div>
                  <span className="text-[#94A3B8]">TIME DELTA:</span>{' '}
                  <strong className="text-[#EF4444]">42.0 seconds</strong>
                </div>
                <div className="text-[#374151]">•</div>
                <div>
                  <span className="text-[#94A3B8]">CALCULATED VELOCITY:</span>{' '}
                  <strong className="text-[#EF4444] underline font-bold">2,108 km/h</strong>
                </div>
                <div className="text-[#374151]">•</div>
                <div className="text-[#EF4444] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  PHYSICAL LAW BREACH CONFIRMED
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPcrDispatched(true)}
                  className={`px-2.5 py-1 text-[10px] font-bold border cursor-pointer transition-all flex items-center gap-1 ${
                    pcrDispatched
                      ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
                      : 'bg-[#EF4444] hover:bg-[#DC2626] text-[#FFFFFF] border-[#EF4444]'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  {pcrDispatched ? 'PCR PATROL DISPATCHED (ETA 2.4 MIN)' : 'DISPATCH PCR PATROL UNIT 14'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* High-Resolution Forensic Inspection Lightbox Modal */}
        {evidenceZoomImage && (
          <div className="fixed inset-0 z-50 bg-[#000000]/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full bg-[#13151B] border border-[#EF4444] p-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262933]">
                <div className="text-xs font-bold text-[#FFFFFF] flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>FORENSIC HIGH-RESOLUTION SIGHTING CAPTURE // PLATE: {activePlate}</span>
                </div>
                <button
                  onClick={() => setEvidenceZoomImage(null)}
                  className="p-1 bg-[#1C1F26] hover:bg-[#252A34] text-[#FFFFFF] border border-[#374151] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img
                src={evidenceZoomImage}
                alt="Enlarged Evidence"
                className="w-full max-h-[70vh] object-contain border border-[#262933]"
              />
              <div className="mt-2 text-[10px] text-[#CBD5E1] flex items-center justify-between">
                <span>C4ISR SECURE DIGITAL EVIDENCE CHAIN • SHA-256 HASH VERIFIED</span>
                <span className="text-[#10B981] font-bold">DPDP ACT 2023 COMPLIANT RECORD</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4 Gantry Checkpoint Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {checkpoints.map((cp, idx) => {
          const isCurrent = activeCamIndex === idx;

          return (
            <div
              key={cp.id}
              className={`p-2 border rounded-none text-xs transition-all ${
                isCurrent
                  ? 'bg-[#1A1D24] border-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-[#13151B] border-[#262933]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#262933] pb-1 mb-1">
                <span className="text-[10px] font-bold text-[#FFFFFF]">{cp.id}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 ${isCurrent ? 'bg-[#F59E0B] text-[#0A0B0E]' : 'text-[#10B981]'}`}>
                  {isCurrent ? 'INTERCEPT' : 'ONLINE'}
                </span>
              </div>
              <div className="text-xs font-bold text-[#FFFFFF] truncate">{cp.name}</div>
              <div className="text-[10px] text-[#CBD5E1] mt-0.5">{cp.location}</div>
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-[#CBD5E1]">Speed: <strong className="text-[#10B981]">{cp.speed}</strong></span>
                <span className="text-[#CBD5E1]">Conf: <strong className="text-[#FFFFFF]">{cp.conf}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
