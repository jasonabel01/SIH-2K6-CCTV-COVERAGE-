import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Gauge, 
  Shield, 
  ArrowRight, 
  Zap, 
  RefreshCw, 
  Layers, 
  Compass, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Radio, 
  Car, 
  Truck, 
  Bike,
  Sparkles,
  ChevronRight,
  BarChart2,
  Cpu,
  Flame,
  Crosshair,
  MinusCircle,
  HelpCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

// Map Tile Layer Providers with LIVE ROAD-MATCHING GOOGLE TRAFFIC
const MAP_PROVIDERS = {
  google_traffic_hybrid: {
    name: 'HYBRID + LIVE TRAFFIC',
    url: 'https://{s}.google.com/vt/lyrs=y,traffic&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20
  },
  google_traffic_streets: {
    name: 'STREETS + LIVE TRAFFIC',
    url: 'https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20
  },
  google_satellite: {
    name: 'SATELLITE RECON',
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20
  },
  dark_matter: {
    name: 'DARK MATTER C4ISR',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19
  }
};

// Transparent Live Traffic Tile Overlay URL (overlaid over dark maps or satellite)
const GOOGLE_TRAFFIC_OVERLAY_URL = 'https://{s}.google.com/vt/lyrs=h,traffic&x={x}&y={y}&z={z}';

// 4 Strategic Urban Macro Traffic Sectors in Delhi NCR
const SECTOR_ZONES = [
  {
    id: 'SEC_CENTRAL',
    code: 'SEC-01',
    name: 'CENTRAL DIPLOMATIC (CP / JANPATH)',
    center: [28.6250, 77.2220],
    polygon: [
      [28.6360, 77.2110],
      [28.6330, 77.2310],
      [28.6110, 77.2340],
      [28.6130, 77.2120]
    ],
    baseSpeed: 24,
    speedLimit: 50,
    baseVolume: 5800,
    baseLos: 'LOS D',
    color: '#F59E0B'
  },
  {
    id: 'SEC_RING_ROAD',
    code: 'SEC-02',
    name: 'INNER RING ARTERIAL (LAJPAT / AIIMS / ASHRAM)',
    center: [28.5680, 77.2360],
    polygon: [
      [28.5750, 77.2050],
      [28.5770, 77.2650],
      [28.5580, 77.2720],
      [28.5550, 77.2100]
    ],
    baseSpeed: 19,
    speedLimit: 60,
    baseVolume: 8400,
    baseLos: 'LOS E',
    color: '#EF4444'
  },
  {
    id: 'SEC_EXPRESSWAY',
    code: 'SEC-03',
    name: 'TRANS-YAMUNA CORRIDOR (DND / MAYUR VIHAR)',
    center: [28.5770, 77.2950],
    polygon: [
      [28.5920, 77.2680],
      [28.5870, 77.3300],
      [28.5620, 77.3320],
      [28.5660, 77.2750]
    ],
    baseSpeed: 68,
    speedLimit: 80,
    baseVolume: 6200,
    baseLos: 'LOS B',
    color: '#10B981'
  },
  {
    id: 'SEC_AIRPORT_NH48',
    code: 'SEC-04',
    name: 'AEROTROPOLIS & NH-48 (IGI T3 / AEROCITY)',
    center: [28.5450, 77.1100],
    polygon: [
      [28.6000, 77.1650],
      [28.5650, 77.1680],
      [28.4980, 77.0950],
      [28.5450, 77.0750]
    ],
    baseSpeed: 62,
    speedLimit: 70,
    baseVolume: 5100,
    baseLos: 'LOS B',
    color: '#00F0FF'
  }
];

// Origin-Destination (O-D) Commuter Flow Pairs
const OD_FLOW_PAIRS = [
  {
    id: 'OD_NOIDA_CP',
    code: 'VEC-01',
    name: 'NOIDA SEC 18 -> CONNAUGHT PLACE',
    origin: { name: 'NOIDA SEC 18 HUB', lat: 28.5700, lng: 77.3250 },
    destination: { name: 'CP RADIAL 1', lat: 28.6315, lng: 77.2167 },
    baseVolume: 2840,
    baseTripMin: 28,
    color: '#00F0FF',
    primaryClass: 'SEDANS (64%)'
  },
  {
    id: 'OD_GURGAON_AIIMS',
    code: 'VEC-02',
    name: 'NH-48 SIRHAUL -> AIIMS RING ROAD',
    origin: { name: 'NH-48 SIRHAUL BORDER', lat: 28.5020, lng: 77.0890 },
    destination: { name: 'AIIMS FLYOVER NORTH', lat: 28.5680, lng: 77.2100 },
    baseVolume: 4120,
    baseTripMin: 34,
    color: '#F59E0B',
    primaryClass: 'COMMUTERS & FREIGHT (52%)'
  },
  {
    id: 'OD_AIRPORT_CP',
    code: 'VEC-03',
    name: 'IGI AIRPORT T3 -> CONNAUGHT PLACE',
    origin: { name: 'IGI T3 DEPARTURE', lat: 28.5562, lng: 77.0855 },
    destination: { name: 'JANPATH - CP RADIAL', lat: 28.6250, lng: 77.2190 },
    baseVolume: 1850,
    baseTripMin: 26,
    color: '#10B981',
    primaryClass: 'COMMERCIAL CABS & SHUTTLES (62%)'
  },
  {
    id: 'OD_SARAI_DND',
    code: 'VEC-04',
    name: 'SARAI KALE KHAN -> DND MAYUR VIHAR',
    origin: { name: 'SARAI KALE KHAN ISBT', lat: 28.5890, lng: 77.2580 },
    destination: { name: 'DND MAYUR VIHAR MERGE', lat: 28.5702, lng: 77.3045 },
    baseVolume: 3320,
    baseTripMin: 16,
    color: '#A855F7',
    primaryClass: '2-WHEELERS & PASSENGER'
  },
  {
    id: 'OD_CP_ASHRAM',
    code: 'VEC-05',
    name: 'CONNAUGHT PLACE -> ASHRAM UNDERPASS',
    origin: { name: 'BARAKHAMBA CIRCLE', lat: 28.6292, lng: 77.2255 },
    destination: { name: 'ASHRAM CHOWK PORTAL', lat: 28.5710, lng: 77.2588 },
    baseVolume: 2640,
    baseTripMin: 24,
    color: '#EF4444',
    primaryClass: 'HIGH-DENSITY MIXED ARTERIAL'
  }
];

