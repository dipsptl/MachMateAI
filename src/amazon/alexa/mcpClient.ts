import { McpCallResult } from '../types';

/**
 * Minimal MCP client (Streamable HTTP, JSON-RPC 2.0).
 * The Alexa+ console uses this to call the MechMate MCP server over HTTP at /api/mcp,
 * exactly like an external MCP client (MCP Inspector, Alexa+) would.
 */
export interface McpWireEntry {
  at: string;
  method: string;
  request: unknown;
  response: unknown;
  ms: number;
}

const ENDPOINT = '/api/mcp';
const PROTOCOL_VERSION = '2025-11-25';
let nextId = 1;
let initialized: Promise<void> | null = null;
let wireLog: McpWireEntry[] = [];

export const getWireLog = () => wireLog;
export const clearWireLog = () => {
  wireLog = [];
};

async function rpc(method: string, params?: unknown): Promise<unknown> {
  const request = { jsonrpc: '2.0', id: nextId++, method, params };
  const t0 = performance.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify(request),
  });
  const response = await res.json();
  wireLog = [
    ...wireLog,
    { at: new Date().toISOString(), method, request, response, ms: Math.round(performance.now() - t0) },
  ].slice(-12);
  if (response.error) throw new Error(`MCP error ${response.error.code}: ${response.error.message}`);
  return response.result;
}

async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      await rpc('initialize', {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: 'mechmate-alexa-console', version: '1.0.0' },
      });
      // Notification: no id, server answers 202 with no body
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      });
    })().catch((e) => {
      initialized = null;
      throw e;
    });
  }
  return initialized;
}

export async function mcpCallTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<McpCallResult> {
  await ensureInitialized();
  const t0 = performance.now();
  const result = (await rpc('tools/call', { name, arguments: args })) as {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
  const text = result.content?.[0]?.text ?? 'null';
  let output: unknown;
  try {
    output = JSON.parse(text);
  } catch {
    output = text;
  }
  return {
    tool: name,
    input: args,
    output,
    timestamp: new Date().toISOString(),
    durationMs: Math.round(performance.now() - t0),
  };
}
