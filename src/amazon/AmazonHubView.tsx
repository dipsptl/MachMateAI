import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  Clock,
  Cloud,
  Cpu,
  ExternalLink,
  Layers,
  Radio,
  Shield,
  Sparkles,
  Terminal,
  Tv,
  Watch,
  Wifi,
  Zap,
} from 'lucide-react';
import { AmazonTrackId, AmazonTrackInfo } from './types';
import { FireTvExperience } from './firetv/FireTvExperience';
import { AlexaAgentExperience } from './alexa/AlexaAgentExperience';
import { BeeExperience } from './bee/BeeExperience';
import { RingExperience } from './ring/RingExperience';

export const AmazonHubView: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<AmazonTrackId | 'overview'>('overview');

  const tracks: AmazonTrackInfo[] = [
    {
      id: 'firetv',
      name: 'Fire TV Control Room',
      badge: 'TRACK 1: 10-FOOT DISPLAY',
      description:
        'Factory control-room dashboard optimized for large TV screens, D-pad remote navigation, and high-visibility plant monitoring.',
      status: 'READY FOR DEVICE/SIMULATOR',
      mode: 'simulator',
      endpoint: '/api/amazon/firetv/feed',
      details: 'Full D-Pad remote navigation (Arrow keys + Enter/Back), audible beacon alerts, auto-rotating carousel.',
    },
    {
      id: 'alexa',
      name: 'Alexa+ AI Voice & MCP',
      badge: 'TRACK 2: AGENT SKILL & MCP',
      description:
        'Self-hosted Model Context Protocol (MCP) server over Streamable HTTP exposing 7 real machinery tools for Alexa+ AI agents.',
      status: 'CONNECTED',
      mode: 'real',
      endpoint: '/api/mcp',
      details: '7 MCP Tools: get_machine_status, get_machine_health, get_high_risk_machines, get_machine_sensor_data, etc.',
    },
    {
      id: 'bee',
      name: 'Bee Wearable & Watch',
      badge: 'TRACK 3: FIELD WEARABLE',
      description:
        'Technician smartwatch integration delivering haptic vibration alerts, risk notifications, and hands-free voice maintenance triage.',
      status: 'READY FOR DEVICE/SIMULATOR',
      mode: 'development',
      endpoint: '/api/amazon/bee/webhook',
      details: 'Haptic alert patterns (triple pulse, double buzz), Apple Watch/Bee software ingestion, field query simulator.',
    },
    {
      id: 'ring',
      name: 'Ring Perimeter Security',
      badge: 'TRACK 4: CAMERA & EVENTS',
      description:
        'Industrial area monitoring linking Ring camera motion and safety perimeter events directly to MechMate machinery hazard states.',
      status: 'READY FOR DEVICE/SIMULATOR',
      mode: 'simulator',
      endpoint: '/api/amazon/ring/webhook',
      details: '4 Industrial camera zones, official simulator event bridge, causal correlation with critical rotating machines.',
    },
  ];

  return (
    <div className="space-y-6 select-none font-['Outfit']">
      {/* Track View Switcher Navigation Bar */}
      <div className="glass-panel p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-[#00D2FF]/30">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            onClick={() => setSelectedTrack('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTrack === 'overview'
                ? 'btn-indigo-primary text-white shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cloud className="w-4 h-4 text-[#00D2FF]" />
            <span>Amazon Ecosystem Hub</span>
          </button>

          <button
            onClick={() => setSelectedTrack('firetv')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTrack === 'firetv'
                ? 'btn-indigo-primary text-white shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="w-4 h-4 text-[#FF8800]" />
            <span>1. Fire TV</span>
          </button>

          <button
            onClick={() => setSelectedTrack('alexa')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTrack === 'alexa'
                ? 'btn-indigo-primary text-white shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4 text-[#00D2FF]" />
            <span>2. Alexa+ MCP</span>
          </button>

          <button
            onClick={() => setSelectedTrack('bee')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTrack === 'bee'
                ? 'btn-indigo-primary text-white shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Watch className="w-4 h-4 text-[#00E599]" />
            <span>3. Bee Wearable</span>
          </button>

          <button
            onClick={() => setSelectedTrack('ring')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTrack === 'ring'
                ? 'btn-indigo-primary text-white shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-4 h-4 text-[#00D2FF]" />
            <span>4. Ring Security</span>
          </button>
        </div>

        <div className="text-xs font-mono text-white/50 px-2 hidden sm:block">
          Amazon Developer Hackathon · 4 Primary Tracks
        </div>
      </div>

      {/* Render Selected Track Sub-Experience */}
      {selectedTrack === 'firetv' && (
        <FireTvExperience onExit={() => setSelectedTrack('overview')} />
      )}
      {selectedTrack === 'alexa' && <AlexaAgentExperience />}
      {selectedTrack === 'bee' && <BeeExperience />}
      {selectedTrack === 'ring' && <RingExperience />}

      {/* Overview Hub View */}
      {selectedTrack === 'overview' && (
        <div className="space-y-6">
          {/* Hero Architecture Card */}
          <div className="glass-panel-elevated p-6 rounded-3xl border border-[#00D2FF]/40 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/40 uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>UNIFIED INDUSTRIAL AI CORE</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                One MechMate Core · Four Amazon Experiences
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-3xl leading-relaxed">
                MechMate AI is architected as a single industrial reliability platform that simultaneously feeds
                large-screen <strong>Fire TV</strong> control rooms, <strong>Alexa+</strong> conversational agents via streamable MCP,
                technician <strong>Bee</strong> smartwatch wearables, and <strong>Ring</strong> perimeter security cameras from a single shared source of machine truth.
              </p>

              {/* ASCII / Visual Architecture Diagram */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-[11px] sm:text-xs text-[#00E599] overflow-x-auto leading-tight mt-4">
                <pre>{`               ┌────────────────────────────────────────────────────────┐
               │             MECHMATE AI INDUSTRIAL CORE                │
               │   • Machine State  • Sensors  • Risk  • ISO 17359      │
               └───────────────────────────┬────────────────────────────┘
                                           │
         ┌───────────────────┬─────────────┴───────┬────────────────────┐
         ▼                   ▼                     ▼                    ▼
┌──────────────────┐┌──────────────────┐┌──────────────────┐┌──────────────────┐
│  1. FIRE TV      ││  2. ALEXA+       ││  3. BEE          ││  4. RING         │
│  10-Foot Display ││  MCP HTTP Server ││  Field Wearable  ││  Area Monitoring │
│  D-Pad Remote UI ││  7 Grounded Tools││  Haptic Alerts   ││  Causal Cameras  │
└──────────────────┘└──────────────────┘└──────────────────┘└──────────────────┘`}</pre>
              </div>
            </div>
          </div>

          {/* 4 Tracks Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="glass-panel p-5 rounded-3xl border border-white/15 space-y-4 hover:border-[#00D2FF]/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15">
                      {track.badge}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        track.status === 'CONNECTED'
                          ? 'bg-[#00E599]/25 text-[#00E599] border-[#00E599]/50'
                          : track.status === 'READY FOR DEVICE/SIMULATOR'
                          ? 'bg-[#00D2FF]/25 text-[#00D2FF] border-[#00D2FF]/50'
                          : 'bg-[#FF8800]/25 text-[#FFB020] border-[#FF8800]/50'
                      }`}
                    >
                      {track.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {track.id === 'firetv' && <Tv className="w-5 h-5 text-[#FF8800]" />}
                    {track.id === 'alexa' && <Bot className="w-5 h-5 text-[#00D2FF]" />}
                    {track.id === 'bee' && <Watch className="w-5 h-5 text-[#00E599]" />}
                    {track.id === 'ring' && <Camera className="w-5 h-5 text-[#00D2FF]" />}
                    <span>{track.name}</span>
                  </h3>

                  <p className="text-xs text-white/70 leading-relaxed font-sans">
                    {track.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-white/70 space-y-1">
                    <div><span className="text-white/40">ENDPOINT:</span> {track.endpoint}</div>
                    <div><span className="text-white/40">CAPABILITY:</span> {track.details}</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTrack(track.id)}
                  className="w-full py-2.5 px-4 rounded-xl btn-indigo-primary text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
                >
                  <span>Open {track.name} Experience</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
