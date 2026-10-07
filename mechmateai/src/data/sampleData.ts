import {
  KnowledgeDocument,
  MachineProfile,
  SensorNodeConfig,
  TimeSeriesPoint,
} from '../models/types';

export type PresetScenarioId =
  | 'bearing_lubrication_degradation'
  | 'normal_baseline'
  | 'thermal_overload'
  | 'shaft_misalignment';

// Deterministic pseudo-random generator for reproducible engineering curves
function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // -1 to 1
}

export function generateTimeSeriesForScenario(
  scenario: PresetScenarioId,
  ratedRpm = 1500,
  hours = 48
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date('2026-09-30T10:00:00Z').getTime();

  for (let i = 0; i < hours; i++) {
    const progress = i / (hours - 1); // 0 to 1
    const ts = new Date(now - (hours - 1 - i) * 3600 * 1000).toISOString();
    const n1 = seededNoise(i * 1.1);
    const n2 = seededNoise(i * 2.3);
    const n3 = seededNoise(i * 3.7);

    if (scenario === 'normal_baseline') {
      const load = Number((70 + n1 * 2.2).toFixed(1));
      const rpm = Math.round(ratedRpm + n2 * 3);
      const oilTemp = Number((58.5 + (load - 70) * 0.18 + n3 * 0.4).toFixed(1));
      const temp = Number((64.2 + (load - 70) * 0.22 + n1 * 0.5).toFixed(1));
      const vibration = Number((2.35 + n2 * 0.08).toFixed(2));
      const pressure = Number((4.2 + n3 * 0.05).toFixed(2));
      const current = Number((112 + (load - 70) * 1.3 + n1 * 0.8).toFixed(1));
      const oilCondition = Number((91.5 - progress * 0.4).toFixed(1));

      points.push({
        timestamp: ts,
        hourOffset: i - (hours - 1),
        temperature: temp,
        vibration,
        rpm,
        load,
        pressure,
        current,
        oilTemperature: oilTemp,
        oilCondition,
      });
    } else if (scenario === 'bearing_lubrication_degradation') {
      // First 20 hours normal baseline, then load increases slightly and bearing temp + vibration climb ~18% while RPM stays stable
      const degFactor = i < 18 ? 0 : Math.pow((i - 18) / (hours - 18), 1.25);
      const load = Number((71.5 + (i >= 18 ? 6.5 * degFactor : 0) + n1 * 1.2).toFixed(1));
      const rpm = Math.round(ratedRpm + n2 * 2); // Stable RPM!
      const oilTemp = Number((59.0 + 11.4 * degFactor + n3 * 0.35).toFixed(1));
      const temp = Number((64.8 + 13.8 * degFactor + n1 * 0.4).toFixed(1)); // Rises to ~78.6°C
      // Vibration increases ~18.4% from ~2.40 mm/s to ~2.84-3.42 mm/s
      const vibration = Number((2.40 * (1 + 0.184 * degFactor * 1.6) + n2 * 0.05).toFixed(2));
      const pressure = Number((4.15 - 0.42 * degFactor + n3 * 0.04).toFixed(2));
      const current = Number((114 + 12.5 * degFactor + n1 * 0.7).toFixed(1));
      const oilCondition = Number((89.0 - 16.5 * degFactor + n2 * 0.2).toFixed(1));

      points.push({
        timestamp: ts,
        hourOffset: i - (hours - 1),
        temperature: temp,
        vibration,
        rpm,
        load,
        pressure,
        current,
        oilTemperature: oilTemp,
        oilCondition,
      });
    } else if (scenario === 'thermal_overload') {
      const degFactor = i < 12 ? 0 : (i - 12) / (hours - 12);
      const load = Number((74 + 21 * degFactor + n1 * 1.5).toFixed(1));
      const rpm = Math.round(ratedRpm - 15 * degFactor + n2 * 3);
      const oilTemp = Number((61.0 + 23.5 * degFactor + n3 * 0.5).toFixed(1));
      const temp = Number((66.5 + 26.0 * degFactor + n1 * 0.6).toFixed(1));
      const vibration = Number((2.5 + 1.85 * degFactor + n2 * 0.09).toFixed(2));
      const pressure = Number((4.1 - 0.85 * degFactor + n3 * 0.05).toFixed(2));
      const current = Number((118 + 34 * degFactor + n1 * 1.1).toFixed(1));
      const oilCondition = Number((86.0 - 24.0 * degFactor).toFixed(1));

      points.push({
        timestamp: ts,
        hourOffset: i - (hours - 1),
        temperature: temp,
        vibration,
        rpm,
        load,
        pressure,
        current,
        oilTemperature: oilTemp,
        oilCondition,
      });
    } else {
      // shaft_misalignment: high vibration jump without extreme load increase
      const degFactor = i < 15 ? 0 : (i - 15) / (hours - 15);
      const load = Number((72 + n1 * 1.8).toFixed(1));
      const rpm = Math.round(ratedRpm + n2 * 4);
      const oilTemp = Number((60.2 + 4.5 * degFactor + n3 * 0.3).toFixed(1));
      const temp = Number((65.5 + 8.2 * degFactor + n1 * 0.4).toFixed(1));
      const vibration = Number((2.42 + 2.65 * degFactor + n2 * 0.08).toFixed(2));
      const pressure = Number((4.12 + n3 * 0.04).toFixed(2));
      const current = Number((115 + 5.5 * degFactor + n1 * 0.6).toFixed(1));
      const oilCondition = Number((88.0 - 4.0 * degFactor).toFixed(1));

      points.push({
        timestamp: ts,
        hourOffset: i - (hours - 1),
        temperature: temp,
        vibration,
        rpm,
        load,
        pressure,
        current,
        oilTemperature: oilTemp,
        oilCondition,
      });
    }
  }

  return points;
}

