/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ENGINEERING_KNOWLEDGE_BASE,
  INITIAL_MACHINES,
} from './data/sampleData';
import {
  KnowledgeDocument,
  MachineIntelligenceState,
  MachineProfile,
  SensorKey,
  SimulationResult,
  TimeSeriesPoint,
} from './models/types';
import { evaluateMachineIntelligence } from './ai/reasoningEngine';
import { DigitalTwin3D } from './components/DigitalTwin3D';
import { AICopilotPanel } from './components/AICopilotPanel';
import { SensorTrendChart } from './components/SensorTrendChart';
import { DiagnosticsView } from './components/DiagnosticsView';
import { SimulationView } from './components/SimulationView';
import { MachinesView } from './components/MachinesView';
import { KnowledgeView } from './components/KnowledgeView';
import { MaintenanceAndReportsView } from './components/MaintenanceAndReportsView';
import { AppGuideView } from './components/AppGuideView';
import { MechSynapseLogo } from './components/MechSynapseLogo';
import { generateDiagnosticPdfReport, generateAppUserGuidePdf } from './utils/pdfGenerator';
import { AmazonHubView } from './amazon/AmazonHubView';
import { FireTvExperience } from './amazon/firetv/FireTvExperience';
import {
  Activity,
  BookOpen,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Cpu,
  Download,
  FileText,
  GitBranch,
  LayoutGrid,
  Radio,
  Settings,
  Sliders,
  Sparkles,
  Wrench,
} from 'lucide-react';

export type NavSection =
  | 'overview'
  | 'machines'
  | 'diagnostics'
  | 'digital_twin'
  | 'simulation'
  | 'knowledge'
  | 'maintenance'
  | 'reports'
  | 'copilot'
  | 'guide'
  | 'amazon'
  | 'firetv';

const PRIMARY_OVERVIEW_SENSORS: SensorKey[] = [
  'temperature',
  'vibration',
  'rpm',
  'load',
  'pressure',
  'oilCondition',
];

