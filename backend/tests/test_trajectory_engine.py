"""
Unit tests for NeuroTraffic Phase 2 Backend:
  - Haversine geodesic distance calculation.
  - Spatial-temporal trajectory reconstruction.
  - Fuzzy plate OCR deduplication with RapidFuzz.
  - Anomaly detection: DEFCON 1 Cloned Registration (impossible speed), Stolen Watchlist, and Speeding.
"""

import pytest
import time
from backend.app.engine.trajectory_service import (
    haversine_distance_km,
    TrajectoryService
)
from backend.app.engine.anomaly_detector import AnomalyDetector, POLICE_WATCHLIST
from backend.app.engine.city_simulator import city_simulator, DELHI_NCR_CAMERAS


def test_haversine_accuracy():
    # Distance between DND Toll (28.5832, 77.2985) and Ashram Chowk (28.5710, 77.2588)
    dist = haversine_distance_km(28.5832, 77.2985, 28.5710, 77.2588)
    # Expected distance is ~4.1 km
    assert 3.5 <= dist <= 4.8


def test_trajectory_service_stitching():
    service = TrajectoryService()
    now = time.time()
    plate = "DL 01 AB 9999"

    # Add 3 sequential sightings
    service.record_sighting(plate, "CAM_DEL_DND_01", timestamp=now, speed_kmh=60.0)
    service.record_sighting(plate, "CAM_DEL_ASHRAM_07", timestamp=now + 300, speed_kmh=55.0)
    service.record_sighting(plate, "CAM_DEL_AIIMS_10", timestamp=now + 900, speed_kmh=50.0)

    traj = service.get_trajectory(plate)
    assert traj["matched_plate"] == plate
    assert traj["total_sightings"] == 3
    assert len(traj["segments"]) == 2
    assert traj["total_distance_km"] > 0
    assert traj["elapsed_time_minutes"] > 0
    assert not traj["physics_breach_detected"]


def test_fuzzy_plate_deduplication():
    service = TrajectoryService()
    now = time.time()
    canonical = "DL 03 XY 1234"
    # Sighting under canonical
    service.record_sighting(canonical, "CAM_DEL_DND_01", timestamp=now, speed_kmh=65.0)

    # Query with a minor OCR typo: "DL 03 XY 123A" instead of 1234
    res = service.get_trajectory("DL 03 XY 123A", fuzzy_threshold=80)
    assert res["matched_plate"] == canonical
    assert res["fuzzy_deduplicated"] is True
    assert res["total_sightings"] >= 1


def test_anomaly_cloned_plate_detection():
    detector = AnomalyDetector()
    plate = "TEST 99 CLONE"
    now = time.time()

    # Sighting 1: DND Toll
    detector.check_sighting(plate, "CAM_DEL_DND_01", 28.5832, 77.2985, now - 30, speed_kmh=60.0)
    from backend.app.engine.trajectory_service import trajectory_service
    trajectory_service.record_sighting(plate, "CAM_DEL_DND_01", timestamp=now - 30, speed_kmh=60.0)

    # Sighting 2: 24 km away at IGI Airport, only 20 seconds later! Implies velocity > 4,000 km/h
    anomalies = detector.check_sighting(plate, "CAM_DEL_IGI_T3_29", 28.5562, 77.0865, now, speed_kmh=80.0)
    cloned_alerts = [a for a in anomalies if a["alert_type"] == "CLONED_PLATE_DEFCON_1"]
    assert len(cloned_alerts) == 1
    assert cloned_alerts[0]["severity"] == "CRITICAL"


def test_watchlist_matching():
    detector = AnomalyDetector()
    stolen_plate = "HR 26 DQ 5521"
    now = time.time()
    alerts = detector.check_sighting(stolen_plate, "CAM_DEL_CP_OUTER_19", 28.6315, 77.2210, now, speed_kmh=40.0)

    wl_alerts = [a for a in alerts if a["alert_type"] == "WATCHLIST_MATCH"]
    assert len(wl_alerts) == 1
    assert "CLONED REGISTRATION" in wl_alerts[0]["details"]["reason"]


def test_52_cameras_initialized():
    cameras = city_simulator.get_all_cameras()
    assert len(cameras) == 52
    assert all("lat" in c and "lon" in c and "name" in c for c in cameras)
