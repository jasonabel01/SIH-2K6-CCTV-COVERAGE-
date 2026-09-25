# Project Build Roadmap: Phase-by-Phase Plan & Deliverables

**Project:** City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking & Urban Traffic Analytics  
**Problem Statement ID:** 26127 (Smart India Hackathon)

---

## Architecture Overview Across 4 Phases

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Core Vision & ANPR Engine (Module 1)                                │
│ OpenCV Preprocessing (CLAHE/Bilateral/Deskew) + YOLOv8 + OCR + Syntax Rules  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ (Plate Detections + Crops)
┌──────────────────────────────────────▼───────────────────────────────────────┐
│ PHASE 2: Trajectory Engine, Alert Core & Simulator (Modules 2 & 4)           │
│ Spatial-Temporal Stitching + Fuzzy Deduplication + Cloned Plate Alert + API  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ (REST Endpoints & WebSockets)
┌──────────────────────────────────────▼───────────────────────────────────────┐
│ PHASE 3: "God's Eye" 3D GIS Command Center & HUD (Module 3)                  │
│ Tactical Dark UI + Camera Frustums + Glowing Trajectory Replay + Live Alerts │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ (Full Interactive Console)
┌──────────────────────────────────────▼───────────────────────────────────────┐
│ PHASE 4: Macro Traffic Analytics, Live AI Lab & SIH Presentation Suite       │
│ Heatmaps + O-D Flow Arcs + Chart.js + DPDP Audit Log + 5-Min Judge Script    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: High-Precision ANPR & Computer Vision Engine (Module 1)
*Goal: Solve the core challenge of reading license plates accurately under harsh Indian real-world conditions (night glare, rain, blur, angled shots).*

### What We Will Build:
1. **OpenCV Image Restoration Pipeline (`preprocessing.py`)**:
   * **CLAHE (Contrast Limited Adaptive Histogram Equalization)**: Normalizes deep shadows and blinding headlight glare.
   * **Bilateral Edge-Preserving Denoising**: Strips rain, fog, and sensor grain without blurring character edges.
   * **Perspective Deskewing (Affine Warp)**: Automatically rectifies license plates photographed at steep oblique angles (up to 45°).
   * **Unsharp Masking**: Counteracts high-speed vehicle motion blur.
2. **Detection & Recognition Core (`plate_detector.py` & `ocr_recognizer.py`)**:
   * **YOLOv8 Plate Detector**: Fast bounding-box localization for multi-lane traffic streams.
   * **PaddleOCR / EasyOCR Engine**: Deep-learning alphanumeric character recognition.
3. **Indian Standard Syntax Auto-Correction**:
   * Rule-based RTO grammar parsing (e.g. `^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$`).
   * Context-aware character disambiguation: automatically resolves `0` vs `O`, `8` vs `B`, `1` vs `I`, `5` vs `S` based on character position.
4. **Adverse Condition Verification Harness**:
   * Benchmark script testing 5 harsh scenarios (night, heavy rain, 45° angle, motion blur, muddy plate) to empirically prove **>90% accuracy**.

### Concrete Outcome of Phase 1:
* A working, standalone AI pipeline. You can input any degraded vehicle photo or video frame, and the engine outputs:
  * Restored image crops showing before/after preprocessing.
  * Verified plate number string (e.g., `DL 01 AB 1234`).
  * Confidence score (e.g., `96.8%`) and inference latency (~18ms).

---

## Phase 2: Trajectory Reconstruction & Real-Time Alert Engine (Modules 2 & 4)
*Goal: Break camera silos by connecting isolated detections across space and time, and instantly detecting security anomalies.*

### What We Will Build:
1. **FastAPI Backend & Database (`backend/app/`)**:
   * SQLite / Geo-spatial database schema with spatial indexing for fast trajectory lookups.
   * Asynchronous REST API and WebSocket broadcaster for sub-50ms live event streaming.
2. **Spatial-Temporal Trajectory Assembler (`trajectory_service.py`)**:
   * **Chronological Sighting Stitcher**: Assembles disparate camera sightings into an ordered journey timeline.
   * **Fuzzy Plate Deduplication**: Uses Levenshtein distance combined with velocity physics to merge OCR misreads (e.g. `DL01A81234` and `DL01AB1234` spotted 2 mins apart are automatically merged into one vehicle track).
   * **Road Network Path Interpolation**: Snaps straight-line points to realistic road geometry between intersections.
3. **Real-Time Anomaly & Threat Engine (`anomaly_detector.py`)**:
   * **Watchlist / Blacklist Matcher**: Instant $O(1)$ lookup for stolen or suspect vehicles.
   * **The "Teleportation" / Cloned Plate Detector**: Flags when the same plate appears at two distant cameras within an impossibly brief timeframe ($v = \Delta d / \Delta t > 200\text{ km/h}$).
   * **Speeding Violations**: Inter-camera segment velocity calculations.
4. **City Simulation Hub (`city_simulator.py`)**:
   * Simulates 50+ camera nodes placed across major New Delhi intersections (Connaught Place, India Gate, DND Flyway, Ring Road, AIIMS) with continuous, realistic vehicle traffic streams and pre-configured anomaly scenarios.

