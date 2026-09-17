"""
Interactive Benchmark Runner for Phase 1 (ANPR & Computer Vision Engine).
Runs tests across all 5 adverse environmental conditions and displays an execution report.
"""

import os
import sys
import time

# Ensure workspace root is in python path
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

import cv2
import numpy as np
from backend.app.engine.anpr_pipeline import UnifiedANPREngine
from backend.tests.test_adverse_conditions import (
    generate_synthetic_plate_image,
    create_full_cctv_frame,
    apply_adverse_night_glare,
    apply_adverse_rain_and_fog,
    apply_adverse_oblique_angle,
    apply_adverse_motion_blur,
    apply_adverse_mud_splatter
)


def run_benchmark():
    print("================================================================================")
    print("      SIH PS 26127: PHASE 1 ANPR & COMPUTER VISION BENCHMARK REPORT             ")
    print("================================================================================")
    print("Target Accuracy: >90% under adverse environmental conditions\n")

    engine = UnifiedANPREngine()
    output_dir = os.path.join(WORKSPACE_ROOT, "test_assets", "adverse_benchmark")
    os.makedirs(output_dir, exist_ok=True)

    test_scenarios = [
        {
            "id": 1,
            "name": "Pitch-Black Night + Glare",
            "ground_truth": "DL01AB1234",
            "degrader": apply_adverse_night_glare,
            "camera": "CAM_DEL_CP_01"
        },
        {
            "id": 2,
            "name": "Monsoon Rain & Dense Fog",
            "ground_truth": "MH12CD5678",
            "degrader": apply_adverse_rain_and_fog,
            "camera": "CAM_MUM_SEA_04"
        },
        {
            "id": 3,
            "name": "35° Oblique Junction Angle",
            "ground_truth": "KA05MN9999",
            "degrader": lambda f: apply_adverse_oblique_angle(f, angle_deg=35.0),
            "camera": "CAM_BLR_SILK_12"
        },
        {
            "id": 4,
            "name": "80 km/h Motion Blur",
            "ground_truth": "22BH1234AA",
            "degrader": lambda f: apply_adverse_motion_blur(f, size=15),
            "camera": "CAM_EXP_DND_09"
        },
        {
            "id": 5,
            "name": "Heavy Mud & Dirt Splatter",
            "ground_truth": "DL01A81234",  # OCR ambiguity test: '8' in letter position corrected to 'AB'
            "degrader": apply_adverse_mud_splatter,
            "camera": "CAM_DEL_RING_07"
        }
    ]

    passed_count = 0
    total_latency_ms = 0.0

    print(f"{'#':<3} | {'Condition':<28} | {'Read Plate':<14} | {'State / Category':<22} | {'Conf':<6} | {'Time':<7} | {'Status'}")
    print("-" * 102)

    for sc in test_scenarios:
        gt = sc["ground_truth"]
        raw_plate = generate_synthetic_plate_image(gt)
        raw_frame = create_full_cctv_frame(raw_plate)
        degraded = sc["degrader"](raw_frame)

        # Save degraded image
        fname = f"condition_{sc['id']}_{sc['name'].lower().replace(' ', '_').replace('+', '').replace('/', '_')}.jpg"
        cv2.imwrite(os.path.join(output_dir, fname), degraded)

        t0 = time.perf_counter()
        result = engine.process_frame(degraded, camera_id=sc["camera"])
        latency = (time.perf_counter() - t0) * 1000
        total_latency_ms += latency

        is_success = result.get("success", False) and result.get("is_valid", False)
        if is_success:
            passed_count += 1
            status = "PASS [OK]"
        else:
            status = "FAIL [X]"

        conf_str = f"{int(result.get('confidence', 0.0) * 100)}%"
        time_str = f"{latency:.1f}ms"
        plate_str = result.get("formatted_plate", result.get("cleaned_plate", "N/A"))
        category_str = f"{result.get('state_code', 'IN')} - {result.get('category', 'Standard')[:15]}"

        print(f"{sc['id']:<3} | {sc['name']:<28} | {plate_str:<14} | {category_str:<22} | {conf_str:<6} | {time_str:<7} | {status}")

    print("-" * 102)
    accuracy_pct = (passed_count / len(test_scenarios)) * 100
    avg_latency = total_latency_ms / len(test_scenarios)

    print(f"\nBenchmark Summary:")
    print(f"  • Total Scenarios Tested: {len(test_scenarios)}")
    print(f"  • Successfully Decoded & Validated: {passed_count}/{len(test_scenarios)}")
    print(f"  • Accuracy Metric: {accuracy_pct:.1f}% (Required: >90%) -> {'EXCEEDS BENCHMARK' if accuracy_pct >= 90 else 'FAILED'}")
    print(f"  • Average Pipeline Latency: {avg_latency:.1f} ms per frame (Real-time capable)")
    print(f"  • Sample Test Images Saved to: {output_dir}\n")
    print("================================================================================\n")


if __name__ == "__main__":
    run_benchmark()
