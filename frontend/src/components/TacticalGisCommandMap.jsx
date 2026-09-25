import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldAlert, 
  AlertTriangle, 
  Radio, 
  Compass, 
  Crosshair, 
  Eye, 
  Layers, 
  Camera, 
  Video, 
  Maximize2, 
  Minimize2, 
  MapPin, 
  Car, 
  Clock, 
  Gauge, 
  Siren, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  Navigation,
  Upload,
  Film,
  Activity,
  Zap,
  FastForward
} from 'lucide-react';

// Fix Leaflet default marker icon issue in Vite bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Map Layer Providers with Live Road-Matching Google Traffic
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
    name: 'SATELLITE',
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20
  }
};

// Camera Network Database across Delhi NCR Corridors with Real Video Stream Bindings
const CAMERA_FLEET = [
  { id: 'CAM_DEL_CP_01', name: 'Connaught Place Radial 1', lat: 28.6315, lng: 77.2167, bearing: 45, status: 'ONLINE', fps: 30.1, speedLimit: 50, zone: 'Central', videoUrl: '/videos/feed3.mp4' },
  { id: 'CAM_DEL_CP_19', name: 'Barakhamba Outer Circle', lat: 28.6292, lng: 77.2255, bearing: 110, status: 'ONLINE', fps: 29.8, speedLimit: 50, zone: 'Central', videoUrl: '/videos/feed3.mp4' },
  { id: 'CAM_DEL_JANPATH_02', name: 'Janpath - Rajpath Intersection', lat: 28.6180, lng: 77.2190, bearing: 180, status: 'ONLINE', fps: 30.0, speedLimit: 50, zone: 'Central', videoUrl: '/videos/feed3.mp4' },
  { id: 'CAM_DEL_IG_03', name: 'India Gate C-Hexagon North', lat: 28.6145, lng: 77.2295, bearing: 180, status: 'ONLINE', fps: 30.0, speedLimit: 60, zone: 'Diplomatic', videoUrl: '/videos/feed3.mp4' },
  { id: 'CAM_DEL_IG_04', name: 'India Gate C-Hexagon South', lat: 28.6105, lng: 77.2285, bearing: 0, status: 'ONLINE', fps: 30.0, speedLimit: 60, zone: 'Diplomatic', videoUrl: '/videos/feed3.mp4' },
  { id: 'CAM_DEL_SARAI_KALE_08', name: 'Sarai Kale Khan ISBT Intermodal', lat: 28.5890, lng: 77.2580, bearing: 160, status: 'ONLINE', fps: 30.0, speedLimit: 60, zone: 'Ring Road', videoUrl: '/videos/feed2.mp4' },
  { id: 'CAM_DEL_DND_01', name: 'DND Flyway Toll Plaza Entry', lat: 28.5832, lng: 77.2798, bearing: 135, status: 'ONLINE', fps: 30.0, speedLimit: 80, zone: 'Highway', videoUrl: '/videos/traffic_demo.mp4' },
  { id: 'CAM_DEL_DND_02', name: 'DND Yamuna River Bridge Mid', lat: 28.5770, lng: 77.2910, bearing: 130, status: 'ONLINE', fps: 29.7, speedLimit: 80, zone: 'Highway', videoUrl: '/videos/traffic_demo.mp4' },
  { id: 'CAM_DEL_DND_03', name: 'DND Mayur Vihar Merge', lat: 28.5702, lng: 77.3045, bearing: 125, status: 'ONLINE', fps: 30.2, speedLimit: 80, zone: 'Highway', videoUrl: '/videos/traffic_demo.mp4' },
  { id: 'CAM_DEL_NOIDA_01', name: 'Noida Sector 18 Expressway Link', lat: 28.5700, lng: 77.3250, bearing: 110, status: 'ONLINE', fps: 30.0, speedLimit: 70, zone: 'Highway', videoUrl: '/videos/traffic_demo.mp4' },
  { id: 'CAM_DEL_ASHRAM_07', name: 'Ashram Chowk Underpass Portal', lat: 28.5710, lng: 77.2588, bearing: 210, status: 'ONLINE', fps: 30.0, speedLimit: 60, zone: 'Arterial', videoUrl: '/videos/feed2.mp4' },
  { id: 'CAM_DEL_MATHURA_02', name: 'Mathura Road Friends Colony South', lat: 28.5620, lng: 77.2710, bearing: 150, status: 'ONLINE', fps: 29.9, speedLimit: 60, zone: 'Arterial', videoUrl: '/videos/feed2.mp4' },
  { id: 'CAM_DEL_LAJPAT_05', name: 'Ring Road Lajpat Nagar Flyover', lat: 28.5685, lng: 77.2420, bearing: 260, status: 'ONLINE', fps: 28.9, speedLimit: 70, zone: 'Ring Road', videoUrl: '/videos/feed2.mp4' },
  { id: 'CAM_DEL_MOOL_04', name: 'Moolchand Hospital Junction', lat: 28.5650, lng: 77.2340, bearing: 250, status: 'ONLINE', fps: 30.0, speedLimit: 60, zone: 'Ring Road', videoUrl: '/videos/feed2.mp4' },
  { id: 'CAM_DEL_AIIMS_09', name: 'AIIMS Flyover North Incline', lat: 28.5680, lng: 77.2100, bearing: 270, status: 'ONLINE', fps: 29.9, speedLimit: 60, zone: 'Ring Road', videoUrl: '/videos/feed4.mp4' },
  { id: 'CAM_DEL_DHAULA_02', name: 'Dhaula Kuan Cloverleaf Portal', lat: 28.5930, lng: 77.1610, bearing: 240, status: 'ONLINE', fps: 30.0, speedLimit: 70, zone: 'Transit', videoUrl: '/videos/feed4.mp4' },
  { id: 'CAM_DEL_AEROCITY_05', name: 'Aerocity Hospitality Corridor', lat: 28.5490, lng: 77.1210, bearing: 230, status: 'ONLINE', fps: 30.1, speedLimit: 60, zone: 'Airport', videoUrl: '/videos/feed4.mp4' },
  { id: 'CAM_DEL_IGI_T3_29', name: 'IGI Airport T3 Departure Ramp', lat: 28.5562, lng: 77.0855, bearing: 220, status: 'ONLINE', fps: 30.1, speedLimit: 60, zone: 'Airport', videoUrl: '/videos/feed4.mp4' },
  { id: 'CAM_DEL_GURGAON_01', name: 'NH-48 Sirhaul Toll Border', lat: 28.5020, lng: 77.0890, bearing: 215, status: 'ONLINE', fps: 29.5, speedLimit: 80, zone: 'Interstate', videoUrl: '/videos/traffic_demo.mp4' }
];

