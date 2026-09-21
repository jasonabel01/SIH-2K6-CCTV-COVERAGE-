"""
Delhi NCR Smart-City 52-Node Camera Network & Real-Time Traffic Generator.
Provides:
  - 52 realistic camera gantry nodes across Delhi NCR with authentic GPS coordinates.
  - Active ANPR telemetry and background traffic simulation.
  - Pre-configured forensic scenarios (DEFCON 1 Cloned Registration, Stolen Vehicle, Inter-camera Speeding).
"""

import time
import math
import random
from typing import Dict, List, Any, Optional

# 52 Key Traffic Gantries across Delhi NCR
DELHI_NCR_CAMERAS: List[Dict[str, Any]] = [
    # --- DND Flyway & Yamuna Corridors (Nodes 1-6) ---
    {"id": "CAM_DEL_DND_01", "name": "DND Toll Plaza (Delhi Inbound)", "lat": 28.5832, "lon": 77.2985, "corridor": "DND Flyway", "speed_limit": 80, "type": "High-Speed Gantry", "address": "DND Expressway Km 2.4, Inbound Toll Plaza, Mayur Vihar Border, New Delhi"},
    {"id": "CAM_DEL_DND_02", "name": "DND Yamuna Bridge Gantry 02", "lat": 28.5855, "lon": 77.3050, "corridor": "DND Flyway", "speed_limit": 80, "type": "High-Speed Gantry", "address": "Yamuna Bridge Superstructure, North Pier Gantry, DND Flyway Eastbound"},
    {"id": "CAM_NOI_DND_03", "name": "DND Noida Toll Plaza Exit", "lat": 28.5878, "lon": 77.3142, "corridor": "DND Flyway", "speed_limit": 80, "type": "Toll ANPR", "address": "Sector 15A Approach Ramp, DND Noida Exit Corridor, Gautam Buddha Nagar"},
    {"id": "CAM_DEL_MAYUR_04", "name": "Mayur Vihar Link Road Junction", "lat": 28.6012, "lon": 77.2915, "corridor": "Yamuna Trans", "speed_limit": 60, "type": "Intersection PTZ", "address": "Mayur Vihar Phase 1 Flyover & Link Road Intersection, East Delhi"},
    {"id": "CAM_DEL_NOIDA_05", "name": "Noida Link Road Chilla Border", "lat": 28.5990, "lon": 77.3180, "corridor": "Inter-State Border", "speed_limit": 50, "type": "Border Security", "address": "Chilla Border Police Checkpoint, Delhi-UP Interstate Line, Mayur Vihar"},
    {"id": "CAM_DEL_KALINDI_06", "name": "Kalindi Kunj Yamuna Bypass", "lat": 28.5442, "lon": 77.3115, "corridor": "Yamuna South", "speed_limit": 60, "type": "High-Speed Gantry", "address": "Kalindi Kunj Barrage Road, Okhla Bird Sanctuary Arterial, South-East Delhi"},

    # --- Ring Road Inner & Outer Corridors (Nodes 7-18) ---
    {"id": "CAM_DEL_ASHRAM_07", "name": "Ashram Chowk Underpass / Flyover", "lat": 28.5710, "lon": 77.2588, "corridor": "Ring Road", "speed_limit": 60, "type": "Chokepoint Gantry", "address": "Ring Road & Mathura Road Underpass Entrance, Ashram Chowk Sector 7, South Delhi"},
    {"id": "CAM_DEL_LAJPAT_08", "name": "Lajpat Nagar Central Flyover", "lat": 28.5678, "lon": 77.2435, "corridor": "Ring Road", "speed_limit": 60, "type": "Corridor ANPR", "address": "Ring Road South Elevated Corridor, Near Lajpat Nagar Metro Pillar 42"},
    {"id": "CAM_DEL_MOOLCHAND_09", "name": "Moolchand Underpass Gantry", "lat": 28.5645, "lon": 77.2340, "corridor": "Ring Road", "speed_limit": 60, "type": "Underpass ANPR", "address": "Moolchand Underpass Portal, Ring Road & Lala Lajpat Rai Marg Junction"},
    {"id": "CAM_DEL_AIIMS_10", "name": "AIIMS Flyover & Trauma Corridor", "lat": 28.5684, "lon": 77.2089, "corridor": "Ring Road", "speed_limit": 50, "type": "Hospital Emergency Corridor", "address": "Mahatma Gandhi Marg, AIIMS Trauma Center Emergency Arterial Corridor, New Delhi"},
    {"id": "CAM_DEL_SAFDARJUNG_11", "name": "Safdarjung Tomb Radial Junction", "lat": 28.5895, "lon": 77.2105, "corridor": "Arterial Radial", "speed_limit": 50, "type": "Intersection PTZ", "address": "Aurobindo Marg & Lodhi Road Junction, Safdarjung Heritage Perimeter"},
    {"id": "CAM_DEL_MOTIBAGH_12", "name": "Moti Bagh Ring Road Flyover", "lat": 28.5810, "lon": 77.1685, "corridor": "Ring Road", "speed_limit": 60, "type": "High-Speed Gantry", "address": "Ring Road West Elevated Section, Near Shanti Path Crossing, South Delhi"},
    {"id": "CAM_DEL_DHAULA_13", "name": "Dhaula Kuan Multi-Tier Interchange", "lat": 28.5925, "lon": 77.1580, "corridor": "Ring Road / NH-48", "speed_limit": 60, "type": "Strategic Interchange", "address": "NH-48 Interchange Tier 2 Gantry, Dhaula Kuan Army Cantonment Node"},
    {"id": "CAM_DEL_NARAINA_14", "name": "Naraina Industrial Flyover", "lat": 28.6250, "lon": 77.1380, "corridor": "Ring Road", "speed_limit": 60, "type": "Freight ANPR", "address": "Naraina Industrial Area Phase 1 Elevated Corridor, West Delhi"},
    {"id": "CAM_DEL_RAJOURI_15", "name": "Rajouri Garden West Arterial", "lat": 28.6480, "lon": 77.1220, "corridor": "Ring Road", "speed_limit": 60, "type": "Corridor ANPR", "address": "Najafgarh Road & Ring Road Junction, Rajouri Garden West Metro Gantry"},
    {"id": "CAM_DEL_PUNJABI_16", "name": "Punjabi Bagh Club Road Roundabout", "lat": 28.6680, "lon": 77.1320, "corridor": "Ring Road", "speed_limit": 50, "type": "Intersection PTZ", "address": "Rohtak Road & Ring Road Interchange, Punjabi Bagh Central Roundabout"},
    {"id": "CAM_DEL_AZADPUR_17", "name": "Azadpur APMC Mandi Corridor", "lat": 28.7080, "lon": 77.1780, "corridor": "Ring Road North", "speed_limit": 50, "type": "Commercial Freight", "address": "Grand Trunk Road, Azadpur Agricultural Produce Mandi Freight Gate"},
    {"id": "CAM_DEL_KASHMERE_18", "name": "Kashmere Gate ISBT North Gantry", "lat": 28.6675, "lon": 77.2280, "corridor": "Ring Road North", "speed_limit": 50, "type": "Transit Hub ANPR", "address": "Grand Trunk Road, Kashmere Gate Inter-State Bus Terminus North Gate"},

    # --- Central Delhi & Connaught Place Circle (Nodes 19-26) ---
    {"id": "CAM_DEL_CP_OUTER_19", "name": "Connaught Place Outer Circle (Barakhamba)", "lat": 28.6315, "lon": 77.2210, "corridor": "Central VIP", "speed_limit": 40, "type": "Urban Smart Cam", "address": "Connaught Place Outer Circle, Radial 4 / Barakhamba Road Junction, New Delhi"},
    {"id": "CAM_DEL_CP_JANPATH_20", "name": "Janpath Radial Corridor", "lat": 28.6260, "lon": 77.2195, "corridor": "Central VIP", "speed_limit": 40, "type": "Urban Smart Cam", "address": "Janpath Radial Road & Tolstoy Marg Crossing, Connaught Place Radial 2"},
    {"id": "CAM_DEL_PARLIAMENT_21", "name": "Parliament Street Checkpoint", "lat": 28.6220, "lon": 77.2135, "corridor": "High Security Zone", "speed_limit": 30, "type": "High Security ANPR", "address": "Sansad Marg Security Perimeter, Patel Chowk Axis, Central Secretariat"},
    {"id": "CAM_DEL_INDIA_GATE_22", "name": "Kartavya Path / C-Hexagon North", "lat": 28.6145, "lon": 77.2310, "corridor": "Central VIP", "speed_limit": 40, "type": "Panoramic PTZ", "address": "C-Hexagon Roundabout North Portal, Kartavya Path & Rajpath Axis, New Delhi"},
    {"id": "CAM_DEL_PRAGATI_23", "name": "Bharat Mandapam / Pragati Maidan Tunnel", "lat": 28.6185, "lon": 77.2440, "corridor": "Tunnel Corridor", "speed_limit": 50, "type": "Underground Tunnel ANPR", "address": "Pragati Maidan Integrated Transit Tunnel, West Portal Gantry, Central Delhi"},
    {"id": "CAM_DEL_ITO_24", "name": "ITO Junction & Vikas Minar Gantry", "lat": 28.6290, "lon": 77.2425, "corridor": "East-West Arterial", "speed_limit": 50, "type": "Chokepoint Gantry", "address": "Bahadur Shah Zafar Marg & Vikas Marg Crossing, Vikas Minar Gantry, ITO Junction"},
    {"id": "CAM_DEL_RAJGHAT_25", "name": "Rajghat Ring Road Crossing", "lat": 28.6410, "lon": 77.2485, "corridor": "Ring Road", "speed_limit": 60, "type": "Corridor ANPR", "address": "Mahatma Gandhi Marg, Ring Road East Corridor, Rajghat Memorial Bypass"},
    {"id": "CAM_DEL_DELHI_GATE_26", "name": "Delhi Gate Heritage Axis", "lat": 28.6405, "lon": 77.2395, "corridor": "Central Radial", "speed_limit": 40, "type": "Urban Smart Cam", "address": "Netaji Subhash Marg & Asaf Ali Road Crossing, Delhi Gate Historic Radial"},

    # --- NH-48 Airport & Gurugram Expressway (Nodes 27-38) ---
    {"id": "CAM_DEL_MAHIPAL_27", "name": "Mahipalpur Bypass Flyover", "lat": 28.5480, "lon": 77.1260, "corridor": "NH-48 Express", "speed_limit": 70, "type": "High-Speed Gantry", "address": "Mehrauli-Gurgaon Road Link, Mahipalpur Flyover Inbound, South-West Delhi"},
    {"id": "CAM_DEL_AEROCITY_28", "name": "Aerocity Hospitality Spine", "lat": 28.5520, "lon": 77.1180, "corridor": "Airport Axis", "speed_limit": 50, "type": "Perimeter Security", "address": "Aerocity Worldmark Arterial Road, Asset Area 4, IGI Airport Precinct"},
    {"id": "CAM_DEL_IGI_T3_29", "name": "IGI Airport Terminal 3 Departure Ramp", "lat": 28.5562, "lon": 77.0865, "corridor": "IGI International", "speed_limit": 40, "type": "Aviation Security", "address": "Indira Gandhi International Airport, Terminal 3 Elevated Departure Viaduct, New Delhi"},
    {"id": "CAM_DEL_IGI_T1_30", "name": "IGI Terminal 1 Domestic Corridor", "lat": 28.5710, "lon": 77.1080, "corridor": "Airport Axis", "speed_limit": 50, "type": "Terminal ANPR", "address": "Terminal 1 Arrival Boulevard, Domestic Aviation Terminal Axis, Palam"},
    {"id": "CAM_DEL_SHIVMURTI_31", "name": "Shiv Murti NH-48 Expressway Gantry", "lat": 28.5350, "lon": 77.0980, "corridor": "NH-48 Express", "speed_limit": 80, "type": "High-Speed Gantry", "address": "NH-48 Express Km 18.6, Shiv Murti Interchange, Mahipalpur-Gurgaon Highway"},
    {"id": "CAM_GUR_BORDER_32", "name": "Delhi-Gurugram Border Toll Gantry", "lat": 28.5140, "lon": 77.0870, "corridor": "Inter-State Express", "speed_limit": 80, "type": "Border Surveillance", "address": "NH-48 Express Km 24.2, Sirhaul Toll Gantry, Haryana-Delhi Interstate Border"},
    {"id": "CAM_GUR_AMBIENCE_33", "name": "Ambience Island Cyber City Access", "lat": 28.5040, "lon": 77.0940, "corridor": "Cyber City", "speed_limit": 60, "type": "Corporate Zone ANPR", "address": "Ambience Island Access Road, Near DLF Cyber City Gate 1, Gurugram"},
    {"id": "CAM_GUR_CYBERCITY_34", "name": "DLF Cyber Hub Rapid Metro Spine", "lat": 28.4950, "lon": 77.0890, "corridor": "Cyber City", "speed_limit": 50, "type": "Urban Smart Cam", "address": "DLF Cyber City Belvedere Towers Radial, Rapid Metro Pillar 38, Gurugram"},
    {"id": "CAM_GUR_SHANKAR_35", "name": "Shankar Chowk Elevated Expressway", "lat": 28.4910, "lon": 77.0780, "corridor": "NH-48 Express", "speed_limit": 80, "type": "High-Speed Gantry", "address": "Shankar Chowk Elevated Flyover, NH-48 Km 28.0, Sector 24, Gurugram"},
    {"id": "CAM_GUR_IFFCO_36", "name": "IFFCO Chowk Flyover Junction", "lat": 28.4720, "lon": 77.0720, "corridor": "NH-48 Express", "speed_limit": 70, "type": "Strategic Interchange", "address": "IFFCO Chowk Flyover Deck, MG Road & NH-48 Interchange, Gurugram"},
    {"id": "CAM_GUR_SIGNATURE_37", "name": "Signature Tower Underpass", "lat": 28.4610, "lon": 77.0580, "corridor": "NH-48 Express", "speed_limit": 70, "type": "Underpass ANPR", "address": "Signature Tower Underpass Portal, Sector 29 Huda City Axis, Gurugram"},
    {"id": "CAM_GUR_RAJIVCHOWK_38", "name": "Rajiv Chowk Gurugram Underpass", "lat": 28.4520, "lon": 77.0420, "corridor": "NH-48 Express", "speed_limit": 70, "type": "High-Speed Gantry", "address": "Rajiv Chowk Underpass Southbound, Sohna Road & NH-48 Node, Gurugram"},

    # --- Noida & Greater Noida Expressway (Nodes 39-46) ---
    {"id": "CAM_NOI_SEC18_39", "name": "Sector 18 Atta Market Access", "lat": 28.5705, "lon": 77.3235, "corridor": "Noida Urban", "speed_limit": 50, "type": "Urban Smart Cam", "address": "Captain Shashi Kant Sharma Marg, Sector 18 Commercial Hub, Noida"},
    {"id": "CAM_NOI_FILMCITY_40", "name": "Film City Sector 16A Flyover", "lat": 28.5620, "lon": 77.3210, "corridor": "Noida Arterial", "speed_limit": 60, "type": "Corridor ANPR", "address": "Sector 16A Film City Flyover, Noida-Greater Noida Origin Corridor"},
    {"id": "CAM_NOI_MAHAMAYA_41", "name": "Mahamaya Flyover Expressway Origin", "lat": 28.5490, "lon": 77.3290, "corridor": "Noida-Gr Noida Expy", "speed_limit": 100, "type": "Expressway Gantry", "address": "Mahamaya Flyover Gantry, Noida-Greater Noida Expressway Km 0.0 Marker"},
    {"id": "CAM_NOI_SEC125_42", "name": "Sector 125 Amity University Crossing", "lat": 28.5410, "lon": 77.3380, "corridor": "Noida-Gr Noida Expy", "speed_limit": 100, "type": "Expressway Gantry", "address": "Expressway Service Road Gantry, Sector 125 Amity University Cross, Noida"},
    {"id": "CAM_NOI_SEC93_43", "name": "Sector 93 Expressway Elevated Deck", "lat": 28.5120, "lon": 77.3750, "corridor": "Noida-Gr Noida Expy", "speed_limit": 100, "type": "High-Speed ANPR", "address": "Sector 93 Elevated Deck Gantry, Noida-Greater Noida Expressway Km 8.4"},
    {"id": "CAM_NOI_SEC137_44", "name": "Sector 137 Metro Corridor Gantry", "lat": 28.5020, "lon": 77.4010, "corridor": "Noida-Gr Noida Expy", "speed_limit": 100, "type": "High-Speed ANPR", "address": "Sector 137 Metro Pillar Corridor, Noida-Greater Noida Expressway Km 12.2"},
    {"id": "CAM_NOI_PARICHOWK_45", "name": "Pari Chowk Greater Noida Roundabout", "lat": 28.4680, "lon": 77.5020, "corridor": "Yamuna Expressway Entry", "speed_limit": 60, "type": "Interchange ANPR", "address": "Pari Chowk Mega Roundabout, Greater Noida Entrance & Knowledge Park Axis"},
    {"id": "CAM_NOI_YAMUNA_46", "name": "Yamuna Expressway Zero Mile Marker", "lat": 28.4550, "lon": 77.5180, "corridor": "Yamuna Expressway", "speed_limit": 120, "type": "High-Speed Gantry", "address": "Yamuna Expressway Toll Plaza Origin, Zero Mile Marker, Greater Noida South"},

    # --- Outer Ring Road & Strategic Perimeter Gates (Nodes 47-52) ---
    {"id": "CAM_DEL_IIT_47", "name": "IIT Flyover & Outer Ring Road", "lat": 28.5440, "lon": 77.1920, "corridor": "Outer Ring Road", "speed_limit": 60, "type": "Corridor ANPR", "address": "Outer Ring Road Elevated Deck, IIT Delhi Campus Gate 1 Flyover, South Delhi"},
    {"id": "CAM_DEL_MUNIRKA_48", "name": "Munirka Elevated Highway Gantry", "lat": 28.5560, "lon": 77.1720, "corridor": "Outer Ring Road", "speed_limit": 60, "type": "High-Speed Gantry", "address": "Munirka Elevated Portal, Outer Ring Road Near JNU East Gate, South Delhi"},
    {"id": "CAM_DEL_NEHRUPLACE_49", "name": "Nehru Place Outer Ring Road", "lat": 28.5490, "lon": 77.2510, "corridor": "Outer Ring Road", "speed_limit": 60, "type": "Business Hub ANPR", "address": "Outer Ring Road Nehru Place Underpass Gantry, Financial District Radial"},
    {"id": "CAM_DEL_OKHLA_50", "name": "Okhla Industrial Estate Phase 3", "lat": 28.5320, "lon": 77.2720, "corridor": "Industrial Perimeter", "speed_limit": 50, "type": "Freight ANPR", "address": "Maa Anandmayee Marg, Okhla Phase 3 Industrial Gate, South-East Delhi"},
    {"id": "CAM_DEL_SINGHU_51", "name": "Singhu Border NH-44 Toll Gantry", "lat": 28.8410, "lon": 77.1350, "corridor": "Punjab/Haryana Axis", "speed_limit": 80, "type": "Heavy Freight Border", "address": "Grand Trunk Road Km 38.0, Singhu Border Toll Gantry, Delhi-Haryana Border"},
    {"id": "CAM_DEL_TIKRI_52", "name": "Tikri Border Rohtak Road Checkpoint", "lat": 28.6890, "lon": 76.9740, "corridor": "West Perimeter Axis", "speed_limit": 60, "type": "Inter-State Border", "address": "Rohtak Road NH-9 Checkpoint, Tikri Border Police Post, West Delhi"}
]


