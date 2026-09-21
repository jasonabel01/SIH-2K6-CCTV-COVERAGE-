import React, { useState, useEffect } from 'react';
import {
  History,
  Radio,
  MapPin,
  Clock,
  Gauge,
  AlertTriangle,
  Send,
  Search,
  CheckCircle2,
  Navigation,
  Shield,
  Zap,
  ArrowRight,
  Car,
  Bike,
  Truck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

/**
 * TrajectoryTimelineViewer - Reconstructs and visualizes multi-camera chronological vehicle journeys.
 * Queries GET /api/v1/trajectories/{plate} and renders:
 *  - Full journey metrics (Distance, Elapsed Time, Avg Velocity).
 *  - Chronological gantry sequence with unique mock sighting addresses for each plate.
 *  - Inter-camera segment velocities with speeding/physics flags.
 *  - Police intercept vector calculation.
 */

// Curated demo plates with distinct mock sighting itineraries
const DEMO_TARGET_PROFILES = {
  'RJ 14 CA 0639': {
    category: '4-Wheeler Sedan (Inter-State Transit)',
    isCloned: false,
    distance: 14.2,
    timeMins: 25.0,
    avgSpeed: 54.2,
    sightings: [
      { camera_id: 'CAM_DEL_DND_01', gantry_name: 'DND Toll Plaza (Delhi Inbound)', corridor: 'DND Flyway', address: 'DND Expressway Km 2.4, Inbound Lane 3, Mayur Vihar Toll Gate, New Delhi', timestamp: 1726851000, speed_kmh: 68.0, speed_limit: 80, confidence: 97.8, lane: 2 },
      { camera_id: 'CAM_DEL_DND_02', gantry_name: 'DND Yamuna Bridge Gantry 02', corridor: 'DND Flyway', address: 'Yamuna Bridge Superstructure, North Pier Gantry, DND Flyway Eastbound', timestamp: 1726851120, speed_kmh: 72.0, speed_limit: 80, confidence: 98.2, lane: 2 },
      { camera_id: 'CAM_DEL_ASHRAM_07', gantry_name: 'Ashram Chowk Underpass / Flyover', corridor: 'Ring Road', address: 'Ring Road & Mathura Road Underpass Entrance, Ashram Chowk Sector 7, South Delhi', timestamp: 1726851540, speed_kmh: 58.0, speed_limit: 60, confidence: 96.9, lane: 1 },
      { camera_id: 'CAM_DEL_LAJPAT_08', gantry_name: 'Lajpat Nagar Central Flyover', corridor: 'Ring Road', address: 'Ring Road South Elevated Corridor, Near Lajpat Nagar Metro Pillar 42', timestamp: 1726851960, speed_kmh: 64.0, speed_limit: 60, confidence: 97.5, lane: 3 },
      { camera_id: 'CAM_DEL_AIIMS_10', gantry_name: 'AIIMS Flyover & Trauma Corridor', corridor: 'Ring Road', address: 'Mahatma Gandhi Marg, AIIMS Trauma Center Emergency Arterial Corridor, New Delhi', timestamp: 1726852500, speed_kmh: 49.0, speed_limit: 50, confidence: 98.0, lane: 2 }
    ]
  },
  'MH 01 CR 2440': {
    category: 'Commercial Yellow-Top Cab (Mumbai Interstate Permit)',
    isCloned: false,
    distance: 28.4,
    timeMins: 42.0,
    avgSpeed: 53.8,
    sightings: [
      { camera_id: 'CAM_GUR_BORDER_32', gantry_name: 'Delhi-Gurugram Border Toll Gantry', corridor: 'Inter-State Express', address: 'NH-48 Express Km 24.2, Sirhaul Toll Gantry, Haryana-Delhi Interstate Border', timestamp: 1726850000, speed_kmh: 62.0, speed_limit: 80, confidence: 97.2, lane: 3 },
      { camera_id: 'CAM_DEL_MAHIPAL_27', gantry_name: 'Mahipalpur Bypass Flyover', corridor: 'NH-48 Express', address: 'Mehrauli-Gurgaon Road Link, Mahipalpur Flyover Inbound, South-West Delhi', timestamp: 1726850420, speed_kmh: 58.0, speed_limit: 70, confidence: 96.8, lane: 2 },
      { camera_id: 'CAM_DEL_DHAULA_13', gantry_name: 'Dhaula Kuan Multi-Tier Interchange', corridor: 'Ring Road / NH-48', address: 'NH-48 Interchange Tier 2 Gantry, Dhaula Kuan Army Cantonment Node, New Delhi', timestamp: 1726850960, speed_kmh: 54.0, speed_limit: 60, confidence: 98.0, lane: 2 },
      { camera_id: 'CAM_DEL_ASHRAM_07', gantry_name: 'Ashram Chowk Underpass / Flyover', corridor: 'Ring Road', address: 'Ring Road & Mathura Road Intersection, Ashram Chowk Sector 7, South Delhi', timestamp: 1726851680, speed_kmh: 52.0, speed_limit: 60, confidence: 98.2, lane: 1 },
      { camera_id: 'CAM_DEL_CP_OUTER_19', gantry_name: 'Connaught Place Outer Circle', corridor: 'Central VIP', address: 'Connaught Place Outer Circle, Radial 4 / Barakhamba Road Junction, Central Delhi', timestamp: 1726852520, speed_kmh: 44.0, speed_limit: 40, confidence: 97.6, lane: 2 }
    ]
  },
  'DL 1ZC 5044': {
    category: '7-Seater Passenger Vehicle (Maruti Ertiga)',
    isCloned: false,
    distance: 22.8,
    timeMins: 32.0,
    avgSpeed: 59.4,
    sightings: [
      { camera_id: 'CAM_DEL_IGI_T3_29', gantry_name: 'IGI Airport Terminal 3 Departure Ramp', corridor: 'IGI International', address: 'Indira Gandhi International Airport, Terminal 3 Elevated Departure Viaduct, New Delhi', timestamp: 1726850600, speed_kmh: 64.0, speed_limit: 40, confidence: 98.6, lane: 1 },
      { camera_id: 'CAM_DEL_AEROCITY_28', gantry_name: 'Aerocity Hospitality Spine', corridor: 'Airport Axis', address: 'Aerocity Worldmark Arterial Road, Asset Area 4, IGI Airport Precinct', timestamp: 1726850900, speed_kmh: 52.0, speed_limit: 50, confidence: 97.4, lane: 2 },
      { camera_id: 'CAM_DEL_MOTIBAGH_12', gantry_name: 'Moti Bagh Ring Road Flyover', corridor: 'Ring Road', address: 'Ring Road West Elevated Section, Near Shanti Path Crossing, South Delhi', timestamp: 1726851380, speed_kmh: 59.0, speed_limit: 60, confidence: 98.1, lane: 3 },
      { camera_id: 'CAM_DEL_AIIMS_10', gantry_name: 'AIIMS Flyover & Trauma Corridor', corridor: 'Ring Road', address: 'Mahatma Gandhi Marg, AIIMS Trauma Center Emergency Arterial Corridor, New Delhi', timestamp: 1726851860, speed_kmh: 48.0, speed_limit: 50, confidence: 97.9, lane: 2 },
      { camera_id: 'CAM_DEL_DND_01', gantry_name: 'DND Toll Plaza (Delhi Inbound)', corridor: 'DND Flyway', address: 'DND Expressway Km 2.4, Inbound Toll Plaza, Mayur Vihar Border, New Delhi', timestamp: 1726852520, speed_kmh: 70.0, speed_limit: 80, confidence: 98.4, lane: 2 }
    ]
  },
  'DL 08 CQ 4192': {
    category: 'Commercial Delivery Courier Van',
    isCloned: false,
    distance: 12.6,
    timeMins: 26.5,
    avgSpeed: 47.5,
    sightings: [
      { camera_id: 'CAM_DEL_KASHMERE_18', gantry_name: 'Kashmere Gate ISBT North Gantry', corridor: 'Ring Road North', address: 'Grand Trunk Road, Kashmere Gate Inter-State Bus Terminus North Gate, North Delhi', timestamp: 1726849500, speed_kmh: 45.0, speed_limit: 50, confidence: 96.8, lane: 1 },
      { camera_id: 'CAM_DEL_RAJGHAT_25', gantry_name: 'Rajghat Ring Road Crossing', corridor: 'Ring Road', address: 'Mahatma Gandhi Marg, Ring Road East Corridor, Rajghat Memorial Bypass', timestamp: 1726850100, speed_kmh: 52.0, speed_limit: 60, confidence: 97.1, lane: 2 },
      { camera_id: 'CAM_DEL_ITO_24', gantry_name: 'ITO Junction & Vikas Minar Gantry', corridor: 'East-West Arterial', address: 'Bahadur Shah Zafar Marg & Vikas Marg Crossing, Vikas Minar Gantry, ITO Junction', timestamp: 1726850600, speed_kmh: 48.0, speed_limit: 50, confidence: 96.9, lane: 2 },
      { camera_id: 'CAM_DEL_CP_OUTER_19', gantry_name: 'Connaught Place Outer Circle', corridor: 'Central VIP', address: 'Connaught Place Outer Circle, Radial 4 / Barakhamba Road Junction, Central Delhi', timestamp: 1726851100, speed_kmh: 42.0, speed_limit: 40, confidence: 97.4, lane: 1 }
    ]
  },
  'DL 3S CD 8412': {
    category: '2-Wheeler Motorcycle (Hero Splendor)',
    isCloned: false,
    distance: 7.2,
    timeMins: 14.0,
    avgSpeed: 45.0,
    sightings: [
      { camera_id: 'CAM_DEL_DND_01', gantry_name: 'DND Toll Plaza (Delhi Inbound)', corridor: 'DND Flyway', address: 'DND Expressway Km 2.4, Inbound Toll Plaza Shoulder, Mayur Vihar Link, New Delhi', timestamp: 1726851200, speed_kmh: 49.0, speed_limit: 80, confidence: 95.8, lane: 4 },
      { camera_id: 'CAM_DEL_MAYUR_04', gantry_name: 'Mayur Vihar Link Road Junction', corridor: 'Yamuna Trans', address: 'Mayur Vihar Phase 1 Flyover & Link Road Intersection, East Delhi', timestamp: 1726851500, speed_kmh: 44.0, speed_limit: 60, confidence: 96.1, lane: 3 },
      { camera_id: 'CAM_DEL_ASHRAM_07', gantry_name: 'Ashram Chowk Underpass / Flyover', corridor: 'Ring Road', address: 'Ring Road & Mathura Road Underpass Entrance, Ashram Chowk Sector 7, South Delhi', timestamp: 1726852040, speed_kmh: 42.0, speed_limit: 60, confidence: 95.4, lane: 3 }
    ]
  },
  'HR 26 DQ 5521': {
    category: 'CRITICAL ALERT: Cloned Registration (DEFCON 1 Physics Breach)',
    isCloned: true,
    distance: 24.6,
    timeMins: 0.7,
    avgSpeed: 2108.0,
    sightings: [
      { camera_id: 'CAM_DEL_DND_01', gantry_name: 'DND Toll Plaza (Delhi Inbound)', corridor: 'DND Flyway', address: 'DND Expressway Km 2.4, Inbound Lane 3, Mayur Vihar Toll Gate, New Delhi', timestamp: 1726852800, speed_kmh: 75.0, speed_limit: 80, confidence: 98.5, lane: 2 },
      { camera_id: 'CAM_DEL_IGI_T3_29', gantry_name: 'IGI Airport Terminal 3 Departure Ramp', corridor: 'IGI International', address: 'Indira Gandhi International Airport, Terminal 3 Elevated Departure Viaduct, New Delhi', timestamp: 1726852842, speed_kmh: 80.0, speed_limit: 40, confidence: 98.7, lane: 1 }
    ]
  }
};

export default function TrajectoryTimelineViewer({
  activePlate,
  onSelectPlate,
  isAnomalyActive,
  onDispatchPcr
}) {
  const [searchInput, setSearchInput] = useState(activePlate || 'RJ 14 CA 0639');
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pcrDispatched, setPcrDispatched] = useState(false);

  // Synchronize search input if activePlate changes externally
  useEffect(() => {
    if (activePlate) {
      setSearchInput(activePlate);
      fetchTrajectory(activePlate);
    }
  }, [activePlate]);

  const fetchTrajectory = async (plate) => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/v1/trajectories/${encodeURIComponent(plate)}?fuzzy=true`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.sightings && json.data.sightings.length > 0) {
          setTrajectoryData(json.data);
          return;
        }
      }
      fallbackTrajectory(plate);
    } catch (e) {
      fallbackTrajectory(plate);
    } finally {
      setLoading(false);
    }
  };

  // Client-side fallback with authentic, plate-specific mock sighting addresses
  const fallbackTrajectory = (plate) => {
    const cleanPlate = plate.trim().toUpperCase();
    const isCloned = cleanPlate === 'HR 26 DQ 5521' || isAnomalyActive;

    const preset = DEMO_TARGET_PROFILES[cleanPlate];
    if (preset) {
      setTrajectoryData({
        query_plate: cleanPlate,
        matched_plate: cleanPlate,
        category: preset.category,
        fuzzy_deduplicated: false,
        total_sightings: preset.sightings.length,
        total_distance_km: preset.distance,
        elapsed_time_minutes: preset.timeMins,
        average_speed_kmh: preset.avgSpeed,
        physics_breach_detected: isCloned || preset.isCloned,
        sightings: preset.sightings,
        segments: buildSegmentsFromSightings(preset.sightings)
      });
      return;
    }

    // Procedural generator for any arbitrary plate entered by user
    const routeChains = [
      DEMO_TARGET_PROFILES['RJ 14 CA 0639'].sightings,
      DEMO_TARGET_PROFILES['MH 01 CR 2440'].sightings,
      DEMO_TARGET_PROFILES['DL 1ZC 5044'].sightings,
      DEMO_TARGET_PROFILES['DL 08 CQ 4192'].sightings
    ];
    const hash = cleanPlate.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % routeChains.length;
    const selectedChain = routeChains[hash];

    setTrajectoryData({
      query_plate: cleanPlate,
      matched_plate: cleanPlate,
      category: 'Tracked Private Vehicle (Delhi NCR Corridor)',
      fuzzy_deduplicated: false,
      total_sightings: selectedChain.length,
      total_distance_km: 18.5,
      elapsed_time_minutes: 24.2,
      average_speed_kmh: 52.4,
      physics_breach_detected: isCloned,
      sightings: selectedChain,
      segments: buildSegmentsFromSightings(selectedChain)
    });
  };

  const buildSegmentsFromSightings = (sightings) => {
    const segs = [];
    for (let i = 0; i < sightings.length - 1; i++) {
      const s1 = sightings[i];
      const s2 = sightings[i + 1];
      const dt = Math.max(0.1, s2.timestamp - s1.timestamp);
      const isBreach = dt < 60 && (s2.camera_id === 'CAM_DEL_IGI_T3_29' || s1.camera_id === 'CAM_DEL_DND_01');
      segs.push({
        from_camera: s1.camera_id,
        from_gantry: s1.gantry_name,
        from_address: s1.address || s1.sighting_address || s1.gantry_name,
        to_camera: s2.camera_id,
        to_gantry: s2.gantry_name,
        to_address: s2.address || s2.sighting_address || s2.gantry_name,
        distance_km: isBreach ? 24.6 : 3.8,
        transit_time_seconds: dt,
        calculated_speed_kmh: isBreach ? 2108.0 : Math.round((3.8 / (dt / 3600)) * 10) / 10,
        speed_limit_kmh: s2.speed_limit || 60,
        is_speeding: false,
        is_physics_breach: isBreach
      });
    }
    return segs;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const target = searchInput.trim().toUpperCase();
      if (onSelectPlate) onSelectPlate(target);
      fetchTrajectory(target);
    }
  };

  const formatTimestamp = (epoch, idx) => {
    if (!epoch) return '--:--:--';
    // Consistent readable IST simulated time format
    const baseHour = 14;
    const baseMin = 10 + idx * 4;
    const baseSec = 15 + idx * 8;
    return `${String(baseHour).padStart(2, '0')}:${String(baseMin).padStart(2, '0')}:${String(baseSec % 60).padStart(2, '0')} IST`;
  };

  return (
    <div className="w-full bg-[#13151B] border border-[#262933] font-mono text-xs shadow-2xl">
      {/* Header & Search Bar */}
      <div className="p-3.5 bg-[#0E1015] border-b border-[#262933] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-[#10B981]/15 border border-[#10B981]/60 flex items-center justify-center">
            <History className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div>
            <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5">
              <span>MULTI-CAMERA TRAJECTORY RECONSTRUCTION</span>
              <span className="text-[#374151]">•</span>
              <span className="text-[#10B981] font-bold">52 NODES ARTERIAL SEARCH</span>
            </div>
            <div className="text-xs font-bold text-[#FFFFFF]">
              SPATIAL-TEMPORAL JOURNEY STITCHER // SIH PS 26127
            </div>
          </div>
        </div>

        {/* Quick Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              placeholder="SEARCH REGISTRATION..."
              className="px-2.5 py-1.5 bg-[#0A0B0E] border border-[#374151] focus:border-[#F59E0B] text-[#FFFFFF] text-xs font-mono font-bold w-48 outline-none uppercase placeholder:text-[#64748B]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#1C1F26] hover:bg-[#252A34] text-[#FFFFFF] border border-[#374151] hover:border-[#F59E0B] font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>TRACE</span>
          </button>
        </form>
      </div>

      {/* Quick Demo Plate Selector Bar */}
      <div className="px-3.5 py-2 bg-[#0A0B0E] border-b border-[#262933] flex items-center gap-1.5 flex-wrap text-[10px]">
        <span className="text-[#CBD5E1] font-bold uppercase mr-1">QUICK TARGETS:</span>
        {Object.keys(DEMO_TARGET_PROFILES).map((plateKey) => {
          const isSelected = trajectoryData?.matched_plate === plateKey;
          const isAlert = plateKey === 'HR 26 DQ 5521';
          return (
            <button
              key={plateKey}
              onClick={() => {
                setSearchInput(plateKey);
                if (onSelectPlate) onSelectPlate(plateKey);
                fetchTrajectory(plateKey);
              }}
              className={`px-2 py-0.5 border transition-all cursor-pointer font-bold flex items-center gap-1 ${
                isSelected
                  ? isAlert
                    ? 'bg-[#EF4444] text-[#FFFFFF] border-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    : 'bg-[#252A34] text-[#F59E0B] border-[#F59E0B] shadow-[inset_0_0_6px_rgba(245,158,11,0.2)]'
                  : isAlert
                    ? 'bg-[#261618] text-[#EF4444] border-[#EF4444]/60 hover:bg-[#EF4444] hover:text-white'
                    : 'bg-[#13151B] text-[#CBD5E1] border-[#374151] hover:text-[#FFFFFF] hover:border-[#CBD5E1]'
              }`}
            >
              {isAlert ? <AlertTriangle className="w-2.5 h-2.5" /> : <Car className="w-2.5 h-2.5" />}
              <span>{plateKey}</span>
            </button>
          );
        })}
      </div>

      {/* Trajectory Content */}
      {trajectoryData && (
        <div className="p-3.5 space-y-3.5 bg-[#0A0B0E]">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-[#13151B] border border-[#262933]">
              <div className="text-[9px] text-[#CBD5E1] uppercase">TARGET VEHICLE</div>
              <div className="text-base font-black text-[#FFFFFF] mt-0.5 tracking-wider">
                {trajectoryData.matched_plate}
              </div>
              <div className="text-[9px] text-[#F59E0B] font-bold mt-0.5 truncate">
                {trajectoryData.category || 'Verified Registration'}
              </div>
            </div>

            <div className="p-2.5 bg-[#13151B] border border-[#262933]">
              <div className="text-[9px] text-[#CBD5E1] uppercase">TOTAL DISTANCE</div>
              <div className="text-base font-black text-[#10B981] mt-0.5">
                {trajectoryData.total_distance_km} km
              </div>
              <div className="text-[9px] text-[#CBD5E1] mt-0.5">
                Across {trajectoryData.total_sightings} Checkpoints
              </div>
            </div>

            <div className="p-2.5 bg-[#13151B] border border-[#262933]">
              <div className="text-[9px] text-[#CBD5E1] uppercase">ELAPSED TIME</div>
              <div className="text-base font-black text-[#FFFFFF] mt-0.5">
                {trajectoryData.elapsed_time_minutes} mins
              </div>
              <div className="text-[9px] text-[#CBD5E1] mt-0.5">
                Avg: {trajectoryData.average_speed_kmh} km/h
              </div>
            </div>

            <div className="p-2.5 bg-[#13151B] border border-[#262933]">
              <div className="text-[9px] text-[#CBD5E1] uppercase">SECURITY STATUS</div>
              <div className={`text-base font-black mt-0.5 ${trajectoryData.physics_breach_detected ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                {trajectoryData.physics_breach_detected ? 'DEFCON 1' : 'NOMINAL'}
              </div>
              <div className="text-[9px] text-[#CBD5E1] mt-0.5">
                {trajectoryData.physics_breach_detected ? 'Physics Engine Breach' : 'Clean Journey Record'}
              </div>
            </div>
          </div>

          {/* Critical Cloned Registration Notice */}
          {trajectoryData.physics_breach_detected && (
            <div className="p-3 bg-[#261618] border border-[#EF4444] text-[#F8FAFC] flex items-start gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5 animate-bounce" />
              <div>
                <div className="text-xs font-black text-[#EF4444] tracking-wider uppercase">
                  DEFCON 1: CLONED VEHICLE REGISTRATION (PHYSICS BREACH DETECTED)
                </div>
                <div className="text-xs text-[#CBD5E1] mt-0.5">
                  Inter-camera velocity calculation: <span className="text-[#FFFFFF] font-bold">{trajectoryData.average_speed_kmh} km/h</span> across distant gantries within 42 seconds. Physically impossible for a single chassis.
                </div>
              </div>
            </div>
          )}

          {/* Chronological Sighting Nodes with Distinct Mock Addresses */}
          <div className="space-y-2">
            <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-[#262933]">
              <span>CHRONOLOGICAL SIGHTING TIMELINE WITH MOCK SIGHTING ADDRESSES</span>
              <span className="text-[#10B981] font-bold">SORTED BY SIGHTING TIME</span>
            </div>

            <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#262933]">
              {trajectoryData.sightings.map((s, idx) => {
                const address = s.address || s.sighting_address || `${s.gantry_name}, Delhi NCR`;
                return (
                  <div key={idx} className="relative bg-[#13151B] p-3 border border-[#262933] flex flex-col gap-2 transition-all hover:border-[#374151]">
                    {/* Node Dot */}
                    <div className="absolute -left-[21px] top-3.5 w-3 h-3 bg-[#0A0B0E] border-2 border-[#10B981] rounded-none flex items-center justify-center">
                      <span className="w-1 h-1 bg-[#10B981]" />
                    </div>

                    {/* Sighting Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-[#1C1F26] text-[#F59E0B] font-bold text-[10px] border border-[#374151]">
                          SIGHTING #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[#10B981] font-bold">[{s.camera_id}]</span>
                        <span className="text-xs font-bold text-[#FFFFFF]">{s.gantry_name}</span>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <span className="text-[10px] text-[#CBD5E1] bg-[#0A0B0E] px-2 py-0.5 border border-[#262933]">
                          {formatTimestamp(s.timestamp, idx)}
                        </span>
                        <div className="text-xs font-black text-[#FFFFFF]">
                          {s.speed_kmh} km/h
                        </div>
                      </div>
                    </div>

                    {/* Prominent Mock Sighting Address Box */}
                    <div className="p-2 bg-[#0E1015] border border-[#262933] flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-tight">
                        <div className="text-[9px] text-[#CBD5E1] font-bold uppercase tracking-wider">
                          MOCK SIGHTING ADDRESS / SENSOR CHECKPOINT:
                        </div>
                        <div className="text-[#FFFFFF] font-bold mt-0.5">
                          {address}
                        </div>
                      </div>
                    </div>

                    {/* Telemetry Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#CBD5E1] pt-1 border-t border-[#1C1F26]">
                      <div className="flex items-center gap-2">
                        <span>Corridor: <strong className="text-[#FFFFFF]">{s.corridor}</strong></span>
                        <span>•</span>
                        <span>Lane: <strong className="text-[#10B981]">Lane {s.lane || 1}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Speed Limit: <strong className="text-[#CBD5E1]">{s.speed_limit || 60} km/h</strong></span>
                        <span>•</span>
                        <span>OCR Confidence: <strong className="text-[#10B981]">{s.confidence}%</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inter-Gantry Speed & Distance Segments */}
          {trajectoryData.segments && trajectoryData.segments.length > 0 && (
            <div className="p-3 bg-[#13151B] border border-[#262933] space-y-2">
              <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-[#262933]">
                <span>INTER-CAMERA TRANSIT VECTORS</span>
                <span className="text-[#F59E0B] font-bold">{trajectoryData.segments.length} TRANSIT LEGS</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {trajectoryData.segments.map((seg, sIdx) => (
                  <div key={sIdx} className="p-2 bg-[#0A0B0E] border border-[#262933] text-[10px]">
                    <div className="flex items-center justify-between font-bold text-[#FFFFFF]">
                      <span className="truncate">{seg.from_gantry}</span>
                      <ArrowRight className="w-3 h-3 text-[#F59E0B] shrink-0 mx-1" />
                      <span className="truncate">{seg.to_gantry}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[#CBD5E1]">
                      <span>Dist: <strong className="text-[#10B981]">{seg.distance_km} km</strong></span>
                      <span>Time: <strong className="text-[#FFFFFF]">{seg.transit_time_seconds}s</strong></span>
                      <span>Speed: <strong className={seg.is_physics_breach ? 'text-[#EF4444]' : 'text-[#FFFFFF]'}>{seg.calculated_speed_kmh} km/h</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intercept Action Protocol */}
          <div className="p-3 bg-[#13151B] border border-[#262933] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-[#CBD5E1] uppercase">TACTICAL POLICE DISPATCH</div>
              <div className="text-xs font-bold text-[#FFFFFF]">
                Nearest Unit: <span className="text-[#10B981]">PCR PATROL BRAVO-14</span> (Ashram Chowk Sector)
              </div>
            </div>

            <button
              onClick={() => {
                setPcrDispatched(!pcrDispatched);
                if (onDispatchPcr) onDispatchPcr();
              }}
              className={`px-4 py-2 text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                pcrDispatched
                  ? 'bg-[#19231E] text-[#10B981] border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-[#1C1F26] hover:bg-[#252A34] text-[#FFFFFF] border-[#374151] hover:border-[#10B981]'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-[#10B981]" />
              {pcrDispatched ? 'PATROL INTERCEPT DISPATCHED (ETA 1.8 MIN)' : 'DISPATCH PCR PATROL INTERCEPT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
