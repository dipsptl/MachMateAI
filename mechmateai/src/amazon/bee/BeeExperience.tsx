import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Battery,
  CheckCircle2,
  Clock,
  Key,
  Layers,
  MessageSquare,
  Mic,
  Radio,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Watch,
  Wifi,
  Wrench,
} from 'lucide-react';
import { beeService, BeeDeviceStatus } from './beeAdapter';
import { machineStore } from '../../core/machineStore';
import { BeeTechnicianQuery, BeeWearableNotification } from '../types';

export const BeeExperience: React.FC = () => {
  const [deviceStatus, setDeviceStatus] = useState<BeeDeviceStatus>(() => beeService.getStatus());
  const [notifications, setNotifications] = useState<BeeWearableNotification[]>(() =>
    beeService.getNotifications()
  );
  const [queryHistory, setQueryHistory] = useState<BeeTechnicianQuery[]>(() =>
    beeService.getQueryHistory()
  );

  const [technicianQueryText, setTechnicianQueryText] = useState<string>(
    'Is Gearbox GT-204 safe to run through the shift?'
  );
  const [manualApiKey, setManualApiKey] = useState<string>('');
  const [manualDeviceId, setManualDeviceId] = useState<string>('');
  const [isConfiguringRealDevice, setIsConfiguringRealDevice] = useState<boolean>(false);

  // Subscribe to central store updates
  useEffect(() => {
    const unsub = machineStore.subscribe(() => {
      setNotifications(beeService.getNotifications());
      setDeviceStatus(beeService.getStatus());
    });
    return unsub;
  }, []);

  const handleSendVoiceQuery = () => {
    if (!technicianQueryText.trim()) return;
    beeService.handleTechnicianVoiceQuery(technicianQueryText);
    setQueryHistory(beeService.getQueryHistory());
  };

  const handleAcknowledgeNotification = (id: string) => {
    machineStore.acknowledgeBeeNotification(id);
    setNotifications(beeService.getNotifications());
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    beeService.setRealDeviceCredentials(manualApiKey, manualDeviceId);
    setDeviceStatus(beeService.getStatus());
    setIsConfiguringRealDevice(false);
  };

  const handleDispatchTestAlert = () => {
    beeService.dispatchWearableAlert(
      'GT-204',
      'HIGH VIBRATION SPIKE DETECTED',
      'GT-204 DE Bearing vibration spiked to 3.82 mm/s (+59%). High frequency harmonics detected. Check alignment bolts.',
      'CRITICAL'
    );
    setNotifications(beeService.getNotifications());
  };

  return (
    <div className="space-y-6 select-none font-['Outfit']">
      {/* Top Header & Track Badge */}
      <div className="glass-panel-elevated p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 border border-[#00D2FF]/30 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00E599] to-[#00D2FF] p-0.5 shadow-[0_0_20px_rgba(0,229,153,0.4)] flex items-center justify-center">
            <Watch className="w-7 h-7 text-[#06151B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                BEE <span className="text-[#00E599]">WEARABLE & APPLE WATCH</span>
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                deviceStatus.connected
                  ? 'bg-[#00E599]/25 text-[#00E599] border-[#00E599]/50'
                  : 'bg-[#FF8800]/25 text-[#FFB020] border-[#FF8800]/50'
              }`}>
                {deviceStatus.connected ? 'LIVE BEE DEVICE CONNECTED' : 'READY FOR DEVICE / SIMULATOR'}
              </span>
            </div>
            <p className="text-xs text-white/70 font-mono mt-0.5">
              Industrial wearable assistant delivering haptic vibration alerts & maintenance guidance to technician wrists
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfiguringRealDevice(!isConfiguringRealDevice)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-[#00E599]" />
            <span>Configure Bee Credentials</span>
          </button>
          <button
            onClick={handleDispatchTestAlert}
            className="flex items-center gap-1.5 px-3 py-1.5 btn-signup-blue rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Dispatch Wrist Alert</span>
          </button>
        </div>
      </div>

      {/* Real Credentials Configuration Modal / Drawer */}
      {isConfiguringRealDevice && (
        <form
          onSubmit={handleSaveCredentials}
          className="glass-panel p-5 rounded-3xl border border-[#00E599]/40 space-y-3 bg-[#081822]/95"
        >
          <div className="text-xs font-mono text-[#00E599] font-bold uppercase">
            CONNECT PHYSICAL BEE WEARABLE OR APPLE WATCH
          </div>
          <p className="text-xs text-white/70">
            To connect a physical Bee device or Apple Watch running Bee software for the hackathon live demo, enter your Bee Developer API credentials. Leave blank to run in documented development adapter mode.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-white/60">BEE API KEY / TOKEN</label>
              <input
                type="password"
                value={manualApiKey}
                onChange={(e) => setManualApiKey(e.target.value)}
                placeholder="bee_live_sk_..."
                className="w-full glass-input text-xs font-mono p-2.5 rounded-xl text-white mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/60">BEE DEVICE SERIAL / UUID</label>
              <input
                type="text"
                value={manualDeviceId}
                onChange={(e) => setManualDeviceId(e.target.value)}
                placeholder="BEE-HW-99214 or Apple Watch UDID"
                className="w-full glass-input text-xs font-mono p-2.5 rounded-xl text-white mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsConfiguringRealDevice(false)}
              className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 btn-indigo-primary text-xs font-bold rounded-xl text-white cursor-pointer"
            >
              Save & Connect
            </button>
          </div>
        </form>
      )}

      {/* Device Status Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-subcard p-3 rounded-2xl">
          <div className="text-[10px] font-mono text-white/60 uppercase">ACTIVE TECHNICIAN</div>
          <div className="text-xs font-bold text-white mt-1 truncate">{deviceStatus.technicianName}</div>
          <div className="text-[10px] font-mono text-[#00E599] mt-0.5">{deviceStatus.assignedPlantSection}</div>
        </div>

        <div className="glass-subcard p-3 rounded-2xl">
          <div className="text-[10px] font-mono text-white/60 uppercase">DEVICE HARDWARE</div>
          <div className="text-xs font-bold text-white mt-1">{deviceStatus.deviceType}</div>
          <div className="text-[10px] font-mono text-white/50 mt-0.5">{deviceStatus.firmwareVersion}</div>
        </div>

        <div className="glass-subcard p-3 rounded-2xl">
          <div className="text-[10px] font-mono text-white/60 uppercase">BATTERY & SYNC</div>
          <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-[#00E599]" />
            <span>{deviceStatus.batteryLevel}%</span>
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-0.5">Synced 10s ago</div>
        </div>

        <div className="glass-subcard p-3 rounded-2xl">
          <div className="text-[10px] font-mono text-white/60 uppercase">OPERATIONAL MODE</div>
          <div className="text-xs font-bold text-[#00D2FF] mt-1 uppercase">
            {deviceStatus.mode.replace(/_/g, ' ')}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-0.5">
            {deviceStatus.connected ? 'Real API Link' : 'Documented Adapter'}
          </div>
        </div>
      </div>

      {/* Main 2-Column Wearable Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Wearable Watch Screen Simulator */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="text-xs font-mono text-white/60 uppercase mb-2">
            TECHNICIAN SMARTWATCH WRIST SIMULATOR
          </div>

          {/* Watch Enclosure Frame */}
          <div className="w-[320px] rounded-[52px] bg-gradient-to-b from-[#222B35] to-[#121A22] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20 relative">
            {/* Watch Top Button Crown */}
            <div className="absolute -right-2.5 top-20 w-2.5 h-8 bg-slate-600 rounded-r-md border-r border-white/40" />

            {/* Watch Glass Display */}
            <div className="w-full h-[400px] rounded-[38px] bg-black p-4 flex flex-col justify-between overflow-y-auto no-scrollbar border border-white/10">
              {/* Watch Status Bar */}
              <div className="flex items-center justify-between text-[11px] font-mono text-white/70 pb-2 border-b border-white/15">
                <span>10:42 AM</span>
                <span className="text-[#00E599] flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  <span>BEE</span>
                </span>
              </div>

              {/* Latest Active Wrist Alert */}
              <div className="my-auto space-y-2.5 py-2">
                {notifications[0] ? (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1A0B10] to-[#2A1018] border border-[#FF2244]/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF2244]/30 text-[#FF4466] font-bold">
                        {notifications[0].hapticPattern.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-white/60">
                        {notifications[0].machineCode}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-white leading-tight">
                      {notifications[0].title}
                    </h4>

                    <p className="text-[11px] text-white/80 leading-relaxed font-sans">
                      {notifications[0].guidanceText}
                    </p>

                    <div className="pt-1">
                      <button
                        onClick={() => handleAcknowledgeNotification(notifications[0].id)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          notifications[0].acknowledgedByTechnician
                            ? 'bg-[#00E599]/20 text-[#00E599]'
                            : 'bg-[#FF2244] text-white shadow-md'
                        }`}
                      >
                        {notifications[0].acknowledgedByTechnician
                          ? '✓ ACKNOWLEDGED'
                          : 'ACKNOWLEDGE & DISPATCH'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-white/50 font-mono">
                    No active critical wrist alerts
                  </div>
                )}
              </div>

              {/* Watch Mic Prompt */}
              <div className="pt-2 border-t border-white/15 text-center">
                <span className="text-[10px] font-mono text-[#00D2FF]">
                  ● HOLD CROWN TO SPEAK
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Technician Voice Queries & Wearable Alert History */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Voice Inquiry Interface */}
          <div className="glass-panel p-5 rounded-3xl border border-white/15 space-y-3">
            <div className="text-xs font-mono uppercase text-[#00D2FF] font-bold flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              <span>TECHNICIAN FIELD QUERY (BEE MICROPHONE)</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={technicianQueryText}
                onChange={(e) => setTechnicianQueryText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendVoiceQuery();
                }}
                placeholder="Ask Bee about machine status, safety, or procedure..."
                className="w-full glass-input text-xs sm:text-sm text-white placeholder-white/50 p-3 rounded-2xl"
              />
              <button
                onClick={handleSendVoiceQuery}
                className="p-3 btn-indigo-primary text-white rounded-2xl cursor-pointer shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Is Gearbox GT-204 safe to run through the shift?',
                'What tools do I need for Pump 301?',
                'Motor 102 vibration status',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setTechnicianQueryText(q);
                    beeService.handleTechnicianVoiceQuery(q);
                    setQueryHistory(beeService.getQueryHistory());
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] text-white/80 hover:text-white border border-white/10 cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* AI Guidance Responses to Wearable */}
          <div className="glass-panel p-5 rounded-3xl border border-white/15 space-y-3">
            <div className="text-xs font-mono uppercase text-white/70">
              RECENT WEARABLE INTERACTION LOG ({queryHistory.length})
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto no-scrollbar">
              {queryHistory.map((item) => (
                <div key={item.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#00D2FF]">
                    <span>Q: "{item.textQuery}"</span>
                    <span className="text-white/40">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium leading-relaxed font-sans">
                    A: {item.responseGuidance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