class CitySimulator:
    """
    Simulates traffic telemetry across all 52 Delhi NCR camera nodes.
    Includes background traffic and pre-configured forensic anomaly targets.
    """

    def __init__(self):
        self.cameras = {cam["id"]: cam for cam in DELHI_NCR_CAMERAS}
        self.active_vehicles = [
            "RJ 14 CA 0639", "HR 55 AH 7820", "UP 16 CH 9651",
            "DL 01 TA 4210", "DL 3S CD 8412", "DL 8C X 2628",
            "HR 26 DQ 5521", "DL 10 CE 9901"
        ]

    def get_all_cameras(self) -> List[Dict[str, Any]]:
        """Returns the full list of 52 camera nodes with live operational status."""
        current_epoch = time.time()
        result = []
        for cam in DELHI_NCR_CAMERAS:
            # Deterministic live metrics based on node id
            cam_hash = hash(cam["id"]) % 100
            result.append({
                **cam,
                "status": "ONLINE",
                "anpr_active": True,
                "fps": 60.0 if cam["type"] == "High-Speed Gantry" else 30.0,
                "latency_ms": round(38.0 + (cam_hash % 15), 1),
                "detections_today": 12400 + (cam_hash * 143),
                "optical_mode": "IR_NIGHT_CLAHE" if (cam_hash % 3 == 0) else "COLOR_DAY"
            })
        return result

    def get_camera_by_id(self, camera_id: str) -> Optional[Dict[str, Any]]:
        return self.cameras.get(camera_id)

    def generate_live_telemetry_event(self) -> Dict[str, Any]:
        """
        Produces a synthetic live sighting event across the 52-camera network.
        Used for sub-50ms WebSocket telemetry streaming.
        """
        cam = random.choice(DELHI_NCR_CAMERAS)
        plate = random.choice(self.active_vehicles)
        speed = random.randint(35, 88)
        is_speeding = speed > cam["speed_limit"]

        return {
            "event_type": "VEHICLE_SIGHTING",
            "timestamp": round(time.time(), 3),
            "camera_id": cam["id"],
            "gantry_name": cam["name"],
            "lat": cam["lat"],
            "lon": cam["lon"],
            "corridor": cam["corridor"],
            "plate_id": plate,
            "speed_kmh": speed,
            "speed_limit": cam["speed_limit"],
            "is_speeding": is_speeding,
            "confidence": round(random.uniform(94.5, 98.9), 1),
            "threat_level": "CRITICAL" if plate == "HR 26 DQ 5521" else ("WARNING" if is_speeding else "NOMINAL")
        }


# Global Singleton Simulator Instance
city_simulator = CitySimulator()