const DEFAULT_GEARBOX_SENSORS: SensorNodeConfig[] = [
  {
    id: 'SNS-TEMP-BRG1',
    key: 'temperature',
    label: 'DE Bearing Temperature',
    shortLabel: 'Bearing Temp',
    unit: '°C',
    componentId: 'COMP-BRG-IN',
    componentName: 'Input Drive-End Spherical Roller Bearing',
    location3D: [-0.95, 0.22, 0.45],
    baselineMean: 64.8,
    baselineStd: 1.4,
    warningThreshold: 75.0,
    criticalThreshold: 85.0,
  },
  {
    id: 'SNS-VIB-BRG1',
    key: 'vibration',
    label: 'Bearing Housing Vibration (RMS)',
    shortLabel: 'Vibration',
    unit: 'mm/s',
    componentId: 'COMP-BRG-IN',
    componentName: 'Input Drive-End Spherical Roller Bearing',
    location3D: [-0.95, 0.52, 0.25],
    baselineMean: 2.40,
    baselineStd: 0.12,
    warningThreshold: 2.80,
    criticalThreshold: 4.50,
  },
  {
    id: 'SNS-RPM-IN',
    key: 'rpm',
    label: 'Input Shaft Tachometer',
    shortLabel: 'Input RPM',
    unit: 'RPM',
    componentId: 'COMP-SHAFT-IN',
    componentName: 'High-Speed Input Pinion Shaft (70mm)',
    location3D: [-1.55, 0.22, 0.0],
    baselineMean: 1500,
    baselineStd: 5.0,
    warningThreshold: 1560,
    criticalThreshold: 1650,
  },
  {
    id: 'SNS-LOAD-TRQ',
    key: 'load',
    label: 'Transmitted Mechanical Load',
    shortLabel: 'Torque Load',
    unit: '%',
    componentId: 'COMP-GEAR-MESH',
    componentName: 'Helical-Bevel Primary Gear Mesh Stage',
    location3D: [0.0, 0.35, 0.0],
    baselineMean: 71.5,
    baselineStd: 2.5,
    warningThreshold: 85.0,
    criticalThreshold: 95.0,
  },
  {
    id: 'SNS-OIL-TEMP',
    key: 'oilTemperature',
    label: 'Sump Lubrication Oil Temp',
    shortLabel: 'Oil Temp',
    unit: '°C',
    componentId: 'COMP-OIL-SUMP',
    componentName: 'Lower Housing Oil Sump Zone (ISO VG 320)',
    location3D: [0.15, -0.52, 0.65],
    baselineMean: 59.0,
    baselineStd: 1.5,
    warningThreshold: 68.0,
    criticalThreshold: 78.0,
  },
  {
    id: 'SNS-OIL-COND',
    key: 'oilCondition',
    label: 'Oil Dielectric Viscosity Index',
    shortLabel: 'Oil Condition',
    unit: '%',
    componentId: 'COMP-OIL-SUMP',
    componentName: 'Lower Housing Oil Sump Zone (ISO VG 320)',
    location3D: [-0.25, -0.52, -0.65],
    baselineMean: 89.0,
    baselineStd: 2.0,
    warningThreshold: 76.0,
    criticalThreshold: 65.0,
    isLowerWorse: true,
  },
  {
    id: 'SNS-PRESS-LUB',
    key: 'pressure',
    label: 'Forced Lube Manifold Pressure',
    shortLabel: 'Oil Pressure',
    unit: 'bar',
    componentId: 'COMP-HOUSING',
    componentName: 'Cast Iron Split Housing & Lube Gallery',
    location3D: [0.65, 0.65, 0.55],
    baselineMean: 4.15,
    baselineStd: 0.10,
    warningThreshold: 3.65,
    criticalThreshold: 3.10,
    isLowerWorse: true,
  },
  {
    id: 'SNS-CURR-MTR',
    key: 'current',
    label: 'Drive Motor Phase Current',
    shortLabel: 'Drive Current',
    unit: 'A',
    componentId: 'COMP-SHAFT-OUT',
    componentName: 'Low-Speed Output Shaft Assembly (100mm)',
    location3D: [1.55, -0.05, 0.0],
    baselineMean: 114.0,
    baselineStd: 3.2,
    warningThreshold: 130.0,
    criticalThreshold: 145.0,
  },
];

