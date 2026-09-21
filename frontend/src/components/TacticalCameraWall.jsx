import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  Radio,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Layers,
  Crosshair,
  Volume2,
  VolumeX,
  Wifi,
  MapPin,
  Car
} from 'lucide-react';
import { getActiveVehiclesForFeed } from '../utils/anprTrajectories';
import AnprTargetReticle from './AnprTargetReticle';

/**
 * Tactical 4-Screen CCTV Matrix Wall (C4ISR Ground-Station Standard)
 * 
 * Features:
 *  - 4 Distinct Synchronized Camera Feeds:
 *      Feed 1: CAM_DEL_DND_01 // DND Toll Plaza (Delhi Inbound, Lane 3) -> /videos/traffic_demo.mp4 (or HLS live)
 *      Feed 2: CAM_DEL_ASHRAM_07 // Ashram Chowk Underpass / Mathura Road -> /videos/feed2.mp4
 *      Feed 3: CAM_DEL_CP_OUTER_19 // Connaught Place Outer Circle / Barakhamba -> /videos/feed3.mp4
 *      Feed 4: CAM_DEL_IGI_T3_29 // IGI Airport Terminal 3 Express Corridor -> /videos/feed4.mp4
 *  - Prominent Mock Current Addresses for each CCTV node.
 *  - DYNAMIC ANPR NUMBER PLATE TRACKING:
 *      * Tightly locked directly onto the vehicle bumper and license plate (NOT floating in mid-air).
 *      * Real-time spatial trajectory interpolation synced to video playback at 60 FPS.
 *      * Strict temporal gating: boxes disappear completely when vehicle exits frame (ZERO ghost boxes).
 *      * DEFCON 1 Cloned Plate tracking with alert HUD and audio siren.
 *  - Seamless synchronization with bottom Mission Deck (Play/Pause, Slow-Mo, Scrubbing).
 *  - Single-feed forensic magnification modal that KEEPS all 4 feeds permanently mounted without blanking.
 *  - Defense-grade Charcoal & Tactical Amber MFD aesthetics (Strictly no blue).
 */

// Curated live public traffic HLS streams (with automatic fallback to local high-FPS stream)
const PUBLIC_LIVE_STREAMS = [
  {
    name: 'NYC DOT / Public Highway Corridor Live Stream',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    backup: '/videos/traffic_demo.mp4'
  },
  {
    name: 'Akamai Live Edge Traffic Feed',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/200034/test/master.m3u8',
    backup: '/videos/traffic_demo.mp4'
  }
];

