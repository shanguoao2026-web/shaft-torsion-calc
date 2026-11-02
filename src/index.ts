/** Inputs use kW, rpm, N·m, mm, and MPa. */
export interface ShaftInput {
  power?: number;
  rpm?: number;
  torque?: number;
  d?: number;
  di?: number;
  length?: number;
  G?: number;
  allow?: number;
  size?: boolean;
}

/** Unit-bearing field names keep JSON and library results unambiguous. */
export interface ShaftResult {
  torqueNm: number;
  outerDiameterMm: number;
  innerDiameterMm: number;
  shearModulusMPa: number;
  polarMomentMm4: number;
  maxShearMPa: number;
  minimumSolidDiameterMm?: number;
  lengthMm?: number;
  twistRad?: number;
  twistDeg?: number;
  allowableShearMPa?: number;
  safetyFactor?: number;
}

function positive(name: string, value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive number.`);
  }
  return value;
}

export function calculateShaft(input: ShaftInput): ShaftResult {
  const hasTorque = input.torque !== undefined;
  const hasPower = input.power !== undefined || input.rpm !== undefined;
  if (hasTorque === hasPower) {
    throw new Error('Provide either torque or both power and rpm, exclusively.');
  }
  const torque = hasTorque
    ? positive('torque', input.torque)
    : 9550 * positive('power', input.power) / positive('rpm', input.rpm);
  const G = positive('G', input.G ?? 79300);
  const allow = input.allow === undefined ? undefined : positive('allow', input.allow);
  const length = input.length === undefined ? undefined : positive('length', input.length);
  const di = input.di ?? 0;
  if (!Number.isFinite(di) || di < 0) throw new Error('di must be a finite nonnegative number.');
  let d: number;
  let minimumSolidDiameterMm: number | undefined;
  if (input.size && input.d === undefined) {
    if (allow === undefined) throw new Error('Sizing requires allow when d is omitted.');
    if (di !== 0) throw new Error('Sizing without d supports solid shafts only (di = 0).');
    d = minimumSolidDiameterMm = Math.cbrt(16 * torque * 1000 / (Math.PI * allow));
  } else {
    d = positive('d', input.d);
  }
  if (di >= d) throw new Error('di must be less than d.');
  const polarMomentMm4 = Math.PI * (d ** 4 - di ** 4) / 32;
  const maxShearMPa = torque * 1000 * d / (2 * polarMomentMm4);
  const result: ShaftResult = {
    torqueNm: torque, outerDiameterMm: d, innerDiameterMm: di,
    shearModulusMPa: G, polarMomentMm4, maxShearMPa,
  };
  if (minimumSolidDiameterMm !== undefined) result.minimumSolidDiameterMm = minimumSolidDiameterMm;
  if (length !== undefined) {
    result.lengthMm = length;
    result.twistRad = torque * 1000 * length / (G * polarMomentMm4);
    result.twistDeg = result.twistRad * 180 / Math.PI;
  }
  if (allow !== undefined) {
    result.allowableShearMPa = allow;
    result.safetyFactor = allow / maxShearMPa;
  }
  if (Object.entries(result).some(([key, value]) =>
    !Number.isFinite(value) || (key !== 'innerDiameterMm' && value <= 0))) {
    throw new Error('Inputs exceed the supported numerical range.');
  }
  return result;
}
