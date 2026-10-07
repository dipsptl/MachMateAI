import { machineStore } from '../../core/machineStore';
import { McpToolDefinition, McpCallResult, AlexaSpeechResponse } from '../types';
import { SensorKey } from '../../models/types';

export const MCP_TOOL_DEFINITIONS: McpToolDefinition[] = [
  {
    name: 'get_machine_status',
    description: 'Get operational status, running state, category, speed, and rated power for an industrial machine.',
    parameters: {
      type: 'object',
      properties: {
        machineId: {
          type: 'string',
          description: 'The unique ID or code of the machine (e.g. "GT-204", "GP-108", "GP-108", "GC-310").',
        },
      },
      required: ['machineId'],
    },
  },
  {
    name: 'get_machine_health',
    description: 'Get intelligence state (NORMAL, WATCH, INVESTIGATE, CRITICAL), risk score, and headline diagnostic conclusion for a machine.',
    parameters: {
      type: 'object',
      properties: {
        machineId: {
          type: 'string',
          description: 'The machine code or ID.',
        },
      },
      required: ['machineId'],
    },
  },
  {
    name: 'get_high_risk_machines',
    description: 'Retrieve all industrial machines sorted by risk score, highlighting those requiring immediate attention or investigation.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_machine_sensor_data',
    description: 'Get real-time physical sensor telemetry (temperature, vibration, rpm, load, pressure, oil condition) for a machine.',
    parameters: {
      type: 'object',
      properties: {
        machineId: {
          type: 'string',
          description: 'The machine code or ID.',
        },
        channel: {
          type: 'string',
          enum: ['temperature', 'vibration', 'rpm', 'load', 'pressure', 'oilTemperature', 'oilCondition'],
          description: 'Optional specific sensor channel to query.',
        },
      },
      required: ['machineId'],
    },
  },
  {
    name: 'get_failure_prediction',
    description: 'Retrieve physics-informed failure prediction, root-cause failure modes, and degradation mechanisms for a machine.',
    parameters: {
      type: 'object',
      properties: {
        machineId: {
          type: 'string',
          description: 'The machine code or ID.',
        },
      },
      required: ['machineId'],
    },
  },
  {
    name: 'get_maintenance_recommendation',
    description: 'Get prioritized ISO 17359 inspection plans, required tools, and immediate maintenance procedures for a machine.',
    parameters: {
      type: 'object',
      properties: {
        machineId: {
          type: 'string',
          description: 'The machine code or ID.',
        },
      },
      required: ['machineId'],
    },
  },
  {
    name: 'get_recent_alerts',
    description: 'Retrieve recent industrial alerts across physical telemetry, Ring perimeter security, and Bee wearable channels.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of alerts to retrieve (default 10).',
        },
      },
    },
  },
];

/**
 * Execute an MCP Tool against the unified MechMate Machine Store
 */
