"""
Integration tests for Phase 2 REST & WebSocket endpoints in backend/app/main.py.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_cameras_endpoint():
    response = client.get("/api/v1/cameras")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_nodes"] == 52
    assert len(data["cameras"]) == 52


def test_trajectory_endpoint():
    response = client.get("/api/v1/trajectories/RJ%2014%20CA%200639")
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "success"
    traj = res["data"]
    assert traj["matched_plate"] == "RJ 14 CA 0639"
    assert traj["total_sightings"] >= 4
    assert traj["total_distance_km"] > 0


def test_active_alerts_endpoint():
    response = client.get("/api/v1/alerts/active")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["active_count"] >= 1


def test_websocket_telemetry():
    with client.websocket_connect("/ws/telemetry") as websocket:
        handshake = websocket.receive_json()
        assert handshake["type"] == "HANDSHAKE"
        assert handshake["nodes_count"] == 52

        # Receive at least 1 live event packet
        event = websocket.receive_json()
        assert event["event_type"] == "VEHICLE_SIGHTING"
        assert "plate_id" in event
        assert "camera_id" in event
