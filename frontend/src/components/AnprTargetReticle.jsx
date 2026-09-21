import React from 'react';
import { Crosshair, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * AnprTargetReticle
 * Defense-Grade C4ISR Tactical Target Reticle & ANPR Registration Tracker.
 * 
 * Accurately locked onto the vehicle's bumper and license plate.
 * Moves dynamically across time with smooth sub-pixel interpolation.
 */
export default function AnprTargetReticle({
  track,
  isSelected = false,
  onClick
}) {
  if (!track) return null;

  const {
    plate,
    category,
    confidence,
    isClone,
    cloneLabel,
    left,
    top,
    width,
    height,
    speed
  } = track;

  // Visual Theme
  const theme = isClone
    ? {
        border: 'border-[#EF4444]',
        bg: 'bg-[#EF4444]/20',
        text: 'text-[#EF4444]',
        badgeBg: 'bg-[#261618]',
        badgeBorder: 'border-[#EF4444]',
        shadow: 'shadow-[0_0_14px_rgba(239,68,68,0.7)]',
        cornerColor: 'bg-[#EF4444]'
      }
    : isSelected
    ? {
        border: 'border-[#F59E0B]',
        bg: 'bg-[#F59E0B]/20',
        text: 'text-[#F59E0B]',
        badgeBg: 'bg-[#20170A]',
        badgeBorder: 'border-[#F59E0B]',
        shadow: 'shadow-[0_0_14px_rgba(245,158,11,0.7)]',
        cornerColor: 'bg-[#F59E0B]'
      }
    : {
        border: 'border-[#10B981]',
        bg: 'bg-[#10B981]/10',
        text: 'text-[#10B981]',
        badgeBg: 'bg-[#0A0B0E]/95',
        badgeBorder: 'border-[#10B981]/70',
        shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
        cornerColor: 'bg-[#10B981]'
      };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(plate);
      }}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        transition: 'left 60ms linear, top 60ms linear, width 60ms linear, height 60ms linear'
      }}
      className={`absolute z-20 cursor-pointer pointer-events-auto border-2 ${theme.border} ${theme.bg} ${theme.shadow} flex flex-col justify-between select-none group`}
    >
      {/* 4 Precision L-Corner Reticle Ticks */}
      <span className={`absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 ${theme.border}`} />
      <span className={`absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 ${theme.border}`} />
      <span className={`absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 ${theme.border}`} />
      <span className={`absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 ${theme.border}`} />

      {/* Center Target Reticle on hover or active */}
      {(isSelected || isClone) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <Crosshair className={`w-3.5 h-3.5 ${theme.text} animate-pulse`} />
        </div>
      )}

      {/* Floating Upper Tag (Pinned directly above the bumper bracket) */}
      <div className="absolute -top-5.5 left-0 -right-8 pointer-events-none flex items-center gap-1 z-30">
        <div className={`flex items-center gap-1.5 px-1.5 py-0.5 ${theme.badgeBg} border ${theme.badgeBorder} shadow-md`}>
          {isClone ? (
            <AlertTriangle className="w-2.5 h-2.5 text-[#EF4444] animate-ping" />
          ) : (
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${theme.cornerColor} animate-pulse`} />
          )}
          <span className="text-[8.5px] font-black tracking-wider text-[#FFFFFF] font-mono whitespace-nowrap">
            {isClone && cloneLabel ? `[${cloneLabel}] ` : ''}
            {plate}
          </span>
          <span className={`text-[7.5px] font-bold ${theme.text} pl-0.5`}>
            {confidence}
          </span>
        </div>
      </div>

      {/* Floating Lower Sub-Telemetry Tag (Pinned directly below the bumper bracket) */}
      <div className="absolute -bottom-4.5 left-0 pointer-events-none z-30">
        <div className="text-[7.5px] font-mono text-[#CBD5E1] bg-[#0A0B0E]/95 border border-[#374151] px-1 py-0.2 shadow-sm whitespace-nowrap">
          {speed} • {category}
        </div>
      </div>
    </div>
  );
}
