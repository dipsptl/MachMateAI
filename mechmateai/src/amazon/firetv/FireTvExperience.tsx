import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Flame,
  Maximize2,
  Minimize2,
  Radio,
  Sliders,
  Tv,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
} from 'lucide-react';
import { machineStore } from '../../core/machineStore';
import { FireTvFeedData } from '../types';

interface FireTvExperienceProps {
  onExit?: () => void;
}

export const FireTvExperience: React.FC<FireTvExperienceProps> = ({ onExit }) => {
  const [feed, setFeed] = useState<FireTvFeedData>(() => machineStore.getFireTvFeed());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('GT-204');
  const [audioChimeEnabled, setAudioChimeEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [lastRemoteKey, setLastRemoteKey] = useState<string>('Ready');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Subscribe to live machineStore updates
  useEffect(() => {
    const unsub = machineStore.subscribe(() => {
      setFeed(machineStore.getFireTvFeed());
    });
    return unsub;
  }, []);

  // Auto carousel rotation every 10 seconds for TV unattended display unless user intervenes
  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setFocusedIndex((prev) => (prev + 1) % feed.machines.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [autoRotate, feed.machines.length]);

  // Sync selected machine with focused index
  useEffect(() => {
    if (feed.machines[focusedIndex]) {
      setSelectedMachineId(feed.machines[focusedIndex].id);
    }
  }, [focusedIndex, feed.machines]);

  // Play synthetic Web Audio chime for critical alarms when enabled
  const playAlarmChime = useCallback(() => {
    if (!audioChimeEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext policy
    }
  }, [audioChimeEnabled]);

  // Physical Fire TV Remote D-Pad / Keyboard Navigation Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setAutoRotate(false); // Stop auto rotation when user presses remote
      setLastRemoteKey(e.key);

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % feed.machines.length);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + feed.machines.length) % feed.machines.length);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(feed.machines.length - 1, prev + 2));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(0, prev - 2));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          playAlarmChime();
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          if (onExit) onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feed.machines.length, onExit, playAlarmChime]);

  const activeMachine =
    feed.machines.find((m) => m.id === selectedMachineId) || feed.machines[0];
  const mostCrit = feed.mostCriticalMachine;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#060B11] text-white p-4 sm:p-6 lg:p-8 flex flex-col font-['Outfit'] select-none">
      {/* =====================================================================
          TOP 10-FOOT CONTROL-ROOM HEADER
          ===================================================================== */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/15">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D2FF] to-[#0A50E2] p-0.5 shadow-[0_0_24px_rgba(0,210,255,0.4)] flex items-center justify-center">
            <Tv className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                MECHMATE <span className="text-[#00D2FF]">FIRE TV</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF8800]/25 text-[#FF8800] border border-[#FF8800]/40 uppercase">
                10-FOOT CONTROL ROOM
              </span>
            </div>
            <p className="text-xs text-white/60 font-mono mt-0.5">
              {feed.factoryName} · 24/7 Unattended Plant Screen
            </p>
          </div>
        </div>

        {/* Remote D-Pad Navigation HUD & Quick Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white/70">
            <span>D-PAD:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">◀</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">▲</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">▼</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">▶</kbd>
            <span className="text-white/40">|</span>
            <span>SELECT:</span>
            <kbd className="px-2 py-0.5 rounded bg-[#00D2FF]/20 text-[#00D2FF] font-bold">OK</kbd>
          </div>

          <button
            onClick={() => setAudioChimeEnabled(!audioChimeEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              audioChimeEnabled
                ? 'bg-[#00E599]/25 text-[#00E599] border border-[#00E599]/50'
                : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
            }`}
            title="Toggle Audible Alarm Beacon"
          >
            {audioChimeEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{audioChimeEnabled ? 'ALARM ON' : 'MUTE'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white cursor-pointer transition-colors"
            title="Toggle TV Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit TV</span>
            </button>
          )}
        </div>
      </header>

      {/* =====================================================================
          FACTORY HEALTH SUMMARY TICKER
          ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-5">
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-[#00D2FF]">
          <div>
            <div className="text-[11px] font-mono uppercase text-white/60">AVERAGE HEALTH</div>
            <div className="text-3xl font-black text-white mt-0.5">{feed.averageHealthScore}%</div>
            <div className="text-[11px] text-[#00E599] font-mono mt-0.5">ISO 20816 Index</div>
          </div>
          <Activity className="w-8 h-8 text-[#00D2FF]/40" />
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-[#00E599]">
          <div>
            <div className="text-[11px] font-mono uppercase text-white/60">ACTIVE ASSETS</div>
            <div className="text-3xl font-black text-white mt-0.5">{feed.runningCount} / {feed.totalMachines}</div>
            <div className="text-[11px] text-white/50 font-mono mt-0.5">100% Operational</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-[#00E599]/40" />
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-[#FF8800]">
          <div>
            <div className="text-[11px] font-mono uppercase text-white/60">WATCH STAGE</div>
            <div className="text-3xl font-black text-[#FF8800] mt-0.5">{feed.investigateCount}</div>
            <div className="text-[11px] text-white/50 font-mono mt-0.5">Degradation Trends</div>
          </div>
          <Sliders className="w-8 h-8 text-[#FF8800]/40" />
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-[#FF2244]">
          <div>
            <div className="text-[11px] font-mono uppercase text-white/60">CRITICAL ALARMS</div>
            <div className="text-3xl font-black text-[#FF2244] mt-0.5 animate-pulse">{feed.criticalCount}</div>
            <div className="text-[11px] text-[#FF2244] font-mono mt-0.5">Immediate Action Req</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-[#FF2244]/40 animate-pulse" />
        </div>
      </div>

      {/* =====================================================================
          MAIN 10-FOOT TV WORKSPACE
          - Left: Spotlight Card for Most Critical Machine or Focused Asset
          - Right: 4-Asset Grid Navigable via Remote D-Pad
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Left 7 Columns: Expanded Spotlight Machinery Diagnostic Card */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-panel-elevated p-6 rounded-3xl border border-[#00D2FF]/40 relative overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${
              activeMachine.state === 'CRITICAL' ? 'bg-[#FF2244]/20' : 'bg-[#00D2FF]/15'
            }`} />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00D2FF] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-[#00D2FF]" />
                  <span>REMOTE-FOCUSED MACHINERY ASSET</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {activeMachine.name}
                </h2>
                <div className="text-xs font-mono text-white/60 mt-0.5">
                  CODE: {activeMachine.code} · CATEGORY: {activeMachine.category}
                </div>
              </div>

              <div className={`px-4 py-2 rounded-2xl text-sm font-black font-mono tracking-wider border flex items-center gap-2 ${
                activeMachine.state === 'CRITICAL'
                  ? 'bg-[#FF2244]/25 text-[#FF4466] border-[#FF2244]/60 shadow-[0_0_18px_rgba(255,34,68,0.4)] animate-pulse'
                  : activeMachine.state === 'INVESTIGATE'
                  ? 'bg-[#FF8800]/25 text-[#FFB020] border-[#FF8800]/50'
                  : 'bg-[#00E599]/20 text-[#00E599] border-[#00E599]/40'
              }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-current" />
                <span>{activeMachine.state} STATE</span>
              </div>
            </div>

            {/* Giant 10-Foot Metric Readouts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="glass-subcard p-4 rounded-2xl">
                <div className="text-[11px] font-mono text-white/60 uppercase">BEARING TEMP</div>
                <div className="text-3xl font-black text-white mt-1">
                  {activeMachine.temperatureC.toFixed(1)}°C
                </div>
                <div className={`text-[11px] font-mono mt-1 ${activeMachine.temperatureC > 75 ? 'text-[#FF4466]' : 'text-[#00E599]'}`}>
                  {activeMachine.temperatureC > 75 ? '▲ Above Threshold' : '✓ Normal'}
                </div>
              </div>

              <div className="glass-subcard p-4 rounded-2xl">
                <div className="text-[11px] font-mono text-white/60 uppercase">RMS VIBRATION</div>
                <div className="text-3xl font-black text-white mt-1">
                  {activeMachine.vibrationMmS.toFixed(2)}
                </div>
                <div className="text-[11px] font-mono text-white/50 mt-1">mm/s velocity</div>
              </div>

              <div className="glass-subcard p-4 rounded-2xl">
                <div className="text-[11px] font-mono text-white/60 uppercase">OPERATING SPEED</div>
                <div className="text-3xl font-black text-[#00D2FF] mt-1">
                  {activeMachine.rpm}
                </div>
                <div className="text-[11px] font-mono text-white/50 mt-1">RPM Input</div>
              </div>

              <div className="glass-subcard p-4 rounded-2xl">
                <div className="text-[11px] font-mono text-white/60 uppercase">RISK LEVEL</div>
                <div className={`text-3xl font-black mt-1 ${
                  activeMachine.riskScore >= 70 ? 'text-[#FF2244]' : activeMachine.riskScore >= 40 ? 'text-[#FF8800]' : 'text-[#00E599]'
                }`}>
                  {activeMachine.riskScore}/100
                </div>
                <div className="text-[11px] font-mono text-white/50 mt-1">Prototype Index</div>
              </div>
            </div>

            {/* AI Action Guidance Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/15 flex items-start gap-3.5">
              <Wrench className="w-5 h-5 text-[#00D2FF] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-mono uppercase text-[#00D2FF] font-bold">
                  AUTONOMOUS ISO 17359 TRIAGE RECOMMENDATION
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  {activeMachine.urgentAction || 'Maintain nominal surveillance interval.'}
                </div>
              </div>
            </div>
          </div>

          {/* Plant AI Maintenance Synthesis Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-white/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-[#FF8800] shrink-0" />
              <div>
                <div className="text-xs font-mono text-white/60 uppercase">CONTROL ROOM AI DIGEST</div>
                <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                  {feed.aiSummary}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: All Machines Carousel & Alert Feed */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="text-xs font-mono uppercase text-white/70 tracking-wider flex items-center justify-between px-1">
            <span>MACHINERY FLEET OVERVIEW</span>
            <span className="text-[#00D2FF]">PRESS ◀ ▶ ON REMOTE</span>
          </div>

          <div className="space-y-3">
            {feed.machines.map((m, idx) => {
              const isFocused = focusedIndex === idx;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setFocusedIndex(idx);
                    setAutoRotate(false);
                  }}
                  className={`p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between border ${
                    isFocused
                      ? 'bg-gradient-to-r from-[#00D2FF]/20 via-[#0A50E2]/25 to-white/5 border-[#00D2FF] scale-[1.02] shadow-[0_0_24px_rgba(0,210,255,0.35)]'
                      : 'glass-panel border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      m.state === 'CRITICAL' ? 'bg-[#FF2244] animate-ping' : m.state === 'INVESTIGATE' ? 'bg-[#FF8800]' : 'bg-[#00E599]'
                    }`} />
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{m.name}</span>
                        {isFocused && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00D2FF] text-[#060B11] font-mono font-bold">
                            FOCUSED
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-white/60 mt-0.5">
                        {m.code} · {m.temperatureC.toFixed(1)}°C · {m.vibrationMmS.toFixed(2)} mm/s
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      m.state === 'CRITICAL' ? 'bg-[#FF2244]/25 text-[#FF4466]' : m.state === 'INVESTIGATE' ? 'bg-[#FF8800]/25 text-[#FFB020]' : 'bg-[#00E599]/20 text-[#00E599]'
                    }`}>
                      {m.state}
                    </span>
                    <div className="text-[11px] font-mono text-white/50 mt-1">
                      Risk {m.riskScore}/100
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Critical Alerts Stream */}
          <div className="glass-panel p-4 rounded-2xl border border-white/15 space-y-2.5 mt-2">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-white/70">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#FF2244]" />
                <span>LIVE INDUSTRIAL ALERTS</span>
              </span>
              <span className="text-[10px] text-white/40">{feed.criticalAlerts.length} events</span>
            </div>

            <div className="space-y-2">
              {feed.criticalAlerts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      a.severity === 'CRITICAL' ? 'bg-[#FF2244]' : 'bg-[#FF8800]'
                    }`} />
                    <span className="font-bold text-white shrink-0 font-mono">[{a.machineCode}]</span>
                    <span className="text-white/80 truncate">{a.message}</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50 shrink-0">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
