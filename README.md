# shaft-torsion-calc

A TypeScript Node.js CLI for elastic torsion of solid and hollow circular shafts, using standard circular-shaft formulas as found in Shigley and mechanical design handbooks. Zero runtime dependencies. Requires Node.js 18 or newer.

## Install and run

```sh
npm install
npm run build
node dist/cli.js --power 5 --rpm 1450 --d 20 --length 500 --allow 40
node dist/cli.js --torque 100 --d 30 --di 20 --G 80000 --json
node dist/cli.js --torque 32.931 --size --allow 40
```

Optionally run `npm link` to use the `shaft-torsion-calc` command. Run `npm test` to build and execute the Node test suite.

## Inputs

| Option | Units | Description |
| --- | --- | --- |
| `--power` | kW | Power; requires `--rpm` |
| `--rpm` | rpm | Rotational speed; requires `--power` |
| `--torque` | N·m | Torque; exclusive with power and rpm |
| `--d` | mm | Outer diameter; required unless sizing |
| `--di` | mm | Inner diameter; defaults to 0 (solid) |
| `--length` | mm | Optional length for twist calculation |
| `--G` | MPa | Shear modulus; defaults to 79300 |
| `--allow` | MPa | Optional allowable shear stress for safety factor |
| `--size` | — | With `--allow` and no `--d`, calculate minimum solid diameter |
| `--json` | — | Print JSON instead of a table |
| `--help`, `-h` | — | Display usage |

Both `--name value` and `--name=value` are supported. Values must be finite and positive, except `di`, which may be zero and must be less than `d`. Duplicate and unknown options are errors. Invalid inputs print an error to stderr and exit with status 1.

Sizing without `d` requires a solid shaft (`di = 0`). If `d` is supplied with `--size`, the supplied geometry is evaluated normally. Sizing gives the theoretical minimum without rounding to a manufactured diameter or adding design margins.

## Formulas and results

With torque `T` in N·m, convert to `Tmm = 1000 T` in N·mm:

- `T = 9550 P / n` for power in kW and speed in rpm.
- `J = π(d⁴ − di⁴) / 32` in mm⁴.
- `τmax = Tmm d / (2J)` in MPa.
- `θ = Tmm L / (GJ)` in radians; degrees are `θ × 180 / π`.
- Safety factor is `allow / τmax`.
- Minimum solid diameter is `cbrt(16 Tmm / (π allow))` in mm.

For 5 kW at 1450 rpm and a solid 20 mm shaft, torque is about 32.931 N·m and maximum shear is about 20.965 MPa. With a 500 mm length and default G, twist is about 0.7574°. Sizing at 32.931 N·m and 40 MPa gives about 16.125 mm.

JSON fields include `torqueNm`, `outerDiameterMm`, `innerDiameterMm`, `shearModulusMPa`, `polarMomentMm4`, and `maxShearMPa`. Length adds `lengthMm`, `twistRad`, and `twistDeg`; allowable stress adds `allowableShearMPa` and `safetyFactor`; sizing adds `minimumSolidDiameterMm`. Optional fields are omitted when not applicable. JSON retains full numerical precision; table values use ten significant digits.

These formulas assume a uniform circular shaft under elastic torsion. They do not account for stress concentrations, fatigue, keyways, combined loads, or material nonlinearity.

## Library

```js
import { calculateShaft } from './dist/index.js';
const result = calculateShaft({ torque: 100, d: 30, di: 20, length: 500 });
console.log(result.maxShearMPa);
```

Type declarations are included in the build. Inputs outside the finite numerical range of the calculations are rejected.

## License

MIT; see [LICENSE](LICENSE).