### Concrete Outcome of Phase 2:
* A fully operational backend server.
* You can query `GET /api/v1/trajectories/{plate}` and receive the vehicle’s full journey (ordered timestamps, road coordinates, speeds, camera thumbnails).
* Live WebSockets stream real-time detection events and instant high-priority alerts to any connected client.

---

## Phase 3: "God's Eye" Tactical Cyber-HUD & Map Dashboard (Module 3)
*Goal: Deliver an awe-inspiring, defense-grade GIS visual experience inspired by `bilawalsidhu/gods-eye-view`.*

### What We Will Build:
1. **Tactical Dark Cyber-HUD UI**:
   * Obsidian theme (`#090d16`), electric cyan accents (`#00f0ff`), glassmorphism panels, and monospace telemetry.
   * Top navigation HUD with system status (`ONLINE`), active camera counters, and event rate metrics.
2. **Interactive 3D GIS Map (MapLibre GL / Deck.gl)**:
   * Anchored to New Delhi with dark tactical tiles and 3D buildings.
   * **50+ Camera Nodes**: Glowing camera markers projecting translucent field-of-view (FOV) frustums onto road lanes.
   * **Click-to-Inspect CCTV Modal**: Clicking any camera node pops open a live simulated CCTV feed showing passing cars and recognized plate readouts.
3. **Single-Plate Trajectory Tracker & Timeline Replay**:
   * Search input with fuzzy plate suggestions.
   * Auto-zoom and smooth camera fly-to upon selecting a vehicle.
   * **Glowing Neon Vector Trail (`TripsLayer`)**: An animated cyan trail showing everywhere the vehicle drove.
   * **Interactive Time-Scrubber**: Slider allowing judges to rewind or fast-forward vehicle movement hour-by-hour.
4. **Real-Time Alert Drawer & Intercept System**:
   * Flashing red/amber alert toasts and audible pings when a stolen or cloned plate is detected.
   * **"Locate on Map" Button**: Instantly locks the GIS camera onto the flagged vehicle's latest sighting.

### Concrete Outcome of Phase 3:
* A high-fidelity, 60 FPS interactive web application running in your browser.
* You can search any plate, watch its animated glowing route unfold on the map, inspect live camera nodes, and see security alerts trigger live.

---

## Phase 4: Macro Traffic Analytics, Live AI Lab & Presentation Suite
*Goal: Complete all macro analytics requirements and package the project into a flawless, judge-ready SIH demo.*

### What We Will Build:
1. **Macro Traffic Analytics Layers**:
   * **Density Heatmap**: Dynamic green-amber-red heatmaps visualizing city-wide congestion.
   * **3D Origin-Destination (O-D) Flow Arcs**: Glowing curved vectors showing commuter migration patterns between city zones.
   * **Chart.js Traffic Panels**: Live charts showing Average Speed Trends, Peak Congestion Indexes, and Corridor Bottleneck Rankings.
2. **Live AI Vision & OCR Lab (Direct Proof for Judges)**:
   * A dedicated inspection tab where judges can select or upload difficult test photos (night, rain, glare, 45° angle, blur).
   * Side-by-side visualization displaying: Raw Input $\rightarrow$ OpenCV CLAHE/Deblur $\rightarrow$ Deskewed Plate Crop $\rightarrow$ OCR Recognition with 96%+ confidence readout.
3. **DPDP Act 2023 Governance & Audit Log**:
   * Officer search authorization modal.
   * Immutable audit log tracking every plate query (Officer ID, timestamp, search reason) to demonstrate legal compliance with data privacy laws.
4. **Turnkey Demo Launcher & Pitch Script**:
   * Simple 1-command startup script (`./start.sh`) that launches both backend and frontend.
   * A 5-minute rehearsed presentation script showing you exactly what to click and say during SIH judging.

### Concrete Outcome of Phase 4:
* A 100% complete, competition-ready product.
* Addresses every single requirement in Problem Statement 26127.
* Provides judges with undeniable visual and empirical proof of accuracy, speed, and real-world utility.

---

## Phase Summary & Deliverables Matrix

| Phase | Core Modules Addressed | Key Technical Deliverable | Status | Outcome You Can See & Test |
| :--- | :--- | :--- | :---: | :--- |
| **Phase 1** | Module 1 (ANPR / OCR) | OpenCV preprocessing + YOLO + PaddleOCR + Indian Syntax Engine | ✅ **Done** | Standalone CV pipeline restoring degraded images & reading plates at >90% accuracy |
| **Phase 2** | Modules 2 & 4 (Trajectory & Alerts) | FastAPI + Spatial Database + Fuzzy Deduplication + Cloned Plate Engine + Simulator | ✅ **Done** | Live backend API reconstructing full vehicle paths & streaming real-time alerts |
| **Phase 3** | Module 3 (GIS Dashboard) | React + Tactical GIS Hybrid Map + Camera Fleet + Glowing Trajectory Replay | ✅ **Done** | Interactive 60 FPS "God's Eye" web dashboard with animated trails & live alerts |
| **Phase 4** | Macro Traffic Analytics | Dynamic Heatmaps + 3D O-D Flow Arcs + Bottleneck Leaderboard + AI Signal Advisor + 24H Rush Simulator | ✅ **Done** | Urban traffic intelligence suite directly fulfilling the second half of SIH Problem Statement 26127 |

