import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Eye, 
  Network, 
  Lock, 
  Activity, 
  Zap, 
  Radio, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

/**
 * SubsystemHealthMatrix
 * 
 * Inspired by George Railean's "Drone Airframe Diagnostics" Subsystem Health panel.
 * Displays operational readiness of the 4 core mission engines:
 * 1. Optical LAB-CLAHE Restoration Subsystem
 * 2. Neural ANPR & Indian RTO Grammar Subsystem
 * 3. Spatial-Temporal Graph & Velocity Engine Subsystem
 * 4. DPDP Act (2023) Cryptographic Vault Subsystem
 * 
 * Installed Skills Applied:
 * - ui-ux-pro-max: Strict status-only colors, monospace metric chips, dark carbon cards.
 */
export default function SubsystemHealthMatrix({ onSelectSubsystem }) {
  const subsystems = [
    {
      id: 'SYS_01_OPTICAL',
      name: 'Adverse Vision & CLAHE',
      category: 'Optical Restoration',
      status: 'OPTIMAL',
      latency: '18.2 ms',
      load: '32%',
      metricLabel: 'CONTRAST GAIN',
      metricVal: '+34.2 dB',
      subtext: 'LAB Grid 8x8 | Bilateral σ=75 | Deskew ±45°',
      color: 'green'
    },
    {
      id: 'SYS_02_NEURAL',
      name: 'YOLOv8 + RTO Syntax',
      category: 'Neural Inference',
      status: 'OPTIMAL',
      latency: '24.1 ms',
      load: '58%',
      metricLabel: 'SYNTAX ACCURACY',
      metricVal: '99.4%',
      subtext: '36 Indian States/UTs Grammar Check',
      color: 'green'
    },
    {
      id: 'SYS_03_GRAPH',
      name: 'Spatial Graph Trajectory',
      category: 'Multi-Camera Engine',
      status: 'ARMED',
      latency: '6.0 ms',
      load: '21%',
      metricLabel: 'ACTIVE NODES',
      metricVal: '52 GANTRY',
      subtext: 'Cloned Plate Velocity Governor Active',
      color: 'cyan'
    },
    {
      id: 'SYS_04_DPDP',
      name: 'DPDP Privacy Vault',
      category: 'Data Governance',
      status: 'COMPLIANT',
      latency: '<1.0 ms',
      load: '12%',
      metricLabel: 'QUERY AUDIT',
      metricVal: 'SHA-256',
      subtext: 'Auto-Pruning TTL: 72 Hours Active',
      color: 'green'
    }
  ];

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* Global Readiness Header Banner */}
      <div className="p-3.5 rounded-none bg-[#13151B] border border-[#262933] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#10B981]/15 border border-[#10B981]/60 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          </div>
          <div>
            <div className="text-[10px] text-[#CBD5E1] uppercase tracking-widest">
              SYSTEM READINESS
            </div>
            <div className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5">
              <span>99.4% OPTIMAL</span>
              <span className="text-[10px] text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.2 rounded-none border border-[#10B981]/40 font-bold">
                4/4 ARMED
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#CBD5E1]">TOTAL LATENCY</div>
          <div className="text-xs font-bold text-[#FFFFFF]">48.3 ms</div>
        </div>
      </div>

      {/* Subsystem Health Cards */}
      <div className="space-y-2.5">
        {subsystems.map((sys) => (
          <div
            key={sys.id}
            className="p-3 rounded-none bg-[#13151B] border border-[#262933] hover:border-[#4B5563] transition-colors group"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#262933]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-none bg-[#10B981]" />
                <span className="text-xs font-bold text-[#FFFFFF] group-hover:text-white transition-colors">
                  {sys.name}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-none bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/40 font-bold">
                {sys.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] my-1">
              <div>
                <span className="text-[#CBD5E1] text-[9px] block">LATENCY / LOAD</span>
                <span className="text-[#FFFFFF] font-semibold">{sys.latency}</span>
                <span className="text-[#CBD5E1] text-[10px] ml-1.5">({sys.load})</span>
              </div>
              <div className="text-right">
                <span className="text-[#CBD5E1] text-[9px] block">{sys.metricLabel}</span>
                <span className="text-[#FFFFFF] font-bold">{sys.metricVal}</span>
              </div>
            </div>

            <div className="text-[10px] text-[#CBD5E1] pt-1 border-t border-[#262933] truncate">
              {sys.subtext}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
