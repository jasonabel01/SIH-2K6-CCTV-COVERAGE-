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
  Car
} from 'lucide-react';

/**
 * Route3DSimulator (Elite Multi-Camera Live Passing Trajectory Engine)
 * 
 * Features:
 * 1. Clean open 3D urban highway corridor with elevated flyover and concrete gantry arches.
 * 2. Realistic vehicle driving through each camera gantry (CAM_01 -> CAM_02 -> CAM_03 -> CAM_04).
 * 3. Optical strobe flash & ANPR acquisition trigger at each camera as the vehicle passes.
 * 4. 4 Live CCTV PIP Camera Monitors along the bottom showing simulated camera view,
 *    plate recognition overlay, speed calculation, and timestamp.
 * 5. Refined volumetric blue headlights & luminous trailing light ribbon (sleek, not bulky).
 * 6. Synthesized Web Audio API military klaxon buzzer on Cloned Alert.
 */
export default function Route3DSimulator({ activePlate = 'RJ 14 CA 0639' }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const vehicleGroupRef = useRef(null);
  const ghostVehicleGroupRef = useRef(null);
  const splineCurveRef = useRef(null);
  const gantryStrobesRef = useRef([]);
  const animRef = useRef(null);

  // Simulation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(12); // 0 to 100%
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [activeCamIndex, setActiveCamIndex] = useState(0);
  const [clonedAlertActive, setClonedAlertActive] = useState(false);
  const [cameraView, setCameraView] = useState('iso'); // 'iso' | 'chase' | 'gantry' | 'overhead'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [capturedCams, setCapturedCams] = useState({ 0: true, 1: false, 2: false, 3: false });

  // Camera Checkpoint Nodes along Delhi Highway Corridor
  const checkpoints = [
    { 
      id: 'CAM_01', 
      name: 'DND Expressway Toll Gantry', 
      location: 'DND Flyway, Delhi NCR',
      time: '14:02:15', 
      speed: '68 km/h', 
      speedVal: 68,
      conf: 99.4,
      threshold: 12, // Progress % where vehicle passes this cam
      pos: new THREE.Vector3(-70, 0, 40),
      lane: 'Express Lane 3'
    },
    { 
      id: 'CAM_02', 
      name: 'Ring Road Elevated Flyover', 
      location: 'Ashram Flyover Overpass',
      time: '14:05:40', 
      speed: '61 km/h', 
      speedVal: 61,
      conf: 98.2,
      threshold: 38,
      pos: new THREE.Vector3(-22, 10, 12),
      lane: 'Elevated Deck Lane 2'
    },
    { 
      id: 'CAM_03', 
      name: 'Barakhamba Road Radial', 
      location: 'Mandi House Outer Junction',
      time: '14:09:10', 
      speed: '48 km/h', 
      speedVal: 48,
      conf: 97.9,
      threshold: 65,
      pos: new THREE.Vector3(26, 0, -16),
      lane: 'Inbound Sector A'
    },
    { 
      id: 'CAM_04', 
      name: 'Connaught Place Outer Circle', 
      location: 'Barakhamba Radial Entrance',
      time: '14:12:00', 
      speed: '36 km/h', 
      speedVal: 36,
      conf: 96.8,
      threshold: 90,
      pos: new THREE.Vector3(72, 0, -42),
      lane: 'Inner Roundabout'
    }
  ];

  // 3D Spline Path
  const curvePoints = checkpoints.map(c => c.pos);
  const curve = new THREE.CatmullRomCurve3([
    curvePoints[0],
    new THREE.Vector3(-48, 5, 26),
    curvePoints[1],
    new THREE.Vector3(2, 5, -2),
    curvePoints[2],
    new THREE.Vector3(48, 0, -30),
    curvePoints[3]
  ]);
  splineCurveRef.current = curve;

  // Web Audio API Synthesizer Alarm Buzzer
  const playTacticalAlarmSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Tone 1: High Warble Alert
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.18);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Tone 2: Secondary Warning Pulse
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(880, now + 0.22);
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.4);
      gain2.gain.setValueAtTime(0.4, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.42);

      // Tone 3: Klaxon Resonator
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'square';
      osc3.frequency.setValueAtTime(587.33, now + 0.45);
      osc3.frequency.setValueAtTime(520.0, now + 0.65);
      gain3.gain.setValueAtTime(0.3, now + 0.45);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.45);
      osc3.stop(now + 0.85);
    } catch (err) {
      console.warn('Web Audio error:', err);
    }
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0A0B0E);
    scene.fog = new THREE.FogExp2(0x0A0B0E, 0.0035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 80, 125);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 260;
    controls.target.set(0, 4, 0);

    // 5. Lighting
    const amb = new THREE.AmbientLight(0x262933, 2.0);
    scene.add(amb);

    const sun = new THREE.DirectionalLight(0xd1d5db, 2.2);
    sun.position.set(60, 90, 50);
    sun.castShadow = true;
    scene.add(sun);

    // 6. Tactical Ground Grid & Multi-Lane Road Network
    const grid = new THREE.GridHelper(260, 52, 0x475569, 0x262933);
    grid.position.y = -0.1;
    scene.add(grid);

    // Highway Asphalt Deck (Elevated and ground road ribbon)
    const roadGeo = new THREE.TubeGeometry(curve, 120, 3.2, 8, false);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x13151B,
      roughness: 0.8,
      metalness: 0.2
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Sleek Trajectory Line
    const trajectoryLineGeo = new THREE.TubeGeometry(curve, 120, 0.35, 6, false);
    const trajectoryLineMat = new THREE.MeshBasicMaterial({ color: 0xE2E8F0, transparent: true, opacity: 0.85 });
    const trajectoryLine = new THREE.Mesh(trajectoryLineGeo, trajectoryLineMat);
    scene.add(trajectoryLine);

    // Flyover Support Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    for (let t = 0.2; t <= 0.55; t += 0.07) {
      const pt = curve.getPoint(t);
      if (pt.y > 1.5) {
        const pGeo = new THREE.CylinderGeometry(1.2, 1.4, pt.y, 8);
        const pillar = new THREE.Mesh(pGeo, pillarMat);
        pillar.position.set(pt.x, pt.y / 2, pt.z);
        scene.add(pillar);
      }
    }

    // 7. Checkpoint Overhead Gantry Portals (CAM_01, CAM_02, CAM_03, CAM_04)
    const strobes = [];
    checkpoints.forEach((cp, idx) => {
      const gantryArch = new THREE.Group();
      gantryArch.position.copy(cp.pos);

      // Tangent orientation at checkpoint
      const t = cp.threshold / 100;
      const tangent = curve.getTangent(Math.min(0.99, Math.max(0.01, t)));
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Dual Gantry Columns spanning across road width
      [-5.5, 5.5].forEach(sideOffset => {
        const colPos = normal.clone().multiplyScalar(sideOffset);
        const colGeo = new THREE.CylinderGeometry(0.6, 0.7, 14, 8);
        const colMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 });
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(colPos.x, 7, colPos.z);
        gantryArch.add(col);
      });

      // Overhead Crossbar Beam
      const barGeo = new THREE.BoxGeometry(12, 1.2, 1.6);
      const barMat = new THREE.MeshStandardMaterial({ color: 0x00A8FF, metalness: 0.9, roughness: 0.2 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(0, 14, 0);
      bar.lookAt(bar.position.clone().add(tangent));
      bar.rotation.y += Math.PI / 2;
      gantryArch.add(bar);

      // Camera Sensor Pod with Optical Lens
      const camPodGeo = new THREE.BoxGeometry(2.0, 1.2, 2.5);
      const camPodMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
      const camPod = new THREE.Mesh(camPodGeo, camPodMat);
      camPod.position.set(0, 13, 0);
      camPod.lookAt(camPod.position.clone().add(tangent));
      gantryArch.add(camPod);

      // Camera Status Indicator LED (Green)
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x10B981 })
      );
      led.position.set(0, 12.8, 1.3);
      camPod.add(led);

      // Optical Strobe Flash Light (Flashes when car passes underneath)
      const strobeLight = new THREE.PointLight(0xFFFFFF, 0, 35);
      strobeLight.position.set(0, 12.5, 0);
      gantryArch.add(strobeLight);
      strobes.push(strobeLight);

      // Ground Sighting Target Reticle Ring
      const ringGeo = new THREE.RingGeometry(3.5, 4.0, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00A8FF, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.1;
      gantryArch.add(ring);

      scene.add(gantryArch);
    });
    gantryStrobesRef.current = strobes;

    // 8. Sleek Target Vehicle with Refined Volumetric Blue Rays
    const vehicleGroup = new THREE.Group();
    vehicleGroupRef.current = vehicleGroup;

    // Vehicle Body (Deep tactical blue metallic)
    const vBody = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.8, 8.5),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.25 })
    );
    vBody.position.y = 1.3;
    vBody.castShadow = true;
    vehicleGroup.add(vBody);

    // Windshield & Cabin
    const vCabin = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 1.5, 4.8),
      new THREE.MeshStandardMaterial({ color: 0x0b1120, metalness: 0.95, roughness: 0.1 })
    );
    vCabin.position.set(0, 2.8, -0.6);
    vehicleGroup.add(vCabin);

    // ==========================================
    // REFINED VOLUMETRIC BLUE RAYS OF LIGHT
    // ==========================================
    // Twin forward soft volumetric blue light cones (sleek & elegant)
    [-1.4, 1.4].forEach(hx => {
      // 1. Blue Headlight Lens
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.2), new THREE.MeshBasicMaterial({ color: 0x38BDF8 }));
      hl.position.set(hx, 1.3, 4.3);
      vehicleGroup.add(hl);

      // 2. Volumetric Blue Light Ray Cone (Tapered, semi-transparent)
      const rayGeo = new THREE.CylinderGeometry(0.2, 2.5, 20, 16, 1, true);
      const rayMat = new THREE.MeshBasicMaterial({
        color: 0x00A8FF,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const rayCone = new THREE.Mesh(rayGeo, rayMat);
      rayCone.rotation.x = Math.PI / 2;
      rayCone.position.set(hx, 1.3, 14);
      vehicleGroup.add(rayCone);

      // 3. Core Laser Filament
      const laserPts = [new THREE.Vector3(hx, 1.3, 4.3), new THREE.Vector3(hx, 0.1, 26)];
      const laserLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(laserPts),
        new THREE.LineBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
      );
      vehicleGroup.add(laserLine);

      // 4. SpotLight on Road
      const spot = new THREE.SpotLight(0x00A8FF, 3.0, 35, Math.PI / 5, 0.5, 1);
      spot.position.set(hx, 1.3, 4.5);
      spot.target.position.set(hx, 0, 22);
      vehicleGroup.add(spot);
      vehicleGroup.add(spot.target);
    });

    // Vertical Blue Tactical Satellite Tracking Ray
    const vertBeamGeo = new THREE.CylinderGeometry(0.18, 0.18, 55, 8);
    const vertBeamMat = new THREE.MeshBasicMaterial({
      color: 0x00A8FF,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const vertBeam = new THREE.Mesh(vertBeamGeo, vertBeamMat);
    vertBeam.position.set(0, 28, 0);
    vehicleGroup.add(vertBeam);

    // Blue Ground Neon Underglow
    const underglowGeo = new THREE.PlaneGeometry(7.5, 12);
    const underglowMat = new THREE.MeshBasicMaterial({
      color: 0x00A8FF,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const underglow = new THREE.Mesh(underglowGeo, underglowMat);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.set(0, 0.1, 0);
    vehicleGroup.add(underglow);

    // 4 Wheels
    [[-2.1, 0.9, 2.4], [2.1, 0.9, 2.4], [-2.1, 0.9, -2.4], [2.1, 0.9, -2.4]].forEach(([wx, wy, wz]) => {
      const wGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.7, 12);
      const wheel = new THREE.Mesh(wGeo, new THREE.MeshStandardMaterial({ color: 0x090D16, roughness: 0.9 }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      vehicleGroup.add(wheel);
    });

    // Floating Target Plate Sprite
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 256;
    tagCanvas.height = 64;
    const tagCtx = tagCanvas.getContext('2d');
    tagCtx.fillStyle = '#0B0F19';
    tagCtx.fillRect(0, 0, 256, 64);
    tagCtx.strokeStyle = '#00A8FF';
    tagCtx.lineWidth = 4;
    tagCtx.strokeRect(2, 2, 252, 60);
    tagCtx.fillStyle = '#00A8FF';
    tagCtx.font = 'bold 28px monospace';
    tagCtx.textAlign = 'center';
    tagCtx.textBaseline = 'middle';
    tagCtx.fillText(activePlate, 128, 32);

    const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tagCanvas) }));
    tagSprite.position.set(0, 5.8, 0);
    tagSprite.scale.set(9, 2.2, 1);
    vehicleGroup.add(tagSprite);

    scene.add(vehicleGroup);

    // 9. Ghost Vehicle for Cloned Anomaly (Red)
    const ghostGroup = new THREE.Group();
    ghostVehicleGroupRef.current = ghostGroup;
    ghostGroup.position.set(65, 0, 45);

    const gBody = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.8, 8.5),
      new THREE.MeshStandardMaterial({ color: 0xEF4444, metalness: 0.85 })
    );
    gBody.position.y = 1.3;
    ghostGroup.add(gBody);

    const gBadgeCanvas = document.createElement('canvas');
    gBadgeCanvas.width = 280;
    gBadgeCanvas.height = 64;
    const gCtx = gBadgeCanvas.getContext('2d');
    gCtx.fillStyle = '#EF4444';
    gCtx.fillRect(0, 0, 280, 64);
    gCtx.fillStyle = '#FFFFFF';
    gCtx.font = 'bold 22px monospace';
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'middle';
    gCtx.fillText(`CLONE: ${activePlate}`, 140, 32);

    const gSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gBadgeCanvas) }));
    gSprite.position.set(0, 6.5, 0);
    gSprite.scale.set(10, 2.4, 1);
    ghostGroup.add(gSprite);
    ghostGroup.visible = false;
    scene.add(ghostGroup);

    // Impossible Arc (Red)
    const arcPts = [];
    const p1 = checkpoints[0].pos;
    const p2 = ghostGroup.position;
    for (let i = 0; i <= 30; i++) {
      const alpha = i / 30;
      const x = p1.x + (p2.x - p1.x) * alpha;
      const z = p1.z + (p2.z - p1.z) * alpha;
      const y = Math.sin(alpha * Math.PI) * 40;
      arcPts.push(new THREE.Vector3(x, y, z));
    }
    const arcLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcPts),
      new THREE.LineDashedMaterial({ color: 0xEF4444, dashSize: 3, gapSize: 2, linewidth: 3 })
    );
    arcLine.computeLineDistances();
    arcLine.visible = false;
    arcLine.name = 'impossibleArc';
    scene.add(arcLine);

    // 10. Animation Loop (Live Vehicle Movement through Cameras)
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Vehicle Position & Direction along Spline
      const u = Math.max(0.001, Math.min(0.999, progress / 100));
      const pos = curve.getPoint(u);
      const tangent = curve.getTangent(u);

      if (vehicleGroupRef.current) {
        vehicleGroupRef.current.position.copy(pos);
        const lookTarget = pos.clone().add(tangent);
        vehicleGroupRef.current.lookAt(lookTarget);
      }

      // Checkpoint Optical Flash Trigger (when vehicle is directly at a gantry)
      if (gantryStrobesRef.current.length > 0) {
        checkpoints.forEach((cp, idx) => {
          const distToGantry = Math.abs(progress - cp.threshold);
          const strobe = gantryStrobesRef.current[idx];
          if (strobe) {
            if (distToGantry < 2.5) {
              // Passing under gantry: Strobe fires!
              strobe.intensity = 8.0 * (Math.sin(elapsedTime * 30) > 0 ? 1 : 0.2);
            } else {
              strobe.intensity = 0;
            }
          }
        });
      }

      // Camera Presets
      if (cameraView === 'chase' && cameraRef.current && controlsRef.current) {
        const offset = tangent.clone().multiplyScalar(-24).add(new THREE.Vector3(0, 10, 0));
        cameraRef.current.position.lerp(pos.clone().add(offset), 0.08);
        controlsRef.current.target.lerp(pos, 0.1);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 420;
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
  }, [progress, cameraView]);

  // Simulation Timeline Loop
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const next = (prev + 0.35 * simSpeed) % 100;

          // Update active checkpoint & captured flags
          checkpoints.forEach((cp, idx) => {
            if (next >= cp.threshold) {
              setActiveCamIndex(idx);
              setCapturedCams(prevCaptures => ({ ...prevCaptures, [idx]: true }));
            }
          });

          // Reset captures when looping
          if (next < 5) {
            setCapturedCams({ 0: true, 1: false, 2: false, 3: false });
          }

          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simSpeed]);

  // Update Cloned Anomaly
  useEffect(() => {
    if (!sceneRef.current) return;
    if (ghostVehicleGroupRef.current) {
      ghostVehicleGroupRef.current.visible = clonedAlertActive;
    }
    const arc = sceneRef.current.getObjectByName('impossibleArc');
    if (arc) {
      arc.visible = clonedAlertActive;
    }
  }, [clonedAlertActive]);

  // Trigger Cloned Alert + Buzzer
  const handleTriggerClonedAlert = () => {
    setClonedAlertActive(true);
    playTacticalAlarmSound();
  };

  // Switch Camera Views
  const setPreset = (preset) => {
    setCameraView(preset);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    switch (preset) {
      case 'iso':
        cam.position.set(0, 80, 125);
        ctrl.target.set(0, 4, 0);
        break;
      case 'gantry': // Lock onto currently active gantry
        const targetGantry = checkpoints[activeCamIndex].pos;
        cam.position.set(targetGantry.x + 12, targetGantry.y + 18, targetGantry.z + 24);
        ctrl.target.copy(targetGantry);
        break;
      case 'overhead':
        cam.position.set(0, 150, 0);
        ctrl.target.set(0, 0, 0);
        break;
      default:
        break;
    }
    ctrl.update();
  };

  const currentCam = checkpoints[activeCamIndex] || checkpoints[0];

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2E3440]">
        <div>
          <div className="text-xs text-[#CBD5E1] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#CBD5E1]" />
            MODULE 4: MULTI-CAMERA LIVE PASSING TRAJECTORY
          </div>
          <div className="text-lg font-bold font-['Orbitron'] text-[#FFFFFF] flex items-center gap-2 mt-0.5">
            Trajectory Reconstruction
            <span className="text-[10px] font-mono bg-[#121417] text-[#CBD5E1] border border-[#2E3440] px-2 py-0.5">
              PASSING: {currentCam.id} ({currentCam.name.split(' ')[0]})
            </span>
            <span className="text-[10px] font-mono bg-[#2A2F3A] text-[#CBD5E1] border border-[#CBD5E1]/40 px-2 py-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#CBD5E1] animate-pulse" />
              BLUE RAY ACTIVE
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 border rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
              soundEnabled 
                ? 'bg-[#252A34] text-[#FFFFFF] border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]' 
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:bg-[#252A34] hover:text-[#FFFFFF]'
            }`}
            title={soundEnabled ? 'Buzzer Sound: ON' : 'Buzzer Sound: MUTED'}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${soundEnabled ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#F59E0B]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-1.5 font-bold text-xs tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer border ${
              isPlaying
                ? 'bg-[#252A34] text-[#FFFFFF] border-[#10B981] shadow-[inset_0_0_8px_rgba(16,185,129,0.15)]'
                : 'bg-[#1A1D24] hover:bg-[#252A34] text-[#FFFFFF] border-[#374151] hover:border-[#F59E0B]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${isPlaying ? 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.9)]' : 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]'}`} />
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#10B981]" /> : <Play className="w-3.5 h-3.5 text-[#F59E0B]" />}
            <span>{isPlaying ? 'PAUSE ROUTE' : 'PLAY MOTION'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setProgress(0);
              setActiveCamIndex(0);
              setCapturedCams({ 0: true, 1: false, 2: false, 3: false });
              setClonedAlertActive(false);
            }}
            className="p-2 bg-[#1A1D24] hover:bg-[#252A34] text-[#CBD5E1] hover:text-[#FFFFFF] border border-[#374151] hover:border-[#4B5563] rounded-none cursor-pointer transition-all"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleTriggerClonedAlert}
            className={`px-3.5 py-1.5 rounded-none font-bold text-xs tracking-wider transition-all flex items-center gap-2 cursor-pointer border ${
              clonedAlertActive
                ? 'bg-[#252A34] text-[#FFFFFF] border-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-[#1A1D24] text-[#EF4444] border-[#EF4444]/60 hover:bg-[#252A34] hover:border-[#EF4444]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-none shrink-0 bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse" />
            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>TRIGGER CLONED ALERT</span>
          </button>
        </div>
      </div>

      {/* Cloned Anomaly Alert Banner */}
      {clonedAlertActive && (
        <div className="p-3.5 bg-[#EF4444] border border-[#EF4444] text-[#FFFFFF] rounded-none flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-[#0A0B0E] border border-[#FFFFFF] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <div className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                DEFCON 1: PHYSICAL VELOCITY BREACH // CLONED REGISTRATION DETECTED
              </div>
              <div className="text-xs text-[#FFFFFF] mt-0.5">
                Target plate <strong className="underline">{activePlate}</strong> logged at <span className="font-bold">CAM_01 (DND)</span> and simultaneously sighted at <span className="font-bold">CAM_09 (Rohini)</span> within 42 seconds.
              </div>
              <div className="text-[11px] text-[#FFFFFF]/90 mt-0.5">
                • Spatial Distance: <strong>24.6 km</strong> | Required Speed: <strong className="underline">2,108 km/h (Mach 1.7 - IMPOSSIBLE)</strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => setClonedAlertActive(false)}
            className="px-3 py-1.5 bg-[#1C1F26] hover:bg-[#252A34] text-[#FFFFFF] border border-[#EF4444] font-mono text-xs font-bold rounded-none uppercase tracking-wider shrink-0 cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
          >
            <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-none shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
            DISMISS ALERT
          </button>
        </div>
      )}

      {/* 3D Highway Stage */}
      <div className="relative w-full h-[400px] bg-[#0A0B0E] border border-[#262933] overflow-hidden select-none">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* View Presets Floating Toolbar */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[#13151B]/95 border border-[#262933] p-1.5 backdrop-blur-sm text-xs shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setPreset('iso')}
            className={`px-2 py-1 text-[10px] border rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
              cameraView === 'iso'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${cameraView === 'iso' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            3D ISOMETRIC
          </button>
          <button
            onClick={() => setPreset('chase')}
            className={`px-2 py-1 text-[10px] border rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
              cameraView === 'chase'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${cameraView === 'chase' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            CHASE CAM
          </button>
          <button
            onClick={() => setPreset('gantry')}
            className={`px-2 py-1 text-[10px] border rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
              cameraView === 'gantry'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${cameraView === 'gantry' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            LOCK GANTRY
          </button>
          <button
            onClick={() => setPreset('overhead')}
            className={`px-2 py-1 text-[10px] border rounded-none cursor-pointer transition-all flex items-center gap-1.5 ${
              cameraView === 'overhead'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${cameraView === 'overhead' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            OVERHEAD PLAN
          </button>
        </div>

        {/* Live Passing Telemetry Card */}
        <div className="absolute top-2 left-2 z-20 bg-[#13151B]/95 border border-[#262933] p-2.5 backdrop-blur-sm text-xs space-y-1 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <div className="text-[10px] text-[#CBD5E1] uppercase flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-[#10B981]" />
            TRANSIT VEHICLE: <strong className="text-[#FFFFFF] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{activePlate}</strong>
          </div>
          <div className="text-[11px] text-[#CBD5E1]">
            Approaching: <span className="text-[#FFFFFF] font-bold">{currentCam.name}</span>
          </div>
          <div className="text-[11px] text-[#CBD5E1]">
            Speed: <span className="text-[#10B981] font-bold">{currentCam.speed}</span> | Progress: <span className="text-[#FFFFFF] font-bold">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="absolute bottom-2 left-2 right-2 z-20 bg-[#13151B]/95 border border-[#262933] p-2 flex items-center gap-3 backdrop-blur-sm text-xs shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-1.5 text-[#FFFFFF] font-bold text-[11px]">
            <Clock className="w-3.5 h-3.5 text-[#CBD5E1]" />
            <span>TIMELINE:</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-[#0A0B0E] rounded-none appearance-none cursor-pointer accent-[#F59E0B] border border-[#262933]"
          />
          <span className="text-[11px] font-bold text-[#FFFFFF]">
            {currentCam.time} IST
          </span>
          <div className="flex items-center gap-1 border-l border-[#262933] pl-2">
            {[1.0, 2.0].map(s => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-2 py-0.5 text-[9px] border cursor-pointer transition-all ${
                  simSpeed === s 
                    ? 'bg-[#252A34] text-[#FFFFFF] font-bold border-[#F59E0B]' 
                    : 'bg-[#1A1D24] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:bg-[#252A34]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 LIVE CCTV CAMERA FEED PIP MONITORS (VEHICLE PASSING SEQUENCE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {checkpoints.map((cp, idx) => {
          const isCurrent = activeCamIndex === idx;
          const isCaptured = capturedCams[idx];

          return (
            <div 
              key={cp.id}
              className={`p-2 border rounded-none font-mono text-xs transition-all relative overflow-hidden ${
                isCurrent
                  ? 'bg-[#1A1C23] border-[#E2E8F0] ring-1 ring-[#FFFFFF]/20 shadow-[0_0_12px_rgba(0,0,0,0.5)]'
                  : isCaptured
                  ? 'bg-[#13151B] border-[#10B981]/50 opacity-90'
                  : 'bg-[#0A0B0E] border-[#262933] opacity-60'
              }`}
            >
              {/* Camera Header */}
              <div className="flex items-center justify-between border-b border-[#262933] pb-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[#FFFFFF] animate-ping' : isCaptured ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'}`} />
                  <span className="text-[10px] font-bold text-[#FFFFFF]">{cp.id} FEED</span>
                </div>
                <span className={`text-[9px] px-1 py-0.2 font-bold ${
                  isCurrent 
                    ? 'bg-[#262933] text-white border border-[#4B5563] animate-pulse' 
                    : isCaptured 
                    ? 'bg-[#10B981]/15 text-[#10B981]' 
                    : 'text-[#CBD5E1]'
                }`}>
                  {isCurrent ? '● IN FRAME' : isCaptured ? 'ACQUIRED' : 'ARMED'}
                </span>
              </div>

              {/* Simulated Camera Video Screen */}
              <div className="relative w-full h-24 bg-[#050608] border border-[#262933] flex flex-col justify-between p-1.5 overflow-hidden">
                {/* Camera HUD Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="w-full h-full border border-dashed border-[#4B5563]" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-[#4B5563]/40" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#4B5563]/40" />
                </div>

                {/* Top Overlay */}
                <div className="flex justify-between items-center text-[9px] text-[#CBD5E1] z-10">
                  <span>REC // {cp.time}</span>
                  <span className="text-[#10B981] font-bold">{cp.speed}</span>
                </div>

                {/* Simulated Vehicle Passing Frame */}
                <div className="flex items-center justify-center my-auto z-10">
                  {isCurrent ? (
                    <div className="text-center animate-pulse">
                      <div className="inline-block px-2 py-0.5 bg-[#0A0B0E]/90 border border-[#E2E8F0] text-[#FFFFFF] text-[11px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        [{activePlate}]
                      </div>
                      <div className="text-[8px] text-[#10B981] mt-0.5">OCR CONF: {cp.conf}%</div>
                    </div>
                  ) : isCaptured ? (
                    <div className="text-center opacity-75">
                      <div className="text-[9px] text-[#10B981] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                        PLATE VERIFIED
                      </div>
                      <div className="text-[8px] text-[#CBD5E1]">{activePlate}</div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-[#CBD5E1]/60 uppercase tracking-wider">
                      WAITING VEHICLE...
                    </div>
                  )}
                </div>

                {/* Bottom Overlay */}
                <div className="flex justify-between items-center text-[8px] text-[#CBD5E1] z-10">
                  <span className="truncate max-w-[120px]">{cp.location.split(',')[0]}</span>
                  <span className="text-[#CBD5E1]">{cp.lane.split(' ')[0]}</span>
                </div>
              </div>

              {/* Node Metrics Footer */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#CBD5E1]">
                <span>Speed: <strong className="text-[#10B981]">{cp.speed}</strong></span>
                <span>Conf: <strong className="text-[#FFFFFF]">{cp.conf}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
