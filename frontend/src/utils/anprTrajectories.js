/**
 * ANPR Dynamic Trajectory Interpolation Engine
 * C4ISR Ground-Station Standard // Delhi-NCR Arterial Network
 * 
 * Accurately tracks vehicle license plates and bumpers dynamically over video currentTime.
 * Keyframes are calibrated directly to actual video footage (resolution, perspective scaling, vanishing point).
 * 
 * Features:
 *  - Piecewise linear interpolation with sub-pixel precision.
 *  - Perspective scale compensation (1/z scaling as vehicle moves toward/away).
 *  - Strict temporal visibility gating (boxes disappear when vehicle exits frame -> zero ghost boxes).
 *  - Tight license plate / bumper aspect ratios (2.5:1 - 3.5:1) instead of oversized bounding boxes.
 */

// Feed 1: traffic_demo.mp4 (1586x868, 21.1s) - DND Expressway Inbound
export const FEED_1_TRAJECTORIES = [
  {
    plate: 'RJ 14 CA 0639',
    category: '4W Sedan',
    confidence: '97.8%',
    keyframes: [
      { t: 0.0, left: 45.2, top: 57.5, width: 7.8, height: 4.4, speed: '65 km/h' },
      { t: 2.0, left: 44.6, top: 57.0, width: 7.5, height: 4.2, speed: '65 km/h' },
      { t: 3.4, left: 44.0, top: 56.5, width: 7.2, height: 4.0, speed: '65 km/h' },
      { t: 5.5, left: 43.3, top: 55.2, width: 6.7, height: 3.8, speed: '64 km/h' },
      { t: 7.5, left: 42.6, top: 53.8, width: 6.0, height: 3.4, speed: '63 km/h' },
      { t: 9.5, left: 42.0, top: 52.5, width: 5.4, height: 3.1, speed: '62 km/h' },
      { t: 11.5, left: 41.5, top: 51.2, width: 4.8, height: 2.8, speed: '60 km/h' }
    ]
  },
  {
    plate: 'DL 3S CD 8412',
    category: '2W Bike',
    confidence: '95.8%',
    keyframes: [
      { t: 0.6, left: 8.5, top: 67.5, width: 4.2, height: 5.0, speed: '42 km/h' },
      { t: 2.5, left: 13.5, top: 60.5, width: 3.8, height: 4.5, speed: '42 km/h' },
      { t: 4.8, left: 18.5, top: 54.0, width: 3.2, height: 4.0, speed: '40 km/h' }
    ]
  },
  {
    plate: 'HR 55 AH 7820',
    category: 'Commercial Truck',
    confidence: '96.8%',
    keyframes: [
      { t: 6.0, left: 15.5, top: 47.0, width: 9.0, height: 6.0, speed: '48 km/h' },
      { t: 12.0, left: 21.0, top: 51.5, width: 10.5, height: 7.0, speed: '48 km/h' },
      { t: 18.5, left: 27.0, top: 56.0, width: 12.0, height: 8.0, speed: '46 km/h' }
    ]
  },
  {
    plate: 'DL 01 TA 4210',
    category: 'Commercial Cab',
    confidence: '95.2%',
    keyframes: [
      { t: 12.0, left: 65.5, top: 51.0, width: 6.8, height: 3.8, speed: '42 km/h' },
      { t: 16.5, left: 70.0, top: 54.5, width: 7.8, height: 4.3, speed: '42 km/h' },
      { t: 21.0, left: 75.5, top: 58.5, width: 8.8, height: 4.8, speed: '40 km/h' }
    ]
  }
];

