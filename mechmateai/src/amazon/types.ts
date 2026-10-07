import { MachineIntelligenceState, SensorKey } from '../models/types';

export type AmazonIntegrationStatus =
  | 'CONNECTED'
  | 'READY FOR DEVICE/SIMULATOR'
  | 'DEVELOPMENT MODE'
  | 'NOT CONFIGURED';

export type AmazonTrackId = 'firetv' | 'alexa' | 'bee' | 'ring';

export interface AmazonTrackInfo {
  id: AmazonTrackId;
  name: string;
  badge: string;
  description: string;
  status: AmazonIntegrationStatus;
  mode: 'real' | 'simulator' | 'development';
  endpoint: string;
  lastEventTime?: string;
  details: string;
  requiredCredentials?: string[];
}

// ----------------------------------------------------------------------------
// 1. FIRE TV TYPES
// ----------------------------------------------------------------------------
export interface FireTvFeedData {
  factoryName: string;
  timestamp: string;
  totalMachines: number;
  runningCount: number;
  criticalCount: number;
  investigateCount: number;
  averageHealthScore: number;
  mostCriticalMachine: {
    id: string;
    name: string;
    code: string;
    state: MachineIntelligenceState;
    temperatureC: number;
    vibrationMmS: number;
    riskScore: number;
    recommendedAction: string;
  };
  machines: {
    id: string;
    name: string;
    code: string;
    category: string;
    state: MachineIntelligenceState;
    riskScore: number;
    temperatureC: number;
    vibrationMmS: number;
    rpm: number;
    loadPercent: number;
    urgentAction?: string;
  }[];
  criticalAlerts: {
    id: string;
    machineCode: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    timestamp: string;
  }[];
  aiSummary: string;
}

// ----------------------------------------------------------------------------
// 2. ALEXA+ / MCP TYPES
// ----------------------------------------------------------------------------
export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface McpCallResult {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: string;
  durationMs: number;
}

export interface AlexaSpeechResponse {
  speech: string;
  reprompt?: string;
  cardTitle: string;
  cardContent: string;
  invokedTools: string[];
  data: unknown;
}

// ----------------------------------------------------------------------------
// 3. BEE WEARABLE TYPES
// ----------------------------------------------------------------------------
export interface BeeWearableNotification {
  id: string;
  machineId: string;
  machineCode: string;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  hapticPattern: 'triple_pulse' | 'double_buzz' | 'gentle_tap';
  guidanceText: string;
  timestamp: string;
  read: boolean;
  acknowledgedByTechnician?: boolean;
}

export interface BeeTechnicianQuery {
  id: string;
  audioPrompt?: string;
  textQuery: string;
  machineTargetId?: string;
  responseGuidance: string;
  timestamp: string;
}

// ----------------------------------------------------------------------------
// 4. RING INDUSTRIAL MONITORING TYPES
// ----------------------------------------------------------------------------
export type RingEventType =
  | 'motion_detected'
  | 'person_detected'
  | 'restricted_area_intrusion'
  | 'door_opened'
  | 'hazard_smoke_or_steam';

export interface RingIndustrialEvent {
  id: string;
  source: 'ring';
  sourceDeviceId: string;
  sourceDeviceName: string;
  eventType: RingEventType;
  location: string;
  associatedMachineId?: string;
  associatedMachineCode?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
  snapshotUrl?: string;
  confidence: number;
  aiSafetyActionTaken: string;
  rawPayload?: Record<string, unknown>;
}

export interface RingCameraZone {
  id: string;
  name: string;
  zone: 'RESTRICTED_ROTATING_MACHINERY' | 'MAINTENANCE_BAY' | 'LUBRICATION_STORAGE' | 'CONTROL_ROOM';
  cameraModel: string;
  machineId: string;
  machineCode: string;
  isOnline: boolean;
  motionSensitivity: number;
  lastMotionAt?: string;
  streamPlaceholder: string;
}
