import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Radar, 
  Target, 
  Crosshair, 
  Radio, 
  Layers, 
  AlertTriangle, 
  Maximize2, 
  RotateCcw 
} from 'lucide-react';

/**
 * GodsEyeRadarSystem
 * Realistic satellite road map with a continuous 360° rotating circular radar sweep ray.
 * Centered on Central New Delhi corridor (matching reference screenshot).
 */
export default function GodsEyeRadarSystem({ activeTargetPlate = 'RJ 14 CA 0639' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const [selectedTarget, setSelectedTarget] = useState(activeTargetPlate);
  const [mapType, setMapType] = useState('hybrid'); // 'hybrid' | 'satellite' | 'dark'
  const [sweepSpeed, setSweepSpeed] = useState(1.0); // Speed multiplier
  const [isPaused, setIsPaused] = useState(false);

  // Center Coordinates: Central New Delhi Roundabouts & Corridors (Mansingh Rd / Taj Mahal Hotel / Khan Market)
  const centerCoord = [28.6035, 77.2250];

  // Vehicles moving along real road corridors visible on the map
  const [vehicles, setVehicles] = useState([
    {
      id: 'RJ 14 CA 0639',
      label: 'RJ 14 CA 0639 (Sedan)',
      color: '#00A8FF',
      speed: '58 km/h',
      route: [
        [28.6110, 77.2260],
        [28.6070, 77.2256],
        [28.6035, 77.2251],
        [28.5990, 77.2246],
        [28.5950, 77.2242]
      ],
      progress: 0.25,
      rate: 0.0025,
      lat: 28.6070,
      lng: 77.2256
    },
    {
      id: 'HR 55 AH 7820',
      label: 'HR 55 AH 7820 (Truck)',
      color: '#10B981',
      speed: '42 km/h',
      route: [
        [28.5950, 77.2242],
        [28.5990, 77.2246],
        [28.6035, 77.2251],
        [28.6070, 77.2256],
        [28.6110, 77.2260]
      ],
      progress: 0.65,
      rate: 0.0018,
      lat: 28.6035,
      lng: 77.2251
    },
    {
      id: 'UP 16 CH 9651',
      label: 'UP 16 CH 9651 (Creta)',
      color: '#F59E0B',
      speed: '65 km/h',
      route: [
        [28.6050, 77.2180],
        [28.6042, 77.2215],
        [28.6035, 77.2250],
        [28.6030, 77.2285],
        [28.6025, 77.2320]
      ],
      progress: 0.40,
      rate: 0.0030,
      lat: 28.6035,
      lng: 77.2250
    },
    {
      id: 'DL 3S CD 8412',
      label: 'DL 3S CD 8412 (Bike)',
      color: '#38BDF8',
      speed: '51 km/h',
      route: [
        [28.6025, 77.2320],
        [28.6030, 77.2285],
        [28.6035, 77.2250],
        [28.6042, 77.2215],
        [28.6050, 77.2180]
      ],
      progress: 0.80,
      rate: 0.0032,
      lat: 28.6042,
      lng: 77.2215
    },
    {
      id: 'DL 01 TA 4210',
      label: 'DL 01 TA 4210 (Taxi)',
      color: '#EAB308',
      speed: '48 km/h',
      route: [
        [28.6080, 77.2210],
        [28.6055, 77.2230],
        [28.6035, 77.2250],
        [28.6005, 77.2268],
        [28.5975, 77.2285]
      ],
      progress: 0.15,
      rate: 0.0022,
      lat: 28.6055,
      lng: 77.2230
    }
  ]);

  // Interpolate route waypoint
  const getPositionOnRoute = (route, p) => {
    const totalSegments = route.length - 1;
    const scaled = p * totalSegments;
    const idx = Math.min(Math.floor(scaled), totalSegments - 1);
    const localP = scaled - idx;
    const p1 = route[idx];
    const p2 = route[idx + 1];
    return {
      lat: p1[0] + (p2[0] - p1[0]) * localP,
      lng: p1[1] + (p2[1] - p1[1]) * localP
    };
  };

  // Map Tile Layers
  const tileURLs = {
    hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', // Google Satellite + Roads
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: centerCoord,
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });
    mapInstanceRef.current = map;

    // Add Tiles
    let currentTileLayer = L.tileLayer(tileURLs[mapType], {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Center Radar Station Marker
    const radarTowerIcon = L.divIcon({
      className: 'radar-tower-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-4 h-4 bg-[#00A8FF] rounded-full border-2 border-white shadow-lg animate-ping absolute opacity-75"></div>
          <div class="w-4 h-4 bg-[#00A8FF] rounded-full border-2 border-white shadow-md relative z-10 flex items-center justify-center">
            <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
          </div>
          <div class="absolute -bottom-5 bg-[#0B0F19]/90 text-[#00A8FF] border border-[#2D3748] px-1 py-0.2 text-[9px] font-mono font-bold whitespace-nowrap">
            RADAR-01
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker(centerCoord, { icon: radarTowerIcon, zIndexOffset: 1000 }).addTo(map);

    // Vehicle Markers
    const vehicleMarkers = {};
    vehicles.forEach(v => {
      const vIcon = L.divIcon({
        className: 'vehicle-blip-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md flex items-center justify-center" style="background-color: ${v.color};">
              <span class="w-1 h-1 bg-black rounded-full"></span>
            </div>
            <div class="absolute -top-6 bg-[#0B0F19]/90 text-white border border-[#2D3748] px-1 py-0.2 text-[9px] font-mono font-bold whitespace-nowrap shadow group-hover:border-[#00A8FF]">
              ${v.id}
            </div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const m = L.marker([v.lat, v.lng], { icon: vIcon }).addTo(map);
      m.on('click', () => setSelectedTarget(v.id));
      vehicleMarkers[v.id] = m;
    });

    // Animate Vehicles along routes
    let vehTimer = setInterval(() => {
      setVehicles(prev => {
        return prev.map(v => {
          let newProg = (v.progress + v.rate) % 1.0;
          const pos = getPositionOnRoute(v.route, newProg);
          if (vehicleMarkers[v.id]) {
            vehicleMarkers[v.id].setLatLng([pos.lat, pos.lng]);
          }
          return {
            ...v,
            progress: newProg,
            lat: pos.lat,
            lng: pos.lng
          };
        });
      });
    }, 50);

    // 360° Circular Radar Ray Canvas Setup
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let angle = 0;

      const resizeCanvas = () => {
        if (!mapContainerRef.current || !canvas) return;
        canvas.width = mapContainerRef.current.clientWidth;
        canvas.height = mapContainerRef.current.clientHeight;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      map.on('move', resizeCanvas);
      map.on('zoom', resizeCanvas);

      const renderRadar = () => {
        if (!canvas || !ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Convert center lat/lng to screen pixel position
        const centerPt = map.latLngToContainerPoint(centerCoord);
        const maxRadius = Math.max(width, height) * 0.75;

        // Draw Concentric Radar Rings
        const ringSteps = [0.25, 0.5, 0.75, 1.0];
        ctx.save();
        ringSteps.forEach((step, idx) => {
          const r = maxRadius * step;
          ctx.beginPath();
          ctx.arc(centerPt.x, centerPt.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = idx === ringSteps.length - 1 ? 'rgba(0, 168, 255, 0.4)' : 'rgba(0, 168, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();

          // Range labels
          ctx.fillStyle = 'rgba(0, 168, 255, 0.7)';
          ctx.font = '10px monospace';
          ctx.fillText(`${(step * 2.0).toFixed(1)} km`, centerPt.x + 8, centerPt.y - r + 12);
        });

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(centerPt.x, centerPt.y - maxRadius);
        ctx.lineTo(centerPt.x, centerPt.y + maxRadius);
        ctx.moveTo(centerPt.x - maxRadius, centerPt.y);
        ctx.lineTo(centerPt.x + maxRadius, centerPt.y);
        ctx.strokeStyle = 'rgba(0, 168, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.restore();

        // 360° Circular Sweep Ray with Fading Sweep Sector
        const sweepSpan = Math.PI / 4; // 45-degree beam wedge
        ctx.save();
        
        // Gradient Sector
        const grad = ctx.createRadialGradient(
          centerPt.x, centerPt.y, 0,
          centerPt.x, centerPt.y, maxRadius
        );
        grad.addColorStop(0, 'rgba(0, 168, 255, 0.35)');
        grad.addColorStop(1, 'rgba(0, 168, 255, 0.02)');

        ctx.beginPath();
        ctx.moveTo(centerPt.x, centerPt.y);
        ctx.arc(centerPt.x, centerPt.y, maxRadius, angle - sweepSpan, angle, false);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Leading Bright Radar Ray
        ctx.beginPath();
        ctx.moveTo(centerPt.x, centerPt.y);
        const rayX = centerPt.x + Math.cos(angle) * maxRadius;
        const rayY = centerPt.y + Math.sin(angle) * maxRadius;
        ctx.lineTo(rayX, rayY);
        ctx.strokeStyle = '#00A8FF';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00A8FF';
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.restore();

        // Increment angle (turning in circle)
        angle = (angle + 0.025 * sweepSpeed) % (Math.PI * 2);
        animRef.current = requestAnimationFrame(renderRadar);
      };

      renderRadar();
    }

    return () => {
      clearInterval(vehTimer);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      map.remove();
    };
  }, [mapType, sweepSpeed]);

  const activeVeh = vehicles.find(v => v.id === selectedTarget) || vehicles[0];

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#1A202C] border border-[#2D3748] rounded-none">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-[#00A8FF] animate-spin" style={{ animationDuration: '4s' }} />
          <span className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">
            360° Circular Radar Traffic Map
          </span>
          <span className="text-[10px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 px-1.5 py-0.2">
            LIVE SWEEP
          </span>
        </div>

        {/* Quick Map Layer Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setMapType('hybrid')}
            className={`px-2 py-1 text-[11px] rounded-none border cursor-pointer transition-colors ${
              mapType === 'hybrid'
                ? 'bg-[#00A8FF] text-[#0B0F19] font-bold border-[#00A8FF]'
                : 'bg-[#0B0F19] text-[#94A3B8] border-[#2D3748] hover:text-[#F1F5F9]'
            }`}
          >
            Google Hybrid (Roads)
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2 py-1 text-[11px] rounded-none border cursor-pointer transition-colors ${
              mapType === 'satellite'
                ? 'bg-[#00A8FF] text-[#0B0F19] font-bold border-[#00A8FF]'
                : 'bg-[#0B0F19] text-[#94A3B8] border-[#2D3748] hover:text-[#F1F5F9]'
            }`}
          >
            Esri Satellite
          </button>
          <button
            onClick={() => setMapType('dark')}
            className={`px-2 py-1 text-[11px] rounded-none border cursor-pointer transition-colors ${
              mapType === 'dark'
                ? 'bg-[#00A8FF] text-[#0B0F19] font-bold border-[#00A8FF]'
                : 'bg-[#0B0F19] text-[#94A3B8] border-[#2D3748] hover:text-[#F1F5F9]'
            }`}
          >
            Dark Matter
          </button>
        </div>
      </div>

      {/* Main Map Viewport with Rotating Circular Radar Ray Overlay */}
      <div className="relative w-full h-[450px] bg-[#0B0F19] border border-[#2D3748] overflow-hidden">
        {/* Leaflet Map */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* 360° Circular Radar Sweep Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
        />

        {/* Live Status Badge */}
        <div className="absolute top-2 left-2 z-20 bg-[#0B0F19]/90 border border-[#2D3748] p-2 text-xs flex flex-col gap-1">
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[#00A8FF]" />
            RADAR BORESIGHT: 360° CONTINUOUS
          </div>
          <div className="text-[#F1F5F9] font-bold text-xs">
            NEW DELHI CENTRAL ROAD GRID
          </div>
          <div className="text-[10px] text-[#94A3B8]">
            Lat: 28.6035° N | Lon: 77.2250° E
          </div>
        </div>

        {/* Target Quick Switcher (Bottom Overlay) */}
        <div className="absolute bottom-2 left-2 right-2 z-20 bg-[#0B0F19]/90 border border-[#2D3748] p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-[#00A8FF]" />
            <span className="text-[10px] text-[#94A3B8] uppercase">TARGET LOCKED:</span>
            <span className="text-[#00A8FF] font-bold">{activeVeh.id}</span>
            <span className="text-[#10B981] text-[11px]">({activeVeh.speed})</span>
          </div>

          <div className="flex items-center gap-1">
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedTarget(v.id)}
                className={`px-2 py-0.5 text-[10px] border cursor-pointer transition-colors ${
                  selectedTarget === v.id
                    ? 'bg-[#00A8FF] text-[#0B0F19] font-bold border-[#00A8FF]'
                    : 'bg-[#1A202C] text-[#94A3B8] border-[#2D3748] hover:text-[#F1F5F9]'
                }`}
              >
                {v.id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
