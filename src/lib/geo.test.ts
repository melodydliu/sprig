import { distanceMiles, formatDistance } from './geo';

const HB_PIER = { latitude: 33.6535, longitude: -118.0009 };
const NEWPORT_PIER = { latitude: 33.6061, longitude: -117.929 };

describe('distanceMiles', () => {
  it('is zero for the same point', () => {
    expect(distanceMiles(HB_PIER, HB_PIER)).toBeCloseTo(0, 5);
  });

  it('matches a known real-world distance (~5.4 mi HB Pier -> Newport Pier)', () => {
    const d = distanceMiles(HB_PIER, NEWPORT_PIER);
    expect(d).toBeGreaterThan(5);
    expect(d).toBeLessThan(6);
  });

  it('is symmetric', () => {
    expect(distanceMiles(HB_PIER, NEWPORT_PIER)).toBeCloseTo(
      distanceMiles(NEWPORT_PIER, HB_PIER),
      6,
    );
  });
});

describe('formatDistance', () => {
  it('uses feet under ~0.2 mi', () => {
    const near = { latitude: 33.6535, longitude: -118.0 };
    expect(formatDistance(HB_PIER, near)).toMatch(/ft$/);
  });

  it('uses one decimal under 10 mi', () => {
    expect(formatDistance(HB_PIER, NEWPORT_PIER)).toMatch(/^\d\.\d mi$/);
  });

  it('supports kilometers', () => {
    expect(formatDistance(HB_PIER, NEWPORT_PIER, 'km')).toMatch(/km$/);
  });
});