export default function TacticalCameraWall({
  activeTargetPlate,
  onSelectPlateForTracking,
  isAnomalyActive,
  onTriggerAnomaly,
  isPlaying = true,
  isSlowMo = false,
  currentTime
}) {
  const [activeStreamIndex, setActiveStreamIndex] = useState(0);
  const [streamSource, setStreamSource] = useState('TACTICAL_LOOP'); // 'TACTICAL_LOOP' | 'PUBLIC_HLS'
  const [isHlsLive, setIsHlsLive] = useState(false);
  const [zoomedCamera, setZoomedCamera] = useState(null); // null | 1 | 2 | 3 | 4
  const [telemetryFps, setTelemetryFps] = useState(59.8);
  const [streamBitrate, setStreamBitrate] = useState('4.8 Mbps');
  const [audioMuted, setAudioMuted] = useState(true);

  // Dynamic playback timestamps for all 4 feeds
  const [feedTimes, setFeedTimes] = useState({ f1: 0, f2: 0, f3: 0, f4: 0 });

  // Video references for 4 feeds
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const videoRef3 = useRef(null);
  const videoRef4 = useRef(null);
  const hlsInstanceRef = useRef(null);
  const lastScrubRef = useRef(currentTime);

  // Initialize Feed 1 (Supports HLS and local tactical loop)
  useEffect(() => {
    const video = videoRef1.current;
    if (!video) return;

    if (streamSource === 'PUBLIC_HLS') {
      const streamUrl = PUBLIC_LIVE_STREAMS[activeStreamIndex].url;

      if (Hls.isSupported()) {
        if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30
        });
        hlsInstanceRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          setIsHlsLive(true);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setIsHlsLive(false);
            video.src = PUBLIC_LIVE_STREAMS[activeStreamIndex].backup;
            video.play().catch(() => {});
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => {});
          setIsHlsLive(true);
        });
      }
    } else {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      video.src = '/videos/traffic_demo.mp4';
      video.play().catch(() => {});
      setIsHlsLive(false);
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
      }
    };
  }, [streamSource, activeStreamIndex]);

  // Robust initialization and zoom-restore keeper for all 4 feeds
  useEffect(() => {
    const feeds = [
      { ref: videoRef1, defaultSrc: '/videos/traffic_demo.mp4', isHls: streamSource === 'PUBLIC_HLS' },
      { ref: videoRef2, defaultSrc: '/videos/feed2.mp4', isHls: false },
      { ref: videoRef3, defaultSrc: '/videos/feed3.mp4', isHls: false },
      { ref: videoRef4, defaultSrc: '/videos/feed4.mp4', isHls: false }
    ];

    feeds.forEach(({ ref, defaultSrc, isHls }) => {
      const v = ref.current;
      if (!v) return;
      if (!isHls) {
        const currentSrc = v.getAttribute('src') || v.src;
        if (!currentSrc || currentSrc === '' || currentSrc.endsWith('/')) {
          v.src = defaultSrc;
        }
      }
      if (isPlaying && v.paused) {
        v.play().catch(() => {});
      }
    });
  }, [zoomedCamera, isPlaying, streamSource]);

  // Sync external Play/Pause controls
  useEffect(() => {
    [videoRef1, videoRef2, videoRef3, videoRef4].forEach((vRef) => {
      const v = vRef.current;
      if (!v) return;
      if (isPlaying === false) {
        v.pause();
      } else if (isPlaying === true && v.paused) {
        v.play().catch(() => {});
      }
    });
  }, [isPlaying]);

  // Sync external Slow-Motion controls
  useEffect(() => {
    [videoRef1, videoRef2, videoRef3, videoRef4].forEach((vRef) => {
      if (vRef.current) {
        vRef.current.playbackRate = isSlowMo ? 0.35 : 1.0;
      }
    });
  }, [isSlowMo]);

  // Sync external timeline scrubber
  useEffect(() => {
    if (currentTime !== undefined && Math.abs(currentTime - lastScrubRef.current) > 0.35) {
      lastScrubRef.current = currentTime;
      [videoRef1, videoRef2, videoRef3, videoRef4].forEach((vRef) => {
        const v = vRef.current;
        if (!v || isNaN(v.duration) || v.duration <= 0) return;
        v.currentTime = currentTime % v.duration;
      });
    }
  }, [currentTime]);

  // High-performance 30 FPS tracking loop to continuously update vehicle coordinates in sync with video frames
  useEffect(() => {
    let animId;
    let lastTime = 0;

    const syncLoop = (now) => {
      if (now - lastTime >= 33) { // ~30 FPS sync
        lastTime = now;
        setFeedTimes({
          f1: videoRef1.current?.currentTime || 0,
          f2: videoRef2.current?.currentTime || 0,
          f3: videoRef3.current?.currentTime || 0,
          f4: videoRef4.current?.currentTime || 0
        });
      }
      animId = requestAnimationFrame(syncLoop);
    };

    animId = requestAnimationFrame(syncLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Audio Tactical Warning on DEFCON 1 Anomaly
  useEffect(() => {
    if (isAnomalyActive && !audioMuted) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}
    }
  }, [isAnomalyActive, audioMuted]);

  // Telemetry real-time jitter simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryFps(roundTo(59.2 + Math.random() * 1.4, 1));
      setStreamBitrate(`${(4.4 + Math.random() * 0.8).toFixed(1)} Mbps`);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const roundTo = (num, dec) => Number(Math.round(num + 'e' + dec) + 'e-' + dec);

  // Compute active vehicles for each feed based on its real-time video currentTime
  const activeVehiclesFeed1 = getActiveVehiclesForFeed(1, feedTimes.f1, isAnomalyActive);
  const activeVehiclesFeed2 = getActiveVehiclesForFeed(2, feedTimes.f2, isAnomalyActive);
  const activeVehiclesFeed3 = getActiveVehiclesForFeed(3, feedTimes.f3, isAnomalyActive);
  const activeVehiclesFeed4 = getActiveVehiclesForFeed(4, feedTimes.f4, isAnomalyActive);

  return (
    <div className="w-full bg-[#13151B] border border-[#262933] font-mono text-xs shadow-2xl relative">
      {/* Top Tactical Matrix Header */}
      <div className="px-3.5 py-2.5 bg-[#0E1015] border-b border-[#262933] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-[#F59E0B]/15 border border-[#F59E0B]/60 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5">
              <span>TACTICAL CCTV MATRIX WALL</span>
              <span className="text-[#374151]">•</span>
              <span className="text-[#10B981] font-bold">4 LIVE FEEDS SYNCHRONIZED</span>
            </div>
            <div className="text-xs font-bold text-[#FFFFFF] tracking-wider">
              DELHI NCR ARTERIAL SURVEILLANCE // C4ISR GROUND STATION
            </div>
          </div>
        </div>

        {/* Center / Right Stream Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Stream Mode Toggle */}
          <div className="flex items-center bg-[#0A0B0E] border border-[#374151] p-0.5">
            <button
              onClick={() => setStreamSource('TACTICAL_LOOP')}
              className={`px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                streamSource === 'TACTICAL_LOOP'
                  ? 'bg-[#252A34] text-[#FFFFFF] border border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF]'
              }`}
            >
              <Layers className="w-3 h-3 text-[#F59E0B]" />
              4 SYNCHRONIZED FEEDS (60 FPS)
            </button>
            <button
              onClick={() => setStreamSource('PUBLIC_HLS')}
              className={`px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                streamSource === 'PUBLIC_HLS'
                  ? 'bg-[#252A34] text-[#FFFFFF] border border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF]'
              }`}
            >
              <Wifi className="w-3 h-3 text-[#10B981]" />
              FEED 1 LIVE HLS STREAM
            </button>
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            title="Toggle Tactical Siren"
            className="p-1.5 bg-[#1C1F26] hover:bg-[#252A34] text-[#CBD5E1] hover:text-[#FFFFFF] border border-[#374151] cursor-pointer"
          >
            {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />}
          </button>

          {/* Trigger DEFCON 1 Anomaly */}
          <button
            onClick={onTriggerAnomaly}
            className={`px-2.5 py-1 text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isAnomalyActive
                ? 'bg-[#261618] text-[#EF4444] border-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                : 'bg-[#1C1F26] hover:bg-[#252A34] text-[#CBD5E1] hover:text-[#EF4444] border-[#374151] hover:border-[#EF4444]/60'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
            {isAnomalyActive ? 'DEFCON 1 ACTIVE' : 'TEST CLONED ANOMALY'}
          </button>
        </div>
      </div>

      {/* DEFCON 1 Flashing Threat Banner */}
      {isAnomalyActive && (
        <div className="bg-[#EF4444] text-[#FFFFFF] px-4 py-2 border-b border-[#EF4444] flex items-center justify-between font-mono animate-pulse">
          <div className="flex items-center gap-2 text-xs font-black">
            <span className="w-2 h-2 bg-[#FFFFFF]" />
            [DEFCON 1 PHYSICS BREACH] TARGET "HR 26 DQ 5521" SIGHTED AT FEED 01 (DND) & FEED 04 (IGI AIRPORT) WITHIN 42 SECONDS (VELOCITY &gt; 2,100 KM/H)
          </div>
          <span className="text-[10px] bg-[#0A0B0E] text-[#FFFFFF] px-2 py-0.5 border border-[#FFFFFF]/40 font-bold">
            CLONED REGISTRATION CONFIRMED
          </span>
        </div>
      )}

      {/* 2x2 Tactical Grid or Maximized Single Feed: ALL FEEDS PERMANENTLY MOUNTED (NEVER DESTROYED) */}
      <div className={`p-1.5 bg-[#0A0B0E] relative ${zoomedCamera ? 'grid grid-cols-1' : 'grid grid-cols-1 md:grid-cols-2 gap-1.5'}`}>
        
        {/* ================= FEED 01: DND TOLL PLAZA ================= */}
        <div className={`relative bg-[#000000] border border-[#262933] overflow-hidden group aspect-video transition-all ${
          zoomedCamera && zoomedCamera !== 1 ? 'hidden' : ''
        } ${zoomedCamera === 1 ? 'col-span-full ring-2 ring-[#F59E0B]' : ''}`}>
          <video
            ref={videoRef1}
            src={streamSource === 'TACTICAL_LOOP' ? '/videos/traffic_demo.mp4' : undefined}
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={(e) => { if (isPlaying && e.target.paused) e.target.play().catch(() => {}); }}
            className="w-full h-full object-cover"
          />

          {/* Dynamic, Physically Synced ANPR Reticles for Feed 1 */}
          {activeVehiclesFeed1.map((track) => (
            <AnprTargetReticle
              key={`${track.plate}-${track.isClone ? 'clone' : 'norm'}`}
              track={track}
              isSelected={activeTargetPlate === track.plate}
              onClick={onSelectPlateForTracking}
            />
          ))}

          {/* Top-Left Camera Label & Status */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#0A0B0E]/90 border border-[#262933] px-2 py-0.5 text-[9px] z-10">
            <span className="w-1.5 h-1.5 bg-[#10B981] animate-pulse" />
            <span className="text-[#FFFFFF] font-bold">FEED 01:</span>
            <span className="text-[#CBD5E1]">CAM_DEL_DND_01</span>
          </div>

          {/* Top-Right Maximize / Restore Button */}
          <button
            onClick={() => setZoomedCamera(zoomedCamera === 1 ? null : 1)}
            className={`absolute top-2 right-2 p-1 text-[#CBD5E1] hover:text-[#FFFFFF] border border-[#262933] cursor-pointer z-10 ${
              zoomedCamera === 1 ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]' : 'bg-[#0A0B0E]/80 hover:bg-[#252A34]'
            }`}
            title={zoomedCamera === 1 ? 'Restore 2x2 Grid' : 'Maximize Feed 01'}
          >
            {zoomedCamera === 1 ? <Minimize2 className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          {/* Prominent Mock Current Address Strip */}
          <div className="absolute top-7 left-2 right-12 flex items-center gap-1.5 bg-[#0E1015]/95 border border-[#374151] px-2 py-0.5 text-[8.5px] text-[#FFFFFF] shadow-md z-10">
            <MapPin className="w-3 h-3 text-[#F59E0B] shrink-0" />
            <span className="text-[#F59E0B] font-bold">CURRENT ADDRESS:</span>
            <span className="truncate text-[#CBD5E1]">DND Expressway Km 2.4, Inbound Toll Plaza, Mayur Vihar Link, New Delhi</span>
          </div>

          {/* Bottom Telemetry Strip */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[8px] text-[#CBD5E1] bg-[#0A0B0E]/85 px-2 py-0.5 border border-[#262933] z-10">
            <div>OPTICAL: 4K HIGHWAY PTZ • 28.5832° N, 77.2985° E • LANE 3</div>
            <div className="text-[#10B981] font-bold">{telemetryFps} FPS // 34ms</div>
          </div>
        </div>

        {/* ================= FEED 02: ASHRAM CHOWK UNDERPASS ================= */}
        <div className={`relative bg-[#000000] border border-[#262933] overflow-hidden group aspect-video transition-all ${
          zoomedCamera && zoomedCamera !== 2 ? 'hidden' : ''
        } ${zoomedCamera === 2 ? 'col-span-full ring-2 ring-[#F59E0B]' : ''}`}>
          <video
            ref={videoRef2}
            src="/videos/feed2.mp4"
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={(e) => { if (isPlaying && e.target.paused) e.target.play().catch(() => {}); }}
            className="w-full h-full object-cover"
          />

          {/* Dynamic, Physically Synced ANPR Reticles for Feed 2 */}
          {activeVehiclesFeed2.map((track) => (
            <AnprTargetReticle
              key={track.plate}
              track={track}
              isSelected={activeTargetPlate === track.plate}
              onClick={onSelectPlateForTracking}
            />
          ))}

          {/* Top-Left Camera Label */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#0A0B0E]/90 border border-[#262933] px-2 py-0.5 text-[9px] z-10">
            <span className="w-1.5 h-1.5 bg-[#10B981]" />
            <span className="text-[#FFFFFF] font-bold">FEED 02:</span>
            <span className="text-[#CBD5E1]">CAM_DEL_ASHRAM_07</span>
          </div>

          {/* Top-Right Maximize / Restore Button */}
          <button
            onClick={() => setZoomedCamera(zoomedCamera === 2 ? null : 2)}
            className={`absolute top-2 right-2 p-1 text-[#CBD5E1] hover:text-[#FFFFFF] border border-[#262933] cursor-pointer z-10 ${
              zoomedCamera === 2 ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]' : 'bg-[#0A0B0E]/80 hover:bg-[#252A34]'
            }`}
            title={zoomedCamera === 2 ? 'Restore 2x2 Grid' : 'Maximize Feed 02'}
          >
            {zoomedCamera === 2 ? <Minimize2 className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          {/* Prominent Mock Current Address Strip */}
          <div className="absolute top-7 left-2 right-12 flex items-center gap-1.5 bg-[#0E1015]/95 border border-[#374151] px-2 py-0.5 text-[8.5px] text-[#FFFFFF] shadow-md z-10">
            <MapPin className="w-3 h-3 text-[#10B981] shrink-0" />
            <span className="text-[#10B981] font-bold">CURRENT ADDRESS:</span>
            <span className="truncate text-[#CBD5E1]">Ring Road & Mathura Road Intersection, Ashram Underpass Portal, South Delhi</span>
          </div>

          {/* Bottom Telemetry Strip */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[8px] text-[#CBD5E1] bg-[#0A0B0E]/85 px-2 py-0.5 border border-[#262933] z-10">
            <div>SENSOR: 850nm IR NIGHT-VISION • 28.5710° N, 77.2588° E • LANE 1-2</div>
            <div className="text-[#10B981] font-bold">CLAHE ACTIVE // 60.0 FPS</div>
          </div>
        </div>

        {/* ================= FEED 03: CONNAUGHT PLACE OUTER CIRCLE ================= */}
        <div className={`relative bg-[#000000] border border-[#262933] overflow-hidden group aspect-video transition-all ${
          zoomedCamera && zoomedCamera !== 3 ? 'hidden' : ''
        } ${zoomedCamera === 3 ? 'col-span-full ring-2 ring-[#F59E0B]' : ''}`}>
          <video
            ref={videoRef3}
            src="/videos/feed3.mp4"
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={(e) => { if (isPlaying && e.target.paused) e.target.play().catch(() => {}); }}
            className="w-full h-full object-cover"
          />

          {/* Dynamic, Physically Synced ANPR Reticles for Feed 3 */}
          {activeVehiclesFeed3.map((track) => (
            <AnprTargetReticle
              key={track.plate}
              track={track}
              isSelected={activeTargetPlate === track.plate}
              onClick={onSelectPlateForTracking}
            />
          ))}

          {/* Top-Left Camera Label */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#0A0B0E]/90 border border-[#262933] px-2 py-0.5 text-[9px] z-10">
            <span className="w-1.5 h-1.5 bg-[#10B981]" />
            <span className="text-[#FFFFFF] font-bold">FEED 03:</span>
            <span className="text-[#CBD5E1]">CAM_DEL_CP_OUTER_19</span>
          </div>

          {/* Top-Right Maximize / Restore Button */}
          <button
            onClick={() => setZoomedCamera(zoomedCamera === 3 ? null : 3)}
            className={`absolute top-2 right-2 p-1 text-[#CBD5E1] hover:text-[#FFFFFF] border border-[#262933] cursor-pointer z-10 ${
              zoomedCamera === 3 ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]' : 'bg-[#0A0B0E]/80 hover:bg-[#252A34]'
            }`}
            title={zoomedCamera === 3 ? 'Restore 2x2 Grid' : 'Maximize Feed 03'}
          >
            {zoomedCamera === 3 ? <Minimize2 className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          {/* Prominent Mock Current Address Strip */}
          <div className="absolute top-7 left-2 right-12 flex items-center gap-1.5 bg-[#0E1015]/95 border border-[#374151] px-2 py-0.5 text-[8.5px] text-[#FFFFFF] shadow-md z-10">
            <MapPin className="w-3 h-3 text-[#F59E0B] shrink-0" />
            <span className="text-[#F59E0B] font-bold">CURRENT ADDRESS:</span>
            <span className="truncate text-[#CBD5E1]">Connaught Place Outer Circle, Radial 4 / Barakhamba Road Junction, Central Delhi</span>
          </div>

          {/* Bottom Telemetry Strip */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[8px] text-[#CBD5E1] bg-[#0A0B0E]/85 px-2 py-0.5 border border-[#262933] z-10">
            <div>OPTICAL: RAIN DE-GLARE // ADVERSE DE-NOISE • 28.6315° N, 77.2210° E</div>
            <div className="text-[#10B981] font-bold">HIGH SPEED // 60.0 FPS</div>
          </div>
        </div>

        {/* ================= FEED 04: IGI AIRPORT T3 EXPRESS ================= */}
        <div className={`relative bg-[#000000] border border-[#262933] overflow-hidden group aspect-video transition-all ${
          zoomedCamera && zoomedCamera !== 4 ? 'hidden' : ''
        } ${zoomedCamera === 4 ? 'col-span-full ring-2 ring-[#F59E0B]' : ''}`}>
          <video
            ref={videoRef4}
            src="/videos/feed4.mp4"
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={(e) => { if (isPlaying && e.target.paused) e.target.play().catch(() => {}); }}
            className="w-full h-full object-cover"
          />

          {/* Dynamic, Physically Synced ANPR Reticles for Feed 4 */}
          {activeVehiclesFeed4.map((track) => (
            <AnprTargetReticle
              key={`${track.plate}-${track.isClone ? 'clone' : 'norm'}`}
              track={track}
              isSelected={activeTargetPlate === track.plate}
              onClick={onSelectPlateForTracking}
            />
          ))}

          {/* Top-Left Camera Label */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#0A0B0E]/90 border border-[#262933] px-2 py-0.5 text-[9px] z-10">
            <span className="w-1.5 h-1.5 bg-[#10B981]" />
            <span className="text-[#FFFFFF] font-bold">FEED 04:</span>
            <span className="text-[#CBD5E1]">CAM_DEL_IGI_T3_29</span>
          </div>

          {/* Top-Right Maximize / Restore Button */}
          <button
            onClick={() => setZoomedCamera(zoomedCamera === 4 ? null : 4)}
            className={`absolute top-2 right-2 p-1 text-[#CBD5E1] hover:text-[#FFFFFF] border border-[#262933] cursor-pointer z-10 ${
              zoomedCamera === 4 ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]' : 'bg-[#0A0B0E]/80 hover:bg-[#252A34]'
            }`}
            title={zoomedCamera === 4 ? 'Restore 2x2 Grid' : 'Maximize Feed 04'}
          >
            {zoomedCamera === 4 ? <Minimize2 className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          {/* Prominent Mock Current Address Strip */}
          <div className="absolute top-7 left-2 right-12 flex items-center gap-1.5 bg-[#0E1015]/95 border border-[#374151] px-2 py-0.5 text-[8.5px] text-[#FFFFFF] shadow-md z-10">
            <MapPin className="w-3 h-3 text-[#10B981] shrink-0" />
            <span className="text-[#10B981] font-bold">CURRENT ADDRESS:</span>
            <span className="truncate text-[#CBD5E1]">Indira Gandhi International Airport, Terminal 3 Elevated Departure Viaduct, New Delhi</span>
          </div>

          {/* Bottom Telemetry Strip */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[8px] text-[#CBD5E1] bg-[#0A0B0E]/85 px-2 py-0.5 border border-[#262933] z-10">
            <div>MULTI-TARGET LOCK: YOLO-V8 + RESNET • 28.5562° N, 77.0865° E</div>
            <div className="text-[#10B981] font-bold">48.3 ms LATENCY</div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Diagnostics */}
      <div className="px-3.5 py-2 bg-[#0E1015] border-t border-[#262933] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#CBD5E1]">
        <div className="flex items-center gap-3">
          <span className="text-[#FFFFFF] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#10B981]" />
            NETWORK BUFFER: 100% HEALTHY
          </span>
          <span className="text-[#262933]">|</span>
          <span>4 SYNCHRONIZED ARTERIAL NODES</span>
          <span className="text-[#262933]">|</span>
          <span>REST API: /api/v1/anpr/process-live-frame</span>
        </div>
        <div className="text-[#F59E0B] font-bold flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5" />
          CLICK ANY VEHICLE BOUNDING BOX TO STITCH ITS FULL JOURNEY TIMELINE
        </div>
      </div>
    </div>
  );
}
