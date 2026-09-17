import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeHeroScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.set(0, 140, 220);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Isometric 3D City Grid Ground
    const gridHelper = new THREE.GridHelper(300, 30, 0x475569, 0x262933);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // 3. 3D Buildings (Stylized stealth defense monoliths)
    const buildingsGroup = new THREE.Group();
    const buildingGeom = new THREE.BoxGeometry(1, 1, 1);
    const buildingMat = new THREE.MeshBasicMaterial({
      color: 0x13151B,
      transparent: true,
      opacity: 0.85
    });
    const wireMat = new THREE.LineBasicMaterial({ color: 0x262933, transparent: true, opacity: 0.8 });

    // Procedural urban block distribution
    for (let x = -120; x <= 120; x += 30) {
      for (let z = -120; z <= 120; z += 30) {
        if (Math.abs(x) < 20 || Math.abs(z) < 20) continue; // Leave road corridors open
        const h = 20 + Math.random() * 60;
        const mesh = new THREE.Mesh(buildingGeom, buildingMat);
        mesh.scale.set(18, h, 18);
        mesh.position.set(x, h / 2, z);
        buildingsGroup.add(mesh);

        // Building wireframe edges
        const edges = new THREE.EdgesGeometry(mesh.geometry);
        const line = new THREE.LineSegments(edges, wireMat);
        line.scale.copy(mesh.scale);
        line.position.copy(mesh.position);
        buildingsGroup.add(line);
      }
    }
    scene.add(buildingsGroup);

    // 4. Illuminated Road Corridor Lines & Moving Vehicle Beams
    const roadLines = [];
    const roadMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.7 });

    // Main X road
    const geomX = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-140, 0.2, 0),
      new THREE.Vector3(140, 0.2, 0)
    ]);
    const lineX = new THREE.Line(geomX, roadMat);
    scene.add(lineX);

    // Main Z road
    const geomZ = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.2, -140),
      new THREE.Vector3(0, 0.2, 140)
    ]);
    const lineZ = new THREE.Line(geomZ, roadMat);
    scene.add(lineZ);

    // 5. Moving Vehicle Traffic Particles
    const trafficCount = 30;
    const trafficGeom = new THREE.SphereGeometry(1.2, 8, 8);
    const trafficMatWhite = new THREE.MeshBasicMaterial({ color: 0xF8FAFC });
    const trafficMatGreen = new THREE.MeshBasicMaterial({ color: 0x10B981 });
    const trafficMatAmber = new THREE.MeshBasicMaterial({ color: 0xF59E0B });

    const vehicles = [];
    for (let i = 0; i < trafficCount; i++) {
      const isX = Math.random() > 0.5;
      const r = Math.random();
      const mat = r > 0.6 ? trafficMatWhite : (r > 0.3 ? trafficMatGreen : trafficMatAmber);
      const mesh = new THREE.Mesh(trafficGeom, mat);
      mesh.position.y = 1.0;
      mesh.userData = {
        isX,
        speed: (0.3 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1),
        limit: 130
      };
      if (isX) {
        mesh.position.x = (Math.random() - 0.5) * 260;
        mesh.position.z = (Math.random() > 0.5 ? 2.5 : -2.5);
      } else {
        mesh.position.z = (Math.random() - 0.5) * 260;
        mesh.position.x = (Math.random() > 0.5 ? 2.5 : -2.5);
      }
      scene.add(mesh);
      vehicles.push(mesh);
    }

    // 6. Rotating Radar Sweeper
    const radarGeom = new THREE.RingGeometry(0, 130, 32, 1, 0, Math.PI / 4);
    const radarMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const radarMesh = new THREE.Mesh(radarGeom, radarMat);
    radarMesh.rotation.x = -Math.PI / 2;
    radarMesh.position.y = 0.5;
    scene.add(radarMesh);

    // 7. Animation Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate radar
      radarMesh.rotation.z += 0.015;

      // Slowly rotate city for cinematic angle
      buildingsGroup.rotation.y += 0.0008;
      gridHelper.rotation.y += 0.0008;
      lineX.rotation.y += 0.0008;
      lineZ.rotation.y += 0.0008;

      // Animate traffic vehicles
      vehicles.forEach(v => {
        if (v.userData.isX) {
          v.position.x += v.userData.speed;
          if (v.position.x > v.userData.limit) v.position.x = -v.userData.limit;
          if (v.position.x < -v.userData.limit) v.position.x = v.userData.limit;
        } else {
          v.position.z += v.userData.speed;
          if (v.position.z > v.userData.limit) v.position.z = -v.userData.limit;
          if (v.position.z < -v.userData.limit) v.position.z = v.userData.limit;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // 8. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0B0E]/60 via-transparent to-[#0A0B0E]" />
    </div>
  );
}
