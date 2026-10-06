import { machineStore } from '../../core/machineStore';
import { BeeTechnicianQuery, BeeWearableNotification } from '../types';

export interface BeeDeviceStatus {
  connected: boolean;
  mode: 'real_device' | 'development_adapter';
  deviceId: string;
  deviceType: 'Bee Hardware' | 'Apple Watch (Bee OS)' | 'Development Simulator';
  batteryLevel: number;
  firmwareVersion: string;
  lastSyncTimestamp: string;
  technicianName: string;
  assignedPlantSection: string;
}

/**
 * Bee Wearable & Apple Watch Integration Layer
 */
class BeeIntegrationService {
  private deviceStatus: BeeDeviceStatus = {
    connected: false,
    mode: 'development_adapter',
    deviceId: 'BEE-WATCH-DEV-007',
    deviceType: 'Apple Watch (Bee OS)',
    batteryLevel: 89,
    firmwareVersion: 'BeeOS 2.4.1-ind',
    lastSyncTimestamp: new Date().toISOString(),
    technicianName: 'Dave Miller (Chief Reliability Tech)',
    assignedPlantSection: 'Petrochemical Loop 2 & Cooling Towers',
  };

  private queryHistory: BeeTechnicianQuery[] = [
    {
      id: 'BEE-QRY-101',
      textQuery: 'Is Gearbox GT-204 safe to run through the shift?',
      machineTargetId: 'GT-204',
      responseGuidance:
        'GT-204 is in CRITICAL state (Risk 82/100). Bearing temp is climbing at +0.28°C/hr. Recommend reducing load to 65% and greasing DE bearing within 4 hours.',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
  ];

  public getStatus(): BeeDeviceStatus {
    return {
      ...this.deviceStatus,
      lastSyncTimestamp: new Date().toISOString(),
    };
  }

  public setRealDeviceCredentials(apiKey: string, deviceId: string) {
    if (apiKey && apiKey.length > 8 && deviceId) {
      this.deviceStatus.connected = true;
      this.deviceStatus.mode = 'real_device';
      this.deviceStatus.deviceId = deviceId;
      this.deviceStatus.deviceType = 'Bee Hardware';
    } else {
      this.deviceStatus.connected = false;
      this.deviceStatus.mode = 'development_adapter';
    }
  }

  public getNotifications(): BeeWearableNotification[] {
    return machineStore.getBeeNotifications();
  }

  public getQueryHistory(): BeeTechnicianQuery[] {
    return this.queryHistory;
  }

  /**
   * Process a technician query coming from the Bee microphone or speech-to-text
   */
  public handleTechnicianVoiceQuery(
    textQuery: string,
    machineHint?: string
  ): BeeTechnicianQuery {
    const q = textQuery.toLowerCase();
    let targetCode = machineHint || 'GT-204';
    if (q.includes('pump') || q.includes('108')) targetCode = 'GP-108';
    else if (q.includes('motor') || q.includes('108')) targetCode = 'GP-108';
    else if (q.includes('compressor') || q.includes('310')) targetCode = 'GC-310';

    const machine = machineStore.getMachineById(targetCode);
    const diag = machine ? machineStore.getMachineDiagnostics(machine.id) : undefined;

    let guidance = '';
    if (!machine || !diag) {
      guidance = `Unable to locate machine ${targetCode}. Please specify an active asset: GT-204, GP-108, or GC-310.`;
    } else if (q.includes('safe') || q.includes('risk') || q.includes('status')) {
      guidance = `${machine.code} (${machine.name}) is in ${diag.intelligenceState} state. Risk score: ${diag.prototypeRiskScore}/100. ${diag.headlineConclusion}. Recommended action: ${diag.inspectionPlan[0]?.title || 'Routine observation'}.`;
    } else if (q.includes('maintenance') || q.includes('do') || q.includes('inspect')) {
      const top = diag.inspectionPlan[0];
      guidance = `Primary procedure for ${machine.code}: ${top?.title || 'Inspect lubrication'}. Tools needed: ${top?.requiredTools.join(', ') || 'Vibration probe, thermal gun'}.`;
    } else {
      guidance = `${machine.code} is currently ${machine.operatingState}. Temp: ${diag.sensorStats.temperature?.currentValue}°C, Vibration: ${diag.sensorStats.vibration?.currentValue} mm/s. State: ${diag.intelligenceState}.`;
    }

    const recorded: BeeTechnicianQuery = {
      id: `BEE-QRY-${Date.now().toString().slice(-4)}`,
      textQuery,
      machineTargetId: machine?.id,
      responseGuidance: guidance,
      timestamp: new Date().toISOString(),
    };

    this.queryHistory = [recorded, ...this.queryHistory].slice(0, 20);
    return recorded;
  }

  /**
   * Dispatch an urgent notification from MechMate core directly to the technician's wrist
   */
  public dispatchWearableAlert(
    machineId: string,
    title: string,
    guidance: string,
    priority: 'CRITICAL' | 'HIGH' | 'NORMAL' = 'HIGH'
  ): BeeWearableNotification {
    const machine = machineStore.getMachineById(machineId);
    return machineStore.addBeeNotification({
      machineId: machine?.id || machineId,
      machineCode: machine?.code || machineId,
      title,
      priority,
      hapticPattern: priority === 'CRITICAL' ? 'triple_pulse' : priority === 'HIGH' ? 'double_buzz' : 'gentle_tap',
      guidanceText: guidance,
      timestamp: new Date().toISOString(),
      read: false,
      acknowledgedByTechnician: false,
    });
  }
}

export const beeService = new BeeIntegrationService();
