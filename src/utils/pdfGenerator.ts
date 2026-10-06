import { jsPDF } from 'jspdf';
import {
  DiagnosticSummary,
  MachineProfile,
  SimulationResult,
} from '../models/types';

/**
 * Generates and downloads a formatted, multi-section PDF Engineering Diagnostic Report.
 */
export function generateDiagnosticPdfReport(
  machine: MachineProfile,
  diagnostics: DiagnosticSummary,
  latestSimulation?: SimulationResult,
  engineerNotes?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  let y = 16;

  const checkPageBreak = (neededMm: number) => {
    if (y + neededMm > 278) {
      doc.addPage();
      y = 16;
    }
  };

  // Header Banner (Deep Ocean Blue + Cyan-Teal + Vintage Off-White)
  doc.setFillColor(7, 25, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(92, 225, 230);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CuraAI · PREDICT · PREVENT · PROTECT — DIAGNOSTIC REPORT', margin, 12);

  doc.setTextColor(246, 241, 229);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Machine: ${machine.name} (${machine.code})  |  State: ${diagnostics.intelligenceState}  |  Generated: ${new Date(diagnostics.timestamp).toUTCString()}`,
    margin,
    19
  );
  doc.setTextColor(216, 226, 236);
  doc.text(
    `Doc ID: CURAAI-DIAG-${machine.code}-${Date.now().toString().slice(-5)}  |  AI Confidence: ${diagnostics.aiConfidence}%  |  Prototype Engineering Intelligence System V1.0`,
    margin,
    24
  );

  y = 36;

  // Section 1: Machine Identity & Specifications
  doc.setTextColor(20, 25, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. MACHINE IDENTITY & MECHANICAL SPECIFICATIONS', margin, y);
  y += 2;
  doc.setDrawColor(25, 167, 206);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const specLines = [
    `Machine Name / ID: ${machine.name} (${machine.code})   |   Category: ${machine.category}   |   Model: ${machine.model}`,
    `Location: ${machine.location}   |   Operating State: ${machine.operatingState}`,
    `Rated Power: ${machine.ratedPowerKw} kW   |   Input Speed: ${machine.inputSpeedRpm} RPM   |   Output Speed: ${machine.outputSpeedRpm} RPM   |   Ratio: ${diagnostics.calculations.exactGearRatio}:1`,
    `Torque (ESTIMATED): Input = ${diagnostics.calculations.inputTorqueNm} Nm, Output = ${diagnostics.calculations.outputTorqueNm} Nm (Efficiency assumed: ${(machine.efficiencyAssumed * 100).toFixed(1)}%)`,
    `Prototype Dimensions: Housing ${machine.dimensions.housingLengthMm}x${machine.dimensions.housingWidthMm}x${machine.dimensions.housingHeightMm} mm, Input Shaft ${machine.dimensions.inputShaftDiameterMm} mm (Prelim min: ${diagnostics.calculations.preliminaryMinInputShaftMm} mm), Output Shaft ${machine.dimensions.outputShaftDiameterMm} mm`,
  ];
  for (const line of specLines) {
    doc.text(line, margin, y);
    y += 4.8;
  }

  y += 3;

  // Section 2: Machine Intelligence State & AI Executive Reasoning
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. AI ENGINEERING DIAGNOSIS & REASONING SUMMARY', margin, y);
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `Intelligence State: ${diagnostics.intelligenceState}   |   Sensor Agreement: ${diagnostics.sensorAgreement}%   |   Trend Stability: ${diagnostics.trendStability}%   |   Operating Margin: ${diagnostics.operatingMargin}%`,
    margin,
    y
  );
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Prototype Diagnostic Risk Estimate: ${diagnostics.prototypeRiskScore}/100 (Hybrid engineering rules + statistical anomaly score)`, margin, y);
  y += 5;

  const conclusionLines = doc.splitTextToSize(
    `Detected Pattern: ${diagnostics.detectedPattern}\n\nConclusion: ${diagnostics.headlineConclusion}\n\nEngineering Narrative: ${diagnostics.detailedNarrative}`,
    pageWidth - margin * 2
  );
  doc.text(conclusionLines, margin, y);
  y += conclusionLines.length * 4.2 + 4;

  // Section 3: Sensor Telemetry & Anomaly Analysis (MEASURED)
  checkPageBreak(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. SENSOR TELEMETRY & STATISTICAL ANOMALY ANALYSIS [MEASURED]', margin, y);
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Sensor Channel', margin, y);
  doc.text('Measured', margin + 56, y);
  doc.text('Baseline', margin + 82, y);
  doc.text('Deviation', margin + 108, y);
  doc.text('Z-Score', margin + 132, y);
  doc.text('State / Score', margin + 152, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  for (const stat of Object.values(diagnostics.sensorStats)) {
    checkPageBreak(6);
    doc.text(`${stat.label}`, margin, y);
    doc.text(`${stat.currentValue} ${stat.unit}`, margin + 56, y);
    doc.text(`${stat.baselineMean} ${stat.unit}`, margin + 82, y);
    doc.text(`${stat.deviationPercent >= 0 ? '+' : ''}${stat.deviationPercent}%`, margin + 108, y);
    doc.text(`${stat.zScore >= 0 ? '+' : ''}${stat.zScore}s`, margin + 132, y);
    doc.text(`${stat.severity} (${stat.anomalyScore})`, margin + 152, y);
    y += 4.5;
  }

  y += 4;

  // Section 4: Root-Cause Candidates & Evidence
  checkPageBreak(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('4. ROOT-CAUSE CANDIDATES & SUPPORTING EVIDENCE', margin, y);
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(8.5);
  for (const rc of diagnostics.rootCauseCandidates.slice(0, 3)) {
    checkPageBreak(22);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `• ${rc.failureMode}  [Confidence: ${rc.probabilityScore}% | Urgency: ${rc.urgency}]`,
      margin,
      y
    );
    y += 4.2;
    doc.setFont('helvetica', 'normal');
    const mechLines = doc.splitTextToSize(
      `Component: ${rc.component} — Mechanism: ${rc.engineeringMechanism} | Evidence: ${rc.supportingSignals.join(' ')}`,
      pageWidth - margin * 2 - 4
    );
    doc.text(mechLines, margin + 3, y);
    y += mechLines.length * 4 + 2.5;
  }

  // Section 5: What-If Simulation Results (if available)
  if (latestSimulation) {
    checkPageBreak(32);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('5. WHAT-IF OPERATING SIMULATION SUMMARY [SIMULATED]', margin, y);
    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const simText = doc.splitTextToSize(
      `Scenario: RPM = ${latestSimulation.scenario.rpm} (vs ${latestSimulation.baseline.rpm}), Load = ${latestSimulation.scenario.loadPercent}% (vs ${latestSimulation.baseline.loadPercent}%), Ambient = ${latestSimulation.scenario.ambientTempC}°C.\nSimulated Outputs: Est. Bearing Temp = ${latestSimulation.outputs.estimatedBearingTempC}°C (${latestSimulation.outputs.tempDeltaC >= 0 ? '+' : ''}${latestSimulation.outputs.tempDeltaC}°C), Est. Vibration = ${latestSimulation.outputs.estimatedVibrationMmS} mm/s, Thermal Margin = ${latestSimulation.outputs.thermalMarginC}°C, L10h Life Factor = ${latestSimulation.outputs.bearingFatigueLifeFactor}x.\nAI Interpretation: ${latestSimulation.aiExplanation}`,
      pageWidth - margin * 2
    );
    doc.text(simText, margin, y);
    y += simText.length * 4.2 + 3;
  }

  // Section 6: Prioritized AI Inspection Plan
  checkPageBreak(42);
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('6. PRIORITIZED AI MAINTENANCE & INSPECTION PLAN', margin, y);
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(8.5);
  for (const item of diagnostics.inspectionPlan) {
    checkPageBreak(18);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Priority ${item.priority}: ${item.title}  [${item.urgency} · Est. ${item.expectedDurationMinutes} min]`,
      margin,
      y
    );
    y += 4.2;
    doc.setFont('helvetica', 'normal');
    const itemLines = doc.splitTextToSize(
      `Component: ${item.component} | Why: ${item.why} | Tools: ${item.requiredTools.join(', ')}`,
      pageWidth - margin * 2 - 4
    );
    doc.text(itemLines, margin + 3, y);
    y += itemLines.length * 4 + 2.5;
  }

  if (engineerNotes && engineerNotes.trim().length > 0) {
    checkPageBreak(20);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('7. LEAD ENGINEER NOTES', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(engineerNotes.trim(), pageWidth - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4.2 + 3;
  }

  // Footer Disclaimer
  checkPageBreak(15);
  y += 4;
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(110, 115, 115);
  doc.text(
    'DISCLAIMER: Prototype engineering intelligence system. Simulated and estimated values are explicitly labeled and do not replace certified OEM engineering analysis or safety lockout procedures.',
    margin,
    y
  );

  doc.save(`CuraAI_Diagnostic_Report_${machine.code}.pdf`);
}

/**
 * Generates and downloads a comprehensive, multi-page PDF user manual and system guide.
 */
export function generateAppUserGuidePdf(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  let y = 16;

  const checkPageBreak = (neededMm: number) => {
    if (y + neededMm > 278) {
      doc.addPage();
      y = 16;
    }
  };

  // Header Banner
  doc.setFillColor(7, 25, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(0, 210, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MECHMATE AI · INDUSTRIAL INTELLIGENCE — APPLICATION GUIDE', margin, 12);

  doc.setTextColor(246, 241, 229);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Comprehensive System Manual, Page-by-Page Workflow & Diagnostic Engine Architecture`,
    margin,
    19
  );
  doc.setTextColor(216, 226, 236);
  doc.text(
    `Version: 2.4-Production  |  Standards: ISO 10816 / ISO 20816 / ISO 17359  |  Generated: ${new Date().toLocaleDateString()}`,
    margin,
    24
  );

  y = 35;

  // Introduction
  doc.setTextColor(0, 80, 226);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. EXECUTIVE OVERVIEW & CORE ARCHITECTURE', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 50, 60);
  const introText = doc.splitTextToSize(
    'MechMate AI is an advanced physics-informed predictive maintenance and machinery health intelligence platform. Unlike opaque black-box machine learning systems, MechMate AI combines real-time multi-channel sensor telemetry with mechanical engineering first principles (Hertzian contact stress, AGMA 2001 gear rating, SKF bearing fatigue life, and ISO 20816 vibration severity zones). It continuously monitors critical plant assets—including cooling tower gearboxes, slurry feed pumps, and high-speed process compressors—to predict failures weeks before catastrophic downtime.',
    pageWidth - margin * 2
  );
  doc.text(introText, margin, y);
  y += introText.length * 4.2 + 4;

  // Section 2: How "Run AI Diagnosis" Works
  doc.setTextColor(0, 80, 226);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. HOW "RUN AI DIAGNOSIS" WORKS (DIAGNOSTIC WORKFLOW)', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 50, 60);
  const diagSteps = [
    'Step 1 - Multi-Channel Telemetry Ingestion: Continuously monitors 7 primary channels: Vibration (mm/s RMS), Drive-End Bearing Temperature (°C), Input/Output RPM, Motor Load (%), Sump Oil Temperature (°C), Oil Condition/Dielectric Index (%), and Lube Pressure (bar).',
    'Step 2 - Statistical Normalization (Z-Scores): Compares live telemetry against nominal OEM baseline statistics (Mean and Standard Deviation) to detect subtle deviations long before hard alert limits trigger.',
    'Step 3 - Multi-Agent Physics Reasoning: Evaluates elastohydrodynamic lubrication (EHL) film thickness, thermal dissipation margins, and harmonic vibration energy to distinguish benign load swings from mechanical fault progression.',
    'Step 4 - Causal Graph & Root-Cause Generation: Maps sensor anomalies to specific physical components (e.g., input roller bearings, carburized gear teeth, or shaft couplings) and assigns probability scores.',
    'Step 5 - Actionable Maintenance Prioritization: Generates an immediate inspection plan with required tools (laser alignment, acoustic stethoscopes, grease guns, filter carts) and estimated duration.',
  ];

  for (const step of diagSteps) {
    checkPageBreak(12);
    const lines = doc.splitTextToSize(step, pageWidth - margin * 2 - 3);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4 + 2;
  }
  y += 3;

  // Section 3: Page-by-Page Detailed Breakdown
  checkPageBreak(25);
  doc.setTextColor(0, 80, 226);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. APPLICATION PAGE-BY-PAGE GUIDE', margin, y);
  y += 5;

  const pages = [
    {
      name: 'Overview Dashboard (મુખ્ય ડેશબોર્ડ)',
      desc: 'The central command center. Features the 4 Health State pills (NORMAL, WATCH, INVESTIGATE, CRITICAL), 4 compact intelligent indicators (AI Confidence, Sensor Agreement, Trend Stability, Operating Margin), live telemetry channel selector pills, the 3D GLB Machinery Digital Twin with interactive orbit controls, the real-time sensor waveform trend, and the MechMate AI Copilot with instant diagnostic recommendations and Q&A.',
    },
    {
      name: 'Machines Management (મશીન મેનેજમેન્ટ & CAD)',
      desc: 'Allows engineers to switch active machines (Cooling Tower Gearbox GT-204, Slurry Feed Pump GP-108, Compressor Main Drive GC-310). Provides parametric CAD geometry editing (housing length/width/height, shaft diameters, wall thickness) with live mechanical calculations (Torque T = 9550*P/N, torsional shear stress, shaft safety factors, and gear surface contact fatigue).',
    },
    {
      name: 'Diagnostics & Causal Graph (ડાયગ્નોસિસ & રૂટ કોઝ)',
      desc: 'Visualizes the root-cause causal tree. Allows reliability teams to switch between 5 real-world failure scenarios (Bearing Lubrication Degradation, Shaft Misalignment, Gear Tooth Surface Wear, Sump Oil Overheating, Clean Baseline). Includes real CSV telemetry upload to analyze actual SCADA/IoT plant sensor logs with automated column mapping.',
    },
    {
      name: 'Digital Twin 3D (ઓરિજિનલ 3D GLB એસેટ વ્યુઅર)',
      desc: 'Full-screen high-fidelity 3D Machinery Digital Twin using original binary .GLB assets. Features Exploded View (to inspect internal gears, bearings, and shafts), Section View, Thermal Heatmap Mode, layer toggles (Housing, Shafts, Bearings, Gears, Lubrication), physical 3D sensor beacon nodes, Static Stance mode (steady/no animation as requested), and custom .GLB model upload.',
    },
    {
      name: 'What-If Simulation Laboratory (ફિઝિક્સ સિમ્યુલેશન લેબ)',
      desc: 'Interactive engineering sandbox to test operational stress scenarios: increase motor load (+15% to +40%), vary input speed, or simulate degraded oil viscosity. Calculates simulated thermal rise, vibration spikes, dynamic torque, and remaining bearing fatigue life (L10h hours).',
    },
    {
      name: 'Maintenance & Reports (મેન્ટેનન્સ & રિપોર્ટ એક્સપોર્ટ)',
      desc: 'Provides prioritized inspection checklists, risk scores (0-100), technician task assignments, past maintenance history logs, and instant generation of ISO 17359-compliant diagnostic PDF reports with lead engineer sign-off blocks.',
    },
    {
      name: 'Knowledge Base (નોલેજ બેઝ & સ્ટાન્ડર્ડ્સ)',
      desc: 'Engineering documentation library containing ISO 20816 vibration criteria, bearing failure mode identification guides, lubrication viscosity charts, and OEM maintenance manuals.',
    },
  ];

  for (const p of pages) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 30, 45);
    doc.text(`• ${p.name}`, margin, y);
    y += 4.2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(60, 70, 80);
    const pLines = doc.splitTextToSize(p.desc, pageWidth - margin * 2 - 4);
    doc.text(pLines, margin + 4, y);
    y += pLines.length * 3.8 + 3;
  }

  // Footer
  checkPageBreak(15);
  y += 4;
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(110, 115, 115);
  doc.text(
    'MechMate AI Industrial Intelligence System · Built for Plant Reliability Engineers and Condition Monitoring Specialists.',
    margin,
    y
  );

  doc.save('MechMate_AI_Complete_App_Guide.pdf');
}

