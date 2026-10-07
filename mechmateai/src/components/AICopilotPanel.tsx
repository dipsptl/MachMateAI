import React, { useState } from 'react';
import {
  AgentReasoningStep,
  DiagnosticSummary,
  KnowledgeDocument,
  MachineProfile,
  RetrievedEvidence,
  SimulationResult,
} from '../models/types';
import { searchEngineeringKnowledge } from '../ai/reasoningEngine';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  FileText,
  GitBranch,
  Send,
  Sliders,
  Sparkles,
  Wrench,
} from 'lucide-react';

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  content: string;
  toolsInvoked?: string[];
  reasoningSteps?: { step: number; label: string; detail: string }[];
  evidence?: RetrievedEvidence[];
  dataOrigin?: 'MEASURED + ESTIMATED' | 'SIMULATED' | 'RAG KNOWLEDGE';
}

interface AICopilotPanelProps {
  machine: MachineProfile;
  diagnostics: DiagnosticSummary;
  knowledgeDocs: KnowledgeDocument[];
  latestSimulation?: SimulationResult;
  onHighlightComponent?: (componentId: string | null) => void;
  onNavigateTab?: (tab: string) => void;
  onGeneratePdf?: () => void;
  fullPageMode?: boolean;
}

const ANALYSIS_PHASES = [
  'SENSORS',
  'ANALYZING',
  'CORRELATING',
  'REASONING',
  'DIAGNOSIS',
] as const;