// Top Corridor Bottlenecks Telemetry Database
const INITIAL_BOTTLENECK_CATALOG = [
  {
    id: 'BN_ASHRAM',
    rank: 1,
    name: 'ASHRAM CHOWK UNDERPASS PORTAL',
    zone: 'INNER RING ARTERIAL',
    lat: 28.5710,
    lng: 77.2588,
    speedLimit: 60,
    baseSpeed: 18.4,
    baseQueueM: 840,
    baseDelayMin: 14.2,
    baseVc: 0.96,
    inflow: 2420,
    outflow: 1680,
    status: 'DEFCON RED // CRITICAL CHOKE',
    signalPlan: 'Extend Phase-2 Inbound Green by +18s to discharge queued vehicles onto Mathura Rd.'
  },
  {
    id: 'BN_CP_RADIAL',
    rank: 2,
    name: 'CONNAUGHT PLACE RADIAL 1 & OUTER CIRCLE',
    zone: 'CENTRAL DIPLOMATIC',
    lat: 28.6315,
    lng: 77.2167,
    speedLimit: 50,
    baseSpeed: 22.1,
    baseQueueM: 460,
    baseDelayMin: 8.5,
    baseVc: 0.88,
    inflow: 1980,
    outflow: 1510,
    status: 'SEVERE BOTTLENECK',
    signalPlan: 'Activate Green Wave progression between Radial 1 and Barakhamba (Target Speed: 40 km/h).'
  },
  {
    id: 'BN_DND_MERGE',
    rank: 3,
    name: 'DND MAYUR VIHAR EXPRESSWAY MERGE',
    zone: 'TRANS-YAMUNA CORRIDOR',
    lat: 28.5702,
    lng: 77.3045,
    speedLimit: 80,
    baseSpeed: 28.0,
    baseQueueM: 320,
    baseDelayMin: 5.0,
    baseVc: 0.81,
    inflow: 3100,
    outflow: 2650,
    status: 'MODERATE CHOKE',
    signalPlan: 'Ramp-meter Mayur Vihar on-ramp: 12 vehicles/min pulse rate to prevent mainline stall.'
  },
  {
    id: 'BN_AIIMS',
    rank: 4,
    name: 'AIIMS FLYOVER NORTH INCLINE',
    zone: 'INNER RING ARTERIAL',
    lat: 28.5680,
    lng: 77.2100,
    speedLimit: 60,
    baseSpeed: 34.5,
    baseQueueM: 290,
    baseDelayMin: 4.1,
    baseVc: 0.72,
    inflow: 2240,
    outflow: 1980,
    status: 'HEAVY CONGESTION',
    signalPlan: 'Automated emergency vehicle preemption for incoming trauma centre ambulances.'
  },
  {
    id: 'BN_SARAI',
    rank: 5,
    name: 'SARAI KALE KHAN ISBT INTERMODAL EXIT',
    zone: 'INNER RING ARTERIAL',
    lat: 28.5890,
    lng: 77.2580,
    speedLimit: 60,
    baseSpeed: 31.2,
    baseQueueM: 240,
    baseDelayMin: 3.6,
    baseVc: 0.68,
    inflow: 1850,
    outflow: 1620,
    status: 'SLOW TRANSIT',
    signalPlan: 'Coordinate bus-lane discharge cycle with Ring Road through-phase.'
  }
];

// High-Density Thermal Heat Map Radial Points
const HEAT_CONGESTION_POINTS = [
  { lat: 28.5710, lng: 77.2588, radius: 950, intensity: 0.95, label: 'ASHRAM CHOWK BOTTLENECK' },
  { lat: 28.6315, lng: 77.2167, radius: 750, intensity: 0.85, label: 'CONNAUGHT PLACE RADIAL 1' },
  { lat: 28.5702, lng: 77.3045, radius: 650, intensity: 0.78, label: 'DND MAYUR VIHAR MERGE' },
  { lat: 28.5680, lng: 77.2100, radius: 600, intensity: 0.72, label: 'AIIMS FLYOVER' },
  { lat: 28.5890, lng: 77.2580, radius: 550, intensity: 0.68, label: 'SARAI KALE KHAN ISBT' },
  { lat: 28.6180, lng: 77.2190, radius: 450, intensity: 0.55, label: 'JANPATH INTERSECTION' }
];

// Helper: Generate curved quadratic bezier coordinates between two lat/lngs for 3D Arc effect
function generateArcPoints(p1, p2, bend = 0.22, numPoints = 28) {
  const points = [];
  const dLat = p2.lat - p1.lat;
  const dLng = p2.lng - p1.lng;

  const midLat = (p1.lat + p2.lat) / 2 + dLng * bend;
  const midLng = (p1.lng + p2.lng) / 2 - dLat * bend;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * p1.lat + 2 * (1 - t) * t * midLat + t * t * p2.lat;
    const lng = (1 - t) * (1 - t) * p1.lng + 2 * (1 - t) * t * midLng + t * t * p2.lng;
    points.push([lat, lng]);
  }
  return points;
}

// Audio alert synthesizer using Web Audio API
function playTacticalSound(type = 'ping') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    if (type === 'override') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (e) {}
}

