import React from 'react';
import {
  Activity,
  Box,
  Layers,
  Settings,
  GitBranch,
  Cpu,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Sliders,
  Wrench,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Database,
  BarChart3,
} from 'lucide-react';

interface AppGuideViewProps {
  onBack?: () => void;
}

export const AppGuideView: React.FC<AppGuideViewProps> = ({ onBack }) => {
  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-[1400px] mx-auto text-white">
      {/* Header Banner */}
      <div className="glass-panel rounded-[26px] p-6 sm:p-8 bg-gradient-to-r from-[#07192A]/90 via-[#0A2438]/90 to-[#0A302C]/90 border border-[#00D2FF]/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-radial from-[#00D2FF]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-radial from-[#00E599]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/15 border border-[#00E599]/40 text-xs font-mono text-[#00E599]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OFFICIAL SYSTEM ARCHITECTURE & USER MANUAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
              MechMate AI — Platform Engineering Guide
            </h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Comprehensive reference manual detailing the multi-agent diagnostic reasoning engine, physics calculations (ISO 20816, AGMA 2001, SKF L10h), 3D GLB digital twin topology, and page-by-page system operations.
            </p>
          </div>

          {onBack && (
            <div className="shrink-0">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subcard text-xs font-bold text-white hover:text-[#00D2FF] border border-white/20 hover:border-[#00D2FF]/50 transition-all cursor-pointer shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section 1: How AI Diagnosis Works */}
      <div className="glass-panel rounded-[26px] p-6 space-y-5 border border-white/20">
        <div className="flex items-center gap-2.5 text-base font-bold text-white border-b border-white/15 pb-3">
          <Activity className="w-5 h-5 text-[#00E599]" />
          <span>1. How "Run AI Diagnosis" Works (End-to-End Workflow)</span>
        </div>

        <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
          Unlike opaque black-box deep learning models, MechMate AI employs physics-informed reasoning combined with statistical anomaly detection to ensure explainable, evidence-backed conclusions:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-subcard rounded-2xl p-4 space-y-2 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00D2FF] font-mono">
              <span className="w-6 h-6 rounded-full bg-[#00D2FF]/20 flex items-center justify-center font-bold">1</span>
              <span>7-CHANNEL SENSOR TELEMETRY</span>
            </div>
            <p className="text-xs text-white/75 leading-relaxed">
              Continuously ingests 7 physical channels: Vibration (mm/s RMS), Drive-End Bearing Temperature (°C), Rotational Speed (RPM), Motor Load (%), Sump Oil Temperature (°C), Oil Condition / Dielectric Index (%), and Lube Pressure (bar).
            </p>
          </div>

          <div className="glass-subcard rounded-2xl p-4 space-y-2 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00E599] font-mono">
              <span className="w-6 h-6 rounded-full bg-[#00E599]/20 flex items-center justify-center font-bold">2</span>
              <span>Z-SCORE & PHYSICS EVALUATION</span>
            </div>
            <p className="text-xs text-white/75 leading-relaxed">
              Normalizes telemetry against OEM statistical baselines (Mean and Standard Deviation) to compute Z-scores. Assesses Elastohydrodynamic Lubrication (EHL) film thickness, thermal dissipation margins, and harmonic energy peaks.
            </p>
          </div>

          <div className="glass-subcard rounded-2xl p-4 space-y-2 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF8800] font-mono">
              <span className="w-6 h-6 rounded-full bg-[#FF8800]/20 flex items-center justify-center font-bold">3</span>
              <span>ROOT CAUSE & INSPECTION PLAN</span>
            </div>
            <p className="text-xs text-white/75 leading-relaxed">
              Traverses the causal graph to isolate physical failure modes (bearing flaking, tooth scuffing, angular misalignment) and generates a prioritized maintenance checklist with recommended tools and estimated repair duration.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Detailed Page by Page Guide */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#00D2FF]" />
          <span>2. Application Page-by-Page Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Overview */}
          <div className="glass-panel rounded-[22px] p-5 space-y-3 border border-white/15 hover:border-[#00D2FF]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-[#00D2FF]" />
                <span>Overview (Central Dashboard)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00D2FF]/20 text-[#00D2FF]">HOME</span>
            </div>
            <ul className="text-xs text-white/75 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Health States:</strong> Real-time classification into NORMAL, WATCH, INVESTIGATE, or CRITICAL.</li>
              <li><strong>4 Compact Indicators:</strong> AI Confidence (%), Sensor Agreement (%), Trend Stability (%), and Operating Thermal Margin (%).</li>
              <li><strong>Telemetry Channel Stack:</strong> Switch between 7 live sensor streams to inspect instantaneous deviations.</li>
              <li><strong>Interactive 3D Twin:</strong> Static stance 3D machine model with smooth mouse orbit/pan/zoom and sensor beacons.</li>
              <li><strong>AI Engineering Copilot:</strong> Sidebar panel offering technical explanations, failure probabilities, and interactive Q&A.</li>
            </ul>
          </div>

          {/* Card 2: Machines */}
          <div className="glass-panel rounded-[22px] p-5 space-y-3 border border-white/15 hover:border-[#00E599]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#00E599]" />
                <span>Machines (Fleet & CAD Parameters)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E599]/20 text-[#00E599]">ASSET SPECS</span>
            </div>
            <ul className="text-xs text-white/75 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Fleet Management:</strong> Switch between Cooling Tower Gearbox GT-204, Slurry Pump GP-108, and Compressor GC-310.</li>
              <li><strong>Parametric CAD Dimensions:</strong> Modify housing length/width/height, wall thickness, and shaft diameters.</li>
              <li><strong>Engineering Calculations:</strong> Instantaneous computation of torque ($T = 9550 \times P/N$), torsional shear stress, and shaft safety factors.</li>
            </ul>
          </div>

          {/* Card 3: Diagnostics */}
          <div className="glass-panel rounded-[22px] p-5 space-y-3 border border-white/15 hover:border-[#FF8800]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#FF8800]" />
                <span>Diagnostics (Causal Graph & CSV Ingestion)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF8800]/20 text-[#FF8800]">ROOT CAUSE</span>
            </div>
            <ul className="text-xs text-white/75 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Causal Reasoning Tree:</strong> Visual root-cause node graph linking sensor anomalies to physical mechanical assemblies.</li>
              <li><strong>5 Preset Fault Scenarios:</strong> Bearing Lubrication Degradation, Shaft Misalignment, Gear Tooth Wear, Sump Overheating, and Clean Baseline.</li>
              <li><strong>CSV Telemetry Ingestion:</strong> Upload real-world SCADA or IoT CSV sensor logs with automatic header mapping and validation.</li>
            </ul>
          </div>

          {/* Card 4: Digital Twin 3D */}
          <div className="glass-panel rounded-[22px] p-5 space-y-3 border border-white/15 hover:border-[#2CE0EC]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-[#2CE0EC]" />
                <span>Digital Twin 3D (CAD GLB/GLTF Viewer)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2CE0EC]/20 text-[#2CE0EC]">CAD TOPOLOGY</span>
            </div>
            <ul className="text-xs text-white/75 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Original Binary .GLB Assets:</strong> Loads high-fidelity 3D models tailored to the active machine category.</li>
              <li><strong>Exploded View Slider:</strong> Disassembles housing and gears in real time to reveal internal bearings and pinion shafts.</li>
              <li><strong>Section View & Heatmap:</strong> Cross-section cut plane and thermal infrared color-coded surface representation.</li>
              <li><strong>Layer Visibility Toggles:</strong> Selectively isolate Housing, Shafts, Bearings, Gears, or Lubrication systems.</li>
              <li><strong>Custom 3D Upload:</strong> Drop your plant's custom binary `.glb` model into the stage for instant visualization.</li>
            </ul>
          </div>

          {/* Card 5: What-If Lab */}
          <div className="glass-panel rounded-[22px] p-5 space-y-3 border border-white/15 hover:border-[#00E599]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00E599]" />
                <span>What-If Lab (Physics Stress Simulation)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E599]/20 text-[#00E599]">SIMULATION</span>
            </div>
            <ul className="text-xs text-white/75 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Operational Stress Scenarios:</strong> Simulate heavy plant conditions (e.g. +20% to +40% motor load or speed fluctuations).</li>
              <li><strong>Lubrication Degradation:</strong> Evaluate the thermal and vibration consequences of thinning synthetic oil.</li>
              <li><strong>SKF Bearing L10h Life Impact:</strong> Forecasts remaining fatigue life reduction in running hours under simulated stress.</li>
            </ul>
          </div>

          {/* Card 6: Maintenance & Reports */}
          <div className="glass-panel rounded-[22px] p-5 space-y-3 border border-white/15 hover:border-[#FF5500]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#FF5500]" />
                <span>Maintenance & Reports (ISO 17359 Documentation)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF5500]/20 text-[#FF5500]">WORK ORDERS</span>
            </div>
            <ul className="text-xs text-white/75 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Actionable Work Orders:</strong> Prioritized technician task lists with tool requirements and safety considerations.</li>
              <li><strong>Audit History:</strong> Chronological log of past maintenance, lubrication oil sample lab tests, and laser alignment.</li>
              <li><strong>Diagnostic PDF Export:</strong> Generate standardized engineering reports ready for plant manager review.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
