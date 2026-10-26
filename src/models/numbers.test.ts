import { describe, expect, it } from '@jest/globals';

import { parsePositiveNumber } from './numbers';

describe('parsePositiveNumber', () => {
  it('reads plain numbers, with a dot or a comma', () => {
    expect(parsePositiveNumber('130')).toBe(130);
    expect(parsePositiveNumber(' 72.5 ')).toBe(72.5);
    expect(parsePositiveNumber('6,1')).toBe(6.1);
  });

  it('rejects hex, exponent, signed, zero, infinite and empty input', () => {
    for (const text of ['0x10', '1e3', '-5', '+5', '0', '0.0', 'Infinity', '', ' ', '12abc', '1,2,3', '.5']) {
      expect(parsePositiveNumber(text)).toBeNull();
    }
  });
});
