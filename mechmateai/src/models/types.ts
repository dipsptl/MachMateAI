export type MachineIntelligenceState = 'NORMAL' | 'WATCH' | 'INVESTIGATE' | 'CRITICAL';

export type DataOriginTag = 'MEASURED' | 'PREDICTED' | 'SIMULATED' | 'ESTIMATED';

export type MachineCategory = 'Gearbox' | 'Motor' | 'Pump' | 'Compressor' | 'Fan' | 'Bearing';

export type SensorKey =
  | 'temperature'
  | 'vibration'
  | 'rpm'
  | 'load'
  | 'pressure'
  | 'current'
  | 'oilTemperature'
  | 'oilCondition';

export interface MachineDimensions {
  housingLengthMm: number;
  housingWidthMm: number;
  housingHeightMm: number;
  wallThicknessMm: number;
  baseHeightMm: number;
  inputShaftDiameterMm: number;
  outputShaftDiameterMm: number;
}

export interface OperatingLimits {
  maxTemperatureC: number;
  warningTemperatureC: number;
  maxVibrationMmS: number;
  warningVibrationMmS: number;
  ratedRpm: number;
  maxLoadPercent: number;
  minOilPressureBar: number;
  maxOilTemperatureC: number;
  minOilConditionIndex: number;
}

export interface ComponentSpec {
  id: string;
  name: string;
  category: 'housing' | 'shafts' | 'bearings' | 'gears' | 'lubrication' | 'sensors';
  partNumber: string;
  material: string;
  location3D: [number, number, number]; // Normalized CAD coordinates
  status: 'NOMINAL' | 'WATCH' | 'DEGRADED' | 'CRITICAL';
  temperatureC: number;
  vibrationMmS: number;
  notes: string;
}

export interface SensorNodeConfig {
  id: string;
  key: SensorKey;
  label: string;
  shortLabel: string;
  unit: string;
  componentId: string;
  componentName: string;
  location3D: [number, number, number];
  baselineMean: number;
  baselineStd: number;
  warningThreshold: number;
  criticalThreshold: number;
  isLowerWorse?: boolean; // e.g., Oil Condition or Oil Pressure
}

export interface TimeSeriesPoint {
  timestamp: string;
  hourOffset: number;
  temperature: number;       // Bearing/Housing Temp (°C)
  vibration: number;         // RMS Vibration velocity (mm/s)
  rpm: number;               // Input Shaft Speed (RPM)
  load: number;              // Operating Load (%)
  pressure: number;          // Lubrication Oil Pressure (bar)
  current: number;           // Drive Motor Current (A)
  oilTemperature: number;    // Sump Oil Temp (°C)
  oilCondition: number;      // Dielectric / Viscosity Index (0-100%)
}

export interface MachineProfile {
  id: string;
  name: string;
  code: string;
  category: MachineCategory;
  manufacturer: string;
  model: string;
  location: string;
  serviceDate: string;
  operatingState: 'RUNNING' | 'STANDBY' | 'MAINTENANCE';
  ratedPowerKw: number;
  inputSpeedRpm: number;
  outputSpeedRpm: number;
  nominalGearRatio: number;
  efficiencyAssumed: number;
  dimensions: MachineDimensions;
  limits: OperatingLimits;
  components: ComponentSpec[];
  sensors: SensorNodeConfig[];
  timeSeries: TimeSeriesPoint[];
  maintenanceHistory: {
    date: string;
    type: string;
    technician: string;
    summary: string;
  }[];
}

export interface SensorFeatureStats {
  key: SensorKey;
  label: string;
  unit: string;
  componentName: string;
  currentValue: number;
  baselineMean: number;
  baselineStd: number;
  rollingMean12h: number;
  rollingStd12h: number;
  zScore: number;
  deviationPercent: number;
  rateOfChangePerHour: number;
  trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE';
  correlationWithLoad: number;
  correlationWithTemp: number;
  isAnomalous: boolean;
  severity: 'NOMINAL' | 'WATCH' | 'INVESTIGATE' | 'CRITICAL';
  anomalyScore: number; // 0 to 100
  explanation: string;
  origin: DataOriginTag;
}

export interface RootCauseNode {
  id: string;
  title: string;
  parameterChange: string;
  category: 'OPERATING_CONDITION' | 'THERMAL' | 'TRIBOLOGY' | 'MECHANICAL' | 'SYMPTOM';
  confidence: number;
  whyItMatters: string;
  supportingEvidence: string[];
  sensorEvidence: {
    sensorLabel: string;
    valueStr: string;
    deltaStr: string;
    origin: DataOriginTag;
  }[];
  engineeringExplanation: string;
  recommendedInspection: string;
  componentId: string;
  nextNodeIds: string[];
}

