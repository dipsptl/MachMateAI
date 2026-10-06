import { INITIAL_MACHINES } from '../data/sampleData';
import { evaluateMachineIntelligence } from '../ai/reasoningEngine';
import {
  DiagnosticSummary,
  MachineIntelligenceState,
  MachineProfile,
  SensorKey,
} from '../models/types';
import {
  BeeWearableNotification,
  FireTvFeedData,
  RingIndustrialEvent,
} from '../amazon/types';

// In-memory unified state singleton for all Amazon tracks and core UI
class MechMateMachineStore {
  private machines: MachineProfile[];
  private ringEvents: RingIndustrialEvent[];
  private beeNotifications: BeeWearableNotification[];
  private listeners: Set<() => void>;

  constructor() {
    this.machines = [...INITIAL_MACHINES];
    this.ringEvents = [
      {
        id: 'RING-EVT-001',
        source: 'ring',
        sourceDeviceId: 'cam-gearbox-bay-01',
        sourceDeviceName: 'Stick Up Cam Elite - Gearbox Bay',
        eventType: 'restricted_area_intrusion',
        location: 'Cooling Tower Cell B-04 · Restricted Zone A',
        associatedMachineId: 'GT-204',
        associatedMachineCode: 'GT-204',
        severity: 'high',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        status: 'investigating',
        confidence: 0.94,
        aiSafetyActionTaken:
          'Motion detected inside safety perimeter while GT-204 bearing temp is at 74.8°C. Safety audible beacon activated and warning logged.',
      },
      {
        id: 'RING-EVT-002',
        source: 'ring',
        sourceDeviceId: 'cam-motor-trench-02',
        sourceDeviceName: 'Ring Floodlight Cam Pro - Slurry Trench',
        eventType: 'motion_detected',
        location: 'Slurry Feed Motor GP-108 Perimeter',
        associatedMachineId: 'GP-108',
        associatedMachineCode: 'GP-108',
        severity: 'medium',
        timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        status: 'resolved',
        confidence: 0.88,
        aiSafetyActionTaken:
          'Authorized maintenance technician detected carrying grease gun. Maintenance log updated with technician presence.',
      },
    ];

    this.beeNotifications = [
      {
        id: 'BEE-NOTIF-001',
        machineId: 'GT-204',
        machineCode: 'GT-204',
        title: 'CRITICAL: DE Bearing Thermal Runaway',
        priority: 'CRITICAL',
        hapticPattern: 'triple_pulse',
        guidanceText:
          'GT-204 bearing temperature is +18% above baseline (74.8°C). Inspect ISO VG 320 oil sump level and DE seal within 24h.',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        read: false,
        acknowledgedByTechnician: false,
      },
      {
        id: 'BEE-NOTIF-002',
        machineId: 'GP-108',
        machineCode: 'GP-108',
        title: 'WATCH: Cavitation & Pressure Spike',
        priority: 'NORMAL',
        hapticPattern: 'gentle_tap',
        guidanceText:
          'Feed pump suction pressure dropped to 3.2 bar. Verify deaerator inlet valve position.',
        timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
        read: true,
        acknowledgedByTechnician: true,
      },
    ];

    this.listeners = new Set();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Store listener error:', err);
      }
    });
  }

  public getAllMachines(): MachineProfile[] {
    return this.machines;
  }

  public getMachineById(idOrCode: string): MachineProfile | undefined {
    const q = idOrCode.trim().toLowerCase();
    return this.machines.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.code.toLowerCase() === q ||
        m.name.toLowerCase().includes(q)
    );
  }

  public updateMachine(updated: MachineProfile) {
    this.machines = this.machines.map((m) => (m.id === updated.id ? updated : m));
    this.notify();
  }

  public getMachineDiagnostics(machineId: string): DiagnosticSummary | undefined {
    const m = this.getMachineById(machineId);
    if (!m) return undefined;
    return evaluateMachineIntelligence(m);
  }

  public getHighRiskMachines(): {
    machine: MachineProfile;
    diagnostics: DiagnosticSummary;
    riskScore: number;
    state: MachineIntelligenceState;
    recommendedAction: string;
  }[] {
    return this.machines
      .map((m) => {
        const d = evaluateMachineIntelligence(m);
        return {
          machine: m,
          diagnostics: d,
          riskScore: d.prototypeRiskScore,
          state: d.intelligenceState,
          recommendedAction:
            d.inspectionPlan[0]?.title || d.headlineConclusion || 'Maintain normal watch.',
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  public getMachineSensorData(
    machineId: string,
    channel?: SensorKey
  ): {
    machineCode: string;
    machineName: string;
    timestamp: string;
    channels: Record<string, { currentValue: number; unit: string; isAnomalous: boolean }>;
  } | undefined {
    const m = this.getMachineById(machineId);
    if (!m) return undefined;
    const d = evaluateMachineIntelligence(m);

    const channels: Record<string, { currentValue: number; unit: string; isAnomalous: boolean }> =
      {};
    for (const [key, stat] of Object.entries(d.sensorStats)) {
      if (!channel || channel === key) {
        channels[key] = {
          currentValue: stat.currentValue,
          unit: stat.unit,
          isAnomalous: stat.isAnomalous,
        };
      }
    }

    const latestPt = m.timeSeries[m.timeSeries.length - 1];
    return {
      machineCode: m.code,
      machineName: m.name,
      timestamp: latestPt?.timestamp || new Date().toISOString(),
      channels,
    };
  }

  public getFailurePrediction(machineId: string) {
    const m = this.getMachineById(machineId);
    if (!m) return undefined;
    const d = evaluateMachineIntelligence(m);

    return {
      machineCode: m.code,
      machineName: m.name,
      intelligenceState: d.intelligenceState,
      overallRiskScore: d.prototypeRiskScore,
      operatingMargin: d.operatingMargin,
      confidencePercent: d.aiConfidence,
      headlineConclusion: d.headlineConclusion,
      topRootCauses: d.rootCauseCandidates.slice(0, 3).map((rc) => ({
        failureMode: rc.failureMode,
        component: rc.component,
        probabilityScore: rc.probabilityScore,
        engineeringMechanism: rc.engineeringMechanism,
        urgency: rc.urgency,
        recommendedAction: rc.recommendedAction,
      })),
    };
  }

  public getMaintenanceRecommendation(machineId: string) {
    const m = this.getMachineById(machineId);
    if (!m) return undefined;
    const d = evaluateMachineIntelligence(m);

    return {
      machineCode: m.code,
      machineName: m.name,
      state: d.intelligenceState,
      inspectionPlan: d.inspectionPlan,
      immediateActionRequired: d.intelligenceState === 'CRITICAL',
      recommendedImmediateSteps: d.inspectionPlan
        .filter((item) => item.urgency.includes('IMMEDIATE') || item.priority === 1)
        .map((item) => item.title),
    };
  }

  public getRecentAlerts(limit = 10): {
    id: string;
    source: 'MACHINE_TELEMETRY' | 'RING_PERIMETER' | 'BEE_WEARABLE';
    machineCode: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    timestamp: string;
  }[] {
    const alerts: {
      id: string;
      source: 'MACHINE_TELEMETRY' | 'RING_PERIMETER' | 'BEE_WEARABLE';
      machineCode: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      message: string;
      timestamp: string;
    }[] = [];

    // 1. Critical and anomalous machine telemetry alerts
    this.machines.forEach((m) => {
      const d = evaluateMachineIntelligence(m);
      if (d.intelligenceState === 'CRITICAL' || d.intelligenceState === 'INVESTIGATE') {
        alerts.push({
          id: `ALERT-${m.code}`,
          source: 'MACHINE_TELEMETRY',
          machineCode: m.code,
          severity: d.intelligenceState === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          message: `${m.name}: ${d.headlineConclusion}`,
          timestamp: m.timeSeries[m.timeSeries.length - 1]?.timestamp || new Date().toISOString(),
        });
      }
    });

    // 2. Ring industrial security & perimeter alerts
    this.ringEvents.forEach((re) => {
      alerts.push({
        id: re.id,
        source: 'RING_PERIMETER',
        machineCode: re.associatedMachineCode || 'PERIMETER',
        severity:
          re.severity === 'critical'
            ? 'CRITICAL'
            : re.severity === 'high'
            ? 'WARNING'
            : 'INFO',
        message: `Ring ${re.sourceDeviceName}: ${re.eventType.replace(/_/g, ' ')} in ${re.location}`,
        timestamp: re.timestamp,
      });
    });

    // 3. Bee notifications
    this.beeNotifications.forEach((bn) => {
      alerts.push({
        id: bn.id,
        source: 'BEE_WEARABLE',
        machineCode: bn.machineCode,
        severity: bn.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        message: `Bee Wearable: ${bn.title}`,
        timestamp: bn.timestamp,
      });
    });

    return alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // --------------------------------------------------------------------------
  // RING METHODS
  // --------------------------------------------------------------------------
  public getRingEvents(): RingIndustrialEvent[] {
    return this.ringEvents;
  }

  public addRingEvent(event: Omit<RingIndustrialEvent, 'id'>): RingIndustrialEvent {
    const fullEvent: RingIndustrialEvent = {
      id: `RING-EVT-${Date.now().toString().slice(-5)}`,
      ...event,
    };
    this.ringEvents = [fullEvent, ...this.ringEvents].slice(0, 50);

    // If intrusion happens near a machine in critical state, auto-trigger a Bee push notification!
    if (fullEvent.associatedMachineId && (fullEvent.severity === 'high' || fullEvent.severity === 'critical')) {
      const machine = this.getMachineById(fullEvent.associatedMachineId);
      if (machine) {
        this.addBeeNotification({
          machineId: machine.id,
          machineCode: machine.code,
          title: `PERIMETER ALERT: ${fullEvent.location}`,
          priority: 'CRITICAL',
          hapticPattern: 'triple_pulse',
          guidanceText: `Ring Camera detected ${fullEvent.eventType.replace(/_/g, ' ')} near ${machine.name}. Verify technician clearance before energizing.`,
          timestamp: new Date().toISOString(),
          read: false,
          acknowledgedByTechnician: false,
        });
      }
    }

    this.notify();
    return fullEvent;
  }

  // --------------------------------------------------------------------------
  // BEE METHODS
  // --------------------------------------------------------------------------
  public getBeeNotifications(): BeeWearableNotification[] {
    return this.beeNotifications;
  }

  public addBeeNotification(
    notification: Omit<BeeWearableNotification, 'id'>
  ): BeeWearableNotification {
    const fullNotif: BeeWearableNotification = {
      id: `BEE-NOTIF-${Date.now().toString().slice(-5)}`,
      ...notification,
    };
    this.beeNotifications = [fullNotif, ...this.beeNotifications].slice(0, 50);
    this.notify();
    return fullNotif;
  }

  public acknowledgeBeeNotification(id: string) {
    this.beeNotifications = this.beeNotifications.map((n) =>
      n.id === id ? { ...n, acknowledgedByTechnician: true, read: true } : n
    );
    this.notify();
  }

  // --------------------------------------------------------------------------
  // FIRE TV FEED
  // --------------------------------------------------------------------------
  public getFireTvFeed(): FireTvFeedData {
    const all = this.machines.map((m) => {
      const d = evaluateMachineIntelligence(m);
      const latest = m.timeSeries[m.timeSeries.length - 1];
      return {
        id: m.id,
        name: m.name,
        code: m.code,
        category: m.category,
        state: d.intelligenceState,
        riskScore: d.prototypeRiskScore,
        temperatureC: d.sensorStats.temperature?.currentValue || 65,
        vibrationMmS: d.sensorStats.vibration?.currentValue || 2.4,
        rpm: d.sensorStats.rpm?.currentValue || m.inputSpeedRpm,
        loadPercent: d.sensorStats.load?.currentValue || 72,
        urgentAction: d.inspectionPlan[0]?.title,
      };
    });

    const criticalCount = all.filter((m) => m.state === 'CRITICAL').length;
    const investigateCount = all.filter((m) => m.state === 'INVESTIGATE').length;
    const runningCount = all.length;
    const avgHealth = Math.round(
      all.reduce((acc, m) => acc + (100 - m.riskScore), 0) / Math.max(1, all.length)
    );

    const sortedByRisk = [...all].sort((a, b) => b.riskScore - a.riskScore);
    const mostCrit = sortedByRisk[0];

    const alerts = this.getRecentAlerts(5).map((a) => ({
      id: a.id,
      machineCode: a.machineCode,
      severity: a.severity,
      message: a.message,
      timestamp: a.timestamp,
    }));

    return {
      factoryName: 'MechMate Industrial Plant Loop Alpha',
      timestamp: new Date().toISOString(),
      totalMachines: all.length,
      runningCount,
      criticalCount,
      investigateCount,
      averageHealthScore: avgHealth,
      mostCriticalMachine: {
        id: mostCrit.id,
        name: mostCrit.name,
        code: mostCrit.code,
        state: mostCrit.state,
        temperatureC: mostCrit.temperatureC,
        vibrationMmS: mostCrit.vibrationMmS,
        riskScore: mostCrit.riskScore,
        recommendedAction: mostCrit.urgentAction || 'Regular monitoring',
      },
      machines: all,
      criticalAlerts: alerts,
      aiSummary:
        criticalCount > 0
          ? `WARNING: ${criticalCount} machine(s) in CRITICAL state. ${mostCrit.code} requires immediate inspection of Drive-End bearing and lubricant viscosity.`
          : 'All rotating assets operating within nominal ISO 20816 vibration margins.',
    };
  }
}

export const machineStore = new MechMateMachineStore();
