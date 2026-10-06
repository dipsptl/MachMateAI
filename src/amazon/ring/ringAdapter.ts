import { machineStore } from '../../core/machineStore';
import { RingCameraZone, RingEventType, RingIndustrialEvent } from '../types';

export const INDUSTRIAL_RING_CAMERAS: RingCameraZone[] = [
  {
    id: 'cam-gearbox-bay-01',
    name: 'Stick Up Cam Elite - Gearbox Bay',
    zone: 'RESTRICTED_ROTATING_MACHINERY',
    cameraModel: 'Ring Stick Up Cam Elite PoE',
    machineId: 'GT-204',
    machineCode: 'GT-204',
    isOnline: true,
    motionSensitivity: 85,
    lastMotionAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    streamPlaceholder: 'Live PoE Feed · Petrochemical Loop 2 Zone A',
  },
  {
    id: 'cam-motor-trench-02',
    name: 'Floodlight Cam Pro - Slurry Trench',
    zone: 'MAINTENANCE_BAY',
    cameraModel: 'Ring Floodlight Cam Wired Pro 3D Motion',
    machineId: 'GP-108',
    machineCode: 'GP-108',
    isOnline: true,
    motionSensitivity: 75,
    lastMotionAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    streamPlaceholder: 'Live 1080p HDR Feed · Motor Cell Trench',
  },
  {
    id: 'cam-pump-bay-03',
    name: 'Spotlight Cam Plus - Boiler Feed',
    zone: 'RESTRICTED_ROTATING_MACHINERY',
    cameraModel: 'Ring Spotlight Cam Plus',
    machineId: 'GP-108',
    machineCode: 'GP-108',
    isOnline: true,
    motionSensitivity: 90,
    lastMotionAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    streamPlaceholder: 'Live Night Vision Feed · Boiler Pump Perimeter',
  },
  {
    id: 'cam-compressor-04',
    name: 'Indoor Cam 2nd Gen - Compressor Vault',
    zone: 'CONTROL_ROOM',
    cameraModel: 'Ring Indoor Cam Gen 2',
    machineId: 'GC-310',
    machineCode: 'GC-310',
    isOnline: true,
    motionSensitivity: 60,
    lastMotionAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    streamPlaceholder: 'Live 1080p Feed · Compressor Sound Enclosure',
  },
];

/**
 * Adapter converting official Ring Webhook / Simulator payloads into MechMate Industrial Events
 */
export function ingestRingEvent(payload: {
  deviceId: string;
  kind?: string;
  eventType?: RingEventType;
  description?: string;
  confidence?: number;
  location?: string;
  associatedMachineId?: string;
}): RingIndustrialEvent {
  const camera =
    INDUSTRIAL_RING_CAMERAS.find((c) => c.id === payload.deviceId) ||
    INDUSTRIAL_RING_CAMERAS[0];

  const eventType: RingEventType =
    payload.eventType ||
    (payload.kind === 'motion'
      ? 'motion_detected'
      : payload.kind === 'ding'
      ? 'person_detected'
      : 'restricted_area_intrusion');

  const targetMachineId = payload.associatedMachineId || camera.machineId;
  const machine = machineStore.getMachineById(targetMachineId);
  const diagnostics = machine ? machineStore.getMachineDiagnostics(machine.id) : undefined;

  // Causal correlation: If Ring detects motion in a restricted area while machine is in CRITICAL/INVESTIGATE state
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let safetyAction = 'Event recorded in industrial safety log.';

  if (camera.zone === 'RESTRICTED_ROTATING_MACHINERY') {
    if (diagnostics && (diagnostics.intelligenceState === 'CRITICAL' || diagnostics.intelligenceState === 'INVESTIGATE')) {
      severity = 'critical';
      safetyAction = `CRITICAL SAFETY ALERT: Motion detected inside hazardous perimeter of ${machine?.name} while machine is in ${diagnostics.intelligenceState} state. Operator warning dispatched to Bee wearable and control room.`;
    } else {
      severity = 'high';
      safetyAction = `Restricted safety boundary crossed near ${machine?.name || 'rotating equipment'}. Audible perimeter warning siren triggered.`;
    }
  } else if (eventType === 'person_detected') {
    severity = 'medium';
    safetyAction = 'Personnel recognized in maintenance corridor. Badge presence validated with shift registry.';
  } else {
    severity = 'low';
    safetyAction = 'Ambient movement detected in storage zone.';
  }

  const created = machineStore.addRingEvent({
    source: 'ring',
    sourceDeviceId: camera.id,
    sourceDeviceName: camera.name,
    eventType,
    location: payload.location || camera.streamPlaceholder,
    associatedMachineId: machine?.id,
    associatedMachineCode: machine?.code,
    severity,
    timestamp: new Date().toISOString(),
    status: 'new',
    confidence: payload.confidence || 0.92,
    aiSafetyActionTaken: safetyAction,
    rawPayload: payload as Record<string, unknown>,
  });

  return created;
}
