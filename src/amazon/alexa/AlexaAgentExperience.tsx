import React, { useEffect, useState } from 'react';
import {
  Bot,
  Check,
  Code2,
  Copy,
  Cpu,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Volume2,
  Wrench,
  Zap,
} from 'lucide-react';
import { MCP_TOOL_DEFINITIONS, processAlexaVoiceQuery } from './mcpTools';
import { mcpCallTool, getWireLog, clearWireLog, McpWireEntry } from './mcpClient';
import { AlexaSpeechResponse, McpCallResult } from '../types';

export const AlexaAgentExperience: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agent' | 'mcp_inspector'>('agent');
  const [queryInput, setQueryInput] = useState<string>('Which machine has the highest failure risk?');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [lastSpeechResponse, setLastSpeechResponse] = useState<AlexaSpeechResponse>({
    speech: 'Connecting to the MechMate MCP server...',
    cardTitle: 'Connecting',
    cardContent: 'Calling /api/mcp over Streamable HTTP',
    invokedTools: [],
    data: null,
  });
  const [wireLog, setWireLog] = useState<McpWireEntry[]>([]);
  const [mcpError, setMcpError] = useState<string>('');

  // MCP Inspector State
  const [selectedTool, setSelectedTool] = useState<string>('get_high_risk_machines');
  const [toolArgsJson, setToolArgsJson] = useState<string>('{\n  "machineId": "GT-204"\n}');
  const [lastMcpResult, setLastMcpResult] = useState<McpCallResult | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState<boolean>(false);

  const samplePrompts = [
    'Which machine has the highest failure risk?',
    'Why is Machine 04 showing high risk?',
    'What maintenance should I perform?',
    'Show me machines requiring immediate inspection.',
    'What happened to Machine 02?',
  ];

  const handleRunQuery = async (promptText: string) => {
    setQueryInput(promptText);
    setMcpError('');
    clearWireLog();
    let response: AlexaSpeechResponse;
    try {
      // Every tool call below is a real JSON-RPC request to POST /api/mcp
      response = await processAlexaVoiceQuery(promptText, mcpCallTool);
    } catch (e) {
      setMcpError(e instanceof Error ? e.message : String(e));
      return;
    }
    setLastSpeechResponse(response);
    setWireLog([...getWireLog()]);

    // Speak response via browser Web Speech API if supported
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(response.speech);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    handleRunQuery('Which machine has the highest failure risk?');
    mcpCallTool('get_high_risk_machines', {}).then(setLastMcpResult).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExecuteMcpTool = async () => {
    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(toolArgsJson);
    } catch {
      // Fallback
    }
    try {
      setLastMcpResult(await mcpCallTool(selectedTool, parsedArgs));
    } catch (e) {
      setMcpError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleCopyMcpEndpoint = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/mcp`);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2500);
  };

  return (
    <div className="space-y-6 select-none font-['Outfit']">
      {/* Top Header & Track Badge */}
      <div className="glass-panel-elevated p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 border border-[#00D2FF]/30 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D2FF] to-[#0A50E2] p-0.5 shadow-[0_0_20px_rgba(0,210,255,0.4)] flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                ALEXA+ <span className="text-[#00D2FF]">AGENT & MCP SERVER</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40 uppercase">
                ACTIVE MCP PROTOCOL
              </span>
            </div>
            <p className="text-xs text-white/70 font-mono mt-0.5">
              Industrial voice assistant powered by Model Context Protocol (MCP) streamable tools
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/15">
          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'agent'
                ? 'btn-indigo-primary text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Agent Interface</span>
          </button>
          <button
            onClick={() => setActiveTab('mcp_inspector')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'mcp_inspector'
                ? 'btn-indigo-primary text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>MCP Tool Inspector (7 Tools)</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: VOICE AGENT EXPERIENCE
          ===================================================================== */}
      {activeTab === 'agent' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Columns: Interactive Alexa Voice Agent */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="glass-panel p-5 rounded-3xl border border-white/15 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-white/70">
                <span className="uppercase text-[#00D2FF] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ALEXA+ INDUSTRIAL VOICE PROMPT</span>
                </span>
                <span className="text-[10px] text-white/40">Real MCP Grounded Data</span>
              </div>

              {/* Input Form with Mic Button */}
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunQuery(queryInput);
                  }}
                  placeholder="Ask Alexa about machines, risk, or maintenance..."
                  className="w-full glass-input text-xs sm:text-sm text-white placeholder-white/50 pl-4 pr-12 py-3 rounded-2xl"
                />
                <button
                  onClick={() => handleRunQuery(queryInput)}
                  className="absolute right-2 px-3 py-1.5 btn-indigo-primary rounded-xl text-xs font-bold text-white cursor-pointer shadow-md"
                >
                  Ask
                </button>
              </div>

              {/* Sample Prompts from Hackathon Spec */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-mono text-white/60 uppercase">
                  RECOMMENDED VOICE INQUIRIES:
                </div>
                <div className="flex flex-wrap gap-2">
                  {samplePrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleRunQuery(p)}
                      className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00D2FF]/40 text-xs text-white/90 hover:text-white transition-all cursor-pointer text-left font-medium"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {mcpError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/40 text-xs font-mono text-red-300">
                MCP error: {mcpError}
              </div>
            )}

            {/* Real JSON-RPC wire log (POST /api/mcp) */}
            {wireLog.length > 0 && (
              <div className="glass-panel p-5 rounded-3xl border border-[#00E599]/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono uppercase text-white/70">
                  <span>MCP WIRE LOG · POST /api/mcp (JSON-RPC 2.0)</span>
                  <span className="text-[#00E599] font-bold">LIVE</span>
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {wireLog.map((w, i) => (
                    <details key={i} className="rounded-xl bg-black/40 border border-white/10 px-3 py-1.5">
                      <summary className="cursor-pointer text-[11px] font-mono text-[#00D2FF]">
                        {w.method}
                        {w.method === 'tools/call'
                          ? ` → ${(w.request as { params?: { name?: string } }).params?.name}`
                          : ''}{' '}
                        <span className="text-white/40">({w.ms}ms)</span>
                      </summary>
                      <pre className="mt-1.5 text-[10px] font-mono text-[#00E599] overflow-x-auto max-h-[160px]">
                        {JSON.stringify({ request: w.request, response: w.response }, null, 2).slice(0, 1800)}
                      </pre>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Invoked MCP Tools Pipeline */}
            <div className="glass-panel p-5 rounded-3xl border border-white/15 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-white/70">
                <span>INVOKED MCP SPECIALIST TOOLS</span>
                <span className="text-[#00E599] font-bold">ZERO HALLUCINATIONS</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lastSpeechResponse.invokedTools.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/40"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{t}()</span>
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-white/50 font-mono mt-1">
                Alexa+ queries the self-hosted MCP server via Streamable HTTP, resolving live telemetry before synthesizing responses.
              </p>
            </div>
          </div>

          {/* Right 6 Columns: Alexa Audio Response & Card Output */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="glass-panel-elevated p-6 rounded-3xl border border-[#00D2FF]/40 space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-[#00D2FF] font-bold">
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-[#00E599]' : ''}`} />
                  <span>ALEXA+ SPOKEN ANSWER</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isSpeaking ? 'bg-[#00E599]/25 text-[#00E599]' : 'bg-white/10 text-white/60'
                }`}>
                  {isSpeaking ? 'SPEAKING LIVE...' : 'SYNTHESIS READY'}
                </span>
              </div>

              {/* Giant Speech Bubble */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/15">
                <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
                  "{lastSpeechResponse.speech}"
                </p>
              </div>

              {/* Alexa Display Card (Echo Show / Fire TV Companion) */}
              <div className="p-4 rounded-2xl bg-[#091522]/90 border border-[#00D2FF]/30 space-y-2">
                <div className="text-xs font-mono text-[#00D2FF] uppercase font-bold">
                  ALEXA COMPANION DISPLAY CARD: {lastSpeechResponse.cardTitle}
                </div>
                <pre className="text-xs font-mono text-white/90 whitespace-pre-wrap leading-relaxed font-sans">
                  {lastSpeechResponse.cardContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: MCP SERVER INSPECTOR (7 SPEC TOOLS)
          ===================================================================== */}
      {activeTab === 'mcp_inspector' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Columns: Tool Selector & Parameters */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="glass-panel p-5 rounded-3xl border border-white/15 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-white/70">
                <span>SELECT MCP TOOL</span>
                <span className="text-[#00D2FF]">JSON-RPC 2.0</span>
              </div>

              <div className="space-y-2">
                {MCP_TOOL_DEFINITIONS.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => {
                      setSelectedTool(tool.name);
                      if (tool.name === 'get_high_risk_machines' || tool.name === 'get_recent_alerts') {
                        setToolArgsJson('{\n  "limit": 5\n}');
                      } else {
                        setToolArgsJson('{\n  "machineId": "GT-204"\n}');
                      }
                    }}
                    className={`w-full p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                      selectedTool === tool.name
                        ? 'bg-gradient-to-r from-[#00D2FF]/20 to-[#0A50E2]/25 border-[#00D2FF] shadow-lg'
                        : 'glass-subcard border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">
                        {tool.name}()
                      </span>
                      {selectedTool === tool.name && (
                        <span className="text-[10px] font-mono text-[#00D2FF]">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                      {tool.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Tool Parameters Input */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-white/70">
                  <span>ARGUMENTS (JSON)</span>
                  <span className="text-[10px] text-white/40">Editable</span>
                </div>
                <textarea
                  value={toolArgsJson}
                  onChange={(e) => setToolArgsJson(e.target.value)}
                  rows={4}
                  className="w-full glass-input font-mono text-xs text-white p-3 rounded-xl focus:border-[#00D2FF] outline-none"
                />
              </div>

              <button
                onClick={handleExecuteMcpTool}
                className="w-full py-2.5 btn-indigo-primary text-xs font-mono font-bold rounded-xl text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Play className="w-3.5 h-3.5 text-white" />
                <span>Execute MCP Tool (POST /api/mcp)</span>
              </button>
            </div>
          </div>

          {/* Right 7 Columns: MCP Live Execution Output & Endpoint Spec */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="glass-panel-elevated p-5 rounded-3xl border border-white/15 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono text-[#00D2FF] font-bold">
                  STREAMABLE HTTP MCP ENDPOINT
                </span>
                <button
                  onClick={handleCopyMcpEndpoint}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-mono text-white cursor-pointer"
                >
                  {copiedEndpoint ? <Check className="w-3 h-3 text-[#00E599]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedEndpoint ? 'Copied' : 'Copy /api/mcp URL'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 font-mono text-xs text-white/80 border border-white/10 break-all">
                POST {window.location.origin}/api/mcp
              </div>
              <p className="text-[11px] text-white/50 font-mono">
                Conforms to Model Context Protocol (MCP) streamable HTTP format. Spec 2025-11-25. Test it with MCP Inspector or any MCP client.
              </p>
            </div>

            {/* Live Tool Execution Result */}
            {lastMcpResult && (
              <div className="glass-panel p-5 rounded-3xl border border-white/15 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold">
                    TOOL OUTPUT: <span className="text-[#00D2FF]">{lastMcpResult.tool}()</span>
                  </span>
                  <span className="text-white/50">{lastMcpResult.durationMs}ms</span>
                </div>
                <pre className="p-4 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono text-[#00E599] overflow-x-auto max-h-[360px] leading-relaxed">
                  {JSON.stringify(lastMcpResult.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
