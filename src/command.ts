import { calculateShaft, type ShaftInput, type ShaftResult } from './index.js';

const help = `Usage: shaft-torsion-calc (--power kW --rpm rpm | --torque N·m) --d mm [options]
       shaft-torsion-calc (--power kW --rpm rpm | --torque N·m) --size --allow MPa

Options:
  --power kW    Transmitted power (requires --rpm)
  --rpm rpm     Rotational speed (requires --power)
  --torque N·m  Applied torque (exclusive with power/rpm)
  --d mm        Outer diameter
  --di mm       Inner diameter (default: 0, solid)
  --length mm   Shaft length, enables twist calculation
  --G MPa       Shear modulus (default: 79300)
  --allow MPa   Allowable shear stress, enables safety factor
  --size        Compute minimum solid diameter if --d is omitted
  --json        Print JSON with unit-bearing field names
  --help, -h    Show this help

All numeric inputs must be finite and positive except --di, which may be zero.
`;
const numeric = new Set(['power', 'rpm', 'torque', 'd', 'di', 'length', 'G', 'allow']);

export function runCli(args: string[]): string {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    return help;
  }
  const input: ShaftInput = {};
  let json = false;
  const seen = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
    const [name, ...parts] = arg.slice(2).split('=');
    if (seen.has(name)) throw new Error(`Duplicate option: --${name}`);
    seen.add(name);
    if (name === 'json' || name === 'size') {
      if (parts.length) throw new Error(`--${name} does not accept a value.`);
      if (name === 'json') json = true;
      else input.size = true;
    } else if (numeric.has(name)) {
      const raw = parts.length ? parts.join('=') : args[++i];
      if (raw === undefined || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
        throw new Error(`--${name} requires a numeric value.`);
      }
      (input as Record<string, unknown>)[name] = Number(raw);
    } else {
      throw new Error(`Unknown option: --${name}. Use --help for usage.`);
    }
  }
  const result = calculateShaft(input);
  return json ? JSON.stringify(result, null, 2) + '\n' : printTable(result);
}

function printTable(result: ShaftResult): string {
  const labels: Record<keyof ShaftResult, string> = {
    torqueNm: 'Torque (N·m)', outerDiameterMm: 'Outer diameter (mm)',
    innerDiameterMm: 'Inner diameter (mm)', shearModulusMPa: 'Shear modulus (MPa)',
    polarMomentMm4: 'Polar moment (mm⁴)', maxShearMPa: 'Max shear (MPa)',
    minimumSolidDiameterMm: 'Minimum solid diameter (mm)', lengthMm: 'Length (mm)',
    twistRad: 'Twist (rad)', twistDeg: 'Twist (deg)',
    allowableShearMPa: 'Allowable shear (MPa)', safetyFactor: 'Safety factor',
  };
  let output = 'Quantity                       | Value\n-------------------------------+----------------\n';
  for (const [key, value] of Object.entries(result)) {
    output += `${labels[key as keyof ShaftResult].padEnd(30)} | ${Number(value.toPrecision(10))}\n`;
  }
  return output;
}