export interface RootCauseCandidate {
  id: string;
  failureMode: string;
  component: string;
  componentId: string;
  probabilityScore: number; // 0 to 100 confidence
  supportingSignals: string[];
  contradictingSignals: string[];
  engineeringMechanism: string;
  recommendedAction: string;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AgentReasoningStep {
  stepNumber: number;
  agentName:
    | 'Sensor Intelligence Agent'
    | 'Anomaly Detection Agent'
    | 'Root Cause Agent'
    | 'Engineering Reasoning Agent'
    | 'Simulation Agent'
    | 'Knowledge Agent'
    | 'Maintenance Agent'
    | 'Report Agent';
  actionSummary: string;
  finding: string;
  confidence: number;
  durationMs: number;
  status: 'COMPLETED' | 'ACTIVE';
}

export interface InspectionPlanItem {
  priority: number;
  title: string;
  component: string;
  componentId: string;
  urgency: 'IMMEDIATE (24h)' | 'SHORT-TERM (72h)' | 'SCHEDULED (7d)' | 'ROUTINE';
  why: string;
  supportingEvidence: string;
  expectedDurationMinutes: number;
  requiredTools: string[];
  procedureRef: string;
}

export interface EngineeringCalcOutput {
  exactGearRatio: number;
  stage1Ratio: number;
  stage2Ratio: number;
  intermediateShaftRpm: number;
  inputTorqueNm: number;
  outputTorqueNm: number;
  actualPowerKw: number;
  heatLossKw: number;
  pitchLineVelocityMs: number;
  tangentialGearForceN: number;
  preliminaryMinInputShaftMm: number;
  preliminaryMinOutputShaftMm: number;
  inputShaftSafetyFactor: number;
  outputShaftSafetyFactor: number;
  housingSurfaceAreaM2: number;
  estimatedEquilibriumTempRiseC: number;
  assumptions: string[];
  origin: DataOriginTag;
}

export interface DiagnosticSummary {
  timestamp: string;
  machineId: string;
  intelligenceState: MachineIntelligenceState;
  aiConfidence: number;
  sensorAgreement: number;
  trendStability: number;
  operatingMargin: number;
  prototypeRiskScore: number; // Explicitly labeled Prototype diagnostic risk estimate
  headlineConclusion: string;
  detailedNarrative: string;
  detectedPattern: string;
  sensorStats: Record<SensorKey, SensorFeatureStats>;
  causalGraph: RootCauseNode[];
  rootCauseCandidates: RootCauseCandidate[];
  agentTimeline: AgentReasoningStep[];
  inspectionPlan: InspectionPlanItem[];
  calculations: EngineeringCalcOutput;
}

export interface SimulationInput {
  rpm: number;
  loadPercent: number;
  ambientTempC: number;
  oilTempC: number;
  oilPressureBar: number;
  oilFlowLpm: number;
  durationHours: number;
}

export interface SimulationResult {
  origin: 'SIMULATED';
  baseline: SimulationInput;
  scenario: SimulationInput;
  outputs: {
    estimatedBearingTempC: number;
    tempDeltaC: number;
    estimatedVibrationMmS: number;
    vibrationRiskPercent: number;
    thermalMarginC: number;
    bearingFatigueLifeFactor: number;
    bearingRiskPercent: number;
    lubricationFilmParameterLambda: number;
    operatingMarginPercent: number;
    projectedState: MachineIntelligenceState;
    inputTorqueNm: number;
    outputTorqueNm: number;
    heatGenerationKw: number;
  };
  aiExplanation: string;
  engineeringWarnings: string[];
  assumptions: string[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'Machine Manual' | 'Maintenance Manual' | 'Bearing Datasheet' | 'Gearbox Documentation' | 'Historical Reports' | 'Engineering Procedures';
  docCode: string;
  authorOrOem: string;
  updatedAt: string;
  sections: {
    id: string;
    sectionNumber: string;
    heading: string;
    page: number;
    content: string;
    keywords: string[];
  }[];
}

export interface RetrievedEvidence {
  docId: string;
  docTitle: string;
  docCode: string;
  category: string;
  sectionNumber: string;
  heading: string;
  page: number;
  excerpt: string;
  relevanceScore: number;
}
