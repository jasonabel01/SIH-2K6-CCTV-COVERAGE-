"""
Spatial-Temporal Trajectory Reconstruction & Multi-Camera Journey Stitching Engine.
Solves SIH Problem Statement 26127:
  - Assembles disparate camera sightings into chronological vehicle journeys.
  - Computes exact Haversine geodesic distances and inter-camera segment velocities.
  - Implements rapidfuzz-powered OCR deduplication for misread plate tolerance.
"""

import math
import time
from collections import defaultdict, deque
from typing import Dict, List, Any, Optional, Tuple
from rapidfuzz import fuzz

from backend.app.engine.city_simulator import DELHI_NCR_CAMERAS, city_simulator


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two GPS coordinates in kilometers.
    """
    R = 6371.0  # Earth's mean radius in kilometers
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 3)


class TrajectoryService:
    """
    In-memory spatial-temporal trajectory index with chronological journey stitching.
    """

    def __init__(self):
        # Maps canonical plate -> deque of ordered sightings
        self._trajectories: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        # Camera lookup index
        self._cam_map = {cam["id"]: cam for cam in DELHI_NCR_CAMERAS}
        # Pre-seed demonstrator trajectories
        self._seed_sample_trajectories()

    def record_sighting(
        self,
        plate: str,
        camera_id: str,
        timestamp: Optional[float] = None,
        speed_kmh: Optional[float] = None,
        confidence: float = 96.5,
        lane: int = 1,
        image_snapshot: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Appends a new camera sighting to a vehicle's chronological trajectory.
        """
        clean_plate = plate.strip().upper()
        cam = self._cam_map.get(camera_id, {
            "id": camera_id,
            "name": f"Gantry {camera_id}",
            "lat": 28.5832,
            "lon": 77.2985,
            "corridor": "NCR Arterial",
            "speed_limit": 60
        })

        ts = timestamp if timestamp is not None else time.time()
        recorded_speed = speed_kmh if speed_kmh is not None else 55.0

        sighting = {
            "camera_id": cam["id"],
            "gantry_name": cam["name"],
            "corridor": cam.get("corridor", "NCR Corridor"),
            "lat": cam["lat"],
            "lon": cam["lon"],
            "timestamp": round(ts, 2),
            "speed_kmh": round(recorded_speed, 1),
            "speed_limit": cam.get("speed_limit", 60),
            "confidence": round(confidence, 1),
            "lane": lane,
            "image_snapshot": image_snapshot
        }

        self._trajectories[clean_plate].append(sighting)
        return sighting

    def get_trajectory(self, query_plate: str, fuzzy_threshold: int = 85) -> Dict[str, Any]:
        """
        Reconstructs the full spatial-temporal journey for a vehicle plate.
        Applies fuzzy matching if exact string has few or no sightings.
        """
        clean_query = query_plate.strip().upper()
        target_plate = clean_query

        # Check for direct match
        sightings = list(self._trajectories.get(clean_query, []))

        # If no exact match or very few, perform fuzzy deduplication search
        if not sightings:
            best_match, best_score = None, 0
            for existing_plate in self._trajectories.keys():
                score = fuzz.ratio(clean_query, existing_plate)
                if score > best_score and score >= fuzzy_threshold:
                    best_score = score
                    best_match = existing_plate

            if best_match:
                target_plate = best_match
                sightings = list(self._trajectories[best_match])

        # Sort chronologically by timestamp
        sightings.sort(key=lambda s: s["timestamp"])

        # Compute journey segments, velocities, and physics validations
        segments = []
        total_distance_km = 0.0
        elapsed_seconds = 0.0
        physics_breach = False

        for i in range(len(sightings) - 1):
            s1 = sightings[i]
            s2 = sightings[i + 1]

            dist_km = haversine_distance_km(s1["lat"], s1["lon"], s2["lat"], s2["lon"])
            time_delta_s = max(0.1, s2["timestamp"] - s1["timestamp"])
            time_delta_h = time_delta_s / 3600.0
            computed_speed = round(dist_km / time_delta_h, 1)

            total_distance_km += dist_km
            elapsed_seconds += time_delta_s

            # Flag impossible speed breach (>200 km/h indicates cloned plate / teleportation)
            is_impossible = computed_speed > 200.0
            if is_impossible:
                physics_breach = True

            segments.append({
                "from_camera": s1["camera_id"],
                "from_gantry": s1["gantry_name"],
                "to_camera": s2["camera_id"],
                "to_gantry": s2["gantry_name"],
                "distance_km": round(dist_km, 2),
                "transit_time_seconds": round(time_delta_s, 1),
                "calculated_speed_kmh": computed_speed,
                "speed_limit_kmh": s2["speed_limit"],
                "is_speeding": computed_speed > s2["speed_limit"],
                "is_physics_breach": is_impossible
            })

        avg_speed = round((total_distance_km / (elapsed_seconds / 3600.0)), 1) if elapsed_seconds > 0 else 0.0

        return {
            "query_plate": clean_query,
            "matched_plate": target_plate,
            "fuzzy_deduplicated": target_plate != clean_query,
            "total_sightings": len(sightings),
            "total_distance_km": round(total_distance_km, 2),
            "elapsed_time_minutes": round(elapsed_seconds / 60.0, 1),
            "average_speed_kmh": avg_speed,
            "physics_breach_detected": physics_breach,
            "sightings": sightings,
            "segments": segments
        }

    def _seed_sample_trajectories(self):
        """
        Pre-populates demonstration vehicle journeys across key Delhi NCR corridors.
        """
        now = time.time()

        # 1. Target: RJ 14 CA 0639 (White Sedan - DND to Ring Road corridor)
        t_base = now - 1800  # 30 mins ago
        self.record_sighting("RJ 14 CA 0639", "CAM_DEL_DND_01", timestamp=t_base, speed_kmh=68.0, confidence=97.8)
        self.record_sighting("RJ 14 CA 0639", "CAM_DEL_DND_02", timestamp=t_base + 120, speed_kmh=72.0, confidence=98.2)
        self.record_sighting("RJ 14 CA 0639", "CAM_DEL_ASHRAM_07", timestamp=t_base + 540, speed_kmh=58.0, confidence=96.9)
        self.record_sighting("RJ 14 CA 0639", "CAM_DEL_LAJPAT_08", timestamp=t_base + 960, speed_kmh=64.0, confidence=97.5)
        self.record_sighting("RJ 14 CA 0639", "CAM_DEL_AIIMS_10", timestamp=t_base + 1500, speed_kmh=49.0, confidence=98.0)

        # 2. Target: DL 01 TA 4210 (Commercial Cab - Central Delhi Circle)
        t_base2 = now - 2400
        self.record_sighting("DL 01 TA 4210", "CAM_DEL_CP_OUTER_19", timestamp=t_base2, speed_kmh=42.0, confidence=95.2)
        self.record_sighting("DL 01 TA 4210", "CAM_DEL_CP_JANPATH_20", timestamp=t_base2 + 300, speed_kmh=38.0, confidence=96.0)
        self.record_sighting("DL 01 TA 4210", "CAM_DEL_INDIA_GATE_22", timestamp=t_base2 + 720, speed_kmh=45.0, confidence=95.8)
        self.record_sighting("DL 01 TA 4210", "CAM_DEL_ITO_24", timestamp=t_base2 + 1200, speed_kmh=52.0, confidence=96.4)

        # 3. Target: HR 55 AH 7820 (Commercial Heavy Freight - Gurugram Expressway)
        t_base3 = now - 3600
        self.record_sighting("HR 55 AH 7820", "CAM_GUR_BORDER_32", timestamp=t_base3, speed_kmh=48.0, confidence=96.8)
        self.record_sighting("HR 55 AH 7820", "CAM_GUR_SHANKAR_35", timestamp=t_base3 + 600, speed_kmh=52.0, confidence=97.1)
        self.record_sighting("HR 55 AH 7820", "CAM_GUR_IFFCO_36", timestamp=t_base3 + 1200, speed_kmh=46.0, confidence=96.5)
        self.record_sighting("HR 55 AH 7820", "CAM_GUR_RAJIVCHOWK_38", timestamp=t_base3 + 1900, speed_kmh=50.0, confidence=96.9)

        # 4. Target: HR 26 DQ 5521 (DEFCON 1 Teleportation / Cloned Registration)
        # Simultaneously sighted at DND and IGI Airport (24 km apart) within 45 seconds!
        t_breach = now - 120
        self.record_sighting("HR 26 DQ 5521", "CAM_DEL_DND_01", timestamp=t_breach - 45, speed_kmh=75.0, confidence=98.5)
        self.record_sighting("HR 26 DQ 5521", "CAM_DEL_IGI_T3_29", timestamp=t_breach, speed_kmh=80.0, confidence=98.7)


# Global Singleton Trajectory Service Instance
trajectory_service = TrajectoryService()
