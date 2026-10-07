import React, { useState, useEffect } from 'react';
import {
  DiagnosticSummary,
  MachineProfile,
  SimulationInput,
  SimulationResult,
} from '../models/types';
import { runWhatIfSimulation } from '../ai/reasoningEngine';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Flame,
  Gauge,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface SimulationViewProps {
  machine: MachineProfile;
  diagnostics: DiagnosticSummary;
  onSimulationUpdate: (sim: SimulationResult) => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  machine,
  diagnostics,
  onSimulationUpdate,
}) => {
  const latest = machine.timeSeries[machine.timeSeries.length - 1];

  const defaultInput: SimulationInput = {
    rpm: 1750,
    loadPercent: 90,
    ambientTempC: 28,
    oilTempC: latest ? latest.oilTemperature : 70.4,
    oilPressureBar: latest ? latest.pressure : 3.75,
    oilFlowLpm: 18,
    durationHours: 24,
  };

  const [scenario, setScenario] = useState<SimulationInput>(defaultInput);
  const [simResult, setSimResult] = useState<SimulationResult>(() =>
    runWhatIfSimulation(machine, defaultInput)
  );

  useEffect(() => {
    const res = runWhatIfSimulation(machine, scenario);
    setSimResult(res);
    onSimulationUpdate(res);
  }, [scenario, machine.id]);

  const applyPreset = (preset: Partial<SimulationInput>) => {
    setScenario((prev) => ({ ...prev, ...preset }));
  };

  const resetToCurrentMeasured = () => {
    setScenario({
      rpm: latest ? latest.rpm : machine.inputSpeedRpm,
      loadPercent: latest ? latest.load : 72,
      ambientTempC: 28,
      oilTempC: latest ? latest.oilTemperature : 68,
      oilPressureBar: latest ? latest.pressure : 3.8,
      oilFlowLpm: 18,
      durationHours: 24,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel-elevated rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#5CE1E6]">
            <span>CURAAI PHYSICS-INFORMED WHAT-IF SIMULATOR</span>
            <span>·</span>
            <span>PREDICT · PREVENT · PROTECT</span>
          </div>
          <h2 className="text-base font-semibold text-[#F6F1E5] mt-0.5">
            Operating Condition & Thermal-Tribological Stress Simulation
          </h2>
          <p className="text-xs text-[#EAE3D2]/85">
            Evaluate RPM, load, lubrication temperature, and flow scenarios before changing plant setpoints.
          </p>
        </div>

        {/* Preset Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              applyPreset({
                rpm: 1750,
                loadPercent: 90,
                ambientTempC: 30,
                oilFlowLpm: 18,
              })
            }
            className="px-3 py-1.5 text-xs font-mono bg-[#19A7CE]/25 hover:bg-[#19A7CE]/35 text-[#F6F1E5] border border-[#5CE1E6]/60 rounded-lg transition-all cursor-pointer"
          >
            Preset: 1750 RPM / 90% Load
          </button>
          <button
            onClick={() =>
              applyPreset({
                rpm: machine.inputSpeedRpm,
                loadPercent: 85,
                ambientTempC: 40,
                oilFlowLpm: 12,
              })
            }
            className="px-3 py-1.5 text-xs font-mono glass-subcard hover:border-[#5CE1E6]/55 text-[#F6F1E5] rounded-lg transition-all cursor-pointer"
          >
            Preset: Cooling Loss (+40°C Amb)
          </button>
          <button
            onClick={() =>
              applyPreset({
                rpm: 1350,
                loadPercent: 60,
                ambientTempC: 25,
                oilTempC: 58,
                oilPressureBar: 4.2,
                oilFlowLpm: 22,
              })
            }
            className="px-3 py-1.5 text-xs font-mono bg-[#0B2A42] hover:bg-[#103856] text-[#5CE1E6] border border-[#5CE1E6]/45 rounded-lg transition-all cursor-pointer"
          >
            Preset: De-rated Relief Mode
          </button>
          <button
            onClick={resetToCurrentMeasured}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-[#EAE3D2] hover:text-[#F6F1E5] border border-[#5CE1E6]/35 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Current</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Interactive Parameter Sliders */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-[#19A7CE]/35 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F6F1E5]">
              Scenario Operating Parameters
            </span>
            <span className="text-[11px] font-mono text-[#5CE1E6] font-semibold">
              REAL-TIME COUPLED SOLVER
            </span>
          </div>

          {[
            {
              key: 'rpm' as const,
              label: 'Input Shaft Speed (RPM)',
              min: 600,
              max: 2200,
              step: 10,
              unit: 'RPM',
              measured: simResult.baseline.rpm,
            },
            {
              key: 'loadPercent' as const,
              label: 'Mechanical Torque Load (%)',
              min: 25,
              max: 120,
              step: 1,
              unit: '%',
              measured: simResult.baseline.loadPercent,
            },
            {
              key: 'ambientTempC' as const,
              label: 'Ambient Air Temperature (°C)',
              min: 10,
              max: 50,
              step: 1,
              unit: '°C',
              measured: simResult.baseline.ambientTempC,
            },
            {
              key: 'oilTempC' as const,
              label: 'Sump Oil Supply Temperature (°C)',
              min: 45,
              max: 95,
              step: 0.5,
              unit: '°C',
              measured: simResult.baseline.oilTempC,
            },
            {
              key: 'oilPressureBar' as const,
              label: 'Lubrication Manifold Pressure (bar)',
              min: 1.8,
              max: 5.5,
              step: 0.05,
              unit: 'bar',
              measured: simResult.baseline.oilPressureBar,
            },
            {
              key: 'oilFlowLpm' as const,
              label: 'Cooling Oil Circulation Flow (L/min)',
              min: 6,
              max: 30,
              step: 1,
              unit: 'L/min',
              measured: simResult.baseline.oilFlowLpm,
            },
          ].map((ctrl) => (
            <div key={ctrl.key} className="space-y-1.5 glass-subcard p-3 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F6F1E5] font-medium">{ctrl.label}</span>
                <div className="font-mono">
                  <span className="text-[#EAE3D2]/80 text-[11px] mr-2">
                    Measured: {ctrl.measured} {ctrl.unit}
                  </span>
                  <span className="text-[#5CE1E6] font-semibold">
                    {scenario[ctrl.key]} {ctrl.unit}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step}
                value={scenario[ctrl.key]}
                onChange={(e) =>
                  setScenario((prev) => ({
                    ...prev,
                    [ctrl.key]: parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-[#19A7CE] h-1.5 bg-[#F6F1E5]/20 rounded cursor-pointer"
              />
            </div>
          ))}
        </div>

        {/* Right 7 Columns: Simulated Outcomes & AI Engineering Explanation */}
        <div className="lg:col-span-7 space-y-5">
          {/* Distinction Banner: MEASURED vs PREDICTED vs SIMULATED */}
          <div className="glass-panel-elevated rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#19A7CE]/35">
              <div>
                <span className="text-[11px] font-mono text-[#5CE1E6] font-semibold">
                  [SIMULATED ENGINEERING PROJECTION]
                </span>
                <h3 className="text-sm font-semibold text-[#F6F1E5] mt-0.5">
                  Measured Baseline vs. Simulated Scenario Comparison
                </h3>
              </div>
              <div className="font-mono text-xs text-[#EAE3D2]">
                Projected State:{' '}
                <span
                  className={`font-semibold ${
                    simResult.outputs.projectedState === 'CRITICAL'
                      ? 'text-[#FF887A]'
                      : simResult.outputs.projectedState === 'INVESTIGATE' ||
                        simResult.outputs.projectedState === 'WATCH'
                      ? 'text-[#5CE1E6]'
                      : 'text-[#19A7CE]'
                  }`}
                >
                  {simResult.outputs.projectedState}
                </span>
              </div>
            </div>

            {/* 6 Primary Simulation Output Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              <div className="glass-subcard rounded-xl p-3.5 font-mono">
                <div className="flex items-center justify-between text-[10px] text-[#EAE3D2]/90">
                  <span>BEARING TEMPERATURE</span>
                  <span className="text-[#5CE1E6]">[SIMULATED]</span>
                </div>
                <div className="text-xl font-semibold text-[#F6F1E5] mt-1">
                  {simResult.outputs.estimatedBearingTempC}{' '}
                  <span className="text-xs text-[#EAE3D2]/85">°C</span>
                </div>
                <div className="text-[11px] text-[#EAE3D2]/85 mt-1">
                  Measured: {diagnostics.sensorStats.temperature.currentValue}°C (
                  <span
                    className={
                      simResult.outputs.tempDeltaC > 0 ? 'text-[#5CE1E6]' : 'text-[#19A7CE]'
                    }
                  >
                    {simResult.outputs.tempDeltaC >= 0 ? '+' : ''}
                    {simResult.outputs.tempDeltaC}°C
                  </span>
                  )
                </div>
              </div>

              <div className="glass-subcard rounded-xl p-3.5 font-mono">
                <div className="flex items-center justify-between text-[10px] text-[#EAE3D2]/90">
                  <span>VIBRATION RISK</span>
                  <span className="text-[#5CE1E6]">[SIMULATED]</span>
                </div>
                <div className="text-xl font-semibold text-[#F6F1E5] mt-1">
                  {simResult.outputs.estimatedVibrationMmS}{' '}
                  <span className="text-xs text-[#EAE3D2]/85">mm/s</span>
                </div>
                <div className="text-[11px] text-[#EAE3D2]/85 mt-1">
                  Risk Index: {simResult.outputs.vibrationRiskPercent}% · Measured:{' '}
                  {diagnostics.sensorStats.vibration.currentValue} mm/s
                </div>
              </div>

              <div className="glass-subcard rounded-xl p-3.5 font-mono">
                <div className="flex items-center justify-between text-[10px] text-[#EAE3D2]/90">
                  <span>THERMAL MARGIN</span>
                  <span className="text-[#5CE1E6]">[SIMULATED]</span>
                </div>
                <div
                  className={`text-xl font-semibold mt-1 ${
                    simResult.outputs.thermalMarginC <= 5
                      ? 'text-[#FF887A]'
                      : simResult.outputs.thermalMarginC <= 12
                      ? 'text-[#5CE1E6]'
                      : 'text-[#19A7CE]'
                  }`}
                >
                  {simResult.outputs.thermalMarginC}{' '}
                  <span className="text-xs text-[#EAE3D2]/85">°C to Limit</span>
                </div>
                <div className="text-[11px] text-[#EAE3D2]/85 mt-1">
                  Max Limit: {machine.limits.maxTemperatureC}°C
                </div>
              </div>

              <div className="glass-subcard rounded-xl p-3.5 font-mono">
                <div className="flex items-center justify-between text-[10px] text-[#EAE3D2]/90">
                  <span>BEARING FATIGUE RISK</span>
                  <span className="text-[#5CE1E6]">[SIMULATED]</span>
                </div>
                <div className="text-xl font-semibold text-[#F6F1E5] mt-1">
                  {simResult.outputs.bearingRiskPercent}%{' '}
                  <span className="text-xs text-[#EAE3D2]/85">
                    (L10h: {simResult.outputs.bearingFatigueLifeFactor}×)
                  </span>
                </div>
                <div className="text-[11px] text-[#EAE3D2]/85 mt-1">
                  Film Parameter λ = {simResult.outputs.lubricationFilmParameterLambda}
                </div>
              </div>

              <div className="glass-subcard rounded-xl p-3.5 font-mono">
                <div className="flex items-center justify-between text-[10px] text-[#EAE3D2]/90">
                  <span>TRANSMITTED TORQUE</span>
                  <span className="text-[#5CE1E6]">[SIMULATED]</span>
                </div>
                <div className="text-xl font-semibold text-[#F6F1E5] mt-1">
                  {simResult.outputs.outputTorqueNm}{' '}
                  <span className="text-xs text-[#EAE3D2]/85">Nm Out</span>
                </div>
                <div className="text-[11px] text-[#EAE3D2]/85 mt-1">
                  Input: {simResult.outputs.inputTorqueNm} Nm · Heat: {simResult.outputs.heatGenerationKw} kW
                </div>
              </div>

              <div className="glass-subcard rounded-xl p-3.5 font-mono">
                <div className="flex items-center justify-between text-[10px] text-[#EAE3D2]/90">
                  <span>OPERATING MARGIN</span>
                  <span className="text-[#5CE1E6]">[SIMULATED]</span>
                </div>
                <div className="text-xl font-semibold text-[#F6F1E5] mt-1">
                  {simResult.outputs.operatingMarginPercent}%
                </div>
                <div className="text-[11px] text-[#EAE3D2]/85 mt-1">
                  Current Measured Margin: {diagnostics.operatingMargin}%
                </div>
              </div>
            </div>

            {/* AI Simulation Reasoning Explanation */}
            <div className="mt-5 p-4 glass-subcard rounded-xl">
              <div className="flex items-center gap-2 text-xs font-mono text-[#5CE1E6] font-semibold mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CURAAI SIMULATION AGENT EXPLANATION</span>
              </div>
              <p className="text-xs sm:text-sm text-[#F6F1E5] leading-relaxed">
                {simResult.aiExplanation}
              </p>

              {simResult.engineeringWarnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#F6F1E5]/15 space-y-1.5">
                  {simResult.engineeringWarnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-[#5CE1E6]"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Named Engineering Assumptions */}
            <div className="mt-4 text-[11px] font-mono text-[#EAE3D2]/85 space-y-1">
              <div className="uppercase text-[#F6F1E5] font-semibold">Simulation Model Assumptions:</div>
              {simResult.assumptions.map((a, i) => (
                <div key={i}>• {a}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
