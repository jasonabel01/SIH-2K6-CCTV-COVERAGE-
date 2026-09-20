"""
Real-Time Threat & Anomaly Detection Engine for NeuroTraffic C4ISR.
Implements:
  - Physics / Cloned Plate Detector (Impossible inter-camera velocity > 200 km/h -> DEFCON 1).
  - Stolen / Wanted Vehicle Hotlist matching (Instant O(1) lookup with police FIR metadata).
  - Inter-camera point-to-point average speeding detection & e-Challan generator.
"""

import time
from typing import Dict, List, Any, Optional
from backend.app.engine.trajectory_service import trajectory_service, haversine_distance_km

# Stolen / High-Priority Police Watchlist Database
POLICE_WATCHLIST: Dict[str, Dict[str, Any]] = {
    "HR 26 DQ 5521": {
        "plate": "HR 26 DQ 5521",
        "threat_level": "DEFCON_1_CRITICAL",
        "reason": "CLONED REGISTRATION & SUSPECT INTERCEPT",
        "fir_number": "FIR-2026-DEL-CRIME-8821",
        "station": "Crime Branch Special Cell, New Delhi",
        "vehicle_model": "Dark Mahindra Scorpio-N",
        "action_protocol": "IMMEDIATE_PATROL_INTERCEPT",
        "flagged_timestamp": "2026-09-18T10:30:00Z"
    },
    "DL 08 CQ 4192": {
        "plate": "DL 08 CQ 4192",
        "threat_level": "STOLEN_VEHICLE",
        "reason": "REPORTED STOLEN COMMERCIAL COURIER VAN",
        "fir_number": "FIR-2026-0941-SARAI",
        "station": "Sarai Rohilla Police Station, Delhi",
        "vehicle_model": "Tata Ace Commercial Logistics",
        "action_protocol": "HALT_AT_NEXT_TOLL_GANTRY",
        "flagged_timestamp": "2026-09-19T06:15:00Z"
    },
    "UP 14 BT 0001": {
        "plate": "UP 14 BT 0001",
        "threat_level": "VIP_ESCORT",
        "reason": "STATE VIP ESCORT CONVOY",
        "fir_number": "PROTOCOL-VIP-UP-004",
        "station": "Delhi Police VIP Traffic HQ",
        "vehicle_model": "Toyota Fortuner Convoy Lead",
        "action_protocol": "GREEN_CORRIDOR_PRIORITY",
        "flagged_timestamp": "2026-09-20T08:00:00Z"
    }
}


