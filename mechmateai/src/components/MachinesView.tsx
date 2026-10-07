import React, { useState } from 'react';
import {
  DiagnosticSummary,
  MachineCategory,
  MachineProfile,
} from '../models/types';
import { generateTimeSeriesForScenario } from '../data/sampleData';
import {
  Calculator,
  Check,
  Cog,
  Edit3,
  Plus,
  Ruler,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface MachinesViewProps {
  machines: MachineProfile[];
  selectedMachine: MachineProfile;
  diagnostics: DiagnosticSummary;
  onSelectMachine: (id: string) => void;
  onUpdateMachine: (updated: MachineProfile) => void;
  onAddMachine: (newMachine: MachineProfile) => void;
}

export const MachinesView: React.FC<MachinesViewProps> = ({
  machines,
  selectedMachine,
  diagnostics,
  onSelectMachine,
  onUpdateMachine,
  onAddMachine,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('Auxiliary Cooling Fan Drive GF-501');
  const [newCode, setNewCode] = useState('GF-501');
  const [newCategory, setNewCategory] = useState<MachineCategory>('Gearbox');
  const [newPower, setNewPower] = useState(55);
  const [newInRpm, setNewInRpm] = useState(1500);
  const [newOutRpm, setNewOutRpm] = useState(75);

  const calc = diagnostics.calculations;

  const handleDimensionChange = (
    field: keyof MachineProfile['dimensions'],
    val: number
  ) => {
    if (!Number.isFinite(val) || val <= 5) return;
    onUpdateMachine({
      ...selectedMachine,
      dimensions: {
        ...selectedMachine.dimensions,
        [field]: val,
      },
    });
  };

  const handleSpecChange = (
    field: 'ratedPowerKw' | 'inputSpeedRpm' | 'outputSpeedRpm',
    val: number
  ) => {
    if (!Number.isFinite(val) || val <= 1) return;
    const updated = {
      ...selectedMachine,
      [field]: val,
    };
    updated.nominalGearRatio = Number(
      (updated.inputSpeedRpm / Math.max(1, updated.outputSpeedRpm)).toFixed(2)
    );
    onUpdateMachine(updated);
  };

  const handleCreateMachine = (e: React.FormEvent) => {
    e.preventDefault();
    const ratio = Number((newInRpm / Math.max(1, newOutRpm)).toFixed(2));
    const created: MachineProfile = {
      ...selectedMachine,
      id: newCode.trim() || `MC-${Date.now().toString().slice(-3)}`,
      code: newCode.trim() || 'MC-NEW',
      name: newName.trim() || 'Custom Industrial Asset',
      category: newCategory,
      ratedPowerKw: newPower,
      inputSpeedRpm: newInRpm,
      outputSpeedRpm: newOutRpm,
      nominalGearRatio: ratio,
      timeSeries: generateTimeSeriesForScenario('normal_baseline', newInRpm, 48),
    };
    onAddMachine(created);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Fleet Selector & Add Machine Header */}
      <div className="glass-panel-elevated rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono text-[#5CE1E6] font-semibold tracking-wider">
            CURAAI · PREDICT · PREVENT · PROTECT
          </div>
          <h2 className="text-base font-semibold text-[#F6F1E5] mt-0.5">
            CuraAI Industrial Machine Registry & Parametric Specifications
          </h2>
          <p className="text-xs text-[#EAE3D2]/85">
            Select an asset, adjust prototype CAD dimensions, or verify mechanical torque and shaft sizing equations.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold bg-gradient-to-r from-[#19A7CE] to-[#0D6EA8] text-[#F6F1E5] rounded-xl shadow-[0_0_20px_rgba(25,167,206,0.45)] hover:brightness-110 transition-all cursor-pointer border border-[#5CE1E6]/50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Industrial Machine</span>
        </button>
      </div>

      {/* Add Machine Modal / Form Drawer */}
      {isAdding && (
        <form
          onSubmit={handleCreateMachine}
          className="glass-panel-elevated rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#19A7CE]/35 pb-2.5">
            <span className="text-xs font-mono uppercase text-[#5CE1E6] font-semibold">
              Configure New Machine Profile
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-[#EAE3D2] hover:text-[#F6F1E5] cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Machine Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 text-[#F6F1E5]"
                required
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Machine ID / Code</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
                required
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Machine Type</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MachineCategory)}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 text-[#F6F1E5]"
              >
                <option value="Gearbox" className="bg-[#081F32]">Gearbox</option>
                <option value="Motor" className="bg-[#081F32]">Motor</option>
                <option value="Pump" className="bg-[#081F32]">Pump</option>
                <option value="Compressor" className="bg-[#081F32]">Compressor</option>
                <option value="Fan" className="bg-[#081F32]">Fan</option>
                <option value="Bearing" className="bg-[#081F32]">Bearing</option>
              </select>
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Rated Power (kW)</label>
              <input
                type="number"
                value={newPower}
                onChange={(e) => setNewPower(Number(e.target.value))}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Input Speed (RPM)</label>
              <input
                type="number"
                value={newInRpm}
                onChange={(e) => setNewInRpm(Number(e.target.value))}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Output Speed (RPM)</label>
              <input
                type="number"
                value={newOutRpm}
                onChange={(e) => setNewOutRpm(Number(e.target.value))}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-mono font-semibold bg-gradient-to-r from-[#19A7CE] to-[#0D6EA8] text-[#F6F1E5] rounded-lg shadow-[0_0_18px_rgba(25,167,206,0.45)] cursor-pointer"
            >
              Save & Activate Machine
            </button>
          </div>
        </form>
      )}

      {/* Fleet Cards ("m/c industries block transporat bg") */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {machines.map((m) => {
          const isSelected = m.id === selectedMachine.id;
          return (
            <div
              key={m.id}
              onClick={() => onSelectMachine(m.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'glass-panel-elevated glass-cyan-glow'
                  : 'glass-panel hover:border-[#5CE1E6]/65'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono text-[#EAE3D2]/90">
                <span>
                  {m.code} · {m.category.toUpperCase()}
                </span>
                <span className={isSelected ? 'text-[#5CE1E6] font-semibold' : 'text-[#EAE3D2]/80'}>
                  {isSelected ? '● ACTIVE WORKSTATION' : m.operatingState}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F6F1E5] mt-1">{m.name}</h3>
              <p className="text-xs text-[#EAE3D2]/85 mt-0.5 truncate">{m.model}</p>

              <div className="mt-3 pt-2.5 border-t border-[#F6F1E5]/20 flex items-center justify-between text-xs font-mono text-[#F6F1E5]">
                <span>{m.ratedPowerKw} kW</span>
                <span>·</span>
                <span>
                  {m.inputSpeedRpm} → {m.outputSpeedRpm} RPM
                </span>
                <span>·</span>
                <span className="text-[#5CE1E6] font-semibold">i = {m.nominalGearRatio}:1</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Parametric Specifications Editor + Real-Time Engineering Calculation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Parametric Dimensions & Ratings Editor */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#19A7CE]/35 pb-3">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-[#19A7CE]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F6F1E5]">
                Parametric Machine & CAD Dimensions
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#5CE1E6] font-semibold">
              PROTOTYPE DEMO VALUES
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Rated Power (kW)</label>
              <input
                type="number"
                value={selectedMachine.ratedPowerKw}
                onChange={(e) => handleSpecChange('ratedPowerKw', Number(e.target.value))}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Input Speed (RPM)</label>
              <input
                type="number"
                value={selectedMachine.inputSpeedRpm}
                onChange={(e) => handleSpecChange('inputSpeedRpm', Number(e.target.value))}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Output Speed (RPM)</label>
              <input
                type="number"
                value={selectedMachine.outputSpeedRpm}
                onChange={(e) => handleSpecChange('outputSpeedRpm', Number(e.target.value))}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Housing Length (mm)</label>
              <input
                type="number"
                value={selectedMachine.dimensions.housingLengthMm}
                onChange={(e) =>
                  handleDimensionChange('housingLengthMm', Number(e.target.value))
                }
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Housing Width (mm)</label>
              <input
                type="number"
                value={selectedMachine.dimensions.housingWidthMm}
                onChange={(e) =>
                  handleDimensionChange('housingWidthMm', Number(e.target.value))
                }
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Housing Height (mm)</label>
              <input
                type="number"
                value={selectedMachine.dimensions.housingHeightMm}
                onChange={(e) =>
                  handleDimensionChange('housingHeightMm', Number(e.target.value))
                }
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Wall Thickness (mm)</label>
              <input
                type="number"
                value={selectedMachine.dimensions.wallThicknessMm}
                onChange={(e) =>
                  handleDimensionChange('wallThicknessMm', Number(e.target.value))
                }
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Base Height (mm)</label>
              <input
                type="number"
                value={selectedMachine.dimensions.baseHeightMm}
                onChange={(e) =>
                  handleDimensionChange('baseHeightMm', Number(e.target.value))
                }
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Input Shaft Dia (mm)</label>
              <input
                type="number"
                value={selectedMachine.dimensions.inputShaftDiameterMm}
                onChange={(e) =>
                  handleDimensionChange('inputShaftDiameterMm', Number(e.target.value))
                }
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
            <div>
              <label className="block text-[#EAE3D2]/90 mb-1">Output Shaft Dia (mm)</label>
              <input
                type="number"
                value={selectedMachine.dimensions.outputShaftDiameterMm}
                onChange={(e) =>
                  handleDimensionChange('outputShaftDiameterMm', Number(e.target.value))
                }
                className="w-full glass-input rounded-lg px-2.5 py-1.5 font-mono text-[#F6F1E5]"
              />
            </div>
          </div>

          <p className="text-[11px] font-mono text-[#EAE3D2]/85 pt-2 border-t border-[#19A7CE]/35">
            Note: Modifying dimensions updates the 3D Digital Twin geometry and recalculates shaft torsional safety factors in real time.
          </p>
        </div>

        {/* Right 7 Columns: Mechanical Engineering Calculation Engine */}
        <div className="lg:col-span-7 glass-panel-elevated rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#19A7CE]/35 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#19A7CE]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F6F1E5]">
                Engineering Calculation Engine
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#5CE1E6] font-semibold">
              ORIGIN: [{calc.origin}]
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
            <div className="glass-subcard rounded-xl p-3">
              <div className="text-[10px] text-[#EAE3D2]/90">OVERALL GEAR RATIO (i)</div>
              <div className="text-lg font-semibold text-[#F6F1E5] mt-1">
                {calc.exactGearRatio}:1
              </div>
              <div className="text-[11px] text-[#EAE3D2]/85">
                i₁={calc.stage1Ratio} · i₂={calc.stage2Ratio}
              </div>
            </div>

            <div className="glass-subcard rounded-xl p-3">
              <div className="text-[10px] text-[#EAE3D2]/90">RATED INPUT TORQUE</div>
              <div className="text-lg font-semibold text-[#F6F1E5] mt-1">
                {calc.inputTorqueNm} <span className="text-xs text-[#EAE3D2]/85">Nm</span>
              </div>
              <div className="text-[11px] text-[#EAE3D2]/85">
                T = 9550 × {selectedMachine.ratedPowerKw} / {selectedMachine.inputSpeedRpm}
              </div>
            </div>

            <div className="glass-subcard rounded-xl p-3">
              <div className="text-[10px] text-[#EAE3D2]/90">RATED OUTPUT TORQUE</div>
              <div className="text-lg font-semibold text-[#5CE1E6] mt-1">
                {calc.outputTorqueNm} <span className="text-xs text-[#EAE3D2]/85">Nm</span>
              </div>
              <div className="text-[11px] text-[#EAE3D2]/85">
                At {selectedMachine.outputSpeedRpm} RPM (η={(selectedMachine.efficiencyAssumed * 100).toFixed(0)}%)
              </div>
            </div>

            <div className="glass-subcard rounded-xl p-3">
              <div className="text-[10px] text-[#EAE3D2]/90">PRELIM INPUT SHAFT MIN</div>
              <div className="text-lg font-semibold text-[#F6F1E5] mt-1">
                {calc.preliminaryMinInputShaftMm}{' '}
                <span className="text-xs text-[#EAE3D2]/85">mm</span>
              </div>
              <div className="text-[11px] text-[#5CE1E6]">
                Actual: {selectedMachine.dimensions.inputShaftDiameterMm}mm (SF={calc.inputShaftSafetyFactor}×)
              </div>
            </div>

            <div className="glass-subcard rounded-xl p-3">
              <div className="text-[10px] text-[#EAE3D2]/90">PRELIM OUTPUT SHAFT MIN</div>
              <div className="text-lg font-semibold text-[#F6F1E5] mt-1">
                {calc.preliminaryMinOutputShaftMm}{' '}
                <span className="text-xs text-[#EAE3D2]/85">mm</span>
              </div>
              <div className="text-[11px] text-[#5CE1E6]">
                Actual: {selectedMachine.dimensions.outputShaftDiameterMm}mm (SF={calc.outputShaftSafetyFactor}×)
              </div>
            </div>

            <div className="glass-subcard rounded-xl p-3">
              <div className="text-[10px] text-[#EAE3D2]/90">PITCH VELOCITY & FORCE</div>
              <div className="text-lg font-semibold text-[#F6F1E5] mt-1">
                {calc.pitchLineVelocityMs} <span className="text-xs text-[#EAE3D2]/85">m/s</span>
              </div>
              <div className="text-[11px] text-[#EAE3D2]/85">
                Mesh F_t = {calc.tangentialGearForceN} N
              </div>
            </div>
          </div>

          {/* Named Engineering Assumptions */}
          <div className="glass-subcard rounded-xl p-3.5 text-xs space-y-1.5">
            <div className="font-mono text-[11px] uppercase text-[#5CE1E6] font-semibold">
              Named Engineering Assumptions & Boundary Conditions:
            </div>
            {calc.assumptions.map((assump, i) => (
              <div key={i} className="text-[#EAE3D2]/90 font-mono text-[11px]">
                • {assump}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