// Real-Time Traffic Corridors with Speed & Congestion Classification
const TRAFFIC_CORRIDORS = [
  {
    id: 'CORR_DND',
    name: 'DND Flyway Expressway',
    color: '#10B981', // Green
    speed: 74,
    flowRate: 142,
    status: 'FREE FLOW',
    coords: [
      [28.5860, 77.2720],
      [28.5832, 77.2798],
      [28.5770, 77.2910],
      [28.5702, 77.3045],
      [28.5630, 77.3180]
    ]
  },
  {
    id: 'CORR_RING_ROAD',
    name: 'Mahatma Gandhi Ring Road (Lajpat-AIIMS)',
    color: '#F59E0B', // Amber
    speed: 38,
    flowRate: 210,
    status: 'MODERATE FLOW',
    coords: [
      [28.5730, 77.2530],
      [28.5685, 77.2420],
      [28.5650, 77.2340],
      [28.5680, 77.2100],
      [28.5720, 77.1950]
    ]
  },
  {
    id: 'CORR_ASHRAM',
    name: 'Ashram Chowk Chokepoint & Underpass',
    color: '#EF4444', // Red
    speed: 14,
    flowRate: 285,
    status: 'HEAVY CONGESTION',
    coords: [
      [28.5770, 77.2640],
      [28.5710, 77.2588],
      [28.5660, 77.2520]
    ]
  },
  {
    id: 'CORR_CP_RADIAL',
    name: 'Connaught Place - Barakhamba Arterial',
    color: '#F97316', // Orange
    speed: 22,
    flowRate: 195,
    status: 'SLOW GRIDLOCK',
    coords: [
      [28.6340, 77.2140],
      [28.6315, 77.2167],
      [28.6292, 77.2255],
      [28.6210, 77.2280],
      [28.6145, 77.2295]
    ]
  },
  {
    id: 'CORR_NH48_AIRPORT',
    name: 'NH-48 Sirhaul / IGI Airport Express',
    color: '#10B981', // Green
    speed: 68,
    flowRate: 160,
    status: 'FREE FLOW',
    coords: [
      [28.5930, 77.1610],
      [28.5562, 77.0855],
      [28.5280, 77.0870],
      [28.5020, 77.0890]
    ]
  }
];