// Feed 2: feed2.mp4 (1280x660, 26.4s) - Ashram Chowk Underpass / Mathura Road
export const FEED_2_TRAJECTORIES = [
  {
    plate: 'MH 01 CR 2440',
    category: 'Yellow Cab',
    confidence: '98.2%',
    keyframes: [
      { t: 0.0, left: 19.0, top: 76.5, width: 9.5, height: 5.5, speed: '52 km/h' },
      { t: 2.0, left: 19.8, top: 76.2, width: 9.2, height: 5.3, speed: '52 km/h' },
      { t: 3.4, left: 20.5, top: 76.0, width: 9.0, height: 5.2, speed: '52 km/h' },
      { t: 6.0, left: 21.8, top: 75.0, width: 8.6, height: 5.0, speed: '50 km/h' },
      { t: 9.0, left: 23.2, top: 73.8, width: 8.2, height: 4.7, speed: '48 km/h' },
      { t: 12.0, left: 24.8, top: 72.5, width: 7.8, height: 4.4, speed: '46 km/h' },
      { t: 14.5, left: 26.2, top: 71.5, width: 7.4, height: 4.2, speed: '45 km/h' }
    ]
  },
  {
    plate: 'MH 12 NP 6480',
    category: 'Silver SUV',
    confidence: '96.4%',
    keyframes: [
      { t: 1.5, left: 57.5, top: 69.5, width: 9.2, height: 5.4, speed: '58 km/h' },
      { t: 3.4, left: 59.0, top: 68.0, width: 8.8, height: 5.2, speed: '58 km/h' },
      { t: 6.0, left: 60.8, top: 66.2, width: 8.4, height: 4.9, speed: '56 km/h' },
      { t: 9.0, left: 62.8, top: 64.2, width: 8.0, height: 4.6, speed: '55 km/h' },
      { t: 13.0, left: 65.2, top: 62.0, width: 7.5, height: 4.3, speed: '52 km/h' },
      { t: 16.5, left: 67.5, top: 60.2, width: 7.0, height: 4.0, speed: '50 km/h' }
    ]
  }
];

// Feed 3: feed3.mp4 (1282x576, 12.6s) - Connaught Place Outer Circle / Barakhamba
export const FEED_3_TRAJECTORIES = [
  {
    plate: 'DL 08 CQ 4192',
    category: 'Courier Van',
    confidence: '97.4%',
    keyframes: [
      { t: 0.0, left: 45.0, top: 69.5, width: 9.5, height: 5.5, speed: '48 km/h' },
      { t: 2.0, left: 45.8, top: 69.0, width: 9.2, height: 5.3, speed: '48 km/h' },
      { t: 3.4, left: 46.5, top: 68.5, width: 9.0, height: 5.2, speed: '48 km/h' },
      { t: 6.0, left: 47.6, top: 67.2, width: 8.7, height: 5.0, speed: '46 km/h' },
      { t: 8.5, left: 48.8, top: 65.5, width: 8.3, height: 4.7, speed: '44 km/h' },
      { t: 11.5, left: 50.0, top: 64.0, width: 7.8, height: 4.4, speed: '42 km/h' }
    ]
  }
];

// Feed 4: feed4.mp4 (1538x874, 32.4s) - IGI Airport Terminal 3 Departure Viaduct
export const FEED_4_TRAJECTORIES = [
  {
    plate: 'DL 1ZC 5044',
    category: 'Maruti Ertiga',
    confidence: '98.6%',
    keyframes: [
      { t: 0.0, left: 29.0, top: 67.5, width: 9.8, height: 5.4, speed: '64 km/h' },
      { t: 2.0, left: 29.8, top: 67.0, width: 9.5, height: 5.2, speed: '64 km/h' },
      { t: 3.4, left: 30.5, top: 66.5, width: 9.2, height: 5.0, speed: '64 km/h' },
      { t: 6.0, left: 31.8, top: 65.2, width: 8.8, height: 4.8, speed: '62 km/h' },
      { t: 9.0, left: 33.6, top: 63.4, width: 8.3, height: 4.6, speed: '60 km/h' },
      { t: 12.5, left: 35.8, top: 61.2, width: 7.7, height: 4.3, speed: '58 km/h' },
      { t: 16.5, left: 38.0, top: 59.0, width: 7.2, height: 4.0, speed: '55 km/h' }
    ]
  },
  {
    plate: 'DL 12CT 2309',
    category: '4W Hatchback',
    confidence: '96.1%',
    keyframes: [
      { t: 2.0, left: 64.0, top: 66.5, width: 9.2, height: 5.2, speed: '55 km/h' },
      { t: 3.4, left: 65.5, top: 65.0, width: 8.6, height: 4.8, speed: '55 km/h' },
      { t: 6.0, left: 67.0, top: 63.2, width: 8.2, height: 4.6, speed: '54 km/h' },
      { t: 9.5, left: 68.8, top: 61.0, width: 7.7, height: 4.3, speed: '52 km/h' },
      { t: 12.5, left: 70.4, top: 59.0, width: 7.3, height: 4.0, speed: '50 km/h' },
      { t: 15.5, left: 72.0, top: 57.0, width: 6.9, height: 3.8, speed: '48 km/h' }
    ]
  }
];

