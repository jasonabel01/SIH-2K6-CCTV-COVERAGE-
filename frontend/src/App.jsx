import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Radio, 
  Activity, 
  Terminal, 
  Lock, 
  Eye, 
  AlertCircle, 
  Award, 
  Database, 
  FileText, 
  Radar, 
  Sparkles,
  Compass,
  Crosshair,
  Layers,
  Cpu,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Unlock,
  Send,
  History,
  Key,
  ShieldAlert
} from 'lucide-react';

import ThreeHeroScene from './components/ThreeHeroScene';
import VisionLabSlider from './components/VisionLabSlider';
import Route3DSimulator from './components/Route3DSimulator';
import GodsEyeRadarSystem from './components/GodsEyeRadarSystem';
import UasGantryWireframe3D from './components/UasGantryWireframe3D';
import SubsystemHealthMatrix from './components/SubsystemHealthMatrix';
import TacticalCommandDeck from './components/TacticalCommandDeck';
import TacticalCameraWall from './components/TacticalCameraWall';
import TrajectoryTimelineViewer from './components/TrajectoryTimelineViewer';

/**
 * NeuroTraffic - City-Wide ANPR & Urban Traffic Intelligence
 * Smart India Hackathon (SIH 2026) Problem Statement 26127
 * 
 * Redesigned adhering to George Railean's "Drone Airframe Diagnostics - Dark UI for UAS Control":
 * 1. Deep dark carbon/obsidian ground station interface.
 * 2. System Readiness anchored top-left.
 * 3. 4 Subsystem Health Cards (Optical CLAHE, Neural ANPR, Spatial Graph, DPDP Vault).
 * 4. Central Diagnostic Stage: CCTV Matrix Wall, Journey Stitcher, Video Split-Lab, 3D Gantry, Radar Scope.
 * 5. Dedicated bottom Mission Timeline & Tactical Governor deck.
 * 6. Zero decorative noise: colors strictly signify operational state.
 */