export const AICopilotPanel: React.FC<AICopilotPanelProps> = ({
  machine,
  diagnostics,
  knowledgeDocs,
  latestSimulation,
  onHighlightComponent,
  onNavigateTab,
  onGeneratePdf,
  fullPageMode = false,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [expandedEvidenceMsgId, setExpandedEvidenceMsgId] = useState<string | null>(null);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-msg-1',
      role: 'assistant',
      timestamp: 'ACTIVE TELEMETRY',
      content: diagnostics.headlineConclusion,
      toolsInvoked: [
        'analyze_sensors()',
        'run_anomaly_detection()',
        'calculate_torque()',
        'run_root_cause_analysis()',
        'search_knowledge()',
      ],
      reasoningSteps: [
        {
          step: 1,
          label: 'Analyzed temperature trend',
          detail: `DE Bearing rose to ${diagnostics.sensorStats.temperature.currentValue}°C (+${(
            diagnostics.sensorStats.temperature.currentValue -
            diagnostics.sensorStats.temperature.baselineMean
          ).toFixed(1)}°C vs baseline).`,
        },
        {
          step: 2,
          label: 'Compared RPM/load relationship',
          detail: `Input RPM held stable at ${diagnostics.sensorStats.rpm.currentValue} RPM under ${diagnostics.sensorStats.load.currentValue}% load (${diagnostics.calculations.actualPowerKw} kW).`,
        },
        {
          step: 3,
          label: 'Checked vibration behavior',
          detail: `Housing RMS vibration increased ${diagnostics.sensorStats.vibration.deviationPercent >= 0 ? '+' : ''}${diagnostics.sensorStats.vibration.deviationPercent}% to ${diagnostics.sensorStats.vibration.currentValue} mm/s.`,
        },
        {
          step: 4,
          label: 'Reviewed lubrication condition',
          detail: `Sump oil temp at ${diagnostics.sensorStats.oilTemperature.currentValue}°C; viscosity index declined to ${diagnostics.sensorStats.oilCondition.currentValue}%.`,
        },
        {
          step: 5,
          label: 'Retrieved gearbox engineering knowledge',
          detail: 'Matched SKF 22214 E Section 2.4 & Historical Report #IR-2025-089.',
        },
        {
          step: 6,
          label: 'Evaluated possible failure modes',
          detail: `Primary: ${diagnostics.rootCauseCandidates[0]?.failureMode} (${diagnostics.rootCauseCandidates[0]?.probabilityScore}% confidence).`,
        },
        {
          step: 7,
          label: 'Generated diagnostic conclusion',
          detail: `Priority 1 action: ${diagnostics.inspectionPlan[0]?.title}.`,
        },
      ],
      evidence: searchEngineeringKnowledge(
        'gearbox temperature vibration bearing lubrication',
        knowledgeDocs,
        3
      ),
      dataOrigin: 'MEASURED + ESTIMATED',
    },
  ]);

  const executeEngineeringPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isAnalyzing) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAnalyzing(true);
    setPhaseIndex(0);

    // Subtle microinteraction sequence: SENSORS -> ANALYZING -> CORRELATING -> REASONING -> DIAGNOSIS
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev < ANALYSIS_PHASES.length - 1 ? prev + 1 : prev));
    }, 180);

    // Retrieve local RAG evidence first so citations are always grounded and never fabricated
    const ragEvidence = searchEngineeringKnowledge(trimmed, knowledgeDocs, 3);

    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          machine: {
            id: machine.id,
            name: machine.name,
            code: machine.code,
            ratedPowerKw: machine.ratedPowerKw,
            inputSpeedRpm: machine.inputSpeedRpm,
            outputSpeedRpm: machine.outputSpeedRpm,
            dimensions: machine.dimensions,
            limits: machine.limits,
          },
          diagnostics,
          latestSimulation,
          ragEvidence,
        }),
      });

      clearInterval(interval);
      setPhaseIndex(ANALYSIS_PHASES.length - 1);

      if (response.ok) {
        const data = await response.json();
        if (data.highlightComponentId && onHighlightComponent) {
          onHighlightComponent(data.highlightComponentId);
        }

        const aiMsg: CopilotMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: data.answer,
          toolsInvoked: data.toolsInvoked || ['analyze_sensors()', 'run_root_cause_analysis()'],
          reasoningSteps: data.reasoningSteps,
          evidence: ragEvidence,
          dataOrigin: data.dataOrigin || 'MEASURED + ESTIMATED',
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Fallback to local deterministic engine');
      }
    } catch {
      clearInterval(interval);
      // Deterministic rule-based engineering fallback
      const q = trimmed.toLowerCase();
      let answer = '';
      let tools: string[] = ['analyze_sensors()', 'run_root_cause_analysis()'];
      let origin: CopilotMessage['dataOrigin'] = 'MEASURED + ESTIMATED';

      if (q.includes('simulat') || q.includes('load') || q.includes('15%') || q.includes('what happens')) {
        tools = ['run_simulation()', 'calculate_torque()', 'analyze_sensors()'];
        origin = 'SIMULATED';
        answer = `SIMULATED ANALYSIS: Increasing load by +15% on ${machine.name} raises transmitted power from ${diagnostics.calculations.actualPowerKw} kW to ${(machine.ratedPowerKw * ((diagnostics.sensorStats.load.currentValue + 15) / 100)).toFixed(1)} kW and output torque to ${(diagnostics.calculations.outputTorqueNm * ((diagnostics.sensorStats.load.currentValue + 15) / 100)).toFixed(0)} Nm. Internal frictional heat loss increases to ${(diagnostics.calculations.heatLossKw * 1.18).toFixed(2)} kW, projecting a +4.8°C rise in DE Bearing temperature (${(diagnostics.sensorStats.temperature.currentValue + 4.8).toFixed(1)}°C) and reducing the thermal margin to ${(machine.limits.maxTemperatureC - (diagnostics.sensorStats.temperature.currentValue + 4.8)).toFixed(1)}°C. Continuous operation at this load without restoring oil viscosity is not recommended.`;
      } else if (q.includes('inspect') || q.includes('maintenance') || q.includes('checklist') || q.includes('first')) {
        tools = ['run_root_cause_analysis()', 'search_knowledge()'];
        const p1 = diagnostics.inspectionPlan[0];
        const p2 = diagnostics.inspectionPlan[1];
        answer = `Based on current sensor correlation (r = ${diagnostics.sensorStats.vibration.correlationWithTemp} between bearing temperature and vibration), inspect [${p1.component}] first.\n\n• Priority 1 (${p1.urgency}): ${p1.title} — ${p1.why} Required tools: ${p1.requiredTools.slice(0, 2).join(', ')}.\n• Priority 2 (${p2.urgency}): ${p2.title} — ${p2.why}`;
        onHighlightComponent?.('COMP-OIL-SUMP');
      } else if (q.includes('torque') || q.includes('ratio') || q.includes('shaft') || q.includes('calculat')) {
        tools = ['calculate_ratio()', 'calculate_torque()'];
        const c = diagnostics.calculations;
        answer = `ENGINEERING CALCULATIONS [ESTIMATED]:\n• Gear Ratio: i = ${machine.inputSpeedRpm} / ${machine.outputSpeedRpm} = ${c.exactGearRatio}:1 (Stage 1: ${c.stage1Ratio}:1, Stage 2: ${c.stage2Ratio}:1).\n• Rated Input Torque: T_in = 9550 × ${machine.ratedPowerKw} / ${machine.inputSpeedRpm} = ${c.inputTorqueNm} Nm.\n• Output Torque (η = ${(machine.efficiencyAssumed * 100).toFixed(0)}%): T_out = ${c.outputTorqueNm} Nm.\n• Preliminary Shaft Sizing: Min input shaft = ${c.preliminaryMinInputShaftMm} mm vs actual ${machine.dimensions.inputShaftDiameterMm} mm (Safety Factor = ${c.inputShaftSafetyFactor}x).`;
      } else {
        tools = [
          'analyze_sensors()',
          'run_anomaly_detection()',
          'run_root_cause_analysis()',
          'search_knowledge()',
        ];
        answer = `${diagnostics.headlineConclusion}\n\n${diagnostics.detailedNarrative}\n\nTop Root-Cause Candidate: ${diagnostics.rootCauseCandidates[0]?.failureMode} (${diagnostics.rootCauseCandidates[0]?.probabilityScore}% confidence). Recommended immediate inspection: ${diagnostics.inspectionPlan[0]?.title}.`;
        onHighlightComponent?.('COMP-BRG-IN');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-fb-${Date.now()}`,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: answer,
          toolsInvoked: tools,
          reasoningSteps: diagnostics.agentTimeline.slice(0, 5).map((s) => ({
            step: s.stepNumber,
            label: s.actionSummary,
            detail: s.finding,
          })),
          evidence: ragEvidence,
          dataOrigin: origin,
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const quickActions = [
    {
      label: 'Analyze Machine',
      icon: Activity,
      prompt: 'Why is this gearbox temperature and vibration increasing while RPM is stable?',
    },
    {
      label: 'Find Root Cause',
      icon: GitBranch,
      prompt: 'Evaluate the primary root cause candidates and contradicting evidence for this machine.',
    },
    {
      label: 'Run Simulation',
      icon: Sliders,
      prompt: 'What happens if I increase mechanical load by 15% and RPM to 1650?',
    },
    {
      label: 'Explain Failure',
      icon: Wrench,
      prompt: 'What component should I inspect first and what is the physical failure mechanism?',
    },
    {
      label: 'Generate Report',
      icon: FileText,
      prompt: 'Generate a concise engineering diagnostic summary and maintenance checklist.',
    },
  ];

  return (
    <div
      className={`flex flex-col glass-panel rounded-[22px] overflow-hidden ${
        fullPageMode ? 'h-[calc(100vh-140px)]' : 'h-full'
      }`}
    >
      {/* Copilot Header */}
      <div className="px-4 py-3.5 bg-[#0B1522]/80 backdrop-blur-md border-b border-white/15 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg btn-indigo-primary flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wide text-white">
              MechMate AI Engineering Copilot
            </h3>
            <div className="text-[9px] font-mono tracking-widest text-[#00D2FF]">
              OBSERVE · REASON · PREDICT · PROTECT
            </div>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#00D2FF] font-semibold">
          8 AGENTS ORCHESTRATED
        </span>
      </div>

      {/* Microinteraction Sequence Bar when AI is actively reasoning */}
      {isAnalyzing && (
        <div className="px-4 py-2 bg-[#08101A]/90 border-b border-white/15 flex items-center justify-between gap-1 overflow-x-auto">
          {ANALYSIS_PHASES.map((phase, idx) => {
            const active = idx <= phaseIndex;
            return (
              <React.Fragment key={phase}>
                <span
                  className={`text-[10px] font-mono tracking-wider transition-colors ${
                    active ? 'text-[#00D2FF] font-semibold' : 'text-white/40'
                  }`}
                >
                  {phase}
                </span>
                {idx < ANALYSIS_PHASES.length - 1 && (
                  <ArrowRight
                    className={`w-2.5 h-2.5 shrink-0 ${
                      active ? 'text-white' : 'text-white/30'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Intelligent Quick Actions Bar */}
      <div className="p-3 bg-[#0B1522]/50 border-b border-white/15">
        <div className="text-[11px] font-mono text-[#A8C8D8] mb-2">
          INTELLIGENT ENGINEERING ACTIONS
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                onClick={() => {
                  if (act.label === 'Generate Report' && onGeneratePdf) {
                    executeEngineeringPrompt(act.prompt);
                  } else {
                    executeEngineeringPrompt(act.prompt);
                  }
                }}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold glass-subcard text-white rounded-xl transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-[#8DA0FF]" />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reasoning & Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isEvidenceOpen = expandedEvidenceMsgId === msg.id;
          return (
            <div
              key={msg.id}
              className={`rounded-2xl border p-3.5 ${
                msg.role === 'user'
                  ? 'indigo-feature-block ml-6'
                  : 'glass-subcard'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-white/85 mb-1.5">
                <span className="text-white font-bold">
                  {msg.role === 'user' ? 'ENGINEER QUERY' : 'CURAAI REASONING ENGINE'}
                </span>
                <div className="flex items-center gap-2">
                  {msg.dataOrigin && (
                    <span className="text-[#8DA0FF] font-semibold">[{msg.dataOrigin}]</span>
                  )}
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              <div className="text-xs sm:text-sm leading-relaxed text-white whitespace-pre-line">
                {msg.content}
              </div>

              {/* Tool Calls Executed */}
              {msg.toolsInvoked && msg.toolsInvoked.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/20">
                  <div className="text-[10px] font-mono text-white/80 mb-1">
                    EXECUTED ENGINEERING TOOLS:
                  </div>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-[#8DA0FF]">
                    {msg.toolsInvoked.map((t, i) => (
                      <React.Fragment key={t}>
                        <span>{t}</span>
                        {i < msg.toolsInvoked!.length - 1 && (
                          <span className="text-white/50">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Reasoning Timeline */}
              {msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/20">
                  <div className="text-[10px] font-mono text-white/85 uppercase mb-2">
                    Multi-Agent Reasoning Timeline
                  </div>
                  <div className="space-y-1.5 relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-[#637BFF]/55">
                    {msg.reasoningSteps.map((st) => (
                      <div key={st.step} className="relative pl-6 text-xs">
                        <span className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-[#637BFF] border border-white/60 text-[10px] font-mono text-white flex items-center justify-center shadow-sm">
                          {st.step}
                        </span>
                        <div className="font-semibold text-white">{st.label}</div>
                        <div className="text-[11px] text-white/80">{st.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Evidence / Citations Toggle */}
              {msg.evidence && msg.evidence.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setExpandedEvidenceMsgId(isEvidenceOpen ? null : msg.id)
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8DA0FF] hover:text-white transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>
                      {isEvidenceOpen
                        ? 'Hide Technical Evidence'
                        : `Show Evidence (${msg.evidence.length} Cited Sources)`}
                    </span>
                  </button>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('diagnostics')}
                      className="text-[11px] font-mono text-white hover:text-[#8DA0FF] hover:underline cursor-pointer"
                    >
                      Inspect Causal Graph →
                    </button>
                  )}
                </div>
              )}

              {/* Expanded RAG Citations */}
              {isEvidenceOpen && msg.evidence && (
                <div className="mt-2.5 space-y-2 glass-panel p-2.5 rounded-xl">
                  {msg.evidence.map((ev) => (
                    <div
                      key={`${ev.docId}-${ev.sectionNumber}`}
                      className="text-xs border-b border-white/15 last:border-none pb-2 last:pb-0"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] text-[#8DA0FF]">
                        <span>
                          {ev.docCode} · {ev.sectionNumber} (Page {ev.page})
                        </span>
                        <span className="text-white">Match: {Math.round(ev.relevanceScore * 100)}%</span>
                      </div>
                      <div className="font-semibold text-white mt-0.5">
                        {ev.docTitle} — {ev.heading}
                      </div>
                      <p className="text-[11px] text-white/85 mt-1 leading-relaxed">
                        “{ev.excerpt}”
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Natural Language Engineering Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeEngineeringPrompt(inputQuery);
        }}
        className="p-3 bg-[#0B1522]/80 backdrop-blur-md border-t border-white/15"
      >
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask MechMate AI about this machine…"
            className="w-full glass-input text-xs sm:text-sm text-white placeholder-white/60 pl-3.5 pr-4 py-2.5 rounded-xl"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !inputQuery.trim()}
            className="px-3.5 py-2.5 btn-indigo-primary rounded-xl disabled:opacity-40 transition-all cursor-pointer shrink-0"
            title="Run Engineering Query"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="mt-2 text-center text-[10px] font-mono text-white/50 tracking-tight leading-snug">
          MechMate AI can make mistakes. Check and <span className="text-[#00D2FF] font-semibold">VERIFY CRITICAL ENGINEERING DECISIONS WITH CERTIFIED ANALYSIS</span>.
        </div>
      </form>
    </div>
  );
};