export default function UrbanTrafficAnalytics({ onSelectPlate }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const trafficOverlayLayerRef = useRef(null);
  const heatLayerGroupRef = useRef(null);
  const zonesLayerGroupRef = useRef(null);
  const arcsLayerGroupRef = useRef(null);
  const bottlenecksLayerGroupRef = useRef(null);

  // Active view modes: 'map_traffic' | 'bottlenecks' | 'signal_advisor' | 'trends'
  const [activeTab, setActiveTab] = useState('map_traffic');
  const [mapLayer, setMapLayer] = useState('google_traffic_hybrid');
  const [showLiveTrafficOverlay, setShowLiveTrafficOverlay] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showOdArcs, setShowOdArcs] = useState(true);
  const [showSectors, setShowSectors] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedOdPair, setSelectedOdPair] = useState(null);
  const [selectedBottleneck, setSelectedBottleneck] = useState(INITIAL_BOTTLENECK_CATALOG[0]);
  const [appliedSignalPlans, setAppliedSignalPlans] = useState({});
  const [signalSuccessBanner, setSignalSuccessBanner] = useState(null);

  // Time of Day Rush-Hour Simulator: in minutes (0 to 1439). Default: 18:30 (1110 min)
  const [simMinutes, setSimMinutes] = useState(1110);
  const [isPlayingTimeSim, setIsPlayingTimeSim] = useState(false);

  // Format minutes into HH:MM (24-hour)
  const formattedTime = useMemo(() => {
    const hrs = Math.floor(simMinutes / 60);
    const mins = simMinutes % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }, [simMinutes]);

  // Compute Peak Multiplier based on Time of Day
  const rushFactor = useMemo(() => {
    const h = simMinutes / 60;
    // Morning peak (08:00 to 10:30)
    if (h >= 8 && h <= 10.5) {
      const peak = 1.0 - Math.abs(h - 9.25) / 1.25;
      return 1.0 + peak * 0.75;
    }
    // Evening peak (17:30 to 20:30)
    if (h >= 17.5 && h <= 20.5) {
      const peak = 1.0 - Math.abs(h - 19.0) / 1.5;
      return 1.0 + peak * 0.95;
    }
    // Night freight (23:00 to 05:00)
    if (h >= 23 || h <= 5) {
      return 0.35;
    }
    // Midday nominal
    return 0.70;
  }, [simMinutes]);

  // Derived dynamic metrics scaled by rush factor
  const dynamicCityMetrics = useMemo(() => {
    const totalVehicles = Math.round(14820 * rushFactor);
    const avgCitySpeed = Math.max(16, Math.round(52 - (rushFactor - 0.35) * 28));
    const healthIndex = Math.max(25, Math.min(96, Math.round(100 - (rushFactor - 0.35) * 45)));

    let healthStatus = 'OPTIMAL FLOW';
    let healthColor = '#10B981';
    if (healthIndex < 50) {
      healthStatus = 'DEFCON 1 // SEVERE GRIDLOCK';
      healthColor = '#EF4444';
    } else if (healthIndex < 75) {
      healthStatus = 'ELEVATED SATURATION';
      healthColor = '#F59E0B';
    }

    return { totalVehicles, avgCitySpeed, healthIndex, healthStatus, healthColor };
  }, [rushFactor]);

  // Dynamic Bottlenecks with time scaling
  const dynamicBottlenecks = useMemo(() => {
    return INITIAL_BOTTLENECK_CATALOG.map((bn) => {
      const speed = Math.max(12, Math.round(bn.baseSpeed / (rushFactor * 0.95)));
      const queue = Math.round(bn.baseQueueM * rushFactor);
      const delay = (bn.baseDelayMin * rushFactor).toFixed(1);
      const vc = Math.min(0.99, (bn.baseVc * Math.min(1.2, rushFactor)).toFixed(2));
      const isApplied = !!appliedSignalPlans[bn.id];

      return {
        ...bn,
        currentSpeed: isApplied ? Math.round(speed * 1.35) : speed,
        currentQueue: isApplied ? Math.round(queue * 0.6) : queue,
        currentDelay: isApplied ? (delay * 0.65).toFixed(1) : delay,
        currentVc: isApplied ? (vc * 0.85).toFixed(2) : vc,
        isApplied
      };
    });
  }, [rushFactor, appliedSignalPlans]);

  // Handle Fullscreen ESC listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Recalculate Leaflet Map dimensions on Fullscreen toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  // Auto-play time simulator
  useEffect(() => {
    let interval;
    if (isPlayingTimeSim) {
      interval = setInterval(() => {
        setSimMinutes((prev) => (prev >= 1439 ? 0 : prev + 10));
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimeSim]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {}
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    // Center map over Delhi NCR arterial belt
    const map = L.map(mapContainerRef.current, {
      center: [28.5850, 77.2250],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Base Tile Layer (Default: Google Traffic Hybrid)
    const provider = MAP_PROVIDERS[mapLayer] || MAP_PROVIDERS.google_traffic_hybrid;
    const tileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains,
      attribution: '© Google Maps'
    }).addTo(map);
    baseTileLayerRef.current = tileLayer;

    // Optional Transparent Live Traffic Tile Overlay for Non-Traffic Base Maps
    const trafficOverlay = L.tileLayer(GOOGLE_TRAFFIC_OVERLAY_URL, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      opacity: 0.95
    });
    trafficOverlayLayerRef.current = trafficOverlay;

    // Layer groups for dynamic cleanups
    const heatGroup = L.layerGroup().addTo(map);
    const zonesGroup = L.layerGroup().addTo(map);
    const arcsGroup = L.layerGroup().addTo(map);
    const bnsGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    heatLayerGroupRef.current = heatGroup;
    zonesLayerGroupRef.current = zonesGroup;
    arcsLayerGroupRef.current = arcsGroup;
    bottlenecksLayerGroupRef.current = bnsGroup;

    // Resize triggers
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 300);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
      baseTileLayerRef.current = null;
      trafficOverlayLayerRef.current = null;
      heatLayerGroupRef.current = null;
      zonesLayerGroupRef.current = null;
      arcsLayerGroupRef.current = null;
      bottlenecksLayerGroupRef.current = null;
      if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }
    };
  }, []);

  // Handle Base Map Layer Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      try {
        map.removeLayer(baseTileLayerRef.current);
      } catch (e) {}
    }

    const provider = MAP_PROVIDERS[mapLayer] || MAP_PROVIDERS.google_traffic_hybrid;
    const tileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains,
      attribution: '© Google Maps'
    }).addTo(map);
    baseTileLayerRef.current = tileLayer;

    // Manage separate traffic overlay if base layer does not have traffic built-in
    if (trafficOverlayLayerRef.current) {
      const isBuiltinTraffic = mapLayer === 'google_traffic_hybrid' || mapLayer === 'google_traffic_streets';
      if (showLiveTrafficOverlay && !isBuiltinTraffic) {
        trafficOverlayLayerRef.current.addTo(map);
      } else {
        try {
          map.removeLayer(trafficOverlayLayerRef.current);
        } catch (e) {}
      }
    }
  }, [mapLayer, showLiveTrafficOverlay]);

  // Render Military-Grade Thermal Heatmap Cones & Isotherms
  useEffect(() => {
    const heatGroup = heatLayerGroupRef.current;
    if (!heatGroup) return;

    heatGroup.clearLayers();

    if (showHeatmap) {
      HEAT_CONGESTION_POINTS.forEach((pt) => {
        const scaledIntensity = Math.min(1.0, pt.intensity * rushFactor);
        const color = scaledIntensity > 0.8 ? '#EF4444' : scaledIntensity > 0.6 ? '#F59E0B' : '#10B981';

        // Outer ambient heat dispersal halo
        const outerCircle = L.circle([pt.lat, pt.lng], {
          radius: pt.radius * 1.35,
          color: color,
          weight: 0.5,
          opacity: 0.25,
          fillColor: color,
          fillOpacity: 0.08,
          interactive: false
        });

        // Core thermal density isotherm circle
        const coreCircle = L.circle([pt.lat, pt.lng], {
          radius: pt.radius,
          color: color,
          weight: 1.5,
          dashArray: '4, 4',
          opacity: 0.8,
          fillColor: color,
          fillOpacity: 0.22,
          interactive: true
        });

        coreCircle.bindTooltip(`
          <div style="font-family: monospace; font-size: 10px; background: #0B0F19; color: #F8FAFC; border: 1px solid ${color}; padding: 5px 8px;">
            <div style="color: ${color}; font-weight: bold;">[THERMAL CHOKE] ${pt.label}</div>
            <div style="color: #94A3B8;">HEAT INTENSITY: ${(scaledIntensity * 100).toFixed(0)}% // RADIUS: ${pt.radius}M</div>
          </div>
        `, { sticky: true, className: 'tactical-zone-tooltip' });

        heatGroup.addLayer(outerCircle);
        heatGroup.addLayer(coreCircle);
      });
    }
  }, [showHeatmap, rushFactor]);

  // Render Tactical Sector Boundary Polygons
  useEffect(() => {
    const zonesGroup = zonesLayerGroupRef.current;
    if (!zonesGroup) return;

    zonesGroup.clearLayers();

    if (showSectors) {
      SECTOR_ZONES.forEach((zone) => {
        const polygon = L.polygon(zone.polygon, {
          color: zone.color,
          weight: 1.2,
          dashArray: '6, 4',
          opacity: 0.75,
          fillColor: zone.color,
          fillOpacity: Math.min(0.18, 0.05 * rushFactor)
        });

        const tooltipContent = `
          <div style="font-family: monospace; font-size: 10px; background: #0B0F19; color: #F8FAFC; border: 1px solid ${zone.color}; padding: 6px 9px;">
            <div style="font-weight: 800; color: ${zone.color};">[${zone.code}] ${zone.name}</div>
            <div style="color: #94A3B8;">AVG VELOCITY: <b style="color: #FFFFFF;">${Math.round(zone.baseSpeed / rushFactor)} KM/H</b> (LIMIT: ${zone.speedLimit})</div>
            <div style="color: #94A3B8;">CORRIDOR VOLUME: <b style="color: #00F0FF;">${Math.round(zone.baseVolume * rushFactor)} VEH/HR</b></div>
            <div style="color: ${zone.color}; font-weight: bold; margin-top: 2px;">SERVICE GRADE: ${zone.baseLos}</div>
          </div>
        `;

        polygon.bindTooltip(tooltipContent, {
          sticky: true,
          direction: 'auto',
          className: 'tactical-zone-tooltip'
        });

        zonesGroup.addLayer(polygon);
      });
    }
  }, [showSectors, rushFactor]);

  // Render 3D Parabolic Origin-Destination (O-D) Flow Arcs
  useEffect(() => {
    const arcsGroup = arcsLayerGroupRef.current;
    if (!arcsGroup) return;

    arcsGroup.clearLayers();

    if (showOdArcs) {
      OD_FLOW_PAIRS.forEach((od) => {
        const curveCoords = generateArcPoints(od.origin, od.destination, 0.22, 28);
        const isSelected = selectedOdPair && selectedOdPair.id === od.id;
        const currentVol = Math.round(od.baseVolume * rushFactor);
        const currentTrip = Math.round(od.baseTripMin * (1 + (rushFactor - 0.7) * 0.6));

        // 1. Broad Ambient Glow Arc Line
        const glowArc = L.polyline(curveCoords, {
          color: od.color,
          weight: isSelected ? 8 : 4.5,
          opacity: isSelected ? 0.6 : 0.28,
          lineCap: 'round',
          lineJoin: 'round'
        });

        // 2. Crisp Core High-Speed Vector Pulse Arc
        const pulseArc = L.polyline(curveCoords, {
          color: isSelected ? '#FFFFFF' : od.color,
          weight: isSelected ? 3.5 : 2.2,
          opacity: 0.95,
          dashArray: '10, 8',
          lineCap: 'round',
          lineJoin: 'round'
        });

        pulseArc.on('click', () => {
          setSelectedOdPair(od);
          playTacticalSound('ping');
        });

        const tooltipContent = `
          <div style="font-family: monospace; font-size: 10px; background: #0B0F19; color: #F8FAFC; border: 1px solid ${od.color}; padding: 6px 9px;">
            <div style="font-weight: 800; color: ${od.color};">[${od.code}] O-D MIGRATION VECTOR</div>
            <div style="color: #FFFFFF; font-weight: bold; margin-bottom: 3px;">${od.name}</div>
            <div style="color: #94A3B8;">THROUGHPUT: <b style="color: #00F0FF;">${currentVol.toLocaleString()} VEH/HR</b></div>
            <div style="color: #94A3B8;">TRANSIT TIME: <b style="color: #FBBF24;">${currentTrip} MINS</b></div>
            <div style="color: #94A3B8;">COMPOSITION: <b style="color: #FFFFFF;">${od.primaryClass}</b></div>
          </div>
        `;

        pulseArc.bindTooltip(tooltipContent, {
          sticky: true,
          direction: 'auto',
          className: 'tactical-od-tooltip'
        });

        arcsGroup.addLayer(glowArc);
        arcsGroup.addLayer(pulseArc);

        // Origin Reticle Pin
        const originIcon = L.divIcon({
          html: `<div class="w-2.5 h-2.5 rounded-full border border-white" style="background-color: ${od.color}; box-shadow: 0 0 8px ${od.color};"></div>`,
          className: 'od-origin-pin',
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        });
        const origMarker = L.marker([od.origin.lat, od.origin.lng], { icon: originIcon });
        origMarker.bindTooltip(`[ORIGIN] ${od.origin.name}`, { direction: 'top' });
        arcsGroup.addLayer(origMarker);

        // Destination Square Reticle Pin
        const destIcon = L.divIcon({
          html: `<div class="w-3 h-3 rounded-none border border-white" style="background-color: ${od.color}; box-shadow: 0 0 8px ${od.color};"></div>`,
          className: 'od-dest-pin',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
        const destMarker = L.marker([od.destination.lat, od.destination.lng], { icon: destIcon });
        destMarker.bindTooltip(`[DESTINATION] ${od.destination.name}`, { direction: 'top' });
        arcsGroup.addLayer(destMarker);
      });
    }
  }, [showOdArcs, rushFactor, selectedOdPair]);

  // Render Ranked Bottleneck Markers matching Google Traffic Style
  useEffect(() => {
    const bnsGroup = bottlenecksLayerGroupRef.current;
    if (!bnsGroup) return;

    bnsGroup.clearLayers();

    dynamicBottlenecks.forEach((bn) => {
      const isSelected = selectedBottleneck && selectedBottleneck.id === bn.id;
      
      // Google-Style Round Red Minus Badge or Military Choke Tag
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-7 h-7 rounded-full bg-[#EF4444]/30 ${bn.currentVc > 0.85 ? 'animate-ping' : ''}"></div>
          <div class="w-5 h-5 rounded-full bg-[#EF4444] text-[#FFFFFF] font-black text-[9px] flex items-center justify-center font-mono border-2 ${isSelected ? 'border-[#FFFFFF] scale-125 ring-2 ring-[#00F0FF]' : 'border-[#0A0B0E]'} shadow-[0_0_10px_#EF4444]">
            -
          </div>
          <div class="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0B0F19] text-[#EF4444] border border-[#EF4444] px-1 py-0 text-[8px] font-mono font-bold">
            #${bn.rank}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'bn-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([bn.lat, bn.lng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedBottleneck(bn);
        playTacticalSound('ping');
      });

      marker.bindTooltip(`
        <div style="font-family: monospace; font-size: 10px; background: #0B0F19; color: #F8FAFC; border: 1px solid #EF4444; padding: 5px 8px;">
          <div style="color: #EF4444; font-weight: bold;">[CHOKEPOINT #${bn.rank}] ${bn.name}</div>
          <div>VELOCITY: <b>${bn.currentSpeed} KM/H</b> | QUEUE: <b>${bn.currentQueue}M</b></div>
          <div style="color: #94A3B8;">DELAY: <b>+${bn.currentDelay} MIN</b> | V/C: <b>${bn.currentVc}</b></div>
        </div>
      `, {
        direction: 'top',
        className: 'tactical-bn-tooltip'
      });

      bnsGroup.addLayer(marker);
    });
  }, [dynamicBottlenecks, selectedBottleneck]);

  // Handle Deploying Signal Plan
  const handleDeploySignalPlan = (bnId) => {
    setAppliedSignalPlans((prev) => ({ ...prev, [bnId]: true }));
    playTacticalSound('override');
    const targetBn = INITIAL_BOTTLENECK_CATALOG.find((b) => b.id === bnId);
    setSignalSuccessBanner({
      title: `[DEPLOYED] AI SIGNAL PLAN ACTIVE AT #${targetBn.rank} ${targetBn.name}`,
      desc: `Green split increased. Estimated queue reduction: -40%. V/C lowered below 0.80.`
    });
    setTimeout(() => {
      setSignalSuccessBanner(null);
    }, 5500);
  };

  return (
    <div className={`bg-[#0A0B0E] border border-[#262933] overflow-hidden flex flex-col font-mono select-none transition-all ${
      isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'relative w-full h-[640px]'
    }`}>

      {/* Top Tactical Status Bar */}
      <div className="h-10 bg-[#13151B] border-b border-[#262933] px-3 flex items-center justify-between text-xs shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
            <Activity className="w-4 h-4 text-[#10B981] animate-pulse" />
            <span>SYS://URBAN.TRAFFIC.C4ISR</span>
          </div>
          <span className="text-[#374151]">|</span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[#94A3B8]">NETWORK STATE:</span>
            <span 
              className="font-bold px-2 py-0.5 border"
              style={{
                color: dynamicCityMetrics.healthColor,
                borderColor: `${dynamicCityMetrics.healthColor}80`,
                backgroundColor: `${dynamicCityMetrics.healthColor}15`
              }}
            >
              INDEX {dynamicCityMetrics.healthIndex}/100 [{dynamicCityMetrics.healthStatus}]
            </span>
          </div>
          <span className="text-[#374151]">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#00F0FF]">
            <Radio className="w-3 h-3 text-[#00F0FF] animate-ping" />
            <span>{dynamicCityMetrics.totalVehicles.toLocaleString()} VEH/HR</span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0B0F19] border border-[#262933] p-0.5">
            {[
              { id: 'map_traffic', label: 'LIVE ROAD TRAFFIC', icon: Compass },
              { id: 'bottlenecks', label: 'CHOKEPOINTS', icon: AlertTriangle },
              { id: 'signal_advisor', label: 'SIGNAL ADVISOR', icon: Cpu },
              { id: 'trends', label: 'VELOCITY CURVES', icon: BarChart2 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#10B981] text-[#0A0B0E] font-black shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'text-[#94A3B8] hover:text-[#FFFFFF]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 bg-[#1C1F26] border border-[#374151] hover:text-[#FFFFFF] text-[#94A3B8] cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="relative flex-1 w-full min-h-0 bg-[#0A0B0E] flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT / CENTER VIEWPORT (The Visual Engine) */}
        <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden">
          
          {/* TAB 1: GIS Map with Live Road Matching Traffic & Heatmap */}
          <div className={`w-full h-full relative ${activeTab === 'map_traffic' ? 'block' : 'hidden'}`}>
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" style={{ background: '#0A0B0E' }} />

            {/* Top Tactical Controls: Layer & Toggles */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5">
              {/* Map Layer Switcher */}
              <div className="flex items-center bg-[#0B0F19]/90 border border-[#262933] p-0.5 backdrop-blur-md">
                {Object.keys(MAP_PROVIDERS).map((k) => (
                  <button
                    key={k}
                    onClick={() => setMapLayer(k)}
                    className={`px-2 py-0.5 text-[9px] font-bold cursor-pointer transition-all ${
                      mapLayer === k ? 'bg-[#00F0FF] text-[#0A0B0E] font-black' : 'text-[#94A3B8] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {MAP_PROVIDERS[k].name}
                  </button>
                ))}
              </div>

              {/* Layer Toggles (Heatmap, Arcs, Sectors) */}
              <div className="flex items-center gap-1 bg-[#0B0F19]/90 border border-[#262933] p-1 text-[9px] backdrop-blur-md">
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-1.5 py-0.5 border cursor-pointer transition-all flex items-center gap-1 ${
                    showHeatmap ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] font-bold' : 'border-[#374151] text-[#94A3B8]'
                  }`}
                >
                  <Flame className="w-2.5 h-2.5" />
                  <span>HEAT MAP: {showHeatmap ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => setShowOdArcs(!showOdArcs)}
                  className={`px-1.5 py-0.5 border cursor-pointer transition-all flex items-center gap-1 ${
                    showOdArcs ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold' : 'border-[#374151] text-[#94A3B8]'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>O-D ARCS: {showOdArcs ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => setShowSectors(!showSectors)}
                  className={`px-1.5 py-0.5 border cursor-pointer transition-all flex items-center gap-1 ${
                    showSectors ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] font-bold' : 'border-[#374151] text-[#94A3B8]'
                  }`}
                >
                  <Shield className="w-2.5 h-2.5" />
                  <span>SECTORS: {showSectors ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Bottom-Left Live Traffic Legend (Matching the User's Screenshot Exactly) */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-[#0B0F19]/95 border border-[#262933] px-3 py-2 text-[10px] space-y-1.5 backdrop-blur-md shadow-2xl">
              <div className="text-[#CBD5E1] font-bold text-[9px] uppercase tracking-wider flex items-center justify-between border-b border-[#262933] pb-1">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#10B981]" />
                  LIVE TRAFFIC STREAM (ROAD MATCHING)
                </span>
                <span className="text-[#10B981] font-mono text-[8px]">[LIVE GOOGLE TILE FEED]</span>
              </div>
              
              {/* Traffic Speed Color Bar */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[#94A3B8] text-[9px]">FAST</span>
                <div className="flex items-center gap-1">
                  <span className="w-7 h-2 bg-[#10B981] rounded-none" title="Fast / Free Flow (>60 km/h)" />
                  <span className="w-7 h-2 bg-[#F59E0B] rounded-none" title="Moderate / Steady (30-50 km/h)" />
                  <span className="w-7 h-2 bg-[#EF4444] rounded-none" title="Slow / Heavy (<20 km/h)" />
                  <span className="w-7 h-2 bg-[#7F1D1D] rounded-none" title="Gridlock / Stalled Stop-and-Go" />
                </div>
                <span className="text-[#94A3B8] text-[9px]">SLOW</span>
              </div>

              {/* Chokepoint & Incident indicator symbols */}
              <div className="flex items-center justify-between text-[8.5px] text-[#94A3B8] pt-1 border-t border-[#262933]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] text-white flex items-center justify-center font-bold text-[8px]">-</span>
                  <span>CHOKE POINT</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-[#EF4444] bg-[#EF4444]/30" />
                  <span>THERMAL ISOTHERM</span>
                </span>
              </div>
            </div>

            {/* Selected O-D Pair Detail Modal */}
            {selectedOdPair && (
              <div className="absolute top-3 left-3 z-[1000] w-80 bg-[#13151B]/95 border border-[#00F0FF] p-3 text-xs space-y-2 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                <div className="flex items-center justify-between border-b border-[#262933] pb-1.5">
                  <span className="font-bold text-[#FFFFFF] text-[11px] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00F0FF]" />
                    [{selectedOdPair.code}] O-D CORRIDOR INSPECTOR
                  </span>
                  <button onClick={() => setSelectedOdPair(null)} className="text-[#94A3B8] hover:text-[#FFFFFF] cursor-pointer text-xs font-mono font-bold">[X]</button>
                </div>
                <div className="text-[#00F0FF] font-bold text-xs">{selectedOdPair.name}</div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  <div className="p-1.5 bg-[#1C1F26] border border-[#262933]">
                    <span className="text-[#94A3B8] block text-[8px]">THROUGHPUT</span>
                    <span className="text-[#FFFFFF] font-bold">{Math.round(selectedOdPair.baseVolume * rushFactor).toLocaleString()} VEH/HR</span>
                  </div>
                  <div className="p-1.5 bg-[#1C1F26] border border-[#262933]">
                    <span className="text-[#94A3B8] block text-[8px]">TRANSIT DURATION</span>
                    <span className="text-[#FBBF24] font-bold">{Math.round(selectedOdPair.baseTripMin * (1 + (rushFactor - 0.7) * 0.6))} MINS</span>
                  </div>
                </div>
                <div className="text-[10px] text-[#CBD5E1]">
                  <span className="text-[#94A3B8]">FLEET CLASSIFICATION:</span> {selectedOdPair.primaryClass}
                </div>
              </div>
            )}
          </div>

          {/* TAB 2: Bottleneck Leaderboard Full Table */}
          {activeTab === 'bottlenecks' && (
            <div className="w-full h-full p-4 overflow-y-auto space-y-3 bg-[#0A0B0E]">
              <div className="flex items-center justify-between border-b border-[#262933] pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                  <span className="font-bold text-sm text-[#F8FAFC]">CITY CHOKE-POINT SEVERITY MATRIX</span>
                </div>
                <span className="text-[10px] text-[#94A3B8]">IRC / MoRTH SATURATION AUDIT</span>
              </div>

              <div className="space-y-2">
                {dynamicBottlenecks.map((bn) => (
                  <div
                    key={bn.id}
                    onClick={() => setSelectedBottleneck(bn)}
                    className={`p-3 border transition-all cursor-pointer ${
                      selectedBottleneck?.id === bn.id
                        ? 'bg-[#1C1F26] border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'bg-[#13151B] border-[#262933] hover:border-[#374151]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-none bg-[#EF4444] text-[#0A0B0E] font-black text-xs flex items-center justify-center font-mono">
                          #{bn.rank}
                        </span>
                        <div>
                          <div className="text-[#FFFFFF] font-bold text-xs">{bn.name}</div>
                          <div className="text-[#94A3B8] text-[10px]">{bn.zone}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right font-mono">
                        <div>
                          <span className="text-[#94A3B8] text-[9px] block">AVG SPEED</span>
                          <span className={`text-xs font-bold ${bn.currentSpeed < 20 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                            {bn.currentSpeed} KM/H
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] text-[9px] block">QUEUE LENGTH</span>
                          <span className="text-xs font-bold text-[#FFFFFF]">{bn.currentQueue} METERS</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] text-[9px] block">DELAY</span>
                          <span className="text-xs font-bold text-[#EF4444]">+{bn.currentDelay} MIN</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] text-[9px] block">V/C RATIO</span>
                          <span className="text-xs font-bold text-[#00F0FF]">{bn.currentVc}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Signal Recommendation preview */}
                    <div className="mt-2 pt-2 border-t border-[#262933] flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                        <Cpu className="w-3 h-3 text-[#10B981]" />
                        <span className="text-[#94A3B8]">AI RECOVERY REC:</span>
                        <span className="text-[#E2E8F0]">{bn.signalPlan}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeploySignalPlan(bn.id);
                        }}
                        disabled={bn.isApplied}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-none cursor-pointer transition-all border ${
                          bn.isApplied
                            ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] cursor-not-allowed'
                            : 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-[#0A0B0E]'
                        }`}
                      >
                        {bn.isApplied ? '[PLAN DEPLOYED]' : 'EXECUTE OVERRIDE'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AI Adaptive Signal Advisor Engine */}
          {activeTab === 'signal_advisor' && (
            <div className="w-full h-full p-4 overflow-y-auto space-y-3 bg-[#0A0B0E]">
              <div className="flex items-center justify-between border-b border-[#262933] pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#10B981]" />
                  <span className="font-bold text-sm text-[#F8FAFC]">AI ADAPTIVE SIGNAL TIMING & GREEN-WAVE CONTROLLER</span>
                </div>
                <span className="text-[10px] text-[#10B981] font-bold">SCATS / ITMS PROTOCOL READY</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dynamicBottlenecks.map((bn) => (
                  <div key={bn.id} className="p-3 bg-[#13151B] border border-[#262933] space-y-2.5 relative">
                    <div className="flex items-center justify-between border-b border-[#262933] pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#FFFFFF]">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                        <span>#{bn.rank} {bn.name}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#1C1F26] text-[#94A3B8] border border-[#374151]">
                        LOS: {bn.currentVc > 0.85 ? 'LOS F (FAILURE)' : 'LOS E (SATURATED)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                      <div className="p-1 bg-[#1A1C23]">
                        <span className="text-[#94A3B8] text-[8px] block">QUEUE DELTA</span>
                        <span className="text-[#10B981] font-bold">-40% (-340M)</span>
                      </div>
                      <div className="p-1 bg-[#1A1C23]">
                        <span className="text-[#94A3B8] text-[8px] block">VELOCITY DELTA</span>
                        <span className="text-[#00F0FF] font-bold">+8.4 KM/H</span>
                      </div>
                      <div className="p-1 bg-[#1A1C23]">
                        <span className="text-[#94A3B8] text-[8px] block">THROUGHPUT</span>
                        <span className="text-[#FBBF24] font-bold">+420 VEH/HR</span>
                      </div>
                    </div>

                    <div className="p-2 bg-[#0B0F19] border border-[#262933] text-[10.5px] text-[#CBD5E1] space-y-1">
                      <div className="text-[#94A3B8] text-[8.5px] font-bold uppercase tracking-wider">RECOMMENDED ACTION:</div>
                      <div>{bn.signalPlan}</div>
                    </div>

                    <button
                      onClick={() => handleDeploySignalPlan(bn.id)}
                      disabled={bn.isApplied}
                      className={`w-full py-1.5 text-xs font-bold rounded-none cursor-pointer transition-all border flex items-center justify-center gap-1.5 ${
                        bn.isApplied
                          ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] cursor-not-allowed'
                          : 'bg-[#10B981] hover:bg-[#059669] text-[#0A0B0E] font-black border-[#10B981]'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{bn.isApplied ? '[PLAN ENGAGED] ACTIVE AT CONTROLLER' : 'EXECUTE AI SIGNAL OVERRIDE'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 24-Hour Tactical Graphs & Velocity Curves */}
          {activeTab === 'trends' && (
            <div className="w-full h-full p-4 overflow-y-auto space-y-4 bg-[#0A0B0E]">
              <div className="flex items-center justify-between border-b border-[#262933] pb-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#00F0FF]" />
                  <span className="font-bold text-sm text-[#F8FAFC]">24-HOUR SPEED PROFILE & FLEET COMPOSITION</span>
                </div>
                <span className="text-[10px] text-[#CBD5E1]">REAL-TIME TELEMETRY TIME-SERIES</span>
              </div>

              {/* 24-Hour Speed Dip Tactical SVG Graph */}
              <div className="p-3 bg-[#13151B] border border-[#262933] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#FFFFFF]">AVERAGE ARTERIAL VELOCITY (KM/H) OVER 24 HOURS</span>
                  <span className="text-[#94A3B8] text-[10px]">CURRENT SIMULATED TIME: <b className="text-[#FBBF24]">{formattedTime}</b></span>
                </div>

                <div className="w-full h-36 relative">
                  <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
                    <line x1="0" y1="30" x2="600" y2="30" stroke="#262933" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="600" y2="60" stroke="#262933" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="600" y2="90" stroke="#262933" strokeDasharray="3 3" />

                    <defs>
                      <linearGradient id="speedGradMil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <polygon 
                      points="0,20 60,20 120,22 180,25 210,85 240,95 270,70 330,55 390,52 440,92 480,100 520,70 560,40 600,22 600,120 0,120" 
                      fill="url(#speedGradMil)" 
                    />

                    <polyline
                      fill="none"
                      stroke="#00F0FF"
                      strokeWidth="2.5"
                      points="0,20 60,20 120,22 180,25 210,85 240,95 270,70 330,55 390,52 440,92 480,100 520,70 560,40 600,22"
                    />

                    {(() => {
                      const curX = (simMinutes / 1440) * 600;
                      return (
                        <g>
                          <line x1={curX} y1="0" x2={curX} y2="120" stroke="#FBBF24" strokeWidth="2" strokeDasharray="4 2" />
                          <circle cx={curX} cy="55" r="4" fill="#FBBF24" />
                        </g>
                      );
                    })()}
                  </svg>

                  <div className="flex justify-between text-[8.5px] text-[#94A3B8] font-mono mt-1">
                    <span>00:00</span>
                    <span>04:00</span>
                    <span className="text-[#EF4444] font-bold">08:30 [RUSH]</span>
                    <span>12:00</span>
                    <span>16:00</span>
                    <span className="text-[#EF4444] font-bold">18:30 [PEAK]</span>
                    <span>21:00</span>
                    <span>23:59</span>
                  </div>
                </div>
              </div>

              {/* Fleet Composition Distribution Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'SEDANS & SUVS', pct: '48%', count: Math.round(dynamicCityMetrics.totalVehicles * 0.48), icon: Car, color: '#00F0FF' },
                  { label: '2-WHEELERS', pct: '26%', count: Math.round(dynamicCityMetrics.totalVehicles * 0.26), icon: Bike, color: '#A855F7' },
                  { label: 'COMMERCIAL TRUCKS', pct: '14%', count: Math.round(dynamicCityMetrics.totalVehicles * 0.14), icon: Truck, color: '#F97316' },
                  { label: 'AUTO & CABS', pct: '12%', count: Math.round(dynamicCityMetrics.totalVehicles * 0.12), icon: Car, color: '#FBBF24' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="p-2.5 bg-[#13151B] border border-[#262933] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                        <span className="truncate">{item.label}</span>
                        <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                      </div>
                      <div className="text-sm font-bold text-[#FFFFFF]">{item.pct}</div>
                      <div className="text-[9px] text-[#CBD5E1]">{item.count.toLocaleString()} VEH/HR</div>
                      <div className="w-full h-1 bg-[#262933] mt-1">
                        <div className="h-full" style={{ width: item.pct, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Floating Plan Deployment Success Toast */}
          {signalSuccessBanner && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-lg bg-[#13151B]/95 border-2 border-[#10B981] p-3 text-xs shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
              <div>
                <div className="text-[#10B981] font-bold text-[11px]">{signalSuccessBanner.title}</div>
                <div className="text-[#E2E8F0] text-[10px] mt-0.5">{signalSuccessBanner.desc}</div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR: Live Choke Point Inspector & Active Signal Override */}
        <div className="w-full lg:w-80 bg-[#13151B] border-t lg:border-t-0 lg:border-l border-[#262933] p-3 text-xs flex flex-col justify-between shrink-0 overflow-y-auto space-y-3">
          
          {/* Section 1: Bottleneck Inspector Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#262933] pb-1.5">
              <span className="font-bold text-[#FFFFFF] text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                CHOKE POINT INSPECTOR
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-[#EF4444]/20 text-[#EF4444] font-bold border border-[#EF4444]">
                CRITICAL #{selectedBottleneck.rank}
              </span>
            </div>

            <div className="text-[#FFFFFF] font-bold text-xs">{selectedBottleneck.name}</div>
            <div className="text-[#94A3B8] text-[10px]">{selectedBottleneck.zone}</div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              <div className="p-2 bg-[#1C1F26] border border-[#262933]">
                <span className="text-[#94A3B8] text-[8.5px] block">CURRENT SPEED</span>
                <span className={`text-sm font-black ${selectedBottleneck.currentSpeed < 20 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                  {selectedBottleneck.currentSpeed} KM/H
                </span>
                <span className="text-[8px] text-[#94A3B8] block">LIMIT: {selectedBottleneck.speedLimit} KM/H</span>
              </div>
              <div className="p-2 bg-[#1C1F26] border border-[#262933]">
                <span className="text-[#94A3B8] text-[8.5px] block">QUEUE LENGTH</span>
                <span className="text-sm font-black text-[#FFFFFF]">{selectedBottleneck.currentQueue}M</span>
                <span className="text-[8px] text-[#EF4444] block">+{selectedBottleneck.currentDelay} MIN DELAY</span>
              </div>
            </div>

            <div className="p-2 bg-[#1A1C23] border border-[#262933] space-y-1 text-[10px]">
              <div className="flex justify-between text-[#CBD5E1]">
                <span>INFLOW / OUTFLOW:</span>
                <span className="font-bold text-[#FFFFFF]">{selectedBottleneck.inflow} / {selectedBottleneck.outflow} VEH/HR</span>
              </div>
              <div className="flex justify-between text-[#CBD5E1]">
                <span>V/C SATURATION:</span>
                <span className={`font-bold ${selectedBottleneck.currentVc > 0.85 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                  {selectedBottleneck.currentVc} [LEVEL {selectedBottleneck.currentVc > 0.85 ? 'F' : 'E'}]
                </span>
              </div>
            </div>

            {/* AI Signal Recovery Card */}
            <div className="p-2.5 bg-[#0B0F19] border border-[#10B981]/50 space-y-1.5 text-[10px]">
              <div className="flex items-center gap-1.5 text-[#10B981] font-bold text-[9.5px]">
                <Cpu className="w-3.5 h-3.5" />
                <span>AI SIGNAL OVERRIDE ADVISOR</span>
              </div>
              <div className="text-[#CBD5E1] text-[9.5px] leading-tight">
                {selectedBottleneck.signalPlan}
              </div>
              <button
                onClick={() => handleDeploySignalPlan(selectedBottleneck.id)}
                disabled={selectedBottleneck.isApplied}
                className={`w-full py-1 text-[10px] font-bold rounded-none cursor-pointer transition-all border flex items-center justify-center gap-1 ${
                  selectedBottleneck.isApplied
                    ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] cursor-not-allowed'
                    : 'bg-[#10B981] hover:bg-[#059669] text-[#0A0B0E] font-black border-[#10B981]'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>{selectedBottleneck.isApplied ? '[PLAN ENGAGED] -40% QUEUE' : 'DEPLOY SIGNAL RECOVERY'}</span>
              </button>
            </div>
          </div>

          {/* Quick Jump to Other Choke Points */}
          <div className="border-t border-[#262933] pt-2 space-y-1">
            <span className="text-[9px] text-[#94A3B8] uppercase tracking-wider block">TARGET CHOKE POINT:</span>
            <div className="grid grid-cols-5 gap-1">
              {dynamicBottlenecks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBottleneck(b)}
                  className={`py-1 text-[9px] font-bold font-mono border transition-all cursor-pointer ${
                    selectedBottleneck.id === b.id
                      ? 'bg-[#EF4444] text-[#0A0B0E] border-[#EF4444] font-black'
                      : 'bg-[#1C1F26] text-[#CBD5E1] border-[#374151] hover:border-[#CBD5E1]'
                  }`}
                >
                  #{b.rank}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom 24-Hour Rush-Hour Simulator Control Bar */}
      <div className="h-14 bg-[#13151B] border-t border-[#262933] px-4 flex items-center justify-between gap-4 text-xs shrink-0 z-10">
        
        {/* Play / Reset Time Simulator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlayingTimeSim(!isPlayingTimeSim)}
            className="px-2.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-[#0A0B0E] font-black text-xs flex items-center gap-1.5 cursor-pointer rounded-none transition-all shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          >
            {isPlayingTimeSim ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlayingTimeSim ? 'PAUSE CLOCK' : 'SIMULATE 24H'}</span>
          </button>
          
          <div className="text-center font-mono">
            <span className="text-[9px] text-[#94A3B8] block">TIME OF DAY</span>
            <span className="text-sm font-black text-[#FBBF24]">{formattedTime}</span>
          </div>
        </div>

        {/* 24-Hour Slider with Preset Rush Buttons */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#94A3B8] text-[9px]">PRESETS:</span>
              {[
                { label: 'MORNING (08:30)', min: 510 },
                { label: 'MIDDAY (13:30)', min: 810 },
                { label: 'PEAK (18:30)', min: 1110 },
                { label: 'NIGHT (01:30)', min: 90 }
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setSimMinutes(p.min);
                    setIsPlayingTimeSim(false);
                  }}
                  className={`px-1.5 py-0.5 text-[8.5px] border cursor-pointer transition-all ${
                    Math.abs(simMinutes - p.min) < 30
                      ? 'bg-[#FBBF24]/20 border-[#FBBF24] text-[#FBBF24] font-bold'
                      : 'bg-[#1C1F26] border-[#374151] text-[#94A3B8] hover:text-[#FFFFFF]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <span className="text-[#00F0FF] font-bold text-[9.5px]">
              RUSH FACTOR: {rushFactor.toFixed(2)}x // {dynamicCityMetrics.totalVehicles.toLocaleString()} VEH/HR
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1439"
            step="10"
            value={simMinutes}
            onChange={(e) => {
              setSimMinutes(parseInt(e.target.value));
              setIsPlayingTimeSim(false);
            }}
            className="w-full h-1.5 bg-[#262933] rounded-none appearance-none cursor-pointer accent-[#10B981]"
          />
        </div>

        {/* Global Average Speed readout */}
        <div className="hidden sm:flex items-center gap-3 bg-[#1C1F26] px-3 py-1 border border-[#262933] shrink-0 font-mono">
          <div>
            <div className="text-[8.5px] text-[#94A3B8]">CITY AVG VELOCITY</div>
            <div className="font-black text-sm text-[#10B981]">
              {dynamicCityMetrics.avgCitySpeed} KM/H
            </div>
          </div>
          <div className="w-[1px] h-6 bg-[#262933]" />
          <div>
            <div className="text-[8.5px] text-[#94A3B8]">CORRIDOR DENSITY</div>
            <div className="font-bold text-xs text-[#FFFFFF]">
              {Math.round(rushFactor * 68)}%
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
