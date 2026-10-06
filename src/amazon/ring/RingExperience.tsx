import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  Flame,
  Play,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Video,
  Zap,
} from 'lucide-react';
import { INDUSTRIAL_RING_CAMERAS, ingestRingEvent } from './ringAdapter';
import { machineStore } from '../../core/machineStore';
import { RingCameraZone, RingEventType, RingIndustrialEvent } from '../types';

export const RingExperience: React.FC = () => {
  const [cameras, setCameras] = useState<RingCameraZone[]>(INDUSTRIAL_RING_CAMERAS);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('cam-gearbox-bay-01');
  const [events, setEvents] = useState<RingIndustrialEvent[]>(() => machineStore.getRingEvents());
  const [simulatedEventType, setSimulatedEventType] = useState<RingEventType>('restricted_area_intrusion');
  const [simulating, setSimulating] = useState<boolean>(false);

  // Subscribe to live machineStore updates
  useEffect(() => {
    const unsub = machineStore.subscribe(() => {
      setEvents(machineStore.getRingEvents());
    });
    return unsub;
  }, []);

  const activeCamera =
    cameras.find((c) => c.id === selectedCameraId) || cameras[0];

  const handleTriggerSimulatedRingEvent = () => {
    setSimulating(true);
    const created = ingestRingEvent({
      deviceId: activeCamera.id,
      eventType: simulatedEventType,
      location: activeCamera.streamPlaceholder,
      associatedMachineId: activeCamera.machineId,
      confidence: 0.96,
    });
    setEvents(machineStore.getRingEvents());
    setTimeout(() => setSimulating(false), 600);
  };

  return (
    <div className="space-y-6 select-none font-['Outfit']">
      {/* Top Header & Track Badge */}
      <div className="glass-panel-elevated p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 border border-[#00D2FF]/30 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D2FF] to-[#0A50E2] p-0.5 shadow-[0_0_20px_rgba(0,210,255,0.4)] flex items-center justify-center">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                RING <span className="text-[#00D2FF]">INDUSTRIAL PERIMETER MONITORING</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40 uppercase">
                OFFICIAL SIMULATOR & ADAPTER READY
              </span>
            </div>
            <p className="text-xs text-white/70 font-mono mt-0.5">
              Correlating camera motion and perimeter intrusion with real-time machinery hazard states
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/80 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
          <span>4 INDUSTRIAL RING CAMERAS ONLINE</span>
        </div>
      </div>

      {/* 4 Camera Zones Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cameras.map((cam) => {
          const isSelected = selectedCameraId === cam.id;
          return (
            <div
              key={cam.id}
              onClick={() => setSelectedCameraId(cam.id)}
              className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-gradient-to-b from-[#00D2FF]/20 to-[#0A50E2]/25 border-[#00D2FF] shadow-lg scale-[1.01]'
                  : 'glass-panel border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#00D2FF] font-bold">[{cam.machineCode}]</span>
                <span className="flex items-center gap-1 text-[#00E599]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E599]" />
                  <span>ONLINE</span>
                </span>
              </div>

              <h4 className="text-xs font-bold text-white mt-1.5 truncate">
                {cam.name}
              </h4>

              <div className="text-[10px] font-mono text-white/60 mt-0.5">
                ZONE: {cam.zone.replace(/_/g, ' ')}
              </div>

              {/* Fake Miniature Viewport */}
              <div className="h-24 rounded-xl bg-black/60 border border-white/10 mt-3 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <Video className="w-6 h-6 text-white/30" />
                <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-white/70">
                  {cam.cameraModel.split(' ')[0]} Live Feed
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main 2-Column: Live Camera Viewport + Event Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Selected Ring Camera Feed & Simulator */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-panel-elevated p-5 rounded-3xl border border-white/15 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-[#00D2FF] uppercase font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>RING LIVE MONITORING VIEWPORT</span>
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {activeCamera.name}
                </h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white">
                Target Asset: {activeCamera.machineCode}
              </span>
            </div>

            {/* Industrial Camera Viewport with Motion Bounding Box */}
            <div className="h-64 sm:h-72 rounded-2xl bg-black/80 border border-[#00D2FF]/40 relative overflow-hidden flex flex-col justify-between p-4 shadow-inner">
              {/* Surveillance Overlay Crosshairs & Status */}
              <div className="flex items-center justify-between text-xs font-mono text-white/80">
                <span className="flex items-center gap-1.5 text-[#FF2244] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#FF2244] animate-ping" />
                  <span>REC · 1080p 30FPS</span>
                </span>
                <span>{activeCamera.streamPlaceholder}</span>
              </div>

              {/* Motion Detection Box Over Machine */}
              <div className="self-center p-3 rounded-xl border-2 border-dashed border-[#00D2FF] bg-[#00D2FF]/10 text-center animate-pulse">
                <ShieldAlert className="w-8 h-8 text-[#00D2FF] mx-auto" />
                <span className="text-[11px] font-mono font-bold text-white mt-1 block">
                  RESTRICTED SAFETY BOUNDARY: {activeCamera.machineCode}
                </span>
                <span className="text-[9px] font-mono text-[#00E599]">
                  3D Motion Radar Active (Sensitivity: {activeCamera.motionSensitivity}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
                <span>Model: {activeCamera.cameraModel}</span>
                <span>Last Activity: 18m ago</span>
              </div>
            </div>

            {/* Official Ring Event Simulator Panel */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-white/70">
                <span className="text-[#00D2FF] font-bold">RING EVENT SIMULATOR (HACKATHON TRACK)</span>
                <span className="text-[10px] text-white/40">Official Webhook Compatible</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-white/60">EVENT TYPE</label>
                  <select
                    value={simulatedEventType}
                    onChange={(e) => setSimulatedEventType(e.target.value as RingEventType)}
                    className="w-full glass-input text-xs font-mono p-2 rounded-xl text-white mt-1 cursor-pointer bg-[#0A1A28]"
                  >
                    <option value="restricted_area_intrusion">restricted_area_intrusion (High Hazard)</option>
                    <option value="person_detected">person_detected (Maintenance tech)</option>
                    <option value="motion_detected">motion_detected (General)</option>
                    <option value="hazard_smoke_or_steam">hazard_smoke_or_steam (Critical)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleTriggerSimulatedRingEvent}
                    disabled={simulating}
                    className="w-full py-2 px-3 btn-indigo-primary text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 text-white" />
                    <span>{simulating ? 'Ingesting Event...' : 'Trigger Ring Event'}</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-white/50 font-mono">
                When triggered, Ring events flow directly into MechMate's causal alert pipeline. Critical safety events automatically dispatch to the Bee technician smartwatch.
              </p>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Ring Industrial Event Log */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-3xl border border-white/15 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-white/70">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#00D2FF]" />
                <span>MECHMATE RING EVENT STREAM ({events.length})</span>
              </span>
              <span className="text-[10px] text-white/40">Real-time</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    evt.severity === 'critical'
                      ? 'bg-[#1A0B10]/80 border-[#FF2244]/60'
                      : evt.severity === 'high'
                      ? 'bg-[#1C1408]/80 border-[#FF8800]/50'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-white uppercase">{evt.sourceDeviceName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      evt.severity === 'critical'
                        ? 'bg-[#FF2244]/25 text-[#FF4466]'
                        : evt.severity === 'high'
                        ? 'bg-[#FF8800]/25 text-[#FFB020]'
                        : 'bg-[#00D2FF]/20 text-[#00D2FF]'
                    }`}>
                      {evt.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white mt-1">
                    {evt.eventType.replace(/_/g, ' ').toUpperCase()}
                  </div>

                  <div className="text-[11px] text-white/60 font-mono mt-0.5">
                    Location: {evt.location}
                  </div>

                  <p className="text-[11px] text-white/80 font-sans mt-1.5 leading-relaxed bg-black/30 p-2 rounded-xl border border-white/5">
                    {evt.aiSafetyActionTaken}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mt-2 pt-1 border-t border-white/5">
                    <span>Target: {evt.associatedMachineCode || 'General'}</span>
                    <span>{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