// Pre-configured Trajectories for Vehicle Profiles with Unique Routes and Radiant Neon Signatures
const TRAJECTORY_CATALOG = {
  // 1. RJ 14 CA 0639: Target Suspect Sedan -> Cyan Glow
  'RJ 14 CA 0639': {
    plate: 'RJ 14 CA 0639',
    category: 'Target Suspect Vehicle (White Sedan)',
    isAnomaly: false,
    routeColor: '#00F0FF',
    waypoints: [
      { name: 'Connaught Place Radial 1', camId: 'CAM_DEL_CP_01', lat: 28.6315, lng: 77.2167, time: '14:02:10', speed: 48, status: 'PASS' },
      { name: 'Barakhamba Outer Circle', camId: 'CAM_DEL_CP_19', lat: 28.6292, lng: 77.2255, time: '14:06:45', speed: 52, status: 'PASS' },
      { name: 'India Gate C-Hexagon North', camId: 'CAM_DEL_IG_03', lat: 28.6145, lng: 77.2295, time: '14:11:20', speed: 58, status: 'PASS' },
      { name: 'DND Flyway Toll Plaza Entry', camId: 'CAM_DEL_DND_01', lat: 28.5832, lng: 77.2798, time: '14:19:50', speed: 76, status: 'PASS' },
      { name: 'DND Yamuna River Bridge Mid', camId: 'CAM_DEL_DND_02', lat: 28.5770, lng: 77.2910, time: '14:22:15', speed: 79, status: 'PASS' }
    ]
  },

  // 2. DL 01 TA 4210: Commercial Yellow Cab -> Radiant Taxi Amber/Gold Glow
  'DL 01 TA 4210': {
    plate: 'DL 01 TA 4210',
    category: 'Commercial Cab (Yellow Taxi)',
    isAnomaly: false,
    routeColor: '#FBBF24',
    waypoints: [
      { name: 'Connaught Place Radial 1', camId: 'CAM_DEL_CP_01', lat: 28.6315, lng: 77.2167, time: '14:04:30', speed: 42, status: 'PASS' },
      { name: 'Janpath - Rajpath Intersection', camId: 'CAM_DEL_JANPATH_02', lat: 28.6180, lng: 77.2190, time: '14:09:15', speed: 38, status: 'PASS' },
      { name: 'India Gate C-Hexagon South', camId: 'CAM_DEL_IG_04', lat: 28.6105, lng: 77.2285, time: '14:14:00', speed: 45, status: 'PASS' },
      { name: 'Sarai Kale Khan ISBT Intermodal', camId: 'CAM_DEL_SARAI_KALE_08', lat: 28.5890, lng: 77.2580, time: '14:20:45', speed: 46, status: 'PASS' },
      { name: 'Ashram Chowk Underpass Portal', camId: 'CAM_DEL_ASHRAM_07', lat: 28.5710, lng: 77.2588, time: '14:26:10', speed: 39, status: 'PASS' }
    ]
  },

  // 3. HR 55 AH 7820: Heavy Commercial Logistics Truck -> Heavy Freight Vivid Orange Glow
  'HR 55 AH 7820': {
    plate: 'HR 55 AH 7820',
    category: 'Commercial Heavy Goods Truck',
    isAnomaly: false,
    routeColor: '#F97316',
    waypoints: [
      { name: 'NH-48 Sirhaul Toll Border', camId: 'CAM_DEL_GURGAON_01', lat: 28.5020, lng: 77.0890, time: '13:45:00', speed: 52, status: 'PASS' },
      { name: 'Dhaula Kuan Cloverleaf Portal', camId: 'CAM_DEL_DHAULA_02', lat: 28.5930, lng: 77.1610, time: '13:58:30', speed: 48, status: 'PASS' },
      { name: 'AIIMS Flyover North Incline', camId: 'CAM_DEL_AIIMS_09', lat: 28.5680, lng: 77.2100, time: '14:07:15', speed: 46, status: 'PASS' },
      { name: 'Moolchand Hospital Junction', camId: 'CAM_DEL_MOOL_04', lat: 28.5650, lng: 77.2340, time: '14:12:40', speed: 44, status: 'PASS' },
      { name: 'Ashram Chowk Underpass Portal', camId: 'CAM_DEL_ASHRAM_07', lat: 28.5710, lng: 77.2588, time: '14:18:20', speed: 40, status: 'PASS' }
    ]
  },

  // 4. UP 16 CH 9651: Private Commuter Sedan -> Electric Sky Blue Glow
  'UP 16 CH 9651': {
    plate: 'UP 16 CH 9651',
    category: 'Private Sedan (Honda City)',
    isAnomaly: false,
    routeColor: '#38BDF8',
    waypoints: [
      { name: 'Noida Sector 18 Expressway Link', camId: 'CAM_DEL_NOIDA_01', lat: 28.5700, lng: 77.3250, time: '14:08:00', speed: 62, status: 'PASS' },
      { name: 'DND Mayur Vihar Merge', camId: 'CAM_DEL_DND_03', lat: 28.5702, lng: 77.3045, time: '14:12:30', speed: 68, status: 'PASS' },
      { name: 'DND Flyway Toll Plaza Entry', camId: 'CAM_DEL_DND_01', lat: 28.5832, lng: 77.2798, time: '14:16:45', speed: 74, status: 'PASS' },
      { name: 'Sarai Kale Khan ISBT Intermodal', camId: 'CAM_DEL_SARAI_KALE_08', lat: 28.5890, lng: 77.2580, time: '14:21:10', speed: 56, status: 'PASS' },
      { name: 'India Gate C-Hexagon North', camId: 'CAM_DEL_IG_03', lat: 28.6145, lng: 77.2295, time: '14:25:30', speed: 58, status: 'PASS' }
    ]
  },

  // 5. DL 3S CD 8412: 2-Wheeler Commuter Bike -> Electric Violet / Purple Glow
  'DL 3S CD 8412': {
    plate: 'DL 3S CD 8412',
    category: '2-Wheeler (Hero Splendor Bike)',
    isAnomaly: false,
    routeColor: '#A855F7',
    waypoints: [
      { name: 'Moolchand Hospital Junction', camId: 'CAM_DEL_MOOL_04', lat: 28.5650, lng: 77.2340, time: '14:10:00', speed: 46, status: 'PASS' },
      { name: 'Ring Road Lajpat Nagar Flyover', camId: 'CAM_DEL_LAJPAT_05', lat: 28.5685, lng: 77.2420, time: '14:13:30', speed: 49, status: 'PASS' },
      { name: 'Ashram Chowk Underpass Portal', camId: 'CAM_DEL_ASHRAM_07', lat: 28.5710, lng: 77.2588, time: '14:17:15', speed: 42, status: 'PASS' },
      { name: 'Mathura Road Friends Colony South', camId: 'CAM_DEL_MATHURA_02', lat: 28.5620, lng: 77.2710, time: '14:21:40', speed: 45, status: 'PASS' }
    ]
  },

  // 6. DL 8C X 2628: Local Passenger Hatchback -> Radiant Emerald Green Glow
  'DL 8C X 2628': {
    plate: 'DL 8C X 2628',
    category: '4-Wheeler (Maruti Swift)',
    isAnomaly: false,
    routeColor: '#10B981',
    waypoints: [
      { name: 'Ring Road Lajpat Nagar Flyover', camId: 'CAM_DEL_LAJPAT_05', lat: 28.5685, lng: 77.2420, time: '14:05:00', speed: 55, status: 'PASS' },
      { name: 'Moolchand Hospital Junction', camId: 'CAM_DEL_MOOL_04', lat: 28.5650, lng: 77.2340, time: '14:08:10', speed: 59, status: 'PASS' },
      { name: 'AIIMS Flyover North Incline', camId: 'CAM_DEL_AIIMS_09', lat: 28.5680, lng: 77.2100, time: '14:14:40', speed: 64, status: 'PASS' }
    ]
  },

  // 7. MH 01 CR 2440: Interstate Yellow-Top Cab -> Deep Sun Gold Glow
  'MH 01 CR 2440': {
    plate: 'MH 01 CR 2440',
    category: 'Commercial Yellow-Top Cab (Mumbai Interstate)',
    isAnomaly: false,
    routeColor: '#EAB308',
    waypoints: [
      { name: 'Ashram Chowk Underpass Portal', camId: 'CAM_DEL_ASHRAM_07', lat: 28.5710, lng: 77.2588, time: '13:58:00', speed: 45, status: 'PASS' },
      { name: 'Mathura Road Friends Colony South', camId: 'CAM_DEL_MATHURA_02', lat: 28.5620, lng: 77.2710, time: '14:03:20', speed: 48, status: 'PASS' },
      { name: 'DND Flyway Toll Plaza Entry', camId: 'CAM_DEL_DND_01', lat: 28.5832, lng: 77.2798, time: '14:09:50', speed: 68, status: 'PASS' },
      { name: 'DND Yamuna River Bridge Mid', camId: 'CAM_DEL_DND_02', lat: 28.5770, lng: 77.2910, time: '14:14:10', speed: 72, status: 'PASS' },
      { name: 'DND Mayur Vihar Merge', camId: 'CAM_DEL_DND_03', lat: 28.5702, lng: 77.3045, time: '14:19:15', speed: 65, status: 'PASS' }
    ]
  },

  // 8. DL 1ZC 5044 / DL 12C 5044: Airport Shuttle Ertiga -> Hot Pink / Magenta Glow
  'DL 1ZC 5044': {
    plate: 'DL 1ZC 5044',
    category: 'Passenger 7-Seater (Maruti Ertiga)',
    isAnomaly: false,
    routeColor: '#EC4899',
    waypoints: [
      { name: 'IGI Airport T3 Departure Ramp', camId: 'CAM_DEL_IGI_T3_29', lat: 28.5562, lng: 77.0855, time: '13:52:00', speed: 64, status: 'PASS' },
      { name: 'Aerocity Hospitality Corridor', camId: 'CAM_DEL_AEROCITY_05', lat: 28.5490, lng: 77.1210, time: '13:58:40', speed: 62, status: 'PASS' },
      { name: 'Dhaula Kuan Cloverleaf Portal', camId: 'CAM_DEL_DHAULA_02', lat: 28.5930, lng: 77.1610, time: '14:08:15', speed: 59, status: 'PASS' },
      { name: 'AIIMS Flyover North Incline', camId: 'CAM_DEL_AIIMS_09', lat: 28.5680, lng: 77.2100, time: '14:15:30', speed: 56, status: 'PASS' }
    ]
  },
  'DL 12C 5044': {
    plate: 'DL 12C 5044',
    category: 'Passenger 7-Seater (Maruti Ertiga)',
    isAnomaly: false,
    routeColor: '#EC4899',
    waypoints: [
      { name: 'IGI Airport T3 Departure Ramp', camId: 'CAM_DEL_IGI_T3_29', lat: 28.5562, lng: 77.0855, time: '13:52:00', speed: 64, status: 'PASS' },
      { name: 'Aerocity Hospitality Corridor', camId: 'CAM_DEL_AEROCITY_05', lat: 28.5490, lng: 77.1210, time: '13:58:40', speed: 62, status: 'PASS' },
      { name: 'Dhaula Kuan Cloverleaf Portal', camId: 'CAM_DEL_DHAULA_02', lat: 28.5930, lng: 77.1610, time: '14:08:15', speed: 59, status: 'PASS' },
      { name: 'AIIMS Flyover North Incline', camId: 'CAM_DEL_AIIMS_09', lat: 28.5680, lng: 77.2100, time: '14:15:30', speed: 56, status: 'PASS' }
    ]
  },

  // 9. DL 08 CQ 4192: Central Delivery Van -> Teal / Cyan Blue Glow
  'DL 08 CQ 4192': {
    plate: 'DL 08 CQ 4192',
    category: 'Commercial Delivery Courier Van',
    isAnomaly: false,
    routeColor: '#06B6D4',
    waypoints: [
      { name: 'Connaught Place Radial 1', camId: 'CAM_DEL_CP_01', lat: 28.6315, lng: 77.2167, time: '14:00:00', speed: 42, status: 'PASS' },
      { name: 'Barakhamba Outer Circle', camId: 'CAM_DEL_CP_19', lat: 28.6292, lng: 77.2255, time: '14:04:15', speed: 44, status: 'PASS' },
      { name: 'Janpath - Rajpath Intersection', camId: 'CAM_DEL_JANPATH_02', lat: 28.6180, lng: 77.2190, time: '14:08:30', speed: 48, status: 'PASS' },
      { name: 'India Gate C-Hexagon North', camId: 'CAM_DEL_IG_03', lat: 28.6145, lng: 77.2295, time: '14:12:10', speed: 52, status: 'PASS' }
    ]
  },

  // 10. MH 12 NP 6480: Interstate Multi-Utility SUV -> Electric Royal Indigo Glow
  'MH 12 NP 6480': {
    plate: 'MH 12 NP 6480',
    category: 'Multi-Utility Vehicle (Silver Innova SUV)',
    isAnomaly: false,
    routeColor: '#6366F1',
    waypoints: [
      { name: 'NH-48 Sirhaul Toll Border', camId: 'CAM_DEL_GURGAON_01', lat: 28.5020, lng: 77.0890, time: '13:40:00', speed: 68, status: 'PASS' },
      { name: 'Aerocity Hospitality Corridor', camId: 'CAM_DEL_AEROCITY_05', lat: 28.5490, lng: 77.1210, time: '13:48:30', speed: 62, status: 'PASS' },
      { name: 'Dhaula Kuan Cloverleaf Portal', camId: 'CAM_DEL_DHAULA_02', lat: 28.5930, lng: 77.1610, time: '13:56:45', speed: 58, status: 'PASS' },
      { name: 'AIIMS Flyover North Incline', camId: 'CAM_DEL_AIIMS_09', lat: 28.5680, lng: 77.2100, time: '14:05:20', speed: 54, status: 'PASS' },
      { name: 'Moolchand Hospital Junction', camId: 'CAM_DEL_MOOL_04', lat: 28.5650, lng: 77.2340, time: '14:10:45', speed: 56, status: 'PASS' },
      { name: 'Ashram Chowk Underpass Portal', camId: 'CAM_DEL_ASHRAM_07', lat: 28.5710, lng: 77.2588, time: '14:16:00', speed: 50, status: 'PASS' }
    ]
  },

  // 11. DL 12CT 2309: Compact Commuter Hatchback -> Vibrant Lime Green Glow
  'DL 12CT 2309': {
    plate: 'DL 12CT 2309',
    category: 'Compact Passenger Hatchback',
    isAnomaly: false,
    routeColor: '#84CC16',
    waypoints: [
      { name: 'IGI Airport T3 Departure Ramp', camId: 'CAM_DEL_IGI_T3_29', lat: 28.5562, lng: 77.0855, time: '14:01:00', speed: 58, status: 'PASS' },
      { name: 'Aerocity Hospitality Corridor', camId: 'CAM_DEL_AEROCITY_05', lat: 28.5490, lng: 77.1210, time: '14:07:30', speed: 55, status: 'PASS' },
      { name: 'Dhaula Kuan Cloverleaf Portal', camId: 'CAM_DEL_DHAULA_02', lat: 28.5930, lng: 77.1610, time: '14:15:20', speed: 52, status: 'PASS' },
      { name: 'Janpath - Rajpath Intersection', camId: 'CAM_DEL_JANPATH_02', lat: 28.6180, lng: 77.2190, time: '14:21:40', speed: 48, status: 'PASS' },
      { name: 'Connaught Place Radial 1', camId: 'CAM_DEL_CP_01', lat: 28.6315, lng: 77.2167, time: '14:24:00', speed: 45, status: 'PASS' }
    ]
  },

  // 12. HR 26 DQ 5521: Cloned Teleportation Anomaly -> Crimson Alert Red Pulsing
  'HR 26 DQ 5521': {
    plate: 'HR 26 DQ 5521',
    category: 'CLONED VEHICLE ANOMALY (DEFCON 1 Teleportation)',
    isAnomaly: true,
    routeColor: '#EF4444',
    waypoints: [
      { name: 'DND Flyway Toll Plaza Entry', camId: 'CAM_DEL_DND_01', lat: 28.5832, lng: 77.2798, time: '14:24:00', speed: 78, status: 'CLONE_A' },
      { name: 'IGI Airport T3 Departure Ramp', camId: 'CAM_DEL_IGI_T3_29', lat: 28.5562, lng: 77.0855, time: '14:24:32', speed: 2108, status: 'CLONE_B_ANOMALY' }
    ]
  }
};

