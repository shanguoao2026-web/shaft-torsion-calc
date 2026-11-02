import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../dist/command.js';
import { calculateShaft } from '../dist/index.js';

const near = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const cli = (...args) => runCli(args);

test('power, solid stress, twist, and safety factor', () => {
  const r = calculateShaft({ power: 5, rpm: 1450, d: 20, length: 500, allow: 40 });
  near(r.torqueNm, 32.93103448275862);
  near(r.maxShearMPa, 20.964547676243, 1e-8);
  near(r.polarMomentMm4, Math.PI * 20 ** 4 / 32);
  near(r.twistRad, r.torqueNm * 1000 * 500 / (79300 * r.polarMomentMm4));
  near(r.twistDeg, 0.7574, 0.001);
  near(r.safetyFactor, 40 / r.maxShearMPa);
});
test('hollow shaft agrees with formulas and custom modulus', () => {
  const r = calculateShaft({ torque: 100, d: 30, di: 20, length: 600, G: 80000 });
  near(r.polarMomentMm4, Math.PI * (30 ** 4 - 20 ** 4) / 32);
  near(r.maxShearMPa, 16 * 100000 * 30 / (Math.PI * (30 ** 4 - 20 ** 4)));
  near(r.twistRad, 100000 * 600 / (80000 * r.polarMomentMm4));
  near(r.twistDeg, r.twistRad * 180 / Math.PI);
});
test('sizing uses formula and reaches allowable stress', () => {
  const r = calculateShaft({ torque: 32.931, allow: 40, size: true });
  near(r.outerDiameterMm, Math.cbrt(16 * 32931 / (Math.PI * 40)));
  near(r.minimumSolidDiameterMm, r.outerDiameterMm);
  near(r.maxShearMPa, 40);
  near(r.safetyFactor, 1);
});
test('sizing supports power and preserves an explicitly supplied diameter', () => {
  assert.ok(calculateShaft({ power: 5, rpm: 1450, allow: 40, size: true }).outerDiameterMm > 16);
  const r = calculateShaft({ torque: 10, d: 30, di: 10, size: true });
  assert.equal(r.outerDiameterMm, 30);
  assert.equal(r.minimumSolidDiameterMm, undefined);
});
test('optional results are omitted', () => {
  const r = calculateShaft({ torque: 10, d: 20 });
  assert.equal(r.twistRad, undefined);
  assert.equal(r.safetyFactor, undefined);
  assert.equal(r.innerDiameterMm, 0);
});
test('invalid engineering inputs are rejected', () => {
  for (const input of [
    {}, { power: 5, d: 20 }, { rpm: 100, d: 20 },
    { torque: 10, power: 5, rpm: 100, d: 20 },
    { torque: 0, d: 20 }, { torque: -1, d: 20 },
    { torque: 10 }, { torque: 10, d: 0 },
    { torque: 10, d: 20, di: 20 }, { torque: 10, d: 20, di: 30 },
    { torque: 10, d: 20, di: -1 }, { torque: 10, d: 20, G: 0 },
    { torque: 10, d: 20, length: -1 }, { torque: 10, d: 20, allow: 0 },
    { torque: Infinity, d: 20 }, { torque: 10, d: NaN },
    { torque: 10, size: true }, { torque: 10, size: true, allow: 40, di: 1 },
    { torque: 1e308, d: 20 }, { torque: 10, d: 1e100 },
  ]) assert.throws(() => calculateShaft(input), undefined, JSON.stringify(input));
});
test('CLI JSON is parseable and table and help are readable', () => {
  const r = JSON.parse(cli('--power', '5', '--rpm', '1450', '--d', '20', '--json'));
  near(r.torqueNm, 9550 * 5 / 1450);
  assert.match(cli('--torque=10', '--d=20'), /Torque \(N·m\)/);
  assert.match(cli('--help'), /Usage:/);
  assert.match(cli('-h'), /--size/);
  const sized = JSON.parse(cli('--torque', '32.931', '--allow', '40', '--size', '--json'));
  near(sized.safetyFactor, 1);
});
test('CLI invalid arguments are rejected', () => {
  for (const args of [[], ['--bogus'], ['--torque'], ['--torque', 'abc'],
    ['--torque', '1', '--d', '20mm'], ['--json=true'], ['--size=false'],
    ['--torque', '10', '--d', '20', '--d', '30'], ['stray'],
    ['--power', '5', '--rpm', '0', '--d', '20'],
    ['--torque', '10', '--d', '20', '--di', '20']]) {
    assert.throws(() => runCli(args), Error, args.join(' '));
  }
});