class AnomalyDetector:
    """
    Evaluates vehicle sightings against physics constraints, police watchlists, and speed limits.
    """

    def __init__(self):
        self._active_alerts: List[Dict[str, Any]] = []
        self._seed_default_alerts()

    def check_sighting(
        self,
        plate: str,
        camera_id: str,
        current_lat: float,
        current_lon: float,
        current_time: float,
        speed_kmh: float,
        speed_limit: float = 60.0
    ) -> List[Dict[str, Any]]:
        """
        Runs comprehensive threat analysis on a newly observed sighting.
        """
        clean_plate = plate.strip().upper()
        detected_anomalies = []

        # 1. Check Police Watchlist
        if clean_plate in POLICE_WATCHLIST:
            watch_info = POLICE_WATCHLIST[clean_plate]
            alert = {
                "alert_id": f"ALERT-WL-{clean_plate}-{int(current_time)}",
                "alert_type": "WATCHLIST_MATCH",
                "severity": "CRITICAL" if "DEFCON" in watch_info["threat_level"] else "HIGH",
                "plate": clean_plate,
                "timestamp": current_time,
                "camera_id": camera_id,
                "details": watch_info,
                "message": f"MATCH: {watch_info['reason']} (FIR: {watch_info['fir_number']})"
            }
            detected_anomalies.append(alert)
            self._active_alerts.append(alert)

        # 2. Check Physics / Cloned Plate Violation
        history = trajectory_service.get_trajectory(clean_plate)
        sightings = history.get("sightings", [])

        if len(sightings) >= 1:
            last_sighting = sightings[-1]
            if last_sighting["camera_id"] != camera_id:
                dist_km = haversine_distance_km(last_sighting["lat"], last_sighting["lon"], current_lat, current_lon)
                time_delta_s = max(0.1, current_time - last_sighting["timestamp"])
                velocity = (dist_km / (time_delta_s / 3600.0))

                if velocity > 200.0:  # Physically impossible vehicle speed
                    physics_alert = {
                        "alert_id": f"ALERT-PHYSICS-{clean_plate}-{int(current_time)}",
                        "alert_type": "CLONED_PLATE_DEFCON_1",
                        "severity": "CRITICAL",
                        "plate": clean_plate,
                        "timestamp": current_time,
                        "camera_id": camera_id,
                        "inter_camera_velocity_kmh": round(velocity, 1),
                        "distance_km": round(dist_km, 2),
                        "time_elapsed_s": round(time_delta_s, 1),
                        "prev_camera": last_sighting["camera_id"],
                        "prev_gantry": last_sighting["gantry_name"],
                        "message": (
                            f"DEFCON 1 PHYSICS BREACH: Plate {clean_plate} spotted at {camera_id} and "
                            f"{last_sighting['camera_id']} ({dist_km:.1f} km apart) within {time_delta_s:.0f}s "
                            f"(Implied velocity {velocity:.0f} km/h). Cloned registration confirmed."
                        )
                    }
                    detected_anomalies.append(physics_alert)
                    self._active_alerts.append(physics_alert)

        # 3. Inter-Camera Segment Speeding
        if speed_kmh > (speed_limit + 15.0):
            speed_alert = {
                "alert_id": f"ALERT-SPEED-{clean_plate}-{int(current_time)}",
                "alert_type": "OVERSPEEDING_VIOLATION",
                "severity": "WARNING",
                "plate": clean_plate,
                "timestamp": current_time,
                "camera_id": camera_id,
                "speed_recorded_kmh": round(speed_kmh, 1),
                "speed_limit_kmh": speed_limit,
                "fine_amount_inr": 2000,
                "message": f"SPEED VIOLATION: Recorded at {speed_kmh:.1f} km/h in a {speed_limit:.0f} km/h zone."
            }
            detected_anomalies.append(speed_alert)
            self._active_alerts.append(speed_alert)

        return detected_anomalies

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Returns all currently active threat alerts, latest first."""
        return list(reversed(self._active_alerts))

    def dismiss_alert(self, alert_id: str) -> bool:
        """Dismisses an alert by its unique alert_id."""
        initial_len = len(self._active_alerts)
        self._active_alerts = [a for a in self._active_alerts if a["alert_id"] != alert_id]
        return len(self._active_alerts) < initial_len

    def _seed_default_alerts(self):
        """Pre-populates demonstration alerts for the SIH presentation."""
        now = time.time()
        self._active_alerts.append({
            "alert_id": "ALERT-DEFCON-HR26DQ5521",
            "alert_type": "CLONED_PLATE_DEFCON_1",
            "severity": "CRITICAL",
            "plate": "HR 26 DQ 5521",
            "timestamp": now - 90,
            "camera_id": "CAM_DEL_IGI_T3_29",
            "inter_camera_velocity_kmh": 2108.0,
            "distance_km": 24.6,
            "time_elapsed_s": 42.0,
            "prev_camera": "CAM_DEL_DND_01",
            "prev_gantry": "DND Toll Plaza (Delhi Inbound)",
            "message": "CRITICAL DEFCON 1: Simultaneous sighting at DND Toll & IGI Terminal 3 within 42s (2,108 km/h). Cloned registration confirmed."
        })


# Global Singleton Anomaly Detector Instance
anomaly_detector = AnomalyDetector()
