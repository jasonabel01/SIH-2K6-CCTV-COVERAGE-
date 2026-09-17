import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Gauge, 
  Sliders, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Terminal, 
  Film,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * TacticalCommandDeck
 * 
 * Inspired by George Railean's dedicated bottom Endurance & Timeline Governor block.
 * Anchors the mission timeline scrubber, frame stepper, and rapid scenario injectors
 * so judges can trigger adverse weather and anomaly conditions with 1 click.
 * 
 * Installed Skills Applied:
 * - ui-ux-pro-max: Ergonomic bottom command deck, tactile military buttons.
 * - pitch-psychologist: Instant one-click demo triggers for hackathon judges.
 */
export default function TacticalCommandDeck({
  isPlaying,
  onTogglePlay,
  isSlowMo,
  onToggleSlowMo,
  currentTime = 0,
  duration = 12,
  onScrub,
  activePreset,
  onSelectPreset,
  onTriggerAnomaly,
  isAnomalyActive,
  onRunJudgeDemo
}) {
  return (
    <div className="w-full bg-[#13151B] border-t border-[#262933] px-4 lg:px-8 py-3 fixed bottom-0 left-0 right-0 z-40 font-mono text-xs shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Playback Controls & Frame Stepper */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onTogglePlay}
            className="px-3.5 py-1.5 bg-[#1C1F26] hover:bg-[#252A34] text-[#FFFFFF] font-bold font-['Orbitron'] text-xs rounded-none flex items-center gap-1.5 transition-all cursor-pointer border border-[#374151] hover:border-[#F59E0B] shadow-sm"
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${isPlaying ? 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.9)]' : 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]'}`} />
            {isPlaying ? <Pause className="w-4 h-4 fill-[#CBD5E1]" /> : <Play className="w-4 h-4 fill-[#CBD5E1]" />}
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>

          <button
            onClick={onToggleSlowMo}
            className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
              isSlowMo
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.12)]'
                : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151]'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-[#CBD5E1]" />
            {isSlowMo ? '0.5x SLOW-MO' : '1.0x NOMINAL'}
          </button>

          <div className="hidden sm:flex items-center text-[#CBD5E1] text-[11px] px-2 py-1 bg-[#0A0B0E] border border-[#262933] rounded-none">
            <span className="text-[#FFFFFF] font-bold">{currentTime.toFixed(1)}s</span>
            <span className="mx-1 text-[#323644]">/</span>
            <span>{duration.toFixed(1)}s</span>
          </div>
        </div>

        {/* Center: Mission Timeline Scrubber */}
        <div className="flex items-center gap-3 w-full flex-1 max-w-xl mx-2">
          <span className="text-[10px] text-[#CBD5E1] uppercase tracking-wider shrink-0 font-bold">
            TIMELINE:
          </span>
          <input
            type="range"
            min="0"
            max={duration || 12}
            step="0.1"
            value={currentTime}
            onChange={(e) => onScrub && onScrub(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#0A0B0E] rounded-none appearance-none cursor-pointer accent-[#CBD5E1] border border-[#262933]"
          />
        </div>

        {/* Right: Quick Adverse Scenarios for Judges */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectPreset && onSelectPreset('live_video')}
            className={`px-2.5 py-1.5 rounded-none text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'live_video'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.12),0_0_8px_rgba(245,158,11,0.2)]'
                : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151] hover:border-[#4B5563]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${activePreset === 'live_video' ? 'bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse' : 'bg-[#4B5563]'}`} />
            Live Highway
          </button>
          <button
            onClick={() => onSelectPreset && onSelectPreset('monsoon_rain')}
            className={`px-2.5 py-1.5 rounded-none text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'monsoon_rain'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.12),0_0_8px_rgba(245,158,11,0.2)]'
                : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151] hover:border-[#4B5563]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${activePreset === 'monsoon_rain' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            Monsoon Rain
          </button>
          <button
            onClick={() => onSelectPreset && onSelectPreset('night_glare')}
            className={`px-2.5 py-1.5 rounded-none text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'night_glare'
                ? 'bg-[#252A34] text-[#FFFFFF] font-bold border border-[#F59E0B] shadow-[inset_0_0_8px_rgba(245,158,11,0.12),0_0_8px_rgba(245,158,11,0.2)]'
                : 'bg-[#1C1F26] text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#252A34] border border-[#374151] hover:border-[#4B5563]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${activePreset === 'night_glare' ? 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-[#4B5563]'}`} />
            Night Glare
          </button>

          {/* Cloned Anomaly Button */}
          <button
            onClick={onTriggerAnomaly}
            className={`px-3 py-1.5 rounded-none text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isAnomalyActive
                ? 'bg-[#261618] text-[#EF4444] border border-[#EF4444] animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-[#1C1F26] text-[#EF4444] border border-[#EF4444]/60 hover:bg-[#261618] hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-none bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
            <AlertTriangle className="w-3.5 h-3.5" />
            {isAnomalyActive ? 'DEFCON 1 ACTIVE' : 'TEST CLONED ALERT'}
          </button>

          {/* One-Click Judge Demo Automator */}
          {onRunJudgeDemo && (
            <button
              onClick={onRunJudgeDemo}
              className="px-3.5 py-1.5 bg-[#19231E] hover:bg-[#223329] text-[#10B981] hover:text-[#FFFFFF] border border-[#10B981] text-[11px] font-bold rounded-none flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)]"
            >
              <span className="w-1.5 h-1.5 rounded-none bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              <Zap className="w-3.5 h-3.5 fill-[#10B981] text-[#10B981]" />
              <span>JUDGE DEMO RUN</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