export const INITIAL_MACHINES: MachineProfile[] = [
  {
    id: 'GT-204',
    name: 'Cooling Tower Gearbox GT-204',
    code: 'GT-204',
    category: 'Gearbox',
    manufacturer: 'Flender / MechSynapse Reference',
    model: 'H2SH-25-75KW Horizontal Reduction Unit',
    location: 'Cooling Tower Cell B-04 · Petrochemical Loop 2',
    serviceDate: '2023-11-14',
    operatingState: 'RUNNING',
    ratedPowerKw: 75,
    inputSpeedRpm: 1500,
    outputSpeedRpm: 60,
    nominalGearRatio: 25,
    efficiencyAssumed: 0.96,
    dimensions: {
      housingLengthMm: 800,
      housingWidthMm: 600,
      housingHeightMm: 550,
      wallThicknessMm: 20,
      baseHeightMm: 80,
      inputShaftDiameterMm: 70,
      outputShaftDiameterMm: 100,
    },
    limits: {
      maxTemperatureC: 85,
      warningTemperatureC: 75,
      maxVibrationMmS: 4.5,
      warningVibrationMmS: 2.8,
      ratedRpm: 1500,
      maxLoadPercent: 95,
      minOilPressureBar: 3.2,
      maxOilTemperatureC: 78,
      minOilConditionIndex: 65,
    },
    components: [
      {
        id: 'COMP-BRG-IN',
        name: 'Input Drive-End Spherical Roller Bearing',
        category: 'bearings',
        partNumber: 'SKF-22214-E-C3',
        material: 'Through-Hardened 100Cr6 Bearing Steel',
        location3D: [-0.95, 0.22, 0.45],
        status: 'DEGRADED',
        temperatureC: 78.6,
        vibrationMmS: 3.12,
        notes: 'Elevated outer-race pass frequency energy + thermal rise under 78% load.',
      },
      {
        id: 'COMP-SHAFT-IN',
        name: 'High-Speed Input Pinion Shaft (70mm)',
        category: 'shafts',
        partNumber: 'SH-IN-70-42CRMO4',
        material: '42CrMo4 Alloy Steel (Quenched & Tempered)',
        location3D: [-1.55, 0.22, 0.0],
        status: 'NOMINAL',
        temperatureC: 68.2,
        vibrationMmS: 2.45,
        notes: 'Rotational speed stable at 1500 RPM; keyway torsional shear within design margin.',
      },
      {
        id: 'COMP-GEAR-MESH',
        name: 'Helical-Bevel Primary Gear Mesh Stage',
        category: 'gears',
        partNumber: 'GM-25R-18CRNIMO7',
        material: '18CrNiMo7-6 Case-Carburized Steel (HRC 60)',
        location3D: [0.0, 0.35, 0.0],
        status: 'WATCH',
        temperatureC: 74.1,
        vibrationMmS: 2.88,
        notes: 'Transmitting 78% rated load; reduced oil film thickness increasing mesh friction.',
      },
      {
        id: 'COMP-SHAFT-OUT',
        name: 'Low-Speed Output Shaft Assembly (100mm)',
        category: 'shafts',
        partNumber: 'SH-OUT-100-42CRMO4',
        material: '42CrMo4 Forged Steel',
        location3D: [1.55, -0.05, 0.0],
        status: 'NOMINAL',
        temperatureC: 63.5,
        vibrationMmS: 2.10,
        notes: 'Operating at 60 RPM nominal output speed; high torsional torque capacity.',
      },
      {
        id: 'COMP-HOUSING',
        name: 'Cast Iron Split Housing & Lube Gallery',
        category: 'housing',
        partNumber: 'HSG-800X600-EN-GJL-250',
        material: 'EN-GJL-250 Grey Cast Iron (20mm Wall)',
        location3D: [0.65, 0.65, 0.55],
        status: 'NOMINAL',
        temperatureC: 66.0,
        vibrationMmS: 1.95,
        notes: 'Horizontal split line seal intact; mounting base bolts torqued to specification.',
      },
      {
        id: 'COMP-OIL-SUMP',
        name: 'Lower Housing Oil Sump Zone (ISO VG 320)',
        category: 'lubrication',
        partNumber: 'LUB-PAO-VG320-45L',
        material: 'Synthetic PAO Gear Oil ISO VG 320',
        location3D: [0.15, -0.52, 0.65],
        status: 'DEGRADED',
        temperatureC: 70.4,
        vibrationMmS: 1.80,
        notes: 'Oil temperature increased +11.4°C; viscosity index degraded to 72.5%.',
      },
    ],
    sensors: DEFAULT_GEARBOX_SENSORS,
    timeSeries: generateTimeSeriesForScenario('bearing_lubrication_degradation', 1500, 48),
    maintenanceHistory: [
      {
        date: '2026-06-18',
        type: 'Preventive Oil Sampling & Filter Change',
        technician: 'M. Lindqvist (Reliability Eng)',
        summary: 'Replaced duplex 10-micron lube filter; particle count ISO 4406 16/14/11.',
      },
      {
        date: '2026-02-09',
        type: 'Laser Shaft Alignment Verification',
        technician: 'R. Kowalski',
        summary: 'Input motor-to-gearbox coupling parallel offset verified within 0.03 mm.',
      },
    ],
  },
  {
    id: 'GP-108',
    name: 'Slurry Feed Pump Drive GP-108',
    code: 'GP-108',
    category: 'Pump',
    manufacturer: 'Sulzer / SEW-Eurodrive',
    model: 'X2K110 Heavy Duty Pump Gearbox',
    location: 'Mineral Processing Bay 1 · Slurry Line A',
    serviceDate: '2024-03-22',
    operatingState: 'RUNNING',
    ratedPowerKw: 110,
    inputSpeedRpm: 1800,
    outputSpeedRpm: 360,
    nominalGearRatio: 5,
    efficiencyAssumed: 0.97,
    dimensions: {
      housingLengthMm: 720,
      housingWidthMm: 540,
      housingHeightMm: 500,
      wallThicknessMm: 22,
      baseHeightMm: 75,
      inputShaftDiameterMm: 65,
      outputShaftDiameterMm: 95,
    },
    limits: {
      maxTemperatureC: 85,
      warningTemperatureC: 74,
      maxVibrationMmS: 4.5,
      warningVibrationMmS: 2.8,
      ratedRpm: 1800,
      maxLoadPercent: 95,
      minOilPressureBar: 3.4,
      maxOilTemperatureC: 76,
      minOilConditionIndex: 68,
    },
    components: [
      {
        id: 'COMP-BRG-IN',
        name: 'Input Drive-End Bearing',
        category: 'bearings',
        partNumber: 'SKF-22213-E',
        material: '100Cr6 Bearing Steel',
        location3D: [-0.95, 0.22, 0.45],
        status: 'WATCH',
        temperatureC: 73.5,
        vibrationMmS: 3.65,
        notes: '2X line frequency axial vibration signature consistent with minor coupling offset.',
      },
      {
        id: 'COMP-SHAFT-IN',
        name: 'High-Speed Input Shaft (65mm)',
        category: 'shafts',
        partNumber: 'SH-IN-65',
        material: '42CrMo4 Alloy Steel',
        location3D: [-1.55, 0.22, 0.0],
        status: 'WATCH',
        temperatureC: 69.0,
        vibrationMmS: 3.40,
        notes: 'Elevated axial thrust load from flexible disc coupling.',
      },
      {
        id: 'COMP-GEAR-MESH',
        name: 'Single-Stage Helical Reduction Set',
        category: 'gears',
        partNumber: 'GM-5R-HEL',
        material: '18CrNiMo7-6 Carburized Steel',
        location3D: [0.0, 0.35, 0.0],
        status: 'NOMINAL',
        temperatureC: 67.2,
        vibrationMmS: 2.30,
        notes: 'Backlash and tooth contact pattern nominal.',
      },
      {
        id: 'COMP-SHAFT-OUT',
        name: 'Impeller Drive Output Shaft (95mm)',
        category: 'shafts',
        partNumber: 'SH-OUT-95',
        material: '42CrMo4 Forged Steel',
        location3D: [1.55, -0.05, 0.0],
        status: 'NOMINAL',
        temperatureC: 64.0,
        vibrationMmS: 2.15,
        notes: '360 RPM slurry impeller drive shaft within torque rating.',
      },
      {
        id: 'COMP-HOUSING',
        name: 'Ductile Iron Pump Drive Casing',
        category: 'housing',
        partNumber: 'HSG-720X540',
        material: 'EN-GJS-400 Ductile Iron',
        location3D: [0.65, 0.65, 0.55],
        status: 'NOMINAL',
        temperatureC: 63.0,
        vibrationMmS: 1.90,
        notes: 'Rigid baseplate mounting.',
      },
      {
        id: 'COMP-OIL-SUMP',
        name: 'Splash & Forced Lube Sump',
        category: 'lubrication',
        partNumber: 'LUB-VG220',
        material: 'Synthetic ISO VG 220',
        location3D: [0.15, -0.52, 0.65],
        status: 'NOMINAL',
        temperatureC: 64.5,
        vibrationMmS: 1.75,
        notes: 'Oil condition 84%; clean dielectric reading.',
      },
    ],
    sensors: DEFAULT_GEARBOX_SENSORS.map((s) =>
      s.key === 'rpm' ? { ...s, baselineMean: 1800, warningThreshold: 1860, criticalThreshold: 1950 } : s
    ),
    timeSeries: generateTimeSeriesForScenario('shaft_misalignment', 1800, 48),
    maintenanceHistory: [
      {
        date: '2026-07-10',
        type: 'Slurry Wet-End Liner Replacement',
        technician: 'D. Chen',
        summary: 'Pump wet-end reassembled; drive coupling re-shimmed.',
      },
    ],
  },
  {
    id: 'GC-310',
    name: 'Compressor Main Drive GC-310',
    code: 'GC-310',
    category: 'Compressor',
    manufacturer: 'Siemens Flender',
    model: 'Planurex High-Speed Process Unit',
    location: 'Air Separation Unit · Compressor House 3',
    serviceDate: '2025-01-10',
    operatingState: 'RUNNING',
    ratedPowerKw: 160,
    inputSpeedRpm: 1480,
    outputSpeedRpm: 296,
    nominalGearRatio: 5,
    efficiencyAssumed: 0.975,
    dimensions: {
      housingLengthMm: 860,
      housingWidthMm: 640,
      housingHeightMm: 580,
      wallThicknessMm: 24,
      baseHeightMm: 90,
      inputShaftDiameterMm: 80,
      outputShaftDiameterMm: 110,
    },
    limits: {
      maxTemperatureC: 85,
      warningTemperatureC: 75,
      maxVibrationMmS: 4.5,
      warningVibrationMmS: 2.8,
      ratedRpm: 1480,
      maxLoadPercent: 95,
      minOilPressureBar: 3.5,
      maxOilTemperatureC: 75,
      minOilConditionIndex: 70,
    },
    components: [
      {
        id: 'COMP-BRG-IN',
        name: 'Input Cylindrical Roller Bearing',
        category: 'bearings',
        partNumber: 'FAG-NU2216-E',
        material: '100Cr6 Steel',
        location3D: [-0.95, 0.22, 0.45],
        status: 'NOMINAL',
        temperatureC: 64.2,
        vibrationMmS: 2.32,
        notes: 'Operating smoothly within ISO 10816 Zone A.',
      },
      {
        id: 'COMP-SHAFT-IN',
        name: 'Primary Input Shaft (80mm)',
        category: 'shafts',
        partNumber: 'SH-IN-80',
        material: '42CrMo4 Steel',
        location3D: [-1.55, 0.22, 0.0],
        status: 'NOMINAL',
        temperatureC: 62.5,
        vibrationMmS: 2.20,
        notes: 'Steady 1480 RPM synchronous operation.',
      },
      {
        id: 'COMP-GEAR-MESH',
        name: 'Precision Ground Helical Gear Pair',
        category: 'gears',
        partNumber: 'GM-DIN4-HEL',
        material: '18CrNiMo7-6 Ground DIN Class 4',
        location3D: [0.0, 0.35, 0.0],
        status: 'NOMINAL',
        temperatureC: 65.0,
        vibrationMmS: 2.38,
        notes: 'Low acoustic emission; full EHL lubrication film.',
      },
      {
        id: 'COMP-SHAFT-OUT',
        name: 'Output Drive Shaft (110mm)',
        category: 'shafts',
        partNumber: 'SH-OUT-110',
        material: '42CrMo4 Forged Steel',
        location3D: [1.55, -0.05, 0.0],
        status: 'NOMINAL',
        temperatureC: 61.8,
        vibrationMmS: 2.05,
        notes: 'Nominal torque transmission.',
      },
      {
        id: 'COMP-HOUSING',
        name: 'Heavy Acoustic-Damped Cast Housing',
        category: 'housing',
        partNumber: 'HSG-860X640',
        material: 'EN-GJL-300 Cast Iron',
        location3D: [0.65, 0.65, 0.55],
        status: 'NOMINAL',
        temperatureC: 58.9,
        vibrationMmS: 1.75,
        notes: 'Zero structural resonance.',
      },
      {
        id: 'COMP-OIL-SUMP',
        name: 'Cooled Circulation Sump',
        category: 'lubrication',
        partNumber: 'LUB-PAO-VG220',
        material: 'Synthetic PAO ISO VG 220',
        location3D: [0.15, -0.52, 0.65],
        status: 'NOMINAL',
        temperatureC: 58.6,
        vibrationMmS: 1.60,
        notes: 'Heat exchanger maintaining 58.6°C sump equilibrium.',
      },
    ],
    sensors: DEFAULT_GEARBOX_SENSORS.map((s) =>
      s.key === 'rpm' ? { ...s, baselineMean: 1480, warningThreshold: 1540, criticalThreshold: 1620 } : s
    ),
    timeSeries: generateTimeSeriesForScenario('normal_baseline', 1480, 48),
    maintenanceHistory: [
      {
        date: '2026-08-15',
        type: 'Quarterly Thermography & Oil Lab Analysis',
        technician: 'A. Al-Mansoor',
        summary: 'All bearing zones below 65°C; TAN and water content nominal (<80 ppm).',
      },
    ],
  },
];

