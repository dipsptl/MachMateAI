import {
  MachineProfile,
  SensorFeatureStats,
  SensorKey,
  TimeSeriesPoint,
} from '../models/types';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function stdDev(values: number[], avg?: number): number {
  if (values.length < 2) return 0.0001;
  const m = avg ?? mean(values);
  const variance = values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.max(0.0001, Math.sqrt(variance));
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (den < 1e-6) return 0;
  return Number(Math.max(-1, Math.min(1, num / den)).toFixed(2));
}

function linearSlopePerHour(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  // Use last 16 hours to capture active rate of change
  const windowVals = values.slice(-16);
  const m = windowVals.length;
  const xMean = (m - 1) / 2;
  const yMean = mean(windowVals);
  let num = 0;
  let den = 0;
  for (let i = 0; i < m; i++) {
    num += (i - xMean) * (windowVals[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  return den === 0 ? 0 : Number((num / den).toFixed(3));
}

/**
 * Computes statistical features, operating-condition correlations, and hybrid
 * Isolation/Z-score anomaly detection across all machine sensors.
 */
export function analyzeMachineSensors(
  machine: MachineProfile
): Record<SensorKey, SensorFeatureStats> {
  const series = machine.timeSeries;
  const loads = series.map((p) => p.load);
  const temps = series.map((p) => p.temperature);

  const result = {} as Record<SensorKey, SensorFeatureStats>;

  for (const sensorCfg of machine.sensors) {
    const key = sensorCfg.key;
    const values = series.map((p) => p[key]);
    const currentValue = values[values.length - 1] ?? sensorCfg.baselineMean;

    // Early window (first 16 hours) or configured baseline
    const baselineMean = sensorCfg.baselineMean;
    const baselineStd = Math.max(0.05, sensorCfg.baselineStd);

    const last12 = values.slice(-12);
    const rollingMean12h = Number(mean(last12).toFixed(2));
    const rollingStd12h = Number(stdDev(last12, rollingMean12h).toFixed(2));

    // Signed Z-score relative to healthy baseline
    const rawZ = (currentValue - baselineMean) / baselineStd;
    const zScore = Number(rawZ.toFixed(2));

    // Percentage deviation from baseline
    const deviationPercent = Number(
      (((currentValue - baselineMean) / Math.max(0.001, Math.abs(baselineMean))) * 100).toFixed(1)
    );

    const rateOfChangePerHour = linearSlopePerHour(values);
    const absSlopeThreshold = baselineStd * 0.08;
    const trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE' =
      rateOfChangePerHour > absSlopeThreshold
        ? 'INCREASING'
        : rateOfChangePerHour < -absSlopeThreshold
        ? 'DECREASING'
        : 'STABLE';

    const correlationWithLoad = pearsonCorrelation(values, loads);
    const correlationWithTemp = pearsonCorrelation(values, temps);

    // Hybrid Anomaly Score (0 - 100) combining Z-score distance, operating limit proximity, and rate of change
    const directionalZ = sensorCfg.isLowerWorse ? -zScore : zScore;
    let severity: 'NOMINAL' | 'WATCH' | 'INVESTIGATE' | 'CRITICAL' = 'NOMINAL';

    if (sensorCfg.isLowerWorse) {
      if (currentValue <= sensorCfg.criticalThreshold) severity = 'CRITICAL';
      else if (currentValue <= sensorCfg.warningThreshold) severity = 'INVESTIGATE';
      else if (directionalZ >= 2.0) severity = 'WATCH';
    } else {
      if (currentValue >= sensorCfg.criticalThreshold) severity = 'CRITICAL';
      else if (currentValue >= sensorCfg.warningThreshold) severity = 'INVESTIGATE';
      else if (directionalZ >= 2.2) severity = 'WATCH';
    }

    const zContribution = Math.min(65, Math.max(0, directionalZ * 9.5));
    const trendContribution = Math.min(
      25,
      Math.max(
        0,
        ((sensorCfg.isLowerWorse ? -rateOfChangePerHour : rateOfChangePerHour) / baselineStd) * 18
      )
    );
    const limitBonus =
      severity === 'CRITICAL' ? 25 : severity === 'INVESTIGATE' ? 14 : severity === 'WATCH' ? 6 : 0;

    const anomalyScore = Math.min(
      99,
      Math.max(4, Math.round(zContribution + trendContribution + limitBonus))
    );
    const isAnomalous = severity !== 'NOMINAL' || anomalyScore >= 48;

    let explanation = `${sensorCfg.label} is operating within its healthy baseline band (${currentValue} ${sensorCfg.unit} vs baseline ${baselineMean} ${sensorCfg.unit}).`;
    if (isAnomalous) {
      const dirWord = deviationPercent >= 0 ? 'increased' : 'decreased';
      explanation = `${sensorCfg.label} ${dirWord} ${Math.abs(deviationPercent).toFixed(1)}% from baseline (${baselineMean} → ${currentValue} ${sensorCfg.unit}, Z = ${zScore >= 0 ? '+' : ''}${zScore}σ) with a ${trendDirection.toLowerCase()} trajectory (${rateOfChangePerHour >= 0 ? '+' : ''}${rateOfChangePerHour} ${sensorCfg.unit}/h).`;
    }

    result[key] = {
      key,
      label: sensorCfg.label,
      unit: sensorCfg.unit,
      componentName: sensorCfg.componentName,
      currentValue: Number(currentValue.toFixed(2)),
      baselineMean,
      baselineStd,
      rollingMean12h,
      rollingStd12h,
      zScore,
      deviationPercent,
      rateOfChangePerHour,
      trendDirection,
      correlationWithLoad,
      correlationWithTemp,
      isAnomalous,
      severity,
      anomalyScore,
      explanation,
      origin: 'MEASURED',
    };
  }

  return result;
}

/**
 * Intelligent CSV parser & column auto-detector.
 * Handles varied column header names and gracefully fills missing columns from machine baseline.
 */
export function parseUploadedSensorCsv(
  csvText: string,
  fallbackMachine: MachineProfile
): { points: TimeSeriesPoint[]; detectedColumns: string[]; warnings: string[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row.');
  }

  const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const normalizedHeaders = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const colMap: Partial<Record<keyof TimeSeriesPoint, number>> = {};
  const detectedColumns: string[] = [];

  normalizedHeaders.forEach((h, idx) => {
    if (h.includes('time') || h.includes('date')) {
      colMap.timestamp = idx;
      detectedColumns.push(`${rawHeaders[idx]} → timestamp`);
    } else if (h === 'oiltemperature' || h === 'oiltemp' || h === 'sumptemp') {
      colMap.oilTemperature = idx;
      detectedColumns.push(`${rawHeaders[idx]} → oilTemperature`);
    } else if (h.includes('temp')) {
      colMap.temperature = idx;
      detectedColumns.push(`${rawHeaders[idx]} → temperature`);
    } else if (h.includes('vib') || h.includes('rms')) {
      colMap.vibration = idx;
      detectedColumns.push(`${rawHeaders[idx]} → vibration`);
    } else if (h.includes('rpm') || h.includes('speed')) {
      colMap.rpm = idx;
      detectedColumns.push(`${rawHeaders[idx]} → rpm`);
    } else if (h.includes('load') || h.includes('torque')) {
      colMap.load = idx;
      detectedColumns.push(`${rawHeaders[idx]} → load`);
    } else if (h.includes('press')) {
      colMap.pressure = idx;
      detectedColumns.push(`${rawHeaders[idx]} → pressure`);
    } else if (h.includes('curr') || h.includes('amp')) {
      colMap.current = idx;
      detectedColumns.push(`${rawHeaders[idx]} → current`);
    } else if (h.includes('cond') || h.includes('visc') || h.includes('quality')) {
      colMap.oilCondition = idx;
      detectedColumns.push(`${rawHeaders[idx]} → oilCondition`);
    }
  });

  const warnings: string[] = [];
  const requiredKeys: SensorKey[] = [
    'temperature',
    'vibration',
    'rpm',
    'load',
    'pressure',
    'current',
    'oilTemperature',
    'oilCondition',
  ];

  for (const k of requiredKeys) {
    if (colMap[k] === undefined) {
      warnings.push(`Column '${k}' not found in CSV; using machine baseline fallback.`);
    }
  }

  const points: TimeSeriesPoint[] = [];
  const dataLines = lines.slice(1);
  const totalRows = dataLines.length;

  dataLines.forEach((line, rowIdx) => {
    const cells = line.split(',').map((c) => c.trim());
    const getNum = (key: SensorKey, defaultVal: number): number => {
      const colIdx = colMap[key];
      if (colIdx === undefined || colIdx >= cells.length) return defaultVal;
      const parsed = Number.parseFloat(cells[colIdx]);
      return Number.isFinite(parsed) ? parsed : defaultVal;
    };

    const tsCell = colMap.timestamp !== undefined ? cells[colMap.timestamp] : '';
    const timestamp =
      tsCell && !Number.isNaN(Date.parse(tsCell))
        ? new Date(tsCell).toISOString()
        : new Date(Date.now() - (totalRows - 1 - rowIdx) * 3600 * 1000).toISOString();

    points.push({
      timestamp,
      hourOffset: rowIdx - (totalRows - 1),
      temperature: getNum('temperature', 65.0),
      vibration: getNum('vibration', 2.4),
      rpm: getNum('rpm', fallbackMachine.inputSpeedRpm),
      load: getNum('load', 72.0),
      pressure: getNum('pressure', 4.1),
      current: getNum('current', 114.0),
      oilTemperature: getNum('oilTemperature', 59.0),
      oilCondition: getNum('oilCondition', 88.0),
    });
  });

  return { points, detectedColumns, warnings };
}
