import React, { useState } from 'react';
import { SensorFeatureStats, SensorKey, TimeSeriesPoint } from '../models/types';

interface SensorTrendChartProps {
  series: TimeSeriesPoint[];
  selectedKey: SensorKey;
  stat: SensorFeatureStats;
  warningThreshold?: number;
  criticalThreshold?: number;
  compareKey?: SensorKey;
  height?: number;
}

export const SensorTrendChart: React.FC<SensorTrendChartProps> = ({
  series,
  selectedKey,
  stat,
  warningThreshold,
  criticalThreshold,
  compareKey = 'load',
  height = 200,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!series || series.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs font-mono text-[#8D9694]">
        No telemetry time-series points loaded.
      </div>
    );
  }

  const values = series.map((p) => p[selectedKey]);
  const compareValues = series.map((p) => p[compareKey]);

  const rawMin = Math.min(...values, stat.baselineMean - stat.baselineStd * 2);
  const rawMax = Math.max(
    ...values,
    warningThreshold ?? stat.baselineMean + stat.baselineStd * 3
  );
  const pad = Math.max(0.5, (rawMax - rawMin) * 0.14);
  const minVal = rawMin - pad;
  const maxVal = rawMax + pad;

  const cmpMin = Math.min(...compareValues);
  const cmpMax = Math.max(...compareValues) + 0.01;

  const w = 680;
  const h = height;
  const padLeft = 44;
  const padRight = 18;
  const padTop = 16;
  const padBottom = 26;
  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  const toX = (idx: number) =>
    padLeft + (idx / Math.max(1, series.length - 1)) * plotW;
  const toY = (val: number) =>
    padTop + plotH - ((val - minVal) / Math.max(0.0001, maxVal - minVal)) * plotH;
  const toCmpY = (val: number) =>
    padTop + plotH - ((val - cmpMin) / Math.max(0.0001, cmpMax - cmpMin)) * plotH;

  const pointsStr = values
    .map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(' ');

  const areaPointsStr = `${toX(0).toFixed(1)},${(padTop + plotH).toFixed(1)} ${pointsStr} ${toX(
    values.length - 1
  ).toFixed(1)},${(padTop + plotH).toFixed(1)}`;

  const cmpPointsStr = compareValues
    .map((v, i) => `${toX(i).toFixed(1)},${toCmpY(v).toFixed(1)}`)
    .join(' ');

  const baselineY = toY(stat.baselineMean);
  const warnY =
    warningThreshold !== undefined && warningThreshold >= minVal && warningThreshold <= maxVal
      ? toY(warningThreshold)
      : null;
  const critY =
    criticalThreshold !== undefined && criticalThreshold >= minVal && criticalThreshold <= maxVal
      ? toY(criticalThreshold)
      : null;

  const strokeColor =
    stat.severity === 'CRITICAL'
      ? '#FF5500'
      : stat.isAnomalous
      ? '#00D2FF'
      : '#00E599';

  const activePointIdx = hoverIdx !== null ? hoverIdx : series.length - 1;
  const activePt = series[activePointIdx];

  return (
    <div className="w-full select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#F6F1E5]">{stat.label}</span>
          <span className="text-[#EAE3D2]/70">·</span>
          <span className="font-mono text-[#5CE1E6] text-[11px] font-semibold">[{stat.origin}]</span>
          <span className="text-[#EAE3D2]/70">·</span>
          <span className="font-mono text-[11px] text-[#EAE3D2]/85">
            Baseline: {stat.baselineMean} {stat.unit} (±{stat.baselineStd})
          </span>
        </div>

        {activePt && (
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-[#EAE3D2]/85">
              T{activePt.hourOffset >= 0 ? `+${activePt.hourOffset}` : activePt.hourOffset}h
            </span>
            <span className="text-[#F6F1E5] font-semibold">
              {activePt[selectedKey]} {stat.unit}
            </span>
            <span className="text-[#EAE3D2]/80">
              ({compareKey.toUpperCase()}: {activePt[compareKey]})
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden glass-subcard rounded-xl">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-auto block cursor-crosshair"
          onMouseLeave={() => setHoverIdx(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * w;
            const ratio = Math.max(0, Math.min(1, (relX - padLeft) / plotW));
            const idx = Math.round(ratio * (series.length - 1));
            setHoverIdx(idx);
          }}
        >
          <defs>
            <linearGradient id={`grad-${selectedKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.34" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {[0, 0.5, 1].map((frac, i) => {
            const val = maxVal - frac * (maxVal - minVal);
            const y = padTop + frac * plotH;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={w - padRight}
                  y2={y}
                  stroke="#133A56"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#DCE5EC"
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Healthy Baseline Line */}
          {baselineY >= padTop && baselineY <= padTop + plotH && (
            <g>
              <line
                x1={padLeft}
                y1={baselineY}
                x2={w - padRight}
                y2={baselineY}
                stroke="#F6F1E5"
                strokeWidth="1"
                strokeDasharray="3 3"
                strokeOpacity="0.6"
              />
              <text
                x={padLeft + 6}
                y={baselineY - 4}
                fill="#F6F1E5"
                fillOpacity="0.9"
                fontSize="9"
                fontFamily="IBM Plex Mono, monospace"
              >
                BASELINE {stat.baselineMean} {stat.unit}
              </text>
            </g>
          )}

          {/* Warning Threshold Line */}
          {warnY !== null && (
            <g>
              <line
                x1={padLeft}
                y1={warnY}
                x2={w - padRight}
                y2={warnY}
                stroke="#5CE1E6"
                strokeWidth="1.2"
                strokeDasharray="5 3"
                strokeOpacity="0.85"
              />
              <text
                x={w - padRight - 6}
                y={warnY - 4}
                textAnchor="end"
                fill="#5CE1E6"
                fontSize="9"
                fontFamily="IBM Plex Mono, monospace"
              >
                LIMIT WARN ({warningThreshold} {stat.unit})
              </text>
            </g>
          )}

          {/* Critical Threshold Line */}
          {critY !== null && (
            <line
              x1={padLeft}
              y1={critY}
              x2={w - padRight}
              y2={critY}
              stroke="#E56B5D"
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeOpacity="0.75"
            />
          )}

          {/* Secondary Comparison Curve (e.g. Load or RPM) */}
          <polyline
            fill="none"
            stroke="#8D9694"
            strokeOpacity="0.3"
            strokeWidth="1.25"
            strokeDasharray="2 2"
            points={cmpPointsStr}
          />

          {/* Primary Sensor Area & Line */}
          <polygon fill={`url(#grad-${selectedKey})`} points={areaPointsStr} />
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            points={pointsStr}
          />

          {/* Active Hover Crosshair */}
          {activePt && (
            <g>
              <line
                x1={toX(activePointIdx)}
                y1={padTop}
                x2={toX(activePointIdx)}
                y2={padTop + plotH}
                stroke="#E8E5DD"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
              <circle
                cx={toX(activePointIdx)}
                cy={toY(activePt[selectedKey])}
                r="4"
                fill={strokeColor}
                stroke="#0B0D0E"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* X-Axis Time Markers */}
          {[0, Math.floor(series.length / 2), series.length - 1].map((idx) => {
            const pt = series[idx];
            if (!pt) return null;
            return (
              <text
                key={idx}
                x={toX(idx)}
                y={h - 7}
                textAnchor={idx === 0 ? 'start' : idx === series.length - 1 ? 'end' : 'middle'}
                fill="#8D9694"
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
              >
                {pt.hourOffset === 0 ? 'NOW (0h)' : `${pt.hourOffset}h`}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
