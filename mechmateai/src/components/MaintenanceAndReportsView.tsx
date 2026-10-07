import React, { useState } from 'react';
import {
  DiagnosticSummary,
  MachineProfile,
  SimulationResult,
} from '../models/types';
import { generateDiagnosticPdfReport } from '../utils/pdfGenerator';
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  ShieldAlert,
  Wrench,
} from 'lucide-react';

interface MaintenanceAndReportsViewProps {
  machine: MachineProfile;
  diagnostics: DiagnosticSummary;
  latestSimulation?: SimulationResult;
  mode: 'maintenance' | 'reports';
  onHighlightComponent?: (componentId: string | null) => void;
}

export const MaintenanceAndReportsView: React.FC<MaintenanceAndReportsViewProps> = ({
  machine,
  diagnostics,
  latestSimulation,
  mode,
  onHighlightComponent,
}) => {
  const [completedPriorities, setCompletedPriorities] = useState<Record<number, boolean>>({});
  const [engineerNotes, setEngineerNotes] = useState<string>(
    'Scheduled borescope and oil sample collection during next shift handover. Monitor DE bearing temperature alarm at 80°C.'
  );
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string>(
    new Date().toISOString()
  );

  const togglePriorityDone = (priority: number) => {
    setCompletedPriorities((prev) => ({ ...prev, [priority]: !prev[priority] }));
  };

  const handleGeneratePdf = () => {
    setReportGeneratedAt(new Date().toISOString());
    generateDiagnosticPdfReport(machine, diagnostics, latestSimulation, engineerNotes);
  };

  if (mode === 'maintenance') {
    return (
      <div className="space-y-6">
        {/* Maintenance Intelligence Header */}
        <div className="glass-panel-elevated rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#5CE1E6] font-semibold">
              CURAAI MAINTENANCE INTELLIGENCE AGENT · PREDICT · PREVENT · PROTECT
            </div>
            <h2 className="text-base font-semibold text-[#F6F1E5] mt-0.5">
              AI Inspection Plan — {machine.name} ({machine.code})
            </h2>
            <p className="text-xs text-[#EAE3D2]/85">
              Evidence-prioritized inspection procedures derived from sensor correlations and root-cause confidence.
            </p>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-[#EAE3D2]/85">STATE: </span>
              <span className="text-[#5CE1E6] font-semibold">
                {diagnostics.intelligenceState}
              </span>
            </div>
            <div>
              <span className="text-[#EAE3D2]/85">TOTAL EST. TIME: </span>
              <span className="text-[#F6F1E5] font-semibold">
                {diagnostics.inspectionPlan.reduce(
                  (acc, i) => acc + i.expectedDurationMinutes,
                  0
                )}{' '}
                min
              </span>
            </div>
          </div>
        </div>

        {/* Prioritized AI Inspection Plan Cards */}
        <div className="space-y-4">
          {diagnostics.inspectionPlan.map((item) => {
            const isDone = !!completedPriorities[item.priority];
            return (
              <div
                key={item.priority}
                onClick={() => onHighlightComponent?.(item.componentId)}
                className={`rounded-2xl p-5 transition-all cursor-pointer ${
                  isDone
                    ? 'glass-panel opacity-75'
                    : item.priority === 1
                    ? 'glass-panel-elevated glass-cyan-glow'
                    : 'glass-panel'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePriorityDone(item.priority);
                      }}
                      className={`mt-0.5 w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-xs transition-colors cursor-pointer ${
                        isDone
                          ? 'bg-[#19A7CE] border-[#19A7CE] text-[#F6F1E5] font-bold'
                          : 'glass-subcard border-[#5CE1E6]/70 text-[#F6F1E5]'
                      }`}
                      title="Mark Inspection Step Complete"
                    >
                      {isDone ? '✓' : `P${item.priority}`}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="text-[#5CE1E6] font-semibold">
                          PRIORITY {item.priority}
                        </span>
                        <span className="text-[#EAE3D2]/70">·</span>
                        <span className="text-[#F6F1E5]">{item.urgency}</span>
                        <span className="text-[#EAE3D2]/70">·</span>
                        <span className="text-[#EAE3D2]/85">{item.procedureRef}</span>
                      </div>
                      <h3
                        className={`text-sm sm:text-base font-semibold mt-1 ${
                          isDone ? 'line-through text-[#EAE3D2]/60' : 'text-[#F6F1E5]'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <div className="text-xs text-[#EAE3D2]/85 mt-0.5">
                        Target Component: <span className="text-[#F6F1E5] font-medium">{item.component}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#F6F1E5] glass-subcard px-3 py-1.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-[#19A7CE]" />
                    <span>Est. {item.expectedDurationMinutes} min</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3.5 border-t border-[#F6F1E5]/20 text-xs">
                  <div className="glass-subcard p-3 rounded-xl">
                    <div className="text-[10px] font-mono uppercase text-[#5CE1E6] font-semibold mb-1">
                      Why This Inspection Is Required
                    </div>
                    <p className="text-[#F6F1E5]/95 leading-relaxed">{item.why}</p>
                  </div>
                  <div className="glass-subcard p-3 rounded-xl">
                    <div className="text-[10px] font-mono uppercase text-[#19A7CE] font-semibold mb-1">
                      Supporting Telemetry Evidence
                    </div>
                    <p className="text-[#EAE3D2]/90 font-mono text-[11px] leading-relaxed">
                      {item.supportingEvidence}
                    </p>
                  </div>
                  <div className="glass-subcard p-3 rounded-xl">
                    <div className="text-[10px] font-mono uppercase text-[#F6F1E5] font-semibold mb-1">
                      Required Engineering Tools
                    </div>
                    <ul className="space-y-1 text-[#F6F1E5]/95 text-[11px]">
                      {item.requiredTools.map((tool, i) => (
                        <li key={i}>• {tool}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Reports Mode
  return (
    <div className="space-y-6">
      {/* Top Report Action Bar */}
      <div className="glass-panel-elevated rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[#5CE1E6] font-semibold">
            CURAAI AUTOMATIC DIAGNOSTIC REPORT GENERATOR
          </div>
          <h2 className="text-base font-semibold text-[#F6F1E5] mt-0.5">
            Engineering Diagnostic Dossier — {machine.name}
          </h2>
          <p className="text-xs text-[#EAE3D2]/85">
            Structured engineering document containing measured telemetry, causal reasoning, simulation projections, and inspection priorities.
          </p>
        </div>

        <button
          onClick={handleGeneratePdf}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-semibold bg-gradient-to-r from-[#19A7CE] to-[#0D6EA8] text-[#F6F1E5] rounded-xl shadow-[0_0_22px_rgba(25,167,206,0.5)] hover:brightness-110 transition-all cursor-pointer border border-[#F6F1E5]/40"
        >
          <Download className="w-4 h-4" />
          <span>GENERATE AI DIAGNOSTIC REPORT (PDF)</span>
        </button>
      </div>

      {/* Professional Engineering Document Layout */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Document Header Block */}
        <div className="border-b border-[#19A7CE]/35 pb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#5CE1E6] tracking-widest font-semibold">
              CURAAI · PREDICT · PREVENT · PROTECT
            </div>
            <h1 className="text-xl font-bold text-[#F6F1E5] mt-1">
              DIAGNOSTIC & ROOT-CAUSE ENGINEERING REPORT
            </h1>
            <div className="text-xs font-mono text-[#EAE3D2]/90 mt-1">
              Machine: {machine.name} ({machine.code}) · Location: {machine.location}
            </div>
          </div>

          <div className="text-right font-mono text-xs space-y-0.5">
            <div className="text-[#F6F1E5]">
              STATE:{' '}
              <span className="text-[#5CE1E6] font-semibold">
                {diagnostics.intelligenceState}
              </span>
            </div>
            <div className="text-[#EAE3D2]/90">
              AI Confidence: {diagnostics.aiConfidence}% · Agreement:{' '}
              {diagnostics.sensorAgreement}%
            </div>
            <div className="text-[#EAE3D2]/85">
              Timestamp: {new Date(reportGeneratedAt).toUTCString()}
            </div>
          </div>
        </div>

        {/* 1. Machine Identity & Operating Conditions */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#5CE1E6] font-semibold">
            01. Machine Identity & Mechanical Operating Conditions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 glass-subcard rounded-xl p-3.5 font-mono text-xs">
            <div>
              <div className="text-[10px] text-[#EAE3D2]/85">RATED POWER / SPEED</div>
              <div className="text-[#F6F1E5] font-semibold mt-0.5">
                {machine.ratedPowerKw} kW · {machine.inputSpeedRpm} RPM
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#EAE3D2]/85">GEAR RATIO / OUTPUT</div>
              <div className="text-[#F6F1E5] font-semibold mt-0.5">
                {diagnostics.calculations.exactGearRatio}:1 · {machine.outputSpeedRpm} RPM
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#EAE3D2]/85">TORQUE [ESTIMATED]</div>
              <div className="text-[#F6F1E5] font-semibold mt-0.5">
                In: {diagnostics.calculations.inputTorqueNm} Nm · Out:{' '}
                {diagnostics.calculations.outputTorqueNm} Nm
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#EAE3D2]/85">HOUSING ENVELOPE</div>
              <div className="text-[#F6F1E5] font-semibold mt-0.5">
                {machine.dimensions.housingLengthMm}×{machine.dimensions.housingWidthMm}×
                {machine.dimensions.housingHeightMm} mm
              </div>
            </div>
          </div>
        </div>

        {/* 2. AI Engineering Reasoning & Detected Anomalies */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#5CE1E6] font-semibold">
            02. Detected Pattern & AI Engineering Reasoning
          </h3>
          <div className="glass-subcard rounded-xl p-4 space-y-2">
            <div className="text-xs font-mono text-[#5CE1E6] font-semibold">
              Detected Pattern: {diagnostics.detectedPattern}
            </div>
            <div className="text-sm font-semibold text-[#F6F1E5]">
              {diagnostics.headlineConclusion}
            </div>
            <p className="text-xs text-[#EAE3D2]/90 leading-relaxed">
              {diagnostics.detailedNarrative}
            </p>
          </div>
        </div>

        {/* 3. Sensor Trends & Anomaly Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#5CE1E6] font-semibold">
            03. Sensor Telemetry & Baseline Deviation Table [MEASURED]
          </h3>
          <div className="overflow-x-auto glass-subcard rounded-xl">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[#092032]/55 border-b border-[#19A7CE]/35 text-[10px] text-[#EAE3D2]">
                  <th className="py-2 px-3">SENSOR</th>
                  <th className="py-2 px-3 text-right">MEASURED</th>
                  <th className="py-2 px-3 text-right">BASELINE</th>
                  <th className="py-2 px-3 text-right">DEVIATION</th>
                  <th className="py-2 px-3 text-right">Z-SCORE</th>
                  <th className="py-2 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6F1E5]/15">
                {Object.values(diagnostics.sensorStats).map((s) => (
                  <tr key={s.key}>
                    <td className="py-2 px-3 font-sans text-[#F6F1E5]">{s.label}</td>
                    <td className="py-2 px-3 text-right text-[#F6F1E5] font-semibold">
                      {s.currentValue} {s.unit}
                    </td>
                    <td className="py-2 px-3 text-right text-[#EAE3D2]/85">
                      {s.baselineMean} {s.unit}
                    </td>
                    <td className="py-2 px-3 text-right text-[#5CE1E6] font-semibold">
                      {s.deviationPercent >= 0 ? '+' : ''}
                      {s.deviationPercent}%
                    </td>
                    <td className="py-2 px-3 text-right text-[#EAE3D2]/85">
                      {s.zScore >= 0 ? '+' : ''}
                      {s.zScore}σ
                    </td>
                    <td className="py-2 px-3 text-[#5CE1E6]">{s.severity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Root-Cause Candidates & Priority Inspections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-subcard rounded-xl p-4 space-y-2">
            <div className="text-xs font-mono uppercase text-[#5CE1E6] font-semibold">
              04. Root-Cause Candidates
            </div>
            {diagnostics.rootCauseCandidates.slice(0, 3).map((rc) => (
              <div
                key={rc.id}
                className="border-b border-[#F6F1E5]/15 last:border-none pb-2 last:pb-0 text-xs"
              >
                <div className="flex justify-between font-semibold text-[#F6F1E5]">
                  <span>{rc.failureMode}</span>
                  <span className="font-mono text-[#5CE1E6]">
                    {rc.probabilityScore}%
                  </span>
                </div>
                <div className="text-[11px] text-[#EAE3D2]/85 mt-0.5">
                  {rc.supportingSignals[0]}
                </div>
              </div>
            ))}
          </div>

          <div className="glass-subcard rounded-xl p-4 space-y-2">
            <div className="text-xs font-mono uppercase text-[#5CE1E6] font-semibold">
              05. Recommended Inspection Priority
            </div>
            {diagnostics.inspectionPlan.slice(0, 3).map((ip) => (
              <div
                key={ip.priority}
                className="border-b border-[#F6F1E5]/15 last:border-none pb-2 last:pb-0 text-xs"
              >
                <div className="flex justify-between font-semibold text-[#F6F1E5]">
                  <span>
                    P{ip.priority}: {ip.title}
                  </span>
                  <span className="font-mono text-[#5CE1E6]">{ip.urgency}</span>
                </div>
                <div className="text-[11px] text-[#EAE3D2]/85 mt-0.5">
                  Tools: {ip.requiredTools.slice(0, 2).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Lead Engineer Notes Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase text-[#EAE3D2]/90">
            06. Lead Engineer Sign-Off & Field Observations (Included in PDF)
          </label>
          <textarea
            rows={2}
            value={engineerNotes}
            onChange={(e) => setEngineerNotes(e.target.value)}
            className="w-full glass-input rounded-xl p-3 text-xs text-[#F6F1E5]"
          />
        </div>
      </div>
    </div>
  );
};