export default function App() {
  const [machines, setMachines] = useState<MachineProfile[]>(INITIAL_MACHINES);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('GT-204');
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [selectedSensorKey, setSelectedSensorKey] = useState<SensorKey>('vibration');
  const [highlightedComponentId, setHighlightedComponentId] = useState<string | null>(
    'COMP-BRG-IN'
  );
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>(
    ENGINEERING_KNOWLEDGE_BASE
  );
  const [latestSimulation, setLatestSimulation] = useState<SimulationResult | undefined>(
    undefined
  );
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisBanner, setDiagnosisBanner] = useState<string | null>(null);

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id === selectedMachineId) || machines[0],
    [machines, selectedMachineId]
  );

  const diagnostics = useMemo(
    () => evaluateMachineIntelligence(selectedMachine),
    [selectedMachine]
  );

  const handleRunDiagnosis = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      setIsDiagnosing(false);
      const topIssue = diagnostics.rootCauseCandidates[0];
      setDiagnosisBanner(
        `AI Diagnostic Run Complete: Analyzed ${selectedMachine.sensors.length} sensor streams. Health State: ${diagnostics.intelligenceState} (${diagnostics.aiConfidence}% AI Confidence). Identified: ${topIssue?.failureMode || 'Nominal Baseline'} (${topIssue?.probabilityScore || 98}% confidence). Recommended: ${diagnostics.inspectionPlan[0]?.title || 'Standard Monitoring'}.`
      );
      setTimeout(() => setDiagnosisBanner(null), 8000);
    }, 600);
  };

  const handleUpdateMachine = (updated: MachineProfile) => {
    setMachines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleAddMachine = (newMachine: MachineProfile) => {
    setMachines((prev) => [...prev, newMachine]);
    setSelectedMachineId(newMachine.id);
  };

  const handleUpdateTimeSeries = (newSeries: TimeSeriesPoint[]) => {
    handleUpdateMachine({
      ...selectedMachine,
      timeSeries: newSeries,
    });
  };

  const handleAddKnowledgeDoc = (doc: KnowledgeDocument) => {
    setKnowledgeDocs((prev) => [doc, ...prev]);
  };

  const handleExportPdf = () => {
    generateDiagnosticPdfReport(
      selectedMachine,
      diagnostics,
      latestSimulation
    );
  };

  const handleCycleSensor = () => {
    const idx = PRIMARY_OVERVIEW_SENSORS.indexOf(selectedSensorKey);
    const nextIdx = (idx + 1) % PRIMARY_OVERVIEW_SENSORS.length;
    setSelectedSensorKey(PRIMARY_OVERVIEW_SENSORS[nextIdx]);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'firetv' || window.location.pathname.includes('firetv')) {
      setActiveNav('firetv');
    } else if (params.get('tab') === 'amazon') {
      setActiveNav('amazon');
    }
  }, []);

  const navItems: { id: NavSection; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'machines', label: 'Machines', icon: Settings },
    { id: 'diagnostics', label: 'Diagnostics', icon: GitBranch },
    { id: 'digital_twin', label: 'Digital Twin', icon: Box },
    { id: 'simulation', label: 'Simulation', icon: Sliders },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'copilot', label: 'AI Copilot', icon: Cpu },
  ];

  const stateOrder: MachineIntelligenceState[] = [
    'NORMAL',
    'WATCH',
    'INVESTIGATE',
    'CRITICAL',
  ];

  const currentStateIndex = stateOrder.indexOf(diagnostics.intelligenceState);

  return (
    <div className="relative min-h-screen teal-studio-backdrop text-white flex flex-col pb-1 sm:pb-2 overflow-x-hidden">
      {/* Industrial Machinery Factory Hall across the Full Background ("and bg ma right side che e full bg ma kar") */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden opacity-30 mix-blend-screen">
        <img
          src="/src/assets/images/bg_industrial_machinery_hall_1790838757667.jpg"
          alt="Industrial Machinery Factory Hall"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-85 contrast-125"
        />
        {/* Dark Industrial Base Overlay with Warm Amber/Orange Lighting */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E151E]/88 via-[#0A1017]/82 to-[#05080C]/94" />
        <div className="absolute -top-20 right-0 w-[55vw] h-[65vh] bg-gradient-to-bl from-[#FF8800]/16 via-[#FF5500]/7 to-transparent blur-[140px] pointer-events-none" />
      </div>

      {/* Main Workspace Layout - All blocks sit directly on background canvas (NO full enclosing block!) */}
      <div className="relative z-10 flex-1 flex flex-col max-w-[1680px] w-full mx-auto my-2 sm:my-4 px-3 sm:px-5 lg:px-7 tablet-scale-viewport">
        {/* =====================================================================
            SLIM TOP 3D BEVELED PILL BAR directly on background
            - Left/Center: Our Navigation Titles ("Home About Us Services Contact" style)
            - Right: Machine Selector + "Diagnostic PDF" + Glossy Electric Blue "What-If Lab" Pill
            ===================================================================== */}
        <header className="glass-top-pill-bar rounded-2xl md:rounded-full px-3.5 sm:px-4 xl:px-6 py-2 xl:py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 mb-4 sm:mb-6 shadow-xl">
          {/* Left / Center: Navigation Titles inside the slim top pill block */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'btn-indigo-primary text-white shadow-md'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: "Amazon Hub" + "Diagnostic PDF" + Glossy Electric Blue "What-If Lab" Pill */}
          <div className="flex items-center justify-end gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={() => setActiveNav('amazon')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap cursor-pointer transition-all border ${
                activeNav === 'amazon'
                  ? 'btn-indigo-primary text-white shadow-md'
                  : 'glass-subcard text-white/90 hover:text-white border-white/20'
              }`}
              title="Open Amazon Developer Hackathon 4-Track Hub"
            >
              <Cloud className="w-3.5 h-3.5 text-[#00D2FF]" />
              <span>Amazon Hub</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white/90 hover:text-white transition-colors whitespace-nowrap cursor-pointer rounded-full glass-subcard border border-white/20"
              title="Download Machine Diagnostic ISO 17359 Report PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#00D2FF]" />
              <span>Diagnostic PDF</span>
            </button>

            <button
              onClick={() => setActiveNav('simulation')}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 text-xs font-bold btn-signup-blue rounded-full whitespace-nowrap cursor-pointer shadow-lg"
            >
              <span>What-If Lab</span>
            </button>
          </div>
        </header>

        {/* =====================================================================
            MAIN WORKSPACE BODY directly on background canvas:
            - Single 3D MechMate AI Logo + 3D Embossed Name directly on background
            - All other cards arranged in 3D molded slate-teal glass directly on background
            ===================================================================== */}
        <main className="flex-1 min-w-0 overflow-y-auto">
            {activeNav === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 xl:gap-6 items-start">
                {/* LEFT COLUMN (4 Cols on MD & XL):
                    1. Single 3D MechMate AI Logo (Transparent PNG, No bottom padding)
                    2. "Choose telemetry channel" 3D Molded Glass Block
                    3. Bottom-Left Squircle Badge Card */}
                <div className="md:col-span-4 xl:col-span-4 flex flex-col gap-3">
                  {/* Single Side Logo with Name (MechMate AI, Transparent PNG) - Positioned nicely aligned to the left */}
                  <div className="w-full px-1 pt-0.5 pb-1 flex items-center justify-center -translate-x-1 sm:-translate-x-2">
                    <MechSynapseLogo className="w-full max-w-[240px] md:max-w-[280px] xl:max-w-[340px]" showWordmark heroSize showGlow />
                  </div>

                  {/* Machine Selector directly UNDER the Logo */}
                  <div className="glass-panel rounded-[22px] p-4 space-y-2.5 border border-[#00D2FF]/30 shadow-xl">
                    <div className="flex items-center justify-between text-xs font-mono text-white/80 px-0.5">
                      <span className="font-bold tracking-wider uppercase text-[#00D2FF] flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-[#00D2FF]" />
                        <span>SELECT INDUSTRIAL MACHINE</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/30">
                        {selectedMachine.category}
                      </span>
                    </div>

                    <div className="relative">
                      <select
                        value={selectedMachine.id}
                        onChange={(e) => setSelectedMachineId(e.target.value)}
                        aria-label="Select Industrial Machine"
                        className="w-full glass-input text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 cursor-pointer text-white bg-[#0A1A28]/95 border border-[#00D2FF]/40 focus:border-[#00E599] transition-all shadow-inner"
                      >
                        {machines.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#0A1826] text-white py-2">
                            {m.name} ({m.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-white/70 px-1 pt-0.5">
                      <span className="truncate max-w-[170px] sm:max-w-[210px]">{selectedMachine.location}</span>
                      <span className="font-mono text-[#00D2FF] shrink-0 font-semibold">{selectedMachine.ratedPowerKw} kW · {selectedMachine.inputSpeedRpm} RPM</span>
                    </div>
                  </div>

                  {/* 2. "Choose telemetry channel" 3D Molded Glass Card */}
                  <div className="relative glass-panel rounded-[26px] p-5 pb-7 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base xl:text-lg font-bold text-white leading-tight">
                        Choose
                        <br />
                        telemetry channel
                      </h2>
                      <span className="text-xs font-mono font-bold text-[#00D2FF]">
                        {selectedMachine.code}
                      </span>
                    </div>

                    {/* Pill Stack: Active = Electric Cyan/Royal Blue Pill, Inactive = Deep Dark Navy-Slate Pill */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 md:gap-0 md:space-y-2.5">
                      {PRIMARY_OVERVIEW_SENSORS.map((key) => {
                        const st = diagnostics.sensorStats[key];
                        if (!st) return null;
                        const isSelected = selectedSensorKey === key;

                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedSensorKey(key)}
                            className={`w-full flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 rounded-full text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'indigo-feature-block'
                                : 'glass-subcard'
                            }`}
                          >
                            <span className="text-xs xl:text-sm font-bold text-white truncate">
                              {st.label.replace('DE ', '').replace('Sump ', '')}
                            </span>
                            <div className="flex items-center gap-1.5 md:gap-2.5 font-mono text-[11px] md:text-xs shrink-0">
                              <span className="font-bold text-white">
                                {st.currentValue} {st.unit}
                              </span>
                              <span
                                className={`text-[10px] md:text-[11px] px-1.5 md:px-2 py-0.5 rounded-full font-semibold ${
                                  isSelected
                                    ? 'bg-white/25 text-white'
                                    : st.isAnomalous
                                    ? 'bg-[#FF8800]/25 text-[#FFB020]'
                                    : 'bg-[#00E599]/20 text-[#00E599]'
                                }`}
                              >
                                {st.deviationPercent >= 0 ? '+' : ''}
                                {st.deviationPercent}%
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Floating Circular Cyan-Blue Chevron Button at Bottom Edge */}
                    <button
                      onClick={handleCycleSensor}
                      title="Cycle to Next Telemetry Channel"
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full btn-indigo-primary flex items-center justify-center cursor-pointer shadow-lg"
                    >
                      <ChevronDown className="w-4 h-4 text-white stroke-[2.5]" />
                    </button>
                  </div>

                  {/* 3. Bottom-Left Squircle Badge Card */}
                  <div className="relative glass-panel rounded-[22px] p-3.5 pr-7 flex items-center gap-3 mt-1">
                    {/* Rounded Squircle Electric Cyan Badge on the Left */}
                    <div className="w-14 h-14 rounded-2xl indigo-feature-block flex flex-col items-center justify-center shrink-0 text-center shadow-lg">
                      <span className="text-lg font-extrabold text-white font-mono leading-none">
                        {diagnostics.aiConfidence}%
                      </span>
                      <span className="text-[10px] font-semibold text-white/90 mt-0.5">
                        Confidence
                      </span>
                    </div>

                    {/* Title & Subtitle Text */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white leading-tight">
                        Upcoming inspection
                      </div>
                      <div className="text-[11px] text-white/85 mt-0.5 truncate">
                        {diagnostics.inspectionPlan[0]?.title || 'Inspect DE Bearing & Oil'}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#00D2FF]">
                        <span>Margin: {diagnostics.operatingMargin}%</span>
                        <span>·</span>
                        <span>Risk: {diagnostics.prototypeRiskScore}/100</span>
                      </div>
                    </div>

                    {/* Floating Circular Cyan-Blue ">" Button on the Right Edge */}
                    <button
                      onClick={() => setActiveNav('maintenance')}
                      title="Open Inspection & Maintenance Plan"
                      className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full btn-indigo-primary flex items-center justify-center cursor-pointer shadow-lg"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* CENTER / RIGHT STAGE (8 Cols on MD & XL):
                    1. Intelligence State Pills & 4 Compact Indicators Block
                    2. Interactive 3D GLB/GLTF Digital Twin + Waveform Trend
                    3. MechMate AI Engineering Copilot Panel */}
                <div className="md:col-span-8 xl:col-span-8 flex flex-col gap-4 xl:gap-6">
                  {/* Comprehensive English Engineering Guide Banner */}
                  <div className="glass-panel rounded-2xl p-3.5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[#00D2FF]/40 bg-gradient-to-r from-[#07192A]/95 via-[#0A2234]/95 to-[#072422]/95 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#00D2FF]/25 to-[#00E599]/25 border border-[#00E599]/50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#00E599]" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-2">
                          <span>MechMate AI — Platform Architecture & User Guide</span>
                          <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40 font-mono">
                            PDF AVAILABLE
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-white/70">
                          Complete operational workflows, ISO 20816 physics equations, and 3D digital twin manual.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setActiveNav('guide')}
                        className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-full glass-subcard text-xs font-bold text-white hover:text-[#00D2FF] border border-white/20 hover:border-[#00D2FF]/50 transition-all cursor-pointer whitespace-nowrap text-center"
                      >
                        Read On-Screen →
                      </button>
                      <button
                        onClick={generateAppUserGuidePdf}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold text-[#06151B] bg-gradient-to-r from-[#00E599] to-[#00D2FF] hover:brightness-110 shadow-[0_0_16px_rgba(0,229,153,0.5)] transition-all cursor-pointer font-['Outfit'] whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5 text-[#06151B]" />
                        <span>Download Guide PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Top Intelligence State & 4 Compact Indicators Card */}
                  <div className="glass-panel rounded-[26px] p-4 sm:p-5 space-y-3.5 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 text-xs font-mono text-white/90">
                        <Sparkles className="w-4 h-4 text-[#00E599] shrink-0" />
                        <span className="font-bold tracking-wider uppercase text-white truncate">
                          MECHMATE AI HEALTH STATE · {selectedMachine.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleRunDiagnosis}
                          disabled={isDiagnosing}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full btn-signup-blue text-xs font-bold text-white cursor-pointer shadow-lg disabled:opacity-75"
                          title="Run automated multi-agent physics and telemetry diagnostic evaluation"
                        >
                          <Activity
                            className={`w-3.5 h-3.5 text-white ${
                              isDiagnosing ? 'animate-spin' : 'animate-pulse'
                            }`}
                          />
                          <span>{isDiagnosing ? 'Diagnosing...' : 'Run AI Diagnosis'}</span>
                        </button>
                        <button
                          onClick={() => setActiveNav('diagnostics')}
                          className="px-3.5 py-1.5 rounded-full glass-subcard text-xs font-bold text-white cursor-pointer hover:text-[#00D2FF]"
                        >
                          Causal Graph →
                        </button>
                        <button
                          onClick={() => setActiveNav('digital_twin')}
                          className="px-3.5 py-1.5 rounded-full btn-indigo-primary text-xs font-bold text-white cursor-pointer"
                        >
                          Full 3D Twin →
                        </button>
                      </div>
                    </div>

                    {/* Live AI Diagnosis Feedback Banner */}
                    {diagnosisBanner && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#00D2FF]/20 via-[#0A50E2]/25 to-[#00E599]/20 border border-[#00D2FF]/50 text-xs text-white shadow-xl animate-fadeIn">
                        <Activity className="w-4 h-4 text-[#00E599] shrink-0 animate-pulse" />
                        <span className="flex-1 font-mono font-medium leading-relaxed">
                          {diagnosisBanner}
                        </span>
                        <button
                          onClick={() => setDiagnosisBanner(null)}
                          className="text-white/60 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* 4 State Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                      {stateOrder.map((st, idx) => {
                        const isCurrent = diagnostics.intelligenceState === st;
                        const isPassed = idx <= currentStateIndex;
                        return (
                          <div
                            key={st}
                            className={`flex items-center justify-between px-3 sm:px-4 py-2 rounded-full text-xs font-bold tracking-wider ${
                              isCurrent
                                ? 'indigo-feature-block'
                                : 'glass-subcard text-white/85'
                            }`}
                          >
                            <span className="truncate">{st}</span>
                            <span
                              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 ml-1.5 ${
                                isCurrent
                                  ? 'bg-white text-[#0A50E2]'
                                  : isPassed
                                  ? 'bg-[#00D2FF]/40 text-white'
                                  : 'bg-white/10 text-white/40'
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 4 Compact Intelligent Indicators Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 font-mono pt-1">
                      {[
                        {
                          label: 'AI CONFIDENCE',
                          value: `${diagnostics.aiConfidence}%`,
                          sub: 'Multi-Agent Consensus',
                        },
                        {
                          label: 'SENSOR AGREEMENT',
                          value: `${diagnostics.sensorAgreement}%`,
                          sub: 'Cross-Channel Coherence',
                        },
                        {
                          label: 'TREND STABILITY',
                          value: `${diagnostics.trendStability}%`,
                          sub: '12h Rolling Slope',
                        },
                        {
                          label: 'OPERATING MARGIN',
                          value: `${diagnostics.operatingMargin}%`,
                          sub: `Max Temp ${selectedMachine.limits.maxTemperatureC}°C`,
                        },
                      ].map((ind) => (
                        <div
                          key={ind.label}
                          className="glass-subcard rounded-2xl px-3 sm:px-3.5 py-2 sm:py-2.5"
                        >
                          <div className="text-[10px] text-white/75 truncate">{ind.label}</div>
                          <div className="text-base font-bold text-white mt-0.5">
                            {ind.value}
                          </div>
                          <div className="text-[10px] text-white/70 truncate">
                            {ind.sub}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive 3D GLB/GLTF Digital Twin + Right AI Copilot Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6">
                    {/* Left Sub-Column (7 cols): 3D Digital Twin + Live Telemetry Waveform */}
                    <div className="lg:col-span-7 flex flex-col gap-4 xl:gap-6">
                      {/* 3D GLB/GLTF Machinery Viewport (100% unobstructed, zero side block overlap) */}
                      <div className="h-[320px] sm:h-[380px] md:h-[400px] xl:h-[460px]">
                        <DigitalTwin3D
                          key={selectedMachine.id}
                          machine={selectedMachine}
                          diagnostics={diagnostics}
                          selectedSensorKey={selectedSensorKey}
                          onSelectSensor={(k) => setSelectedSensorKey(k)}
                          highlightedComponentId={highlightedComponentId}
                          onSelectComponent={(cid) => setHighlightedComponentId(cid)}
                        />
                      </div>

                      {/* Live Telemetry Waveform Card */}
                      <div className="glass-panel rounded-[26px] p-3.5 sm:p-4">
                        <SensorTrendChart
                          series={selectedMachine.timeSeries}
                          selectedKey={selectedSensorKey}
                          stat={diagnostics.sensorStats[selectedSensorKey]}
                          warningThreshold={
                            selectedMachine.sensors.find((s) => s.key === selectedSensorKey)
                              ?.warningThreshold
                          }
                          criticalThreshold={
                            selectedMachine.sensors.find((s) => s.key === selectedSensorKey)
                              ?.criticalThreshold
                          }
                          height={185}
                        />
                      </div>
                    </div>

                    {/* Right Sub-Column (5 cols): MechMate AI Engineering Copilot Panel */}
                    <div className="lg:col-span-5 h-[520px] sm:h-[600px] md:h-[640px] xl:h-[710px]">
                      <AICopilotPanel
                        machine={selectedMachine}
                        diagnostics={diagnostics}
                        knowledgeDocs={knowledgeDocs}
                        latestSimulation={latestSimulation}
                        onHighlightComponent={(cid) => setHighlightedComponentId(cid)}
                        onNavigateTab={(tab) => setActiveNav(tab as NavSection)}
                        onGeneratePdf={handleExportPdf}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeNav !== 'overview' && (
              <div className="space-y-5">
                {/* Single Side Logo + Name Header Strip when viewing sub-tabs so the brand is still only on the left side */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveNav('overview')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveNav('overview');
                      }
                    }}
                    className="flex items-center text-left cursor-pointer group select-none"
                    title="Return to Overview"
                  >
                    <MechSynapseLogo className="w-full max-w-[170px]" heroSize showGlow />
                  </div>
                  <div className="text-xs font-mono text-white/85">
                    ACTIVE MACHINE: <span className="font-bold text-white">{selectedMachine.name}</span> ({selectedMachine.code})
                  </div>
                </div>

                {activeNav === 'machines' && (
                  <MachinesView
                    machines={machines}
                    selectedMachine={selectedMachine}
                    diagnostics={diagnostics}
                    onSelectMachine={(id) => setSelectedMachineId(id)}
                    onUpdateMachine={handleUpdateMachine}
                    onAddMachine={handleAddMachine}
                  />
                )}

                {activeNav === 'diagnostics' && (
                  <DiagnosticsView
                    machine={selectedMachine}
                    diagnostics={diagnostics}
                    selectedSensorKey={selectedSensorKey}
                    onSelectSensor={(k) => setSelectedSensorKey(k)}
                    onUpdateTimeSeries={handleUpdateTimeSeries}
                    onHighlightComponent={(cid) => setHighlightedComponentId(cid)}
                  />
                )}

                {activeNav === 'digital_twin' && (
                  <div className="space-y-5">
                    <div className="glass-panel-elevated rounded-[26px] p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-mono text-[#00D2FF]">
                          MECHMATE AI INTERACTIVE 3D DIGITAL MACHINE MODEL
                        </div>
                        <h2 className="text-base font-bold text-white mt-0.5">
                          {selectedMachine.name} — Parametric CAD & GLB/GLTF Topology
                        </h2>
                        <p className="text-xs text-white/85">
                          Toggle Housing, Shafts, Bearings, Gears, Lubrication, and Thermal Zones. Load or export binary .GLB 3D machinery assets directly.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveNav('machines')}
                        className="px-4 py-2.5 text-xs font-mono font-bold btn-indigo-primary rounded-full cursor-pointer"
                      >
                        Edit CAD Dimensions ({selectedMachine.dimensions.housingLengthMm}×
                        {selectedMachine.dimensions.housingWidthMm}×
                        {selectedMachine.dimensions.housingHeightMm} mm) →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-8 h-[580px]">
                        <DigitalTwin3D
                          key={`full-${selectedMachine.id}`}
                          machine={selectedMachine}
                          diagnostics={diagnostics}
                          selectedSensorKey={selectedSensorKey}
                          onSelectSensor={(k) => setSelectedSensorKey(k)}
                          highlightedComponentId={highlightedComponentId}
                          onSelectComponent={(cid) => setHighlightedComponentId(cid)}
                        />
                      </div>

                      {/* Component Isolation & Physical Assembly Tree */}
                      <div className="lg:col-span-4 glass-panel rounded-[26px] p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-3.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-white">
                              Component & Sensor Hierarchy
                            </span>
                            <span className="text-[11px] font-mono text-[#00D2FF]">
                              {selectedMachine.components.length} ASSEMBLIES
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {selectedMachine.components.map((comp) => {
                              const isHigh = highlightedComponentId === comp.id;
                              return (
                                <button
                                  key={comp.id}
                                  onClick={() =>
                                    setHighlightedComponentId(isHigh ? null : comp.id)
                                  }
                                  className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer ${
                                    isHigh
                                      ? 'indigo-feature-block'
                                      : 'glass-subcard'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-white/80">{comp.partNumber}</span>
                                    <span
                                      className={
                                        comp.status === 'DEGRADED' || comp.status === 'CRITICAL'
                                          ? 'text-[#FF8800] font-bold'
                                          : 'text-[#00E599]'
                                      }
                                    >
                                      {comp.status}
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-white mt-0.5">
                                    {comp.name}
                                  </div>
                                  <div className="text-[11px] text-white/80 mt-0.5">
                                    {comp.material}
                                  </div>
                                  <p className="text-[11px] text-white/90 mt-1.5 border-t border-white/15 pt-1.5">
                                    {comp.notes}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeNav === 'simulation' && (
                  <SimulationView
                    machine={selectedMachine}
                    diagnostics={diagnostics}
                    onSimulationUpdate={(sim) => setLatestSimulation(sim)}
                  />
                )}

                {activeNav === 'knowledge' && (
                  <KnowledgeView
                    documents={knowledgeDocs}
                    onAddDocument={handleAddKnowledgeDoc}
                  />
                )}

                {activeNav === 'maintenance' && (
                  <MaintenanceAndReportsView
                    machine={selectedMachine}
                    diagnostics={diagnostics}
                    latestSimulation={latestSimulation}
                    mode="maintenance"
                    onHighlightComponent={(cid) => setHighlightedComponentId(cid)}
                  />
                )}

                {activeNav === 'reports' && (
                  <MaintenanceAndReportsView
                    machine={selectedMachine}
                    diagnostics={diagnostics}
                    latestSimulation={latestSimulation}
                    mode="reports"
                    onHighlightComponent={(cid) => setHighlightedComponentId(cid)}
                  />
                )}

                {activeNav === 'copilot' && (
                  <AICopilotPanel
                    machine={selectedMachine}
                    diagnostics={diagnostics}
                    knowledgeDocs={knowledgeDocs}
                    latestSimulation={latestSimulation}
                    onHighlightComponent={(cid) => setHighlightedComponentId(cid)}
                    onNavigateTab={(tab) => setActiveNav(tab as NavSection)}
                    onGeneratePdf={handleExportPdf}
                    fullPageMode={true}
                  />
                )}

                {activeNav === 'guide' && <AppGuideView />}
                {activeNav === 'amazon' && <AmazonHubView />}
                {activeNav === 'firetv' && (
                  <FireTvExperience onExit={() => setActiveNav('amazon')} />
                )}
              </div>
            )}
          </main>

        {/* Engineering Reliability Disclaimer Footer - Slim & Low Height */}
        <footer className="mt-1 mb-0 py-0.5 px-2 text-center border-t border-white/10 text-[11px] sm:text-xs font-mono text-white/65 tracking-tight select-none leading-tight">
          MechMate AI can make mistakes. Check and <span className="font-bold text-[#00D2FF]">VERIFY CRITICAL ENGINEERING DECISIONS WITH CERTIFIED ANALYSIS</span>.
        </footer>
      </div>
    </div>
  );
}