// Robust plate trajectory resolver with alias and spacing tolerance
function getTrajectoryForPlate(plate) {
  if (!plate) return TRAJECTORY_CATALOG['RJ 14 CA 0639'];
  if (TRAJECTORY_CATALOG[plate]) return TRAJECTORY_CATALOG[plate];

  const clean = String(plate).replace(/\s+/g, '').toUpperCase();
  for (const [key, val] of Object.entries(TRAJECTORY_CATALOG)) {
    if (key.replace(/\s+/g, '').toUpperCase() === clean) {
      return val;
    }
  }

  // Handle common phonetic/OCR plate variants
  if (clean.includes('12C5044') || clean.includes('1ZC5044')) {
    return TRAJECTORY_CATALOG['DL 1ZC 5044'];
  }
  if (clean.includes('08CQ4192') || clean.includes('8CQ4192')) {
    return TRAJECTORY_CATALOG['DL 08 CQ 4192'];
  }

  return TRAJECTORY_CATALOG['RJ 14 CA 0639'];
}

// Play audio alert synthesizer using Web Audio API (no external file needed)
function triggerTacticalSiren(isCritical = false) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCritical ? 'sawtooth' : 'sine';
    const now = ctx.currentTime;
    
    if (isCritical) {
      // Dual-tone DEFCON warning siren
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.30);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      // Gentle tactical radar ping
      osc.frequency.setValueAtTime(1046, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {}
}