export default function App() {
  const [centerView, setCenterView] = useState('cctv_matrix'); // 'cctv_matrix' | 'trajectory_history' | 'vision_lab' | 'gantry_3d' | 'gods_eye_radar' | 'route_sim'
  const [trackedPlate, setTrackedPlate] = useState('RJ 14 CA 0639');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [currentTime, setCurrentTime] = useState(3.4);
  const [duration, setDuration] = useState(12.0);
  const [activePreset, setActivePreset] = useState('live_video');
  const [isAnomalyActive, setIsAnomalyActive] = useState(false);
  const [judgeDemoRunning, setJudgeDemoRunning] = useState(false);
  const [pcrDispatched, setPcrDispatched] = useState(false);
  const [barrierLocked, setBarrierLocked] = useState(false);
  const [liveEventsCount, setLiveEventsCount] = useState(1420);
  const [latestSighting, setLatestSighting] = useState(null);

  // Connect to live sub-50ms WebSocket telemetry
  useEffect(() => {
    let ws;
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws/telemetry';
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event_type === 'VEHICLE_SIGHTING') {
            setLiveEventsCount((prev) => prev + 1);
            setLatestSighting(data);
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Synchronized Target Plate Data
  const plateDatabase = {
    'RJ 14 CA 0639': {
      id: 'RJ 14 CA 0639',
      state: 'Rajasthan (RJ)',
      category: '4-Wheeler (White Sedan Ahead)',
      conf: 97.8,
      chars: ['R', 'J', '1', '4', 'C', 'A', '0', '6', '3', '9'],
      speed: '65 km/h',
      heading: '040° NE',
      rto: 'Jaipur Central Transport Office',
      threat: 'NOMINAL',
      lastSeen: 'CAM_01 (DND Center Lane)',
      is2W: false
    },
    'HR 55 AH 7820': {
      id: 'HR 55 AH 7820',
      state: 'Haryana / Gurugram (HR)',
      category: 'Commercial Heavy Goods Truck',
      conf: 96.8,
      chars: ['H', 'R', '5', '5', 'A', 'H', '7', '8', '2', '0'],
      speed: '48 km/h',
      heading: '042° NE',
      rto: 'Gurugram Commercial Logistics Hub',
      threat: 'NOMINAL',
      lastSeen: 'CAM_01 (DND Left Freight Lane)',
      is2W: false
    },
    'UP 16 CH 9651': {
      id: 'UP 16 CH 9651',
      state: 'Uttar Pradesh / Noida (UP)',
      category: 'Private Sedan (Honda)',
      conf: 96.8,
      chars: ['U', 'P', '1', '6', 'C', 'H', '9', '6', '5', '1'],
      speed: '58 km/h',
      heading: '112° ESE',
      rto: 'Gautam Buddha Nagar Transport Hub',
      threat: 'NOMINAL',
      lastSeen: 'CAM_02 (Ashram Flyover, Lane 2)'
    },
    'DL 01 TA 4210': {
      id: 'DL 01 TA 4210',
      state: 'Delhi (DL)',
      category: 'Commercial Cab (Yellow)',
      conf: 95.2,
      chars: ['D', 'L', '0', '1', 'T', 'A', '4', '2', '1', '0'],
      speed: '42 km/h',
      heading: '284° WNW',
      rto: 'Mall Road Regional Office',
      threat: 'MONITORED',
      lastSeen: 'CAM_04 (Connaught Place Outer)',
      is2W: false
    },
    'DL 3S CD 8412': {
      id: 'DL 3S CD 8412',
      state: 'Delhi (DL)',
      category: '2-Wheeler (Hero Splendor Bike)',
      conf: 94.6,
      chars: ['D', 'L', '3', 'S', 'C', 'D', '8', '4', '1', '2'],
      speed: '49 km/h',
      heading: '046° NE',
      rto: 'Sheikh Sarai South Delhi Office',
      threat: 'NOMINAL',
      lastSeen: 'CAM_01 (DND Left Shoulder)',
      is2W: true
    },
    'DL 8C X 2628': {
      id: 'DL 8C X 2628',
      state: 'Delhi (DL)',
      category: '4-Wheeler (Maruti Swift)',
      conf: 95.9,
      chars: ['D', 'L', '8', 'C', 'X', '2', '6', '2', '8'],
      speed: '62 km/h',
      heading: '042° NE',
      rto: 'Janakpuri West Delhi Hub',
      threat: 'NOMINAL',
      lastSeen: 'CAM_02 (Flyover Lane 3)',
      is2W: false
    },
    'MH 01 CR 2440': {
      id: 'MH 01 CR 2440',
      state: 'Maharashtra / Mumbai (MH)',
      category: 'Commercial Yellow-Top Cab (Mumbai Interstate)',
      conf: 98.2,
      chars: ['M', 'H', '0', '1', 'C', 'R', '2', '4', '4', '0'],
      speed: '52 km/h',
      heading: '168° SSE',
      rto: 'Tardeo RTO, South Mumbai',
      threat: 'NOMINAL',
      lastSeen: 'CAM_DEL_ASHRAM_07 (Underpass Portal)',
      is2W: false
    },
    'DL 1ZC 5044': {
      id: 'DL 1ZC 5044',
      state: 'Delhi (DL)',
      category: 'Passenger 7-Seater (White Maruti Ertiga)',
      conf: 98.6,
      chars: ['D', 'L', '1', 'Z', 'C', '5', '0', '4', '4'],
      speed: '64 km/h',
      heading: '224° SW',
      rto: 'Palam Regional Transport Office',
      threat: 'NOMINAL',
      lastSeen: 'CAM_DEL_IGI_T3_29 (Departure Ramp)',
      is2W: false
    },
    'DL 08 CQ 4192': {
      id: 'DL 08 CQ 4192',
      state: 'Delhi (DL)',
      category: 'Commercial Delivery Courier Van',
      conf: 97.4,
      chars: ['D', 'L', '0', '8', 'C', 'Q', '4', '1', '9', '2'],
      speed: '48 km/h',
      heading: '090° E',
      rto: 'Wazirpur North-West Delhi',
      threat: 'NOMINAL',
      lastSeen: 'CAM_DEL_CP_OUTER_19 (Barakhamba Radial)',
      is2W: false
    },
    'MH 12 NP 6480': {
      id: 'MH 12 NP 6480',
      state: 'Maharashtra / Pune (MH)',
      category: 'Multi-Utility Vehicle (Silver Innova SUV)',
      conf: 96.4,
      chars: ['M', 'H', '1', '2', 'N', 'P', '6', '4', '8', '0'],
      speed: '58 km/h',
      heading: '172° S',
      rto: 'Pune Regional Transport Office',
      threat: 'NOMINAL',
      lastSeen: 'CAM_DEL_ASHRAM_07 (Lane 2)',
      is2W: false
    },
    'DL 12CT 2309': {
      id: 'DL 12CT 2309',
      state: 'Delhi (DL)',
      category: 'Compact Passenger Hatchback',
      conf: 96.1,
      chars: ['D', 'L', '1', '2', 'C', 'T', '2', '3', '0', '9'],
      speed: '55 km/h',
      heading: '220° SW',
      rto: 'Vasant Vihar South-West Delhi',
      threat: 'NOMINAL',
      lastSeen: 'CAM_DEL_IGI_T3_29 (Lane 2)',
      is2W: false
    },
    'HR 26 DQ 5521': {
      id: 'HR 26 DQ 5521',
      state: 'Haryana / Gurugram (HR)',
      category: 'CLONED ANOMALY (DEFCON 1 Breach)',
      conf: 98.7,
      chars: ['H', 'R', '2', '6', 'D', 'Q', '5', '5', '2', '1'],
      speed: '2108 km/h (Anomaly)',
      heading: 'Simultaneous DND & IGI',
      rto: 'Gurugram North RTO Office',
      threat: 'DEFCON 1 CRITICAL',
      lastSeen: 'CAM_DEL_DND_01 & CAM_DEL_IGI_T3_29',
      is2W: false
    }
  };

  const currentPlate = plateDatabase[trackedPlate] || plateDatabase['RJ 14 CA 0639'];

  // Handle Target Locking from any component
  const handleSelectPlateForTracking = (plate) => {
    setTrackedPlate(plate);
    setCenterView('gods_eye_radar');
  };

  // Automated Judge Demo Sequence
  const handleRunJudgeDemo = () => {
    setJudgeDemoRunning(true);
    setCenterView('vision_lab');
    setIsPlaying(true);
    setIsSlowMo(true);

    // Step 1: Switch to 3D Physical Gantry schematic after 3s
    setTimeout(() => {
      setCenterView('gantry_3d');
    }, 3500);

    // Step 2: Switch to God's Eye Radar and trigger Cloned Anomaly after 7s
    setTimeout(() => {
      setCenterView('gods_eye_radar');
      setIsAnomalyActive(true);
      setJudgeDemoRunning(false);
    }, 7000);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F8FAFC] font-sans selection:bg-[#262933] selection:text-white pb-24">
      {/* Top UAS Ground-Station Tactical Header */}
      <header className="sticky top-0 z-50 bg-[#13151B] border-b border-[#262933] px-4 lg:px-6 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          {/* Top-Left: System Readiness */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-none bg-[#10B981]/15 border border-[#10B981]/60 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
            <div>
              <div className="text-[9px] text-[#CBD5E1] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#10B981] animate-pulse" />
                SYSTEM READINESS: <span className="text-[#10B981] font-bold">99.4% OPTIMAL</span>
              </div>
              <div className="font-['Orbitron'] font-bold text-sm text-[#FFFFFF] tracking-wider flex items-center gap-1.5">
                NEUROTRAFFIC <span className="text-[#CBD5E1] text-xs font-normal">// POLICE C4ISR PS 26127</span>
              </div>
            </div>
          </div>

          {/* Center: Mission Code & Defense Threat Level */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-[#0A0B0E] border border-[#262933] rounded-none">
            <div className="flex items-center gap-1.5 text-[#FFFFFF]">
              <Compass className="w-3.5 h-3.5 text-[#CBD5E1]" />
              <span>MISSION: <span className="text-[#FFFFFF] font-bold tracking-wider">DELHI-NCR-CYBER-GRID</span></span>
            </div>
            <span className="text-[#262933]">|</span>
            <div className="flex items-center gap-1.5 text-[#FFFFFF]">
              <span>DEFCON: <span className="text-[#F59E0B] font-bold">4 (MONITORED)</span></span>
            </div>
            <span className="text-[#262933]">|</span>
            <div className="flex items-center gap-1.5 text-[#CBD5E1] text-[11px]">
              <span>LATENCY:</span>
              <span className="text-[#10B981] font-bold">48.3 ms</span>
            </div>
          </div>

          {/* Top-Right: Active Sensor Tower & Audit Trail CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right text-[11px] leading-tight">
              <div className="text-[#FFFFFF] font-bold flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                NODE: CAM_01 (DND TOLL)
              </div>
              <div className="text-[#CBD5E1] text-[10px]">28.5832° N, 77.2985° E | 214m MSL</div>
            </div>
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3 py-1 bg-[#1C1F26] hover:bg-[#252A34] text-[#E2E8F0] hover:text-[#FFFFFF] border border-[#374151] hover:border-[#F59E0B]/70 rounded-none flex items-center gap-1.5 transition-all cursor-pointer font-bold shadow-sm group"
            >
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-none shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              <Terminal className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#FFFFFF]" />
              <span>DPDP AUDIT LOG</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Ground-Station Diagnostic Grid */}
      <div className="w-full max-w-[1780px] mx-auto px-3 sm:px-4 lg:px-6 pt-3 pb-24">
        {/* Cloned Anomaly Banner */}
        {isAnomalyActive && (
          <div className="mb-4 p-3.5 rounded-none bg-[#EF4444] border border-[#EF4444] text-[#F8FAFC] flex flex-col md:flex-row items-center justify-between gap-3 font-mono shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-none bg-[#0A0B0E] border border-[#F8FAFC] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <div className="font-['Orbitron'] font-bold text-[#F8FAFC] tracking-wider text-xs flex items-center gap-2">
                  CRITICAL DEFCON 1: CLONED NUMBER PLATE DETECTED
                  <span className="text-[9px] bg-[#0A0B0E] text-[#F8FAFC] border border-[#F8FAFC]/40 px-1.5 py-0.2 rounded-none">
                    PHYSICS ENGINE BREACH
                  </span>
                </div>
                <div className="text-xs text-[#F8FAFC] mt-0.5">
                  Plate <span className="font-black underline">{currentPlate.id}</span> was simultaneously logged at CAM_01 (DND) and CAM_06 (IGI Airport) within 42 seconds.
                </div>
                <div className="text-[11px] text-[#F8FAFC]/90 mt-0.5">
                  • Spatial Distance: 24.6 km | Transit Velocity: 2,108 km/h (PHYSICALLY IMPOSSIBLE)
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAnomalyActive(false)}
              className="px-3 py-1.5 bg-[#1C1F26] hover:bg-[#252A34] text-[#FFFFFF] border border-[#EF4444] font-mono text-xs font-bold rounded-none uppercase tracking-wider shrink-0 cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
            >
              <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-none shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
              DISMISS ALERT
            </button>
          </div>
        )}

        {/* 3-Column UAS Diagnostic Command Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT COLUMN: Subsystem Health & Readiness (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="text-xs font-mono text-[#F8FAFC] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-[#262933]">
              <span className="flex items-center gap-1.5 font-bold">
                <Radio className="w-3.5 h-3.5 text-[#10B981]" />
                Sensor Array Status
              </span>
              <span className="text-[10px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 px-1.5 py-0.2 rounded-none font-bold">
                ONLINE: 4 NODES
              </span>
            </div>

            {/* Subsystem Health Matrix */}
            <SubsystemHealthMatrix />

            {/* Live Telemetry Health Matrix */}
            <div className="p-3 rounded-none bg-[#13151B] border border-[#262933] font-mono text-xs space-y-2">
              <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider flex items-center justify-between border-b border-[#262933] pb-1">
                <span>RADAR & CAMERA TELEMETRY</span>
                <span className="text-[#10B981] font-bold text-[9px]">NOMINAL</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#CBD5E1]">ANPR Strobe Trigger:</span>
                  <span className="text-[#F8FAFC] font-bold">850nm IR Pulse (OK)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CBD5E1]">Doppler Pulse:</span>
                  <span className="text-[#F8FAFC] font-bold">24.125 GHz Radar Locked</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CBD5E1]">Edge TPU Temperature:</span>
                  <span className="text-[#10B981] font-bold">46.2°C (STABLE)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CBD5E1]">Network Health:</span>
                  <span className="text-[#F8FAFC] font-bold">48.3 ms // 60 FPS</span>
                </div>
              </div>
            </div>

            {/* Corridor Sensor Fleet Status */}
            <div className="p-3 rounded-none bg-[#13151B] border border-[#262933] font-mono text-xs space-y-2">
              <div className="text-[10px] text-[#F8FAFC] font-bold uppercase tracking-wider flex items-center justify-between border-b border-[#262933] pb-1">
                <span>SENSOR FLEET NETWORK</span>
                <span className="text-[#10B981] font-bold">52/52 ONLINE</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#CBD5E1]">Live Detections Broadcast:</span>
                  <span className="text-[#10B981] font-bold">{liveEventsCount.toLocaleString()} veh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CBD5E1]">Optical Bilateral Gain:</span>
                  <span className="text-[#10B981] font-bold">+34.2 dB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CBD5E1]">Telemetry Stream:</span>
                  <span className="text-[#F8FAFC] font-bold">WS:// 38.4ms // 60 FPS</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Central Diagnostic Stage (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            {/* Center Stage Mode Switcher (Sharp Modular Tabs) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 bg-[#13151B] border border-[#262933] rounded-none p-1 font-mono text-xs gap-1">
              <button
                onClick={() => setCenterView('cctv_matrix')}
                className={`py-2 px-1 rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  centerView === 'cctv_matrix'
                    ? 'bg-[#252A34] text-[#FFFFFF] font-black border border-[#F59E0B] shadow-[inset_0_0_10px_rgba(245,158,11,0.12),0_0_10px_rgba(245,158,11,0.25)]'
                    : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151] hover:border-[#4B5563]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${centerView === 'cctv_matrix' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
                1. 4-Feed CCTV Wall
              </button>
              <button
                onClick={() => setCenterView('trajectory_history')}
                className={`py-2 px-1 rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  centerView === 'trajectory_history'
                    ? 'bg-[#252A34] text-[#FFFFFF] font-black border border-[#F59E0B] shadow-[inset_0_0_10px_rgba(245,158,11,0.12),0_0_10px_rgba(245,158,11,0.25)]'
                    : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151] hover:border-[#4B5563]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${centerView === 'trajectory_history' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
                2. Journey Stitcher
              </button>
              <button
                onClick={() => setCenterView('vision_lab')}
                className={`py-2 px-1 rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  centerView === 'vision_lab'
                    ? 'bg-[#252A34] text-[#FFFFFF] font-black border border-[#F59E0B] shadow-[inset_0_0_10px_rgba(245,158,11,0.12),0_0_10px_rgba(245,158,11,0.25)]'
                    : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151] hover:border-[#4B5563]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${centerView === 'vision_lab' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
                3. CLAHE Lab
              </button>
              <button
                onClick={() => setCenterView('gantry_3d')}
                className={`py-2 px-1 rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  centerView === 'gantry_3d'
                    ? 'bg-[#252A34] text-[#FFFFFF] font-black border border-[#F59E0B] shadow-[inset_0_0_10px_rgba(245,158,11,0.12),0_0_10px_rgba(245,158,11,0.25)]'
                    : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151] hover:border-[#4B5563]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${centerView === 'gantry_3d' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
                4. 3D Gantry
              </button>
              <button
                onClick={() => setCenterView('gods_eye_radar')}
                className={`py-2 px-1 rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  centerView === 'gods_eye_radar'
                    ? 'bg-[#252A34] text-[#FFFFFF] font-black border border-[#F59E0B] shadow-[inset_0_0_10px_rgba(245,158,11,0.12),0_0_10px_rgba(245,158,11,0.25)]'
                    : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151] hover:border-[#4B5563]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${centerView === 'gods_eye_radar' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
                5. God's Eye Radar
              </button>
              <button
                onClick={() => setCenterView('route_sim')}
                className={`py-2 px-1 rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  centerView === 'route_sim'
                    ? 'bg-[#252A34] text-[#FFFFFF] font-black border border-[#F59E0B] shadow-[inset_0_0_10px_rgba(245,158,11,0.12),0_0_10px_rgba(245,158,11,0.25)]'
                    : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151] hover:border-[#4B5563]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${centerView === 'route_sim' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
                6. 3D Corridor
              </button>
            </div>

            {/* Active Stage View */}
            <div className="w-full">
              {centerView === 'cctv_matrix' && (
                <TacticalCameraWall
                  activeTargetPlate={trackedPlate}
                  onSelectPlateForTracking={(p) => {
                    handleSelectPlateForTracking(p);
                    setCenterView('trajectory_history');
                  }}
                  isAnomalyActive={isAnomalyActive}
                  onTriggerAnomaly={() => setIsAnomalyActive(!isAnomalyActive)}
                  isPlaying={isPlaying}
                  isSlowMo={isSlowMo}
                  currentTime={currentTime}
                />
              )}

              {centerView === 'trajectory_history' && (
                <TrajectoryTimelineViewer
                  activePlate={trackedPlate}
                  onSelectPlate={(p) => setTrackedPlate(p)}
                  isAnomalyActive={isAnomalyActive}
                  onDispatchPcr={() => setPcrDispatched(true)}
                />
              )}

              {centerView === 'vision_lab' && (
                <VisionLabSlider onSelectPlateForTracking={handleSelectPlateForTracking} />
              )}

              {centerView === 'gantry_3d' && (
                <div className="space-y-3">
                  <UasGantryWireframe3D activeTargetPlate={trackedPlate} plateInfo={currentPlate} />
                  <div className="p-3 rounded-none bg-[#13151B] border border-[#262933] font-mono text-xs flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#CBD5E1] uppercase">PHYSICAL SENSOR ANGLE</div>
                      <div className="text-[#F8FAFC] font-bold text-sm">38.4° Pitch | ±2.1° Azimuth Tilt</div>
                    </div>
                    <button
                      onClick={() => setCenterView('cctv_matrix')}
                      className="px-3.5 py-1.5 bg-[#1C1F26] hover:bg-[#252A34] text-[#FFFFFF] font-bold rounded-none text-[11px] cursor-pointer transition-all border border-[#374151] hover:border-[#F59E0B] flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-none shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
                      SWITCH TO CCTV WALL
                    </button>
                  </div>
                </div>
              )}

              {centerView === 'gods_eye_radar' && (
                <GodsEyeRadarSystem activeTargetPlate={trackedPlate} />
              )}

              {centerView === 'route_sim' && (
                <Route3DSimulator 
                  activePlate={trackedPlate} 
                  isAnomalyActive={isAnomalyActive}
                  onToggleAnomaly={(val) => setIsAnomalyActive(val !== undefined ? val : !isAnomalyActive)}
                />
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Target Telemetry & Forensic Inspector (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="text-xs font-mono text-[#F8FAFC] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-[#262933]">
              <span className="flex items-center gap-1.5 font-bold">
                <Crosshair className="w-3.5 h-3.5 text-[#CBD5E1]" />
                Target Telemetry
              </span>
              <span className="text-[10px] font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 px-2 py-0.5 rounded-none font-bold">
                LOCKED
              </span>
            </div>

            {/* Target Plate Readout Box */}
            <div className="p-3.5 rounded-none bg-[#1A1C23] border border-[#323644] text-center font-mono relative shadow-inner">
              <div className="text-[9px] text-[#CBD5E1] tracking-widest uppercase">
                IND RTO SYNTAX VALIDATOR
              </div>
              <div className="text-2xl font-black font-mono tracking-widest text-[#FFFFFF] mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {currentPlate.id}
              </div>
              <div className="text-xs text-[#CBD5E1] font-mono mt-0.5">
                {currentPlate.state}
              </div>
              <div className="text-[10px] text-[#CBD5E1] mt-1">
                {currentPlate.rto}
              </div>
            </div>

            {/* Character Segmentation Breakdown */}
            <div className="p-3 rounded-none bg-[#13151B] border border-[#262933] font-mono text-xs">
              <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider mb-2 flex justify-between">
                <span>SEGMENTATION CHIPS:</span>
                <span className="text-[#F8FAFC] font-bold">{currentPlate.chars.length} CHARS</span>
              </div>
              <div className="flex flex-wrap gap-1 justify-center my-1">
                {currentPlate.chars.map((ch, idx) => (
                  <span
                    key={idx}
                    className="w-6 h-7 bg-[#0A0B0E] border border-[#323644] rounded-none flex items-center justify-center font-mono font-bold text-xs text-[#F8FAFC]"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-none bg-[#13151B] border border-[#262933]">
                <div className="text-[#CBD5E1] text-[9px]">CONFIDENCE</div>
                <div className="text-[#10B981] font-bold text-base mt-0.5">{currentPlate.conf}%</div>
              </div>
              <div className="p-2.5 rounded-none bg-[#13151B] border border-[#262933]">
                <div className="text-[#CBD5E1] text-[9px]">VELOCITY</div>
                <div className="text-[#F8FAFC] font-bold text-base mt-0.5">{currentPlate.speed}</div>
              </div>
              <div className="p-2.5 rounded-none bg-[#13151B] border border-[#262933]">
                <div className="text-[#CBD5E1] text-[9px]">HEADING</div>
                <div className="text-[#F8FAFC] font-bold text-xs mt-0.5">{currentPlate.heading}</div>
              </div>
              <div className="p-2.5 rounded-none bg-[#13151B] border border-[#262933]">
                <div className="text-[#CBD5E1] text-[9px]">THREAT LEVEL</div>
                <div className="text-[#10B981] font-bold text-xs mt-0.5">{currentPlate.threat}</div>
              </div>
            </div>

            {/* Quick Target Switcher */}
            <div className="p-3 rounded-none bg-[#13151B] border border-[#262933] font-mono text-xs">
              <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider mb-2">
                SWITCH ACTIVE TARGET
              </div>
              <div className="space-y-1">
                {Object.keys(plateDatabase).map((pId) => (
                  <button
                    key={pId}
                    onClick={() => setTrackedPlate(pId)}
                    className={`w-full py-1.5 px-2 rounded-none text-left transition-all flex items-center justify-between cursor-pointer text-xs ${
                      trackedPlate === pId
                        ? 'bg-[#252A34] text-[#FFFFFF] border border-[#F59E0B] font-black shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]'
                        : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${trackedPlate === pId ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-transparent'}`} />
                      <span>{pId}</span>
                    </div>
                    <span className={`text-[10px] ${trackedPlate === pId ? 'text-[#F59E0B] font-bold' : 'text-[#94A3B8]'}`}>
                      {plateDatabase[pId].category.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Law Enforcement Intercept & Action Protocol */}
            <div className="p-3 rounded-none bg-[#13151B] border border-[#262933] font-mono text-xs space-y-2">
              <div className="text-[10px] text-[#F8FAFC] font-bold uppercase tracking-wider flex items-center justify-between border-b border-[#262933] pb-1">
                <span className="flex items-center gap-1.5">
                  <Siren className="w-3.5 h-3.5 text-[#E2E8F0]" />
                  LAW ENFORCEMENT ACTIONS
                </span>
                <span className="text-[9px] bg-[#FFFFFF]/10 text-[#FFFFFF] border border-[#CBD5E1]/40 px-1 py-0.2 font-bold">
                  HOTLIST: CLEAR
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => setPcrDispatched(!pcrDispatched)}
                  className={`w-full py-1.5 px-2 text-[11px] font-bold rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                    pcrDispatched
                      ? 'bg-[#19231E] text-[#10B981] border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'bg-[#1C1F26] hover:bg-[#252A34] text-[#E2E8F0] hover:text-[#10B981] border-[#374151] hover:border-[#10B981]/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${pcrDispatched ? 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.9)]' : 'bg-[#4B5563]'}`} />
                    <Send className="w-3 h-3" />
                    {pcrDispatched ? 'PCR PATROL DISPATCHED' : 'DISPATCH PCR PATROL'}
                  </span>
                  <span className="text-[9px] font-mono">{pcrDispatched ? 'ETA 2.1 MIN' : 'UNIT 14'}</span>
                </button>

                <button
                  onClick={() => setBarrierLocked(!barrierLocked)}
                  className={`w-full py-1.5 px-2 text-[11px] font-bold rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                    barrierLocked
                      ? 'bg-[#261618] text-[#EF4444] border-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                      : 'bg-[#1C1F26] hover:bg-[#252A34] text-[#E2E8F0] hover:text-[#EF4444] border-[#374151] hover:border-[#EF4444]/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${barrierLocked ? 'bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.9)]' : 'bg-[#4B5563]'}`} />
                    <Lock className="w-3 h-3" />
                    {barrierLocked ? 'TOLL BARRIER LOCKED' : 'REMOTE BARRIER LOCKDOWN'}
                  </span>
                  <span className="text-[9px] font-mono">{barrierLocked ? 'ENGAGED' : 'ARMED'}</span>
                </button>
              </div>
            </div>

            {/* DPDP 2023 Cryptographic Proof & Vault Snapshot */}
            <div className="p-3 rounded-none bg-[#13151B] border border-[#262933] font-mono text-xs space-y-1.5">
              <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider flex items-center justify-between border-b border-[#262933] pb-1">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-[#10B981]" />
                  DPDP 2023 VAULT SNAPSHOT
                </span>
                <span className="text-[#10B981] font-bold text-[9px]">ENCRYPTED</span>
              </div>
              <div className="text-[10px] text-[#CBD5E1] space-y-1 pt-0.5">
                <div className="flex justify-between">
                  <span>SHA-256 Signature:</span>
                  <span className="text-[#F8FAFC] font-mono truncate max-w-[130px]">8f4b2a9e87...c701</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-Pruning TTL:</span>
                  <span className="text-[#F8FAFC] font-bold">71h 54m Remaining</span>
                </div>
                <div className="flex justify-between">
                  <span>PII Anonymization:</span>
                  <span className="text-[#10B981] font-bold">AES-GCM-256 (OK)</span>
                </div>
              </div>
            </div>

            {/* Multi-Node Corridor Sighting Chain */}
            <div className="p-3 rounded-none bg-[#13151B] border border-[#262933] font-mono text-xs space-y-1.5">
              <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider flex items-center justify-between border-b border-[#262933] pb-1">
                <span className="flex items-center gap-1">
                  <History className="w-3 h-3 text-[#CBD5E1]" />
                  CORRIDOR SIGHTING AUDIT
                </span>
                <span className="text-[#F8FAFC] text-[9px] font-bold">4 NODES</span>
              </div>
              <div className="space-y-1.5 text-[10px] pt-1">
                <div className="flex items-center justify-between bg-[#0A0B0E] p-1.5 border border-[#262933]">
                  <span className="text-[#F8FAFC] font-bold">CAM_01 (DND Toll)</span>
                  <span className="text-[#CBD5E1]">14:02:15</span>
                  <span className="text-[#10B981] font-bold">68 km/h</span>
                </div>
                <div className="flex items-center justify-between bg-[#0A0B0E] p-1.5 border border-[#262933]">
                  <span className="text-[#F8FAFC] font-bold">CAM_02 (Ring Road)</span>
                  <span className="text-[#CBD5E1]">14:05:40</span>
                  <span className="text-[#10B981] font-bold">61 km/h</span>
                </div>
                <div className="flex items-center justify-between bg-[#0A0B0E] p-1.5 border border-[#262933]">
                  <span className="text-[#F8FAFC] font-bold">CAM_03 (Barakhamba)</span>
                  <span className="text-[#CBD5E1]">14:09:10</span>
                  <span className="text-[#F8FAFC] font-bold">48 km/h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Mission Deck */}
      <TacticalCommandDeck
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        isSlowMo={isSlowMo}
        onToggleSlowMo={() => setIsSlowMo(!isSlowMo)}
        currentTime={currentTime}
        duration={duration}
        onScrub={(t) => setCurrentTime(t)}
        activePreset={activePreset}
        onSelectPreset={(p) => setActivePreset(p)}
        onTriggerAnomaly={() => setIsAnomalyActive(!isAnomalyActive)}
        isAnomalyActive={isAnomalyActive}
        onRunJudgeDemo={handleRunJudgeDemo}
      />

      {/* DPDP Act 2023 Cryptographic Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0B0E]/90 backdrop-blur-none flex items-center justify-center p-4">
          <div className="bg-[#13151B] p-5 rounded-none border border-[#262933] max-w-2xl w-full font-mono shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#262933]">
              <div className="flex items-center gap-2 text-[#F8FAFC] text-xs font-bold uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-[#CBD5E1]" />
                OFFICER SURVEILLANCE AUDIT TRAIL (DPDP ACT 2023)
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-[#E2E8F0] hover:text-[#FFFFFF] bg-[#1C1F26] hover:bg-[#252A34] font-bold text-xs px-2.5 py-1 border border-[#374151] hover:border-[#4B5563] rounded-none cursor-pointer transition-all shadow-sm"
              >
                CLOSE [ESC]
              </button>
            </div>

            <div className="mt-3 text-xs space-y-1.5 max-h-72 overflow-y-auto pr-1">
              <div className="p-2.5 rounded-none bg-[#0A0B0E] border border-[#262933] flex justify-between items-center">
                <div>
                  <span className="text-[#10B981] font-bold">[QUERY]</span> Target: <span className="text-[#F8FAFC] font-bold">RJ 14 CA 0639</span>
                  <div className="text-[10px] text-[#CBD5E1]">Officer: Insp. R. Sharma (ID: DL-POL-4821) | Reason: Highway ANPR Verification</div>
                </div>
                <span className="text-[10px] text-[#CBD5E1]">14:14:02 IST</span>
              </div>
              <div className="p-2.5 rounded-none bg-[#0A0B0E] border border-[#262933] flex justify-between items-center">
                <div>
                  <span className="text-[#EF4444] font-bold">[ALERT]</span> Cloned Plate Violation: <span className="text-[#F8FAFC] font-bold">RJ 14 CA 0639</span>
                  <div className="text-[10px] text-[#CBD5E1]">Trigger: Physics velocity violation (2,108 km/h across CAM_01 & CAM_06)</div>
                </div>
                <span className="text-[10px] text-[#CBD5E1]">14:12:45 IST</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#262933] flex justify-between items-center text-[10px] text-[#CBD5E1]">
              <span>SHA-256 Hash: 9f8a3c2e1b4d5e6f7a8b... (Tamper Evident)</span>
              <span className="text-[#10B981]">Compliance: Section 4(2) DPDP 2023</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
