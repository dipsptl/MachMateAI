import React, { useState } from 'react';
import {
  DiagnosticSummary,
  MachineProfile,
  RootCauseNode,
  SensorKey,
  TimeSeriesPoint,
} from '../models/types';
import {
  PresetScenarioId,
  generateSampleCsvContent,
  generateTimeSeriesForScenario,
} from '../data/sampleData';
import { parseUploadedSensorCsv } from '../ml/sensorIntelligence';
import { SensorTrendChart } from './SensorTrendChart';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Download,
  FileSpreadsheet,
  GitBranch,
  Layers,
  ShieldAlert,
  Sparkles,
  Upload,
} from 'lucide-react';

interface DiagnosticsViewProps {
  machine: MachineProfile;
  diagnostics: DiagnosticSummary;
  selectedSensorKey: SensorKey;
  onSelectSensor: (key: SensorKey) => void;
  onUpdateTimeSeries: (newSeries: TimeSeriesPoint[], label?: string) => void;
  onHighlightComponent: (componentId: string | null) => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  machine,
  diagnostics,
  selectedSensorKey,
  onSelectSensor,
  onUpdateTimeSeries,
  onHighlightComponent,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    diagnostics.causalGraph[diagnostics.causalGraph.length - 1]?.id || 'NODE-VIBRATION'
  );
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<PresetScenarioId>(
    'bearing_lubrication_degradation'
  );

  const activeNode: RootCauseNode =
    diagnostics.causalGraph.find((n) => n.id === selectedNodeId) ||
    diagnostics.causalGraph[0];

  const handleScenarioSwitch = (scen: PresetScenarioId) => {
    setActiveScenario(scen);
    const pts = generateTimeSeriesForScenario(scen, machine.inputSpeedRpm, 48);
    onUpdateTimeSeries(pts, scen);
    setCsvFeedback(`Loaded 48-hour telemetry pattern: ${scen.replace(/_/g, ' ')}.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = String(evt.target?.result || '');
        const parsed = parseUploadedSensorCsv(text, machine);
        onUpdateTimeSeries(parsed.points, file.name);
        setCsvFeedback(
          `Ingested ${parsed.points.length} rows from ${file.name}. Mapped: ${parsed.detectedColumns
            .slice(0, 4)
            .join(', ')}${parsed.warnings.length ? ` (${parsed.warnings[0]})` : ''}`
        );
      } catch (err) {
        setCsvFeedback(
          `CSV Error: ${err instanceof Error ? err.message : 'Unable to parse CSV file.'}`
        );
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const csv = generateSampleCsvContent(machine.timeSeries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${machine.code}_sensor_telemetry.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. AI-First Reasoning Architecture Pipeline Banner */}
      <div className="glass-panel-elevated rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-[#F6F1E5]">
              CuraAI Perception & Engineering Reasoning Pipeline
            </h2>
            <p className="text-xs text-[#DCE5EC]">
              Predict · Prevent · Protect — Observe → Understand → Reason → Simulate → Recommend → Explain
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-[#DCE5EC]">
              Prototype Diagnostic Risk Estimate:{' '}
              <strong className="text-[#5CE1E6]">{diagnostics.prototypeRiskScore}/100</strong>{' '}
              [ESTIMATED]
            </span>
            <span className="text-[#DCE5EC]">·</span>
            <span className="text-[#19A7CE] font-semibold">
              AI Confidence: {diagnostics.aiConfidence}%
            </span>
          </div>
        </div>

        {/* Pipeline Flow Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {[
            {
              stage: '01. OBSERVE',
              title: 'Machine Signals',
              detail: `8 Channels · ${machine.timeSeries.length}h Window`,
              tag: 'MEASURED',
            },
            {
              stage: '02. PERCEIVE',
              title: 'Anomaly Engine',
              detail: `${
                Object.values(diagnostics.sensorStats).filter((s) => s.isAnomalous).length
              } Channels Flagged`,
              tag: 'Z-SCORE + CORR',
            },
            {
              stage: '03. UNDERSTAND',
              title: 'Physics & Models',
              detail: `T_out = ${diagnostics.calculations.outputTorqueNm} Nm · Q = ${diagnostics.calculations.heatLossKw} kW`,
              tag: 'ESTIMATED',
            },
            {
              stage: '04. REASON',
              title: 'Causal Graph',
              detail: `${diagnostics.causalGraph.length} Linked Physical Nodes`,
              tag: 'DAG ENGINE',
            },
            {
              stage: '05. RETRIEVE',
              title: 'Knowledge RAG',
              detail: 'SKF 22214 + ISO 20816',
              tag: 'EVIDENCE',
            },
            {
              stage: '06. RECOMMEND',
              title: 'Inspection Plan',
              detail: `Priority 1: ${diagnostics.inspectionPlan[0]?.urgency}`,
              tag: 'ACTIONABLE',
            },
          ].map((item) => (
            <div
              key={item.stage}
              className="glass-subcard rounded-xl p-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#EAE3D2]/90">
                <span>{item.stage}</span>
                <span className="text-[#5CE1E6] font-semibold">{item.tag}</span>
              </div>
              <div className="text-xs font-semibold text-[#F6F1E5] mt-1.5">
                {item.title}
              </div>
              <div className="text-[11px] font-mono text-[#EAE3D2]/85 mt-0.5 truncate">
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Interactive Root-Cause Causal Graph + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Causal Chain Graph */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#19A7CE]" />
                <h3 className="text-sm font-semibold text-[#F6F1E5]">
                  Root-Cause Causal Graph
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#EAE3D2]/85">
                Click any node to inspect evidence
              </span>
            </div>

            <div className="space-y-1.5">
              {diagnostics.causalGraph.map((node, index) => {
                const isSelected = node.id === activeNode.id;
                return (
                  <React.Fragment key={node.id}>
                    <button
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        onHighlightComponent(node.componentId);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'glass-panel-elevated glass-cyan-glow'
                          : 'glass-subcard hover:border-[#5CE1E6]/55'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#EAE3D2]/90">
                          <span>STEP 0{index + 1}</span>
                          <span>·</span>
                          <span className="text-[#5CE1E6] font-semibold">{node.category}</span>
                        </div>
                        <div className="text-xs font-semibold text-[#F6F1E5] mt-0.5">
                          {node.title}
                        </div>
                        <div className="text-xs font-mono text-[#5CE1E6] mt-0.5 truncate">
                          {node.parameterChange}
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <div className="text-[10px] text-[#EAE3D2]/85">CONFIDENCE</div>
                        <div className="text-xs font-semibold text-[#F6F1E5]">
                          {node.confidence}%
                        </div>
                      </div>
                    </button>

                    {index < diagnostics.causalGraph.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown className="w-3.5 h-3.5 text-[#19A7CE]" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Selected Causal Node Engineering Deep-Dive */}
        <div className="lg:col-span-7 glass-panel-elevated rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#19A7CE]/35">
              <div>
                <div className="text-[11px] font-mono text-[#5CE1E6] font-semibold">
                  CAUSAL NODE INSPECTOR · {activeNode.id}
                </div>
                <h3 className="text-base font-semibold text-[#F6F1E5] mt-0.5">
                  {activeNode.title} — {activeNode.parameterChange}
                </h3>
              </div>
              <div className="font-mono text-xs text-[#5CE1E6] font-semibold">
                Node Confidence: {activeNode.confidence}%
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="text-xs font-mono uppercase text-[#EAE3D2]/85 mb-1">
                  Why This Matters
                </div>
                <p className="text-sm text-[#F6F1E5] leading-relaxed">
                  {activeNode.whyItMatters}
                </p>
              </div>

              <div>
                <div className="text-xs font-mono uppercase text-[#EAE3D2]/85 mb-1.5">
                  Available Sensor & Model Evidence
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeNode.sensorEvidence.map((ev) => (
                    <div
                      key={ev.sensorLabel}
                      className="glass-subcard rounded-xl p-3 font-mono"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#EAE3D2]/90">
                        <span>{ev.sensorLabel}</span>
                        <span className="text-[#5CE1E6] font-semibold">[{ev.origin}]</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-base font-semibold text-[#F6F1E5]">
                          {ev.valueStr}
                        </span>
                        <span className="text-xs text-[#5CE1E6] font-semibold">{ev.deltaStr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-mono uppercase text-[#EAE3D2]/85 mb-1">
                  Supporting Evidence Observations
                </div>
                <ul className="space-y-1 text-xs text-[#F6F1E5]/95">
                  {activeNode.supportingEvidence.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#5CE1E6] font-mono">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-subcard rounded-xl p-3.5">
                <div className="text-xs font-mono uppercase text-[#5CE1E6] mb-1">
                  Engineering Physics Explanation
                </div>
                <p className="text-xs sm:text-sm text-[#F6F1E5] leading-relaxed">
                  {activeNode.engineeringExplanation}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#19A7CE]/35 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono text-[#5CE1E6] uppercase font-semibold">
                Recommended Inspection Action
              </div>
              <div className="text-xs sm:text-sm font-medium text-[#F6F1E5] mt-0.5">
                {activeNode.recommendedInspection}
              </div>
            </div>
            <span className="text-xs font-mono text-[#EAE3D2]/85">
              Target Component: {activeNode.componentId}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Root-Cause Candidates Matrix (Supporting vs Contradicting Signals) */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#F6F1E5]">
              Failure-Mode Candidates & Diagnostic Evidence Matrix
            </h3>
            <p className="text-xs text-[#EAE3D2]/85">
              Evaluates both supporting and contradicting signals to avoid over-confident black-box predictions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {diagnostics.rootCauseCandidates.map((rc) => (
            <div
              key={rc.id}
              onClick={() => onHighlightComponent(rc.componentId)}
              className="glass-subcard rounded-xl p-4 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono text-[#EAE3D2]/90">
                    {rc.component} · URGENCY: <span className="text-[#5CE1E6] font-semibold">{rc.urgency}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#F6F1E5] mt-0.5">
                    {rc.failureMode}
                  </h4>
                </div>
                <div className="text-right font-mono shrink-0">
                  <div className="text-[10px] text-[#EAE3D2]/85">CONFIDENCE</div>
                  <div className="text-sm font-semibold text-[#5CE1E6]">
                    {rc.probabilityScore}%
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#EAE3D2]/90 mt-2 leading-relaxed">
                {rc.engineeringMechanism}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#F6F1E5]/15 text-xs">
                <div>
                  <div className="text-[10px] font-mono text-[#5CE1E6] uppercase mb-1">
                    Supporting Signals
                  </div>
                  <ul className="space-y-1 text-[#F6F1E5]/95 text-[11px]">
                    {rc.supportingSignals.map((s, idx) => (
                      <li key={idx}>+ {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#EAE3D2]/80 uppercase mb-1">
                    Contradicting / Bounding Signals
                  </div>
                  <ul className="space-y-1 text-[#EAE3D2]/85 text-[11px]">
                    {rc.contradictingSignals.map((s, idx) => (
                      <li key={idx}>− {s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#F6F1E5]/15 text-xs">
                <span className="font-mono text-[11px] text-[#5CE1E6] font-semibold">NEXT ACTION: </span>
                <span className="text-[#F6F1E5]">{rc.recommendedAction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Sensor Intelligence, Statistical Feature Table & CSV Telemetry Loader */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#F6F1E5]">
              Sensor Intelligence & Statistical Anomaly Detection [MEASURED]
            </h3>
            <p className="text-xs text-[#EAE3D2]/85">
              Rolling 12h mean/std, Z-score distance, linear slope rate-of-change, and Pearson load/thermal correlation.
            </p>
          </div>

          {/* Preset Scenarios + CSV Upload/Download Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeScenario}
              onChange={(e) => handleScenarioSwitch(e.target.value as PresetScenarioId)}
              className="glass-input text-xs font-mono text-[#F6F1E5] rounded-lg px-2.5 py-1.5"
            >
              <option value="bearing_lubrication_degradation" className="bg-[#081F32] text-[#F6F1E5]">
                Scenario: Bearing & Lube Degradation (Default)
              </option>
              <option value="normal_baseline" className="bg-[#081F32] text-[#F6F1E5]">
                Scenario: Healthy Baseline (Nominal)
              </option>
              <option value="thermal_overload" className="bg-[#081F32] text-[#F6F1E5]">
                Scenario: Severe Thermal Overload
              </option>
              <option value="shaft_misalignment" className="bg-[#081F32] text-[#F6F1E5]">
                Scenario: Shaft Misalignment
              </option>
            </select>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium glass-subcard text-[#F6F1E5] rounded-lg cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-[#19A7CE]" />
              <span>Upload CSV</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleDownloadSampleCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium glass-subcard text-[#F6F1E5] rounded-lg cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#19A7CE]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {csvFeedback && (
          <div className="px-3 py-2 glass-subcard border border-[#19A7CE]/65 rounded-lg text-xs font-mono text-[#F6F1E5]">
            {csvFeedback}
          </div>
        )}

        {/* Interactive Chart for Selected Channel */}
        <div className="p-3.5 glass-subcard rounded-xl">
          <SensorTrendChart
            series={machine.timeSeries}
            selectedKey={selectedSensorKey}
            stat={diagnostics.sensorStats[selectedSensorKey]}
            warningThreshold={
              machine.sensors.find((s) => s.key === selectedSensorKey)?.warningThreshold
            }
            criticalThreshold={
              machine.sensors.find((s) => s.key === selectedSensorKey)?.criticalThreshold
            }
            height={210}
          />
        </div>

        {/* High-Density Statistical Feature Engineering Table */}
        <div className="overflow-x-auto glass-subcard rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#092032]/55 border-b border-[#19A7CE]/35 text-[11px] font-mono text-[#EAE3D2]">
                <th className="py-2.5 px-3">SENSOR CHANNEL</th>
                <th className="py-2.5 px-3 text-right">MEASURED</th>
                <th className="py-2.5 px-3 text-right">BASELINE</th>
                <th className="py-2.5 px-3 text-right">12H MEAN ± STD</th>
                <th className="py-2.5 px-3 text-right">Z-SCORE</th>
                <th className="py-2.5 px-3 text-right">RATE / HR</th>
                <th className="py-2.5 px-3 text-right">CORR (LOAD / TEMP)</th>
                <th className="py-2.5 px-3 text-right">ANOMALY SCORE</th>
                <th className="py-2.5 px-3">STATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6F1E5]/15 text-xs font-mono">
              {Object.values(diagnostics.sensorStats).map((st) => {
                const isSelected = st.key === selectedSensorKey;
                return (
                  <tr
                    key={st.key}
                    onClick={() => onSelectSensor(st.key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#19A7CE]/25' : 'hover:bg-[#F6F1E5]/10'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans font-medium text-[#F6F1E5]">
                      {st.label}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#F6F1E5]">
                      {st.currentValue} {st.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#EAE3D2]/85">
                      {st.baselineMean} {st.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#EAE3D2]/85">
                      {st.rollingMean12h} ± {st.rollingStd12h}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        Math.abs(st.zScore) >= 2.5 ? 'text-[#5CE1E6] font-semibold' : 'text-[#EAE3D2]/85'
                      }`}
                    >
                      {st.zScore >= 0 ? '+' : ''}
                      {st.zScore}σ
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#EAE3D2]/85">
                      {st.rateOfChangePerHour >= 0 ? '+' : ''}
                      {st.rateOfChangePerHour}/h
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#EAE3D2]/85">
                      {st.correlationWithLoad} / {st.correlationWithTemp}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#F6F1E5]">
                      {st.anomalyScore}/100
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          st.severity === 'CRITICAL'
                            ? 'text-[#FF887A] font-semibold'
                            : st.severity === 'INVESTIGATE' || st.severity === 'WATCH'
                            ? 'text-[#5CE1E6] font-semibold'
                            : 'text-[#19A7CE]'
                        }
                      >
                        {st.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