export function executeMcpTool(
  toolName: string,
  args: Record<string, unknown> = {}
): McpCallResult {
  const startTime = performance.now();
  let output: unknown;

  const machineIdArg = String(args.machineId || args.id || '').trim();

  switch (toolName) {
    case 'get_machine_status': {
      const m = machineStore.getMachineById(machineIdArg);
      if (!m) {
        output = { error: `Machine '${machineIdArg}' not found. Available machines: GT-204, GP-108, GC-310.` };
      } else {
        output = {
          id: m.id,
          name: m.name,
          code: m.code,
          category: m.category,
          location: m.location,
          operatingState: m.operatingState,
          ratedPowerKw: m.ratedPowerKw,
          inputSpeedRpm: m.inputSpeedRpm,
          outputSpeedRpm: m.outputSpeedRpm,
          gearRatio: m.nominalGearRatio,
        };
      }
      break;
    }

    case 'get_machine_health': {
      const m = machineStore.getMachineById(machineIdArg);
      if (!m) {
        output = { error: `Machine '${machineIdArg}' not found.` };
      } else {
        const d = machineStore.getMachineDiagnostics(m.id);
        output = {
          code: m.code,
          name: m.name,
          state: d?.intelligenceState || 'NORMAL',
          riskScore: d?.prototypeRiskScore || 0,
          aiConfidence: d?.aiConfidence || 90,
          headlineConclusion: d?.headlineConclusion || 'Nominal operating condition.',
          operatingMargin: d?.operatingMargin || 85,
        };
      }
      break;
    }

    case 'get_high_risk_machines': {
      const highRisk = machineStore.getHighRiskMachines();
      output = {
        totalMachines: highRisk.length,
        criticalCount: highRisk.filter((m) => m.state === 'CRITICAL').length,
        investigateCount: highRisk.filter((m) => m.state === 'INVESTIGATE').length,
        rankedMachines: highRisk.map((h) => ({
          code: h.machine.code,
          name: h.machine.name,
          riskScore: h.riskScore,
          state: h.state,
          recommendedAction: h.recommendedAction,
        })),
      };
      break;
    }

    case 'get_machine_sensor_data': {
      const channel = args.channel ? (String(args.channel) as SensorKey) : undefined;
      const data = machineStore.getMachineSensorData(machineIdArg, channel);
      if (!data) {
        output = { error: `Machine '${machineIdArg}' not found.` };
      } else {
        output = data;
      }
      break;
    }

    case 'get_failure_prediction': {
      const pred = machineStore.getFailurePrediction(machineIdArg);
      if (!pred) {
        output = { error: `Machine '${machineIdArg}' not found.` };
      } else {
        output = pred;
      }
      break;
    }

    case 'get_maintenance_recommendation': {
      const maint = machineStore.getMaintenanceRecommendation(machineIdArg);
      if (!maint) {
        output = { error: `Machine '${machineIdArg}' not found.` };
      } else {
        output = maint;
      }
      break;
    }

    case 'get_recent_alerts': {
      const limit = typeof args.limit === 'number' ? args.limit : 10;
      output = {
        count: limit,
        alerts: machineStore.getRecentAlerts(limit),
      };
      break;
    }

    default:
      output = {
        error: `Unknown tool '${toolName}'. Supported tools: ${MCP_TOOL_DEFINITIONS.map((t) => t.name).join(', ')}`,
      };
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    tool: toolName,
    input: args,
    output,
    timestamp: new Date().toISOString(),
    durationMs,
  };
}

/**
 * Alexa+ Natural Language Agent Query Handler
 * Resolves operator natural language queries into grounded MCP tool calls and answers.
 */
export type McpToolExecutor = (
  toolName: string,
  args?: Record<string, unknown>
) => McpCallResult | Promise<McpCallResult>;