export const ENGINEERING_KNOWLEDGE_BASE: KnowledgeDocument[] = [
  {
    id: 'DOC-GT200-MAN',
    title: 'H2SH Series Horizontal Industrial Gearbox Operating & Engineering Manual',
    category: 'Gearbox Documentation',
    docCode: 'MAN-FL-H2SH-2024-REV4',
    authorOrOem: 'Flender / Industrial Powertrain Division',
    updatedAt: '2025-11-02',
    sections: [
      {
        id: 'SEC-GT-4.2',
        sectionNumber: 'Section 4.2',
        heading: 'Thermal Operating Limits & Sump Temperature Rise Correlation',
        page: 42,
        content:
          'Under continuous rated power (75 kW at 1500 RPM input, 25:1 reduction ratio), normal drive-end spherical roller bearing temperature stabilizes between 62°C and 68°C with an oil sump baseline of 56°C–62°C. A bearing temperature exceeding 75°C (Warning) or 85°C (Critical) while oil sump temperature rises above 68°C indicates excessive frictional heat generation due to elastohydrodynamic (EHL) oil film breakdown or over-torque operation.',
        keywords: ['temperature', 'thermal', 'sump', 'bearing', '75', '85', 'heat', 'increasing', 'gearbox', 'limit'],
      },
      {
        id: 'SEC-GT-6.1',
        sectionNumber: 'Section 6.1',
        heading: 'Torsional Torque & Shaft Stress Sizing Assumptions',
        page: 68,
        content:
          'Nominal input torque is calculated via T_in = 9550 * P(kW) / n_1(RPM). At 75 kW and 1500 RPM, nominal input torque is 477.5 Nm and output torque at 60 RPM (assuming 96% 2-stage efficiency) is 11,460 Nm. Preliminary shaft diameter verification follows ASME B106.1M / DIN 743 using allowable torsional shear stress tau_allow = 45 MPa (with keyway stress concentration) and application service factor K_a = 1.50.',
        keywords: ['torque', 'shaft', 'sizing', 'ratio', 'stress', 'power', 'rpm', '9550', 'calculation'],
      },
    ],
  },
  {
    id: 'DOC-SKF-22214',
    title: 'SKF 22214 E Spherical Roller Bearing Engineering Datasheet',
    category: 'Bearing Datasheet',
    docCode: 'DS-SKF-22214E-C3',
    authorOrOem: 'SKF Group Bearing Engineering',
    updatedAt: '2025-04-19',
    sections: [
      {
        id: 'SEC-BRG-2.4',
        sectionNumber: 'Section 2.4',
        heading: 'Progressive Bearing Degradation & Vibration-Temperature Coupling',
        page: 14,
        content:
          'When RMS housing vibration increases by 15%–25% at constant shaft RPM alongside a simultaneous bearing metal temperature increase of +10°C to +15°C, the signature is characteristic of early-to-mid stage rolling element or outer raceway subsurface fatigue spalling aggravated by reduced lubricant viscosity ratio (kappa < 1.2). Inspect bearing radial internal clearance (C3 nominal: 0.075–0.110 mm) and check magnetic drain plug for ferrous flakes.',
        keywords: ['bearing', 'vibration', 'degradation', 'spalling', 'clearance', 'rpm', 'stable', 'temperature', '22214'],
      },
      {
        id: 'SEC-BRG-3.1',
        sectionNumber: 'Section 3.1',
        heading: 'L10h Fatigue Life & Load-Temperature Sensitivity',
        page: 19,
        content:
          'Spherical roller bearing basic rating life L_10h scales inversely with equivalent dynamic load to the exponent p = 10/3 (L_10h ~ (C/P)^(3.33)). Operating at 90% load instead of 72% load reduces theoretical fatigue life by 52%, and operating above 78°C oil temperature further derates the a_SKF life modification factor due to boundary lubrication contact.',
        keywords: ['simulation', 'load', 'life', 'fatigue', 'bearing', 'risk', 'l10', 'viscosity'],
      },
    ],
  },
  {
    id: 'DOC-LUB-VG320',
    title: 'Tribology & Lubrication Maintenance Manual: Synthetic PAO ISO VG 320',
    category: 'Maintenance Manual',
    docCode: 'PROC-TRIB-VG320-09',
    authorOrOem: 'Plant Reliability & Tribology Engineering Group',
    updatedAt: '2025-08-30',
    sections: [
      {
        id: 'SEC-LUB-1.3',
        sectionNumber: 'Section 1.3',
        heading: 'Thermal Thinning & Dielectric Condition Degradation',
        page: 8,
        content:
          'Synthetic PAO ISO VG 320 gear oil maintains kinematic viscosity of 320 mm²/s at 40°C and 34.5 mm²/s at 100°C. For every +10°C increase in sump temperature above 60°C, dynamic film thickness decreases by approximately 22%. When the online Oil Condition Index drops below 76% alongside a manifold pressure drop (>0.3 bar), perform immediate oil sampling for viscosity, Total Acid Number (TAN), and particle contamination per ISO 4406.',
        keywords: ['lubrication', 'oil', 'viscosity', 'condition', 'pressure', 'temperature', 'filter', 'maintenance', 'inspection'],
      },
    ],
  },
  {
    id: 'DOC-ISO-10816',
    title: 'ISO 10816-3 / ISO 20816-3 Industrial Machinery Vibration Diagnostic Standard',
    category: 'Engineering Procedures',
    docCode: 'STD-ISO-20816-3-G2',
    authorOrOem: 'International Organization for Standardization',
    updatedAt: '2024-12-01',
    sections: [
      {
        id: 'SEC-ISO-5.1',
        sectionNumber: 'Section 5.1',
        heading: 'Vibration Severity Zones for Medium Industrial Gearboxes (15 kW – 300 kW)',
        page: 11,
        content:
          'For Group 2 rigid-mounted industrial machinery (75 kW gearbox): Zone A (Newly commissioned / Nominal) is <= 2.3 mm/s RMS. Zone B (Acceptable for unrestricted operation, Watch threshold) is 2.3 to 2.8 mm/s RMS. Zone C (Unsatisfactory for long-term continuous operation — Investigate) is 2.8 to 4.5 mm/s RMS. Zone D (Critical damage risk) is > 4.5 mm/s RMS. Additionally, any change >25% from baseline within 48 hours warrants root-cause investigation even if absolute value remains in Zone B/C.',
        keywords: ['vibration', 'iso', 'zone', 'anomaly', 'rms', 'threshold', 'misalignment', 'unhealthy', '2.8', '4.5'],
      },
    ],
  },
  {
    id: 'DOC-HIST-IR089',
    title: 'Historical Incident Report #IR-2025-089: Cooling Tower Cell A-02 Gearbox Bearing Seizure Avoidance',
    category: 'Historical Reports',
    docCode: 'HIST-IR-2025-089',
    authorOrOem: 'Petrochemical Reliability Archives',
    updatedAt: '2025-09-14',
    sections: [
      {
        id: 'SEC-HIST-1.0',
        sectionNumber: 'Section 1.0',
        heading: 'Incident Pattern Match: Stable RPM + +18% Vibration + Rising Bearing Temp',
        page: 3,
        content:
          'In September 2025, identical unit GT-102 exhibited an 18% increase in DE bearing vibration (from 2.38 to 2.85 mm/s) while input RPM remained locked at 1500 RPM and load increased from 70% to 78%. Borescope and lube inspection revealed clogged oil spray nozzle reducing flow to the input spherical roller bearing by 35%, causing localized thermal thinning and incipient outer race micro-pitting. Cleaning the spray jet and replacing the oil charge restored baseline temperature (64°C) and prevented a $48,000 unplanned outage.',
        keywords: ['history', 'historical', 'root cause', 'gearbox', 'temperature', 'vibration', 'spray', 'nozzle', 'gt-204', 'why'],
      },
    ],
  },
];

export function generateSampleCsvContent(points: TimeSeriesPoint[]): string {
  const header =
    'timestamp,temperature,vibration,rpm,load,pressure,current,oilTemperature,oilCondition';
  const rows = points.map(
    (p) =>
      `${p.timestamp},${p.temperature},${p.vibration},${p.rpm},${p.load},${p.pressure},${p.current},${p.oilTemperature},${p.oilCondition}`
  );
  return [header, ...rows].join('\n');
}