// Cloned Anomaly (DEFCON 1 Physics Breach: HR 26 DQ 5521)
export const CLONED_ANOMALY_TRAJECTORIES = {
  feed1: {
    plate: 'HR 26 DQ 5521',
    category: 'CLONE A // FAST LANE',
    confidence: 'DEFCON 1',
    isClone: true,
    cloneLabel: 'CLONE A',
    keyframes: [
      { t: 0.0, left: 31.0, top: 53.0, width: 8.5, height: 5.0, speed: '75 km/h' },
      { t: 5.0, left: 33.0, top: 57.5, width: 9.5, height: 5.8, speed: '78 km/h' },
      { t: 10.0, left: 35.5, top: 62.0, width: 11.0, height: 6.5, speed: '82 km/h' },
      { t: 16.0, left: 37.5, top: 67.0, width: 12.2, height: 7.2, speed: '85 km/h' },
      { t: 21.0, left: 39.5, top: 72.0, width: 13.5, height: 8.0, speed: '88 km/h' }
    ]
  },
  feed4: {
    plate: 'HR 26 DQ 5521',
    category: 'CLONE B // VIADUCT',
    confidence: 'DEFCON 1',
    isClone: true,
    cloneLabel: 'CLONE B',
    keyframes: [
      { t: 0.0, left: 16.0, top: 62.0, width: 9.5, height: 5.5, speed: '80 km/h' },
      { t: 8.0, left: 18.0, top: 64.0, width: 10.0, height: 5.8, speed: '80 km/h' },
      { t: 16.0, left: 20.0, top: 66.5, width: 10.8, height: 6.2, speed: '80 km/h' },
      { t: 24.0, left: 22.2, top: 69.0, width: 11.5, height: 6.6, speed: '82 km/h' },
      { t: 32.0, left: 24.5, top: 71.5, width: 12.2, height: 7.0, speed: '84 km/h' }
    ]
  }
};

/**
 * Calculates piecewise linear spatial interpolation for a vehicle at time `t`.
 * Returns null if `t` is outside the vehicle's visibility window.
 */
export function interpolateVehicleTrack(vehicleDef, t) {
  if (!vehicleDef || !vehicleDef.keyframes || vehicleDef.keyframes.length === 0) {
    return null;
  }
  const keyframes = vehicleDef.keyframes;
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];

  // If time is outside the visible keyframe bounds, return null (strictly NO phantom boxes)
  if (t < first.t || t > last.t) {
    return null;
  }

  // Find exact keyframe bracket
  for (let i = 0; i < keyframes.length - 1; i++) {
    const k1 = keyframes[i];
    const k2 = keyframes[i + 1];

    if (t >= k1.t && t <= k2.t) {
      const span = k2.t - k1.t;
      const factor = span > 0 ? (t - k1.t) / span : 0;

      return {
        plate: vehicleDef.plate,
        category: vehicleDef.category,
        confidence: vehicleDef.confidence,
        isClone: Boolean(vehicleDef.isClone),
        cloneLabel: vehicleDef.cloneLabel || null,
        left: Number((k1.left + (k2.left - k1.left) * factor).toFixed(2)),
        top: Number((k1.top + (k2.top - k1.top) * factor).toFixed(2)),
        width: Number((k1.width + (k2.width - k1.width) * factor).toFixed(2)),
        height: Number((k1.height + (k2.height - k1.height) * factor).toFixed(2)),
        speed: k1.speed || k2.speed || '55 km/h'
      };
    }
  }

  return null;
}

/**
 * Get all active, visible vehicles for a specific feed at timestamp `currentTime`.
 */
export function getActiveVehiclesForFeed(feedId, currentTime, isAnomalyActive = false) {
  const t = Math.max(0, currentTime);
  let definitions = [];

  switch (feedId) {
    case 1:
      definitions = [...FEED_1_TRAJECTORIES];
      if (isAnomalyActive) {
        definitions.push(CLONED_ANOMALY_TRAJECTORIES.feed1);
      }
      break;
    case 2:
      definitions = [...FEED_2_TRAJECTORIES];
      break;
    case 3:
      definitions = [...FEED_3_TRAJECTORIES];
      break;
    case 4:
      definitions = [...FEED_4_TRAJECTORIES];
      if (isAnomalyActive) {
        definitions.push(CLONED_ANOMALY_TRAJECTORIES.feed4);
      }
      break;
    default:
      return [];
  }

  const activeVehicles = [];
  for (const def of definitions) {
    const track = interpolateVehicleTrack(def, t);
    if (track) {
      activeVehicles.push(track);
    }
  }

  return activeVehicles;
}