export async function processAlexaVoiceQuery(
  query: string,
  exec: McpToolExecutor = executeMcpTool
): Promise<AlexaSpeechResponse> {
  const q = query.toLowerCase();

  // Pattern 1: Highest failure risk
  if (!q.includes('why') && (q.includes('highest') || q.includes('most critical') || q.includes('high risk') || q.includes('failing'))) {
    const result = await exec('get_high_risk_machines');
    const data = result.output as { rankedMachines: Array<{ code: string; name: string; riskScore: number; state: string; recommendedAction: string }> };
    const top = data.rankedMachines[0];

    const speech = `Machine ${top.code}, ${top.name}, has the highest failure risk with a risk score of ${top.riskScore} out of 100. It is currently in ${top.state} state. The recommended maintenance action is to ${top.recommendedAction}.`;

    return {
      speech,
      cardTitle: `Highest Risk: ${top.code}`,
      cardContent: `${top.name} - Risk Score: ${top.riskScore}/100 (${top.state})\nAction: ${top.recommendedAction}`,
      invokedTools: ['get_high_risk_machines'],
      data,
    };
  }

  // Identify machine ID if mentioned
  let targetMachine = 'GT-204';
  if (q.includes('04') || q.includes('gt-204') || q.includes('tower') || q.includes('gearbox')) {
    targetMachine = 'GT-204';
  } else if (q.includes('108') || q.includes('gp-') || q.includes('pump') || q.includes('motor')) {
    targetMachine = 'GP-108';
  } else if (q.includes('310') || q.includes('gc-') || q.includes('compressor')) {
    targetMachine = 'GC-310';
  }

  // Pattern 2: Why is Machine X showing high risk / what happened?
  if (q.includes('why') || q.includes('happened') || q.includes('problem') || q.includes('cause')) {
    const predResult = await exec('get_failure_prediction', { machineId: targetMachine });
    const sensResult = await exec('get_machine_sensor_data', { machineId: targetMachine });

    const pred = predResult.output as {
      machineCode: string;
      machineName: string;
      intelligenceState: string;
      headlineConclusion: string;
      topRootCauses: Array<{ failureMode: string; probabilityScore: number; engineeringMechanism: string }>;
    };
    const sens = sensResult.output as {
      channels: Record<string, { currentValue: number; unit: string; isAnomalous: boolean }>;
    };

    const topCause = pred.topRootCauses?.[0];
    const tempVal = sens?.channels?.temperature?.currentValue;
    const vibVal = sens?.channels?.vibration?.currentValue;

    const speech = `Machine ${pred.machineCode} is showing ${pred.intelligenceState} state because ${pred.headlineConclusion}. Physical sensors measure bearing temperature at ${tempVal} degrees Celsius and vibration velocity at ${vibVal} millimeters per second. The primary root cause identified is ${topCause?.failureMode} with ${topCause?.probabilityScore} percent confidence due to ${topCause?.engineeringMechanism}.`;

    return {
      speech,
      cardTitle: `Diagnostic Analysis: ${pred.machineCode}`,
      cardContent: `${pred.headlineConclusion}\nTop Cause: ${topCause?.failureMode} (${topCause?.probabilityScore}%)\nTemp: ${tempVal}°C | Vibration: ${vibVal} mm/s`,
      invokedTools: ['get_failure_prediction', 'get_machine_sensor_data'],
      data: { pred, sens },
    };
  }

  // Pattern 3: What maintenance should I perform?
  if (q.includes('maintenance') || q.includes('perform') || q.includes('inspect') || q.includes('checklist')) {
    const maintResult = await exec('get_maintenance_recommendation', { machineId: targetMachine });
    const data = maintResult.output as {
      machineCode: string;
      machineName: string;
      state: string;
      recommendedImmediateSteps: string[];
      inspectionPlan: Array<{ priority: number; title: string; urgency: string; requiredTools: string[] }>;
    };

    const topStep = data.inspectionPlan?.[0];
    const speech = `For Machine ${data.machineCode}, immediate priority is to ${topStep?.title}. Urgency is ${topStep?.urgency}. Required tools include ${topStep?.requiredTools?.join(', ')}.`;

    return {
      speech,
      cardTitle: `Maintenance Plan: ${data.machineCode}`,
      cardContent: data.inspectionPlan?.map((p) => `Priority ${p.priority}: ${p.title} (${p.urgency})`).join('\n') || 'No immediate action.',
      invokedTools: ['get_maintenance_recommendation'],
      data,
    };
  }

  // Pattern 4: Alerts
  if (q.includes('alert') || q.includes('warning') || q.includes('alarm')) {
    const alertResult = await exec('get_recent_alerts', { limit: 5 });
    const data = alertResult.output as { alerts: Array<{ machineCode: string; severity: string; message: string }> };

    const critAlerts = data.alerts.filter((a) => a.severity === 'CRITICAL');
    const speech = `There are ${data.alerts.length} recent industrial alerts across the plant, including ${critAlerts.length} critical alarms. The most urgent alert is on ${data.alerts[0]?.machineCode}: ${data.alerts[0]?.message}.`;

    return {
      speech,
      cardTitle: `Recent Industrial Alerts (${data.alerts.length})`,
      cardContent: data.alerts.map((a) => `[${a.severity}] ${a.machineCode}: ${a.message}`).join('\n'),
      invokedTools: ['get_recent_alerts'],
      data,
    };
  }

  // Fallback: general status
  const statResult = await exec('get_machine_status', { machineId: targetMachine });
  const healthResult = await exec('get_machine_health', { machineId: targetMachine });

  const stat = statResult.output as { name: string; code: string; location: string; operatingState: string };
  const health = healthResult.output as { state: string; riskScore: number; headlineConclusion: string };

  const speech = `Machine ${stat.code}, ${stat.name}, located at ${stat.location}, is currently ${stat.operatingState}. It is evaluated at ${health.state} state with a risk score of ${health.riskScore} out of 100. ${health.headlineConclusion}`;

  return {
    speech,
    cardTitle: `Machine Status: ${stat.code}`,
    cardContent: `${stat.name} (${stat.operatingState})\nState: ${health.state}\nRisk Score: ${health.riskScore}/100\n${health.headlineConclusion}`,
    invokedTools: ['get_machine_status', 'get_machine_health'],
    data: { stat, health },
  };
}