export default function TacticalGisCommandMap({ activeTargetPlate = 'RJ 14 CA 0639', onSelectPlate }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const trajectoryGroupRef = useRef(null);
  const cordonLayerGroupRef = useRef(null);
  const trafficLayerGroupRef = useRef(null);

  // Component State
  const [mapLayer, setMapLayer] = useState('google_traffic_hybrid');
  const baseTileLayerRef = useRef(null);
  const [selectedCam, setSelectedCam] = useState(null);
  const [customVideos, setCustomVideos] = useState({});
  const [camVideoOverride, setCamVideoOverride] = useState(null);
  const [modalVideoMuted, setModalVideoMuted] = useState(true);
  const [showFrustums, setShowFrustums] = useState(true);
  const [showCordon, setShowCordon] = useState(false);
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [autoFollowCam, setAutoFollowCam] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayingReplay, setIsPlayingReplay] = useState(false);
  const [replayProgress, setReplayProgress] = useState(1.0); // 0.0 to 1.0
  const [activeAlert, setActiveAlert] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);

  // Active Vehicle Trajectory Data with dynamic color assignment
  const currentTrajectory = getTrajectoryForPlate(activeTargetPlate);
  const routeColor = currentTrajectory.routeColor || '#00F0FF';

  // Reset replay progress and video override when target vehicle changes
  useEffect(() => {
    setReplayProgress(1.0);
    setIsPlayingReplay(false);
    setCamVideoOverride(null);
  }, [activeTargetPlate]);

  // Handle Fullscreen Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Recalculate Leaflet Map Dimensions on Fullscreen Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  // Initialize Leaflet Map safely (protect against React StrictMode & tab switching re-mounts)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any stale Leaflet instance on the container element
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Error removing map instance:', e);
      }
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    // Center on New Delhi Corridor
    const map = L.map(mapContainerRef.current, {
      center: [28.5950, 77.2250],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Attach initial base tile layer immediately on map creation
    const initialProvider = MAP_PROVIDERS[mapLayer] || MAP_PROVIDERS.google_hybrid;
    const initialTileLayer = L.tileLayer(initialProvider.url, {
      maxZoom: initialProvider.maxZoom,
      subdomains: initialProvider.subdomains,
      attribution: '© Google Maps'
    }).addTo(map);
    baseTileLayerRef.current = initialTileLayer;

    // Layer groups for dynamic cleanups
    const trajectoryGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    const cordonGroup = L.layerGroup().addTo(map);
    const trafficGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    trajectoryGroupRef.current = trajectoryGroup;
    markersGroupRef.current = markersGroup;
    cordonLayerGroupRef.current = cordonGroup;
    trafficLayerGroupRef.current = trafficGroup;

    // Trigger immediate & staggered resize checks so map fills container on tab open
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 300);

    // ResizeObserver ensures map adapts immediately to container geometry changes
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
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
        mapInstanceRef.current = null;
      }
      baseTileLayerRef.current = null;
      vehicleMarkerRef.current = null;
      trajectoryGroupRef.current = null;
      markersGroupRef.current = null;
      cordonLayerGroupRef.current = null;
      trafficLayerGroupRef.current = null;
      if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }
    };
  }, []);

  // Dynamically manage Google Map Tile Layer (Default: Google Hybrid)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      try {
        map.removeLayer(baseTileLayerRef.current);
      } catch (e) {}
    }

    const provider = MAP_PROVIDERS[mapLayer] || MAP_PROVIDERS.google_hybrid;
    const tileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains,
      attribution: '© Google Maps'
    }).addTo(map);

    baseTileLayerRef.current = tileLayer;
  }, [mapLayer]);

  // Render Real-Time Traffic Flow & Speed Heatmap Corridors
  useEffect(() => {
    const trafficGroup = trafficLayerGroupRef.current;
    if (!trafficGroup) return;

    trafficGroup.clearLayers();

    if (showTrafficFlow) {
      TRAFFIC_CORRIDORS.forEach((corr) => {
        // Broad ambient glow line underneath
        const glowLine = L.polyline(corr.coords, {
          color: corr.color,
          weight: 7,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round'
        });

        // Crisp dashed high-speed pulse line on top
        const flowLine = L.polyline(corr.coords, {
          color: corr.color,
          weight: 3.5,
          opacity: 0.95,
          dashArray: '8, 5',
          lineCap: 'round',
          lineJoin: 'round'
        });

        const tooltipContent = `
          <div style="font-family: monospace; font-size: 11px; background: #0B0F19; color: #F8FAFC; border: 1px solid ${corr.color}; padding: 6px 9px; box-shadow: 0 0 12px rgba(0,0,0,0.8);">
            <div style="font-weight: 800; color: ${corr.color}; margin-bottom: 2px;">[CORRIDOR] ${corr.name}</div>
            <div style="color: #94A3B8;">Velocity: <b style="color: #FFFFFF;">${corr.speed} KM/H</b> | Flow: <b style="color: #00F0FF;">${corr.flowRate} veh/min</b></div>
            <div style="margin-top: 2px; font-weight: bold; color: ${corr.color};">CLASSIFICATION: ${corr.status}</div>
          </div>
        `;

        flowLine.bindTooltip(tooltipContent, {
          sticky: true,
          direction: 'auto',
          className: 'tactical-traffic-tooltip'
        });

        trafficGroup.addLayer(glowLine);
        trafficGroup.addLayer(flowLine);
      });
    }
  }, [showTrafficFlow]);

  // Render Camera Fleet Nodes & Frustums
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    CAMERA_FLEET.forEach((cam) => {
      // Custom HTML Pulse Marker
      const isSelected = selectedCam && selectedCam.id === cam.id;
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-6 h-6 rounded-full ${cam.status === 'ONLINE' ? 'bg-[#00F0FF]/20 animate-ping' : 'bg-[#EF4444]/20'}"></div>
          <div class="w-3.5 h-3.5 rounded-full ${isSelected ? 'bg-[#F59E0B] ring-2 ring-[#FFFFFF]' : 'bg-[#00F0FF] ring-1 ring-[#00F0FF]/50'} shadow-[0_0_8px_rgba(0,240,255,0.8)]"></div>
          <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0B0F19]/90 border border-[#262933] px-1 py-0.2 text-[8px] font-mono text-[#E2E8F0] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            ${cam.id}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-cctv-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedCam(cam);
        setCamVideoOverride(null);
        if (!soundMuted) triggerTacticalSiren(false);
      });
      markersGroup.addLayer(marker);

      // Render Camera Frustum (Field-of-View Cone) if enabled
      if (showFrustums) {
        const rad = (cam.bearing * Math.PI) / 180;
        const length = 0.0055; // ~600m visual cone
        const fovSpread = 0.45; // ~25 deg aperture

        const p1 = [cam.lat, cam.lng];
        const p2 = [cam.lat + Math.cos(rad - fovSpread) * length, cam.lng + Math.sin(rad - fovSpread) * length];
        const p3 = [cam.lat + Math.cos(rad + fovSpread) * length, cam.lng + Math.sin(rad + fovSpread) * length];

        const frustumPolygon = L.polygon([p1, p2, p3], {
          color: isSelected ? '#F59E0B' : '#00F0FF',
          weight: 1,
          opacity: 0.6,
          fillColor: isSelected ? '#F59E0B' : '#00F0FF',
          fillOpacity: 0.08,
          interactive: false
        });
        markersGroup.addLayer(frustumPolygon);
      }
    });
  }, [showFrustums, selectedCam, soundMuted]);

  // Jump to specific waypoint and center map (One-click target jump)
  const jumpToWaypoint = (idx) => {
    const wps = currentTrajectory.waypoints;
    if (!wps || !wps[idx]) return;
    const targetWp = wps[idx];
    const progress = idx / (wps.length - 1);
    setReplayProgress(progress);
    setIsPlayingReplay(false);

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([targetWp.lat, targetWp.lng], 15, { animate: true, duration: 1.0 });
    }

    // Auto-match camera
    const matchedCam = CAMERA_FLEET.find(c => c.id === targetWp.camId);
    if (matchedCam) {
      setSelectedCam(matchedCam);
      setCamVideoOverride(null);
    }
    if (!soundMuted) triggerTacticalSiren(false);
  };

  // Render Trajectory Path for Active Vehicle with its UNIQUE ROUTE and UNIQUE RADIANT COLOR
  useEffect(() => {
    const map = mapInstanceRef.current;
    const trajectoryGroup = trajectoryGroupRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !trajectoryGroup) return;

    // Clear previous trajectory layers
    trajectoryGroup.clearLayers();

    if (vehicleMarkerRef.current) {
      map.removeLayer(vehicleMarkerRef.current);
      vehicleMarkerRef.current = null;
    }

    const waypoints = currentTrajectory.waypoints;
    if (!waypoints || waypoints.length < 2) return;

    const latlngs = waypoints.map(w => [w.lat, w.lng]);
    const isCloned = currentTrajectory.isAnomaly;
    const color = currentTrajectory.routeColor || '#00F0FF';

    // 1. Ambient Background Neon Glow Line
    const glowLine = L.polyline(latlngs, {
      color: color,
      weight: 9,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    });
    trajectoryGroup.addLayer(glowLine);

    // 2. Crisp Core Foreground Trajectory Line
    const sharpLine = L.polyline(latlngs, {
      color: color,
      weight: 4,
      opacity: 0.95,
      dashArray: isCloned ? '8, 8' : '10, 6',
      lineCap: 'round',
      lineJoin: 'round'
    });
    trajectoryGroup.addLayer(sharpLine);

    // Fit map bounds to trajectory with smooth frame
    try {
      const bounds = sharpLine.getBounds();
      if (bounds && bounds.isValid && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    } catch (e) {
      console.warn('fitBounds warning:', e);
    }

    // 3. Interactive Waypoint Badges with Vehicle's Signature Color
    waypoints.forEach((wp, idx) => {
      const badgeHtml = `
        <div class="flex items-center justify-center w-5 h-5 rounded-full text-[#0B0F19] font-black text-[10px] font-mono border-2 border-[#0B0F19] cursor-pointer hover:scale-125 transition-transform" 
             style="background-color: ${color}; box-shadow: 0 0 10px ${color};"
             title="Click to Focus WP-${idx + 1}: ${wp.name}">
          ${idx + 1}
        </div>
      `;
      const badgeIcon = L.divIcon({ html: badgeHtml, className: 'waypoint-badge', iconSize: [20, 20], iconAnchor: [10, 10] });
      const badgeMarker = L.marker([wp.lat, wp.lng], { icon: badgeIcon, interactive: true });
      badgeMarker.on('click', () => {
        jumpToWaypoint(idx);
      });
      trajectoryGroup.addLayer(badgeMarker);
    });

    // 4. Vehicle Animated Puck Marker with Vehicle's Signature Color
    const vehicleIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full ${isCloned ? 'animate-ping' : 'animate-pulse'}" style="background-color: ${color}4D;"></div>
        <div class="absolute w-5 h-5 rounded-full flex items-center justify-center" style="background-color: ${color}; box-shadow: 0 0 14px ${color};">
          <svg class="w-3 h-3 text-[#0B0F19]" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
        </div>
      </div>
    `;
    const vIcon = L.divIcon({ html: vehicleIconHtml, className: 'vehicle-puck', iconSize: [32, 32], iconAnchor: [16, 16] });
    const lastWp = waypoints[waypoints.length - 1];
    const vMarker = L.marker([lastWp.lat, lastWp.lng], { icon: vIcon, zIndexOffset: 1000 }).addTo(map);
    vehicleMarkerRef.current = vMarker;

    // Check if Anomaly
    if (isCloned) {
      setActiveAlert({
        level: 'DEFCON_1',
        title: 'TELEPORTATION / CLONED REGISTRATION DETECTED',
        desc: `Vehicle ${currentTrajectory.plate} logged at DND Flyway & IGI Airport simultaneously (Calculated Velocity: 2,108 km/h).`,
        time: 'JUST NOW'
      });
      if (!soundMuted) triggerTacticalSiren(true);
    } else {
      setActiveAlert(null);
    }
  }, [activeTargetPlate, soundMuted]);

  // Handle Play/Pause Replay Scrubber
  useEffect(() => {
    let animTimer;
    if (isPlayingReplay) {
      animTimer = setInterval(() => {
        setReplayProgress((prev) => {
          if (prev >= 1.0) {
            setIsPlayingReplay(false);
            return 1.0;
          }
          return Math.min(1.0, prev + 0.05);
        });
      }, 350);
    }
    return () => clearInterval(animTimer);
  }, [isPlayingReplay]);

  // Update vehicle position along trajectory based on replayProgress
  // & AUTO-SYNC CCTV Video Stream Follower
  useEffect(() => {
    if (!vehicleMarkerRef.current || !currentTrajectory.waypoints) return;
    const wps = currentTrajectory.waypoints;
    if (wps.length < 2) return;

    const totalSegments = wps.length - 1;
    const globalT = replayProgress * totalSegments;
    const segIdx = Math.min(totalSegments - 1, Math.floor(globalT));
    const localT = globalT - segIdx;

    const pA = wps[segIdx];
    const pB = wps[segIdx + 1];

    const currentLat = pA.lat + (pB.lat - pA.lat) * localT;
    const currentLng = pA.lng + (pB.lng - pA.lng) * localT;

    vehicleMarkerRef.current.setLatLng([currentLat, currentLng]);

    // Feature 1: Auto-Sync CCTV Follower - switch video to the nearest camera node
    if (autoFollowCam) {
      const closestIdx = Math.min(wps.length - 1, Math.round(replayProgress * totalSegments));
      const activeWp = wps[closestIdx];
      if (activeWp) {
        const matchedCam = CAMERA_FLEET.find(c => c.id === activeWp.camId);
        if (matchedCam && (!selectedCam || selectedCam.id !== matchedCam.id)) {
          setSelectedCam(matchedCam);
          setCamVideoOverride(null); // Switch to this camera's real live feed
        }
      }
    }
  }, [replayProgress, currentTrajectory, autoFollowCam]);

  // Feature 3: One-click "FOCUS TARGET / LOCK TARGET" (Fly to active vehicle position)
  const handleFocusTarget = () => {
    const map = mapInstanceRef.current;
    if (!map || !vehicleMarkerRef.current) return;
    const currentLatLng = vehicleMarkerRef.current.getLatLng();
    map.flyTo(currentLatLng, 15, { animate: true, duration: 1.0 });
    if (!soundMuted) triggerTacticalSiren(false);
  };

  // Police Cordon Layer Toggle (Static perimeter rings)
  useEffect(() => {
    const cordonGroup = cordonLayerGroupRef.current;
    if (!cordonGroup) return;

    cordonGroup.clearLayers();

    if (showCordon) {
      const chokePoints = [
        { name: 'Ashram Chowk Intercept Ring', lat: 28.5710, lng: 77.2588, radius: 800, pcr: 'PCR-14 & PCR-22' },
        { name: 'Moolchand Cordon Node', lat: 28.5650, lng: 77.2340, radius: 700, pcr: 'PCR-08' }
      ];

      chokePoints.forEach(cp => {
        const circle = L.circle([cp.lat, cp.lng], {
          radius: cp.radius,
          color: '#F59E0B',
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#F59E0B',
          fillOpacity: 0.15
        });

        circle.bindTooltip(`[CORDON] <b>${cp.name}</b><br>Assigned Units: ${cp.pcr}`, {
          permanent: true,
          direction: 'top',
          className: 'tactical-tooltip'
        });

        cordonGroup.addLayer(circle);
      });
    }
  }, [showCordon]);

  // Determine current active waypoint index for UI labels
  const currentWpIdx = currentTrajectory.waypoints 
    ? Math.min(currentTrajectory.waypoints.length - 1, Math.round(replayProgress * (currentTrajectory.waypoints.length - 1)))
    : 0;
  const currentWp = currentTrajectory.waypoints ? currentTrajectory.waypoints[currentWpIdx] : null;

  return (
    <div className={`bg-[#0A0B0E] border border-[#262933] overflow-hidden flex flex-col font-mono select-none transition-all ${
      isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'relative w-full h-[620px]'
    }`}>
      
      {/* Top Tactical Status Bar */}
      <div className="h-10 bg-[#13151B] border-b border-[#262933] px-3 flex items-center justify-between text-xs shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
            <Compass className="w-4 h-4 text-[#00F0FF] animate-spin-slow" />
            <span>GOD'S EYE // GIS TACTICAL C4ISR</span>
          </div>
          <span className="text-[#374151]">|</span>
          <div className="flex items-center gap-1 text-[11px] text-[#CBD5E1]">
            <span>Active Target:</span>
            <span 
              className="font-bold px-1.5 py-0.5 border"
              style={{
                color: routeColor,
                borderColor: `${routeColor}80`,
                backgroundColor: `${routeColor}15`,
                boxShadow: `0 0 8px ${routeColor}40`
              }}
            >
              {currentTrajectory.plate}
            </span>
            <span className="text-[10px] text-[#94A3B8] ml-1">({currentTrajectory.category})</span>
          </div>
          <span className="text-[#374151]">|</span>
          <div className="flex items-center gap-1.5 text-[11px] text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>19 CCTV NODES</span>
          </div>
        </div>

        {/* Tactical Control Bar */}
        <div className="flex items-center gap-2">
          {/* Map Layer Selector (Google Hybrid / Satellite / Streets) */}
          <div className="flex items-center bg-[#0B0F19] border border-[#262933] p-0.5">
            {Object.keys(MAP_PROVIDERS).map((key) => (
              <button
                key={key}
                onClick={() => setMapLayer(key)}
                className={`px-2 py-0.5 text-[9px] font-bold transition-all cursor-pointer ${
                  mapLayer === key
                    ? 'bg-[#00F0FF] text-[#0A0B0E] font-black shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                    : 'text-[#94A3B8] hover:text-[#FFFFFF]'
                }`}
              >
                {MAP_PROVIDERS[key].name}
              </button>
            ))}
          </div>

          {/* Feature 3: One-Click Focus / Lock Target */}
          <button
            onClick={handleFocusTarget}
            className="px-2 py-1 text-[10px] font-bold border border-[#00F0FF]/60 bg-[#00F0FF]/15 text-[#00F0FF] hover:bg-[#00F0FF]/30 flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.3)]"
            title="Focus and Lock Camera on Active Target Position"
          >
            <Crosshair className="w-3 h-3 text-[#00F0FF]" />
            LOCK TARGET
          </button>

          {/* Feature 4: Real-time Traffic Flow & Speed Heatmap Toggle */}
          <button
            onClick={() => setShowTrafficFlow(!showTrafficFlow)}
            className={`px-2 py-1 text-[10px] font-bold border rounded-none flex items-center gap-1 transition-all cursor-pointer ${
              showTrafficFlow
                ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : 'bg-[#1C1F26] border-[#374151] text-[#94A3B8] hover:text-[#FFFFFF]'
            }`}
            title="Toggle Live Traffic Flow & Highway Speed Corridors"
          >
            <Activity className="w-3 h-3" />
            TRAFFIC FLOW
          </button>

          <button
            onClick={() => setShowFrustums(!showFrustums)}
            className={`px-2 py-1 text-[10px] font-bold border rounded-none flex items-center gap-1 transition-all cursor-pointer ${
              showFrustums
                ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                : 'bg-[#1C1F26] border-[#374151] text-[#94A3B8] hover:text-[#FFFFFF]'
            }`}
          >
            <Eye className="w-3 h-3" />
            FRUSTUMS
          </button>

          <button
            onClick={() => setShowCordon(!showCordon)}
            className={`px-2 py-1 text-[10px] font-bold border rounded-none flex items-center gap-1 transition-all cursor-pointer ${
              showCordon
                ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                : 'bg-[#1C1F26] border-[#374151] text-[#94A3B8] hover:text-[#FFFFFF]'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            CORDON
          </button>

          {/* Feature 5: Fullscreen Tactical View Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`px-2 py-1 text-[10px] font-bold border rounded-none flex items-center gap-1 transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-[#00F0FF] text-[#0A0B0E] border-[#00F0FF] font-black'
                : 'bg-[#1C1F26] border-[#374151] text-[#94A3B8] hover:text-[#FFFFFF]'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen Tactical Pitch Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>{isFullscreen ? 'EXIT' : 'FULL'}</span>
          </button>

          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-1 text-[#94A3B8] hover:text-[#FFFFFF] bg-[#1C1F26] border border-[#374151] cursor-pointer"
            title={soundMuted ? 'Unmute Alarms' : 'Mute Alarms'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-[#EF4444]" /> : <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />}
          </button>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative flex-1 w-full min-h-0 bg-[#0A0B0E] overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" style={{ background: '#0A0B0E' }} />

        {/* Live Traffic Stream Bar (Matching Google Maps screenshot) */}
        {showTrafficFlow && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-[#0B0F19]/95 border border-[#262933] px-3 py-2 text-[10px] space-y-1.5 backdrop-blur-md shadow-2xl">
            <div className="text-[#CBD5E1] font-bold text-[9px] uppercase tracking-wider flex items-center justify-between border-b border-[#262933] pb-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#10B981]" />
                LIVE ROAD TRAFFIC STREAM
              </span>
              <span className="text-[#10B981] font-mono text-[8px]">[LIVE GOOGLE TILE FEED]</span>
            </div>
            
            {/* Traffic Speed Color Bar */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[#94A3B8] text-[9px]">FAST</span>
              <div className="flex items-center gap-1">
                <span className="w-6 h-2 bg-[#10B981] rounded-none" title="Fast / Free Flow (>60 km/h)" />
                <span className="w-6 h-2 bg-[#F59E0B] rounded-none" title="Moderate / Steady (30-50 km/h)" />
                <span className="w-6 h-2 bg-[#EF4444] rounded-none" title="Slow / Heavy (<20 km/h)" />
                <span className="w-6 h-2 bg-[#7F1D1D] rounded-none" title="Gridlock / Stop-and-Go" />
              </div>
              <span className="text-[#94A3B8] text-[9px]">SLOW</span>
            </div>
          </div>
        )}

        {/* Floating DEFCON Alert Banner */}
        {activeAlert && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-xl bg-[#1C1F26]/95 border-2 border-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.5)] p-2.5 flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#EF4444] text-[#0A0B0E] font-black rounded-none">
                <Siren className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <div className="text-[#EF4444] font-black tracking-wider text-[11px]">{activeAlert.title}</div>
                <div className="text-[#CBD5E1] text-[10px] leading-tight">{activeAlert.desc}</div>
              </div>
            </div>
            <button
              onClick={() => setShowCordon(true)}
              className="px-2.5 py-1 bg-[#EF4444] hover:bg-[#DC2626] text-[#FFFFFF] font-black text-[10px] rounded-none shrink-0 cursor-pointer transition-all border border-[#EF4444]"
            >
              DEPLOY CORDON
            </button>
          </div>
        )}

        {/* CCTV Camera Inspector Modal with REAL VIDEO STREAM & AUTO-SYNC FOLLOWER STATUS */}
        {selectedCam && (
          <div className="absolute top-3 left-3 z-[1000] w-96 bg-[#13151B]/95 border border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.3)] p-3 text-xs space-y-2.5 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-[#262933] pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                <Camera className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="text-xs">{selectedCam.id}</span>
                <span className="text-[10px] text-[#94A3B8] font-normal">({selectedCam.zone})</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Feature 1: Auto-Follow Cam Toggle */}
                <button
                  onClick={() => setAutoFollowCam(!autoFollowCam)}
                  className={`px-1.5 py-0.5 text-[8px] font-bold border transition-all cursor-pointer ${
                    autoFollowCam 
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' 
                      : 'bg-[#1C1F26] border-[#374151] text-[#94A3B8]'
                  }`}
                  title="Auto-switch video stream to closest vehicle waypoint camera"
                >
                  {autoFollowCam ? '[AUTO-SYNC ON]' : 'AUTO-SYNC OFF'}
                </button>
                <button 
                  onClick={() => {
                    setSelectedCam(null);
                    setCamVideoOverride(null);
                  }}
                  className="text-[#94A3B8] hover:text-[#FFFFFF] font-bold text-xs p-1 cursor-pointer font-mono"
                >
                  [X]
                </button>
              </div>
            </div>

            {/* Quick Video Feed Preset Switcher & Attach Custom File */}
            <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
              <div className="flex items-center gap-1">
                <span className="text-[#94A3B8] text-[8.5px]">FEED:</span>
                {[
                  { label: 'DND', url: '/videos/traffic_demo.mp4' },
                  { label: 'ASHRAM', url: '/videos/feed2.mp4' },
                  { label: 'CP', url: '/videos/feed3.mp4' },
                  { label: 'IGI/DHAULA', url: '/videos/feed4.mp4' }
                ].map((f) => (
                  <button
                    key={f.label}
                    onClick={() => {
                      setCamVideoOverride(f.url);
                      setAutoFollowCam(false);
                    }}
                    className={`px-1.5 py-0.5 border rounded-none cursor-pointer transition-all ${
                      (camVideoOverride || customVideos[selectedCam.id] || selectedCam.videoUrl) === f.url
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold'
                        : 'bg-[#1C1F26] border-[#374151] text-[#94A3B8] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Attach Custom Video File Button */}
              <label className="px-2 py-0.5 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/50 text-[9px] font-bold rounded-none cursor-pointer flex items-center gap-1 transition-all shrink-0">
                <Upload className="w-2.5 h-2.5" />
                <span>ATTACH VIDEO</span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setCustomVideos(prev => ({ ...prev, [selectedCam.id]: url }));
                      setCamVideoOverride(url);
                      setAutoFollowCam(false);
                    }
                  }}
                />
              </label>
            </div>

            {/* REAL CCTV LIVE VIDEO STREAM PLAYER */}
            <div className="relative w-full h-48 bg-[#0B0F19] border border-[#262933] overflow-hidden">
              <video
                key={camVideoOverride || customVideos[selectedCam.id] || selectedCam.videoUrl || '/videos/traffic_demo.mp4'}
                src={camVideoOverride || customVideos[selectedCam.id] || selectedCam.videoUrl || '/videos/traffic_demo.mp4'}
                autoPlay
                loop
                muted={modalVideoMuted}
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Tactical Camera HUD Overlay on Video */}
              <div className="absolute inset-0 pointer-events-none border border-[#00F0FF]/30">
                {/* Top Live Status Bar */}
                <div className="absolute top-1.5 left-2 right-2 flex justify-between items-center text-[9px] font-mono z-10">
                  <span className="bg-[#0B0F19]/80 px-1.5 py-0.5 text-[#10B981] flex items-center gap-1 border border-[#10B981]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                    LIVE 1080P // {selectedCam.fps} FPS
                  </span>
                  <span className="bg-[#0B0F19]/80 px-1.5 py-0.5 text-[#F59E0B] border border-[#F59E0B]/40 font-bold">
                    LIMIT: {selectedCam.speedLimit} KM/H
                  </span>
                </div>

                {/* Center Targeting Reticle */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="w-14 h-14 border border-dashed rounded-full flex items-center justify-center" style={{ borderColor: routeColor }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: routeColor }} />
                  </div>
                </div>

                {/* Simulated Real-Time ANPR Bounding Box on Traffic Stream with Plate's Signature Color */}
                <div 
                  className="absolute bottom-9 left-1/4 w-32 h-14 border-2 animate-pulse"
                  style={{
                    borderColor: routeColor,
                    backgroundColor: `${routeColor}1A`,
                    boxShadow: `0 0 10px ${routeColor}66`
                  }}
                >
                  <div 
                    className="absolute -top-4 left-0 text-[#0A0B0E] font-black text-[8px] px-1 py-0.2 tracking-wider"
                    style={{ backgroundColor: routeColor }}
                  >
                    {currentTrajectory.plate} // 98.2% CONF
                  </div>
                </div>

                {/* Bottom Sighting Tag Overlay */}
                <div className="absolute bottom-1 left-1.5 right-1.5 bg-[#0B0F19]/90 border border-[#374151] px-2 py-0.5 flex justify-between text-[9px]">
                  <span className="text-[#94A3B8] truncate max-w-[130px]">{selectedCam.name}</span>
                  <span className="font-bold" style={{ color: routeColor }}>WP-{currentWpIdx + 1} SYNC</span>
                  <span className="text-[#10B981] font-bold">LANE 2 DETECT</span>
                </div>
              </div>

              {/* Mute/Unmute Video Sound Button */}
              <button
                onClick={() => setModalVideoMuted(!modalVideoMuted)}
                className="absolute top-2 right-2 p-1 bg-[#0B0F19]/80 text-[#E2E8F0] hover:text-[#FFFFFF] border border-[#374151] z-20 cursor-pointer pointer-events-auto"
                title={modalVideoMuted ? 'Unmute Video' : 'Mute Video'}
              >
                {modalVideoMuted ? <VolumeX className="w-3 h-3 text-[#94A3B8]" /> : <Volume2 className="w-3 h-3 text-[#10B981]" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="p-1.5 bg-[#1C1F26] border border-[#262933]">
                <span className="text-[#94A3B8] block text-[8.5px]">GPS COORDINATES:</span>
                <span className="text-[#E2E8F0] font-bold">{selectedCam.lat.toFixed(4)}, {selectedCam.lng.toFixed(4)}</span>
              </div>
              <div className="p-1.5 bg-[#1C1F26] border border-[#262933]">
                <span className="text-[#94A3B8] block text-[8.5px]">CORRIDOR STATUS:</span>
                <span className="text-[#10B981] font-bold">LIVE TELEMETRY STREAM</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Trajectory Flight-Path Time Scrubber & Quick Jump Waypoint Hub */}
      <div className="h-16 bg-[#13151B] border-t border-[#262933] px-4 flex items-center justify-between gap-4 text-xs shrink-0 z-10">
        
        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlayingReplay(!isPlayingReplay)}
            className="w-8 h-8 text-[#0A0B0E] flex items-center justify-center rounded-none font-black transition-all cursor-pointer"
            style={{
              backgroundColor: routeColor,
              boxShadow: `0 0 10px ${routeColor}80`
            }}
            title={isPlayingReplay ? 'Pause Flight Replay' : 'Play Flight Replay'}
          >
            {isPlayingReplay ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            onClick={() => {
              setReplayProgress(0.0);
              setIsPlayingReplay(false);
            }}
            className="w-8 h-8 bg-[#1C1F26] hover:bg-[#252A34] text-[#E2E8F0] border border-[#374151] flex items-center justify-center rounded-none transition-all cursor-pointer"
            title="Reset to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrubbable Timeline Track & Waypoint Quick-Jump Buttons */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-bold text-[#E2E8F0]">
                <Clock className="w-3 h-3" style={{ color: routeColor }} />
                REPLAY: {currentTrajectory?.waypoints?.[0]?.time || '14:00:00'} -&gt; {currentTrajectory?.waypoints?.[currentTrajectory.waypoints.length - 1]?.time || '14:25:00'}
              </span>
              
              {/* Waypoint Quick-Jump Badges */}
              <div className="flex items-center gap-1 ml-2">
                {(currentTrajectory?.waypoints || []).map((wp, idx) => (
                  <button
                    key={idx}
                    onClick={() => jumpToWaypoint(idx)}
                    className={`px-1.5 py-0.2 text-[8.5px] font-mono font-bold border transition-all cursor-pointer ${
                      currentWpIdx === idx
                        ? 'text-[#0A0B0E] font-black'
                        : 'bg-[#1C1F26] text-[#94A3B8] border-[#374151] hover:text-[#FFFFFF]'
                    }`}
                    style={
                      currentWpIdx === idx
                        ? {
                            backgroundColor: routeColor,
                            borderColor: routeColor,
                            boxShadow: `0 0 8px ${routeColor}`
                          }
                        : {}
                    }
                    title={`Jump to ${wp.name}`}
                  >
                    WP-{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <span className="font-bold" style={{ color: routeColor }}>
              {Math.round(replayProgress * 100)}% TRACK COMPLETE
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={replayProgress}
            onChange={(e) => {
              setReplayProgress(parseFloat(e.target.value));
              setIsPlayingReplay(false);
            }}
            className="w-full h-1.5 bg-[#262933] rounded-none appearance-none cursor-pointer"
            style={{ accentColor: routeColor }}
          />
        </div>

        {/* Current Vehicle Telemetry Readout */}
        <div className="flex items-center gap-3 bg-[#1C1F26] px-3 py-1.5 border border-[#262933] shrink-0 text-[11px]">
          <div>
            <div className="text-[9px] text-[#94A3B8]">ESTIMATED SPEED</div>
            <div className="font-black text-sm" style={{ color: routeColor }}>
              {currentWp?.speed || 60} KM/H
            </div>
          </div>
          <div className="w-[1px] h-6 bg-[#262933]" />
          <div>
            <div className="text-[9px] text-[#94A3B8]">CURRENT CORRIDOR</div>
            <div className="text-[#F8FAFC] font-bold text-xs truncate max-w-[140px]">
              {currentWp?.name || 'Sector Active'}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

