import { EngineeringCalcOutput, MachineProfile } from '../models/types';

/**
 * Pure mechanical engineering calculation engine for industrial rotating machinery.
 * Clearly separates preliminary sizing and kinematic/thermal equations from UI logic.
 */
export function runEngineeringCalculations(machine: MachineProfile): EngineeringCalcOutput {
  const latestPoint = machine.timeSeries[machine.timeSeries.length - 1];
  const loadFraction = latestPoint ? latestPoint.load / 100 : 0.78;
  const currentRpm = latestPoint ? latestPoint.rpm : machine.inputSpeedRpm;

  const inputRpm = Math.max(1, machine.inputSpeedRpm);
  const outputRpm = Math.max(0.1, machine.outputSpeedRpm);

  // 1. Exact Gear Ratio: i = input RPM / output RPM
  const exactGearRatio = Number((inputRpm / outputRpm).toFixed(2));

  // 2. Two-stage helical-bevel split ratio estimation:
  // First stage (high-speed bevel/helical): i_1 ~ 1.15 * sqrt(i)
  const stage1Ratio = Number(Math.min(exactGearRatio, Math.max(1.2, Math.sqrt(exactGearRatio) * 1.12)).toFixed(2));
  const stage2Ratio = Number((exactGearRatio / stage1Ratio).toFixed(2));
  const intermediateShaftRpm = Number((currentRpm / stage1Ratio).toFixed(1));

  // 3. Rated & Operating Power
  const ratedPowerKw = machine.ratedPowerKw;
  const actualPowerKw = Number((ratedPowerKw * loadFraction).toFixed(2));

  // 4. Torque Formula: T = 9550 * Power(kW) / RPM
  const inputTorqueNm = Number(((9550 * ratedPowerKw) / inputRpm).toFixed(1));
  const efficiency = machine.efficiencyAssumed || 0.96;
  const outputTorqueNm = Number((inputTorqueNm * exactGearRatio * efficiency).toFixed(1));

  // 5. Pitch Line Velocity & Tangential Mesh Force (assuming pinion pitch diameter d_p1 ~ 1.65 * inputShaftDia)
  const pinionPitchDiaMm = machine.dimensions.inputShaftDiameterMm * 1.65;
  const pitchLineVelocityMs = Number(
    ((Math.PI * (pinionPitchDiaMm / 1000) * currentRpm) / 60).toFixed(2)
  );
  const tangentialGearForceN = Number(
    ((2000 * inputTorqueNm * loadFraction) / Math.max(20, pinionPitchDiaMm)).toFixed(0)
  );

  // 6. Preliminary Torsional Shaft Sizing Estimate (ASME B106.1M / DIN 743 simplified torsional check)
  // d_min = ( (16 * T * K_a) / (pi * tau_allow) )^(1/3)
  // Named Assumptions:
  // - Allowable torsional shear stress with keyway tau_allow = 45 MPa (N/mm^2) for 42CrMo4 steel
  // - Application / duty service factor K_a = 1.50 (industrial continuous fan/pump/cooling tower duty)
  // - Combined bending equivalent factor C_b = 1.35
  const tauAllowMpa = 45;
  const serviceFactorKa = 1.5;
  const bendingFactorCb = 1.35;

  const inputDesignTorqueNmm = inputTorqueNm * 1000 * serviceFactorKa * bendingFactorCb;
  const outputDesignTorqueNmm = outputTorqueNm * 1000 * serviceFactorKa * bendingFactorCb;

  const preliminaryMinInputShaftMm = Number(
    Math.pow((16 * inputDesignTorqueNmm) / (Math.PI * tauAllowMpa), 1 / 3).toFixed(1)
  );
  const preliminaryMinOutputShaftMm = Number(
    Math.pow((16 * outputDesignTorqueNmm) / (Math.PI * tauAllowMpa), 1 / 3).toFixed(1)
  );

  const inputShaftSafetyFactor = Number(
    Math.pow(machine.dimensions.inputShaftDiameterMm / preliminaryMinInputShaftMm, 3).toFixed(2)
  );
  const outputShaftSafetyFactor = Number(
    Math.pow(machine.dimensions.outputShaftDiameterMm / preliminaryMinOutputShaftMm, 3).toFixed(2)
  );

  // 7. Housing Thermal Dissipation & Heat Loss Estimate
  const L = machine.dimensions.housingLengthMm / 1000;
  const W = machine.dimensions.housingWidthMm / 1000;
  const H = machine.dimensions.housingHeightMm / 1000;
  // Finned industrial housing effective surface area factor = 1.35
  const housingSurfaceAreaM2 = Number((2 * (L * W + L * H + W * H) * 1.35).toFixed(2));
  const heatLossKw = Number((actualPowerKw * (1 - efficiency)).toFixed(2));
  // Overall convective heat transfer coefficient U = 18 W/(m^2*K) in forced draft air
  const overallU = 18;
  const estimatedEquilibriumTempRiseC = Number(
    ((heatLossKw * 1000) / Math.max(0.5, overallU * housingSurfaceAreaM2)).toFixed(1)
  );

  return {
    exactGearRatio,
    stage1Ratio,
    stage2Ratio,
    intermediateShaftRpm,
    inputTorqueNm,
    outputTorqueNm,
    actualPowerKw,
    heatLossKw,
    pitchLineVelocityMs,
    tangentialGearForceN,
    preliminaryMinInputShaftMm,
    preliminaryMinOutputShaftMm,
    inputShaftSafetyFactor,
    outputShaftSafetyFactor,
    housingSurfaceAreaM2,
    estimatedEquilibriumTempRiseC,
    assumptions: [
      `Torque calculated via T = 9550 × P(kW) / n(RPM) at rated ${ratedPowerKw} kW.`,
      `Two-stage mechanical efficiency η = ${(efficiency * 100).toFixed(1)}% assumed for helical-bevel mesh & roller bearings.`,
      `Preliminary shaft sizing uses allowable keyway torsional shear stress τ_allow = ${tauAllowMpa} MPa (42CrMo4), duty factor K_a = ${serviceFactorKa}, and combined bending factor C_b = ${bendingFactorCb} (Preliminary estimate only — not certified final shaft design).`,
      `Thermal balance assumes housing finned surface area factor 1.35 and convective coefficient U = ${overallU} W/(m²·K).`,
    ],
    origin: 'ESTIMATED',
  };
}
