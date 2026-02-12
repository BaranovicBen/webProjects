// Tests for validation utilities
const {
  normalizeBusyIntervals,
  parseTimestamp,
  validateConstraints,
} = require('../src/utils/validation');

describe('Validation Utilities', () => {
  describe('parseTimestamp', () => {
    test('should parse numeric timestamp', () => {
      const timestamp = 1705312800000;
      const result = parseTimestamp(timestamp, 'test');
      expect(result).toBe(timestamp);
    });

    test('should parse ISO date string', () => {
      const isoString = '2026-02-15T09:00:00Z';
      const result = parseTimestamp(isoString, 'test');
      expect(result).toBe(new Date(isoString).getTime());
    });

    test('should throw on invalid string', () => {
      expect(() => parseTimestamp('invalid-date', 'test'))
        .toThrow('test is not a valid date string');
    });

    test('should throw on negative number', () => {
      expect(() => parseTimestamp(-1000, 'test'))
        .toThrow('test must be a valid positive number');
    });

    test('should throw on non-number, non-string', () => {
      expect(() => parseTimestamp(null, 'test'))
        .toThrow('test must be a number or ISO date string');
    });
  });

  describe('normalizeBusyIntervals', () => {
    test('should normalize array of arrays with timestamps', () => {
      const intervals = [
        [1705312800000, 1705316400000],
        [1705327200000, 1705330800000],
      ];
      const result = normalizeBusyIntervals(intervals);
      expect(result).toEqual(intervals);
    });

    test('should normalize array of objects with ISO strings', () => {
      const intervals = [
        { start: '2026-02-15T09:00:00Z', end: '2026-02-15T10:00:00Z' },
        { start: '2026-02-15T14:00:00Z', end: '2026-02-15T15:00:00Z' },
      ];
      const result = normalizeBusyIntervals(intervals);
      
      expect(result).toHaveLength(2);
      expect(result[0][0]).toBe(new Date('2026-02-15T09:00:00Z').getTime());
      expect(result[0][1]).toBe(new Date('2026-02-15T10:00:00Z').getTime());
    });

    test('should normalize mixed format (arrays with ISO strings)', () => {
      const intervals = [
        ['2026-02-15T09:00:00Z', '2026-02-15T10:00:00Z'],
      ];
      const result = normalizeBusyIntervals(intervals);
      
      expect(result).toHaveLength(1);
      expect(result[0][0]).toBe(new Date('2026-02-15T09:00:00Z').getTime());
    });

    test('should normalize mixed format (objects with timestamps)', () => {
      const intervals = [
        { start: 1705312800000, end: 1705316400000 },
      ];
      const result = normalizeBusyIntervals(intervals);
      
      expect(result).toEqual([[1705312800000, 1705316400000]]);
    });

    test('should throw on non-array input', () => {
      expect(() => normalizeBusyIntervals('not-an-array'))
        .toThrow('busyIntervals must be an array');
    });

    test('should throw on array with wrong length', () => {
      const intervals = [[1705312800000]]; // Only one element
      expect(() => normalizeBusyIntervals(intervals))
        .toThrow('Interval at index 0 must have exactly 2 elements (start and end)');
    });

    test('should throw on object missing start', () => {
      const intervals = [{ end: 1705316400000 }];
      expect(() => normalizeBusyIntervals(intervals))
        .toThrow("Interval at index 0 must have 'start' and 'end' properties");
    });

    test('should throw on object missing end', () => {
      const intervals = [{ start: 1705312800000 }];
      expect(() => normalizeBusyIntervals(intervals))
        .toThrow("Interval at index 0 must have 'start' and 'end' properties");
    });

    test('should throw when start >= end', () => {
      const intervals = [[1705316400000, 1705312800000]]; // start after end
      expect(() => normalizeBusyIntervals(intervals))
        .toThrow('Interval at index 0: start must be before end');
    });

    test('should throw when start equals end', () => {
      const intervals = [[1705312800000, 1705312800000]];
      expect(() => normalizeBusyIntervals(intervals))
        .toThrow('Interval at index 0: start must be before end');
    });

    test('should throw on date too far in past', () => {
      const intervals = [[0, 1000]]; // Jan 1, 1970
      expect(() => normalizeBusyIntervals(intervals))
        .toThrow('Interval at index 0: start date is too far in the past');
    });

    test('should throw on date too far in future', () => {
      const farFuture = Date.now() + (15 * 365 * 24 * 60 * 60 * 1000); // 15 years
      const intervals = [[farFuture, farFuture + 1000]];
      expect(() => normalizeBusyIntervals(intervals))
        .toThrow('Interval at index 0: end date is too far in the future');
    });

    test('should handle empty array', () => {
      const result = normalizeBusyIntervals([]);
      expect(result).toEqual([]);
    });

    test('should handle multiple intervals of different formats', () => {
      const intervals = [
        [1705312800000, 1705316400000], // array with timestamps
        { start: '2026-02-15T14:00:00Z', end: '2026-02-15T15:00:00Z' }, // object with strings
        ['2026-02-15T16:00:00Z', '2026-02-15T17:00:00Z'], // array with strings
      ];
      const result = normalizeBusyIntervals(intervals);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual([1705312800000, 1705316400000]);
      expect(result[1][0]).toBe(new Date('2026-02-15T14:00:00Z').getTime());
      expect(result[2][0]).toBe(new Date('2026-02-15T16:00:00Z').getTime());
    });
  });

  describe('validateConstraints', () => {
    test('should validate and normalize constraints with timestamps', () => {
      const constraints = {
        rangeStart: 1705312800000,
        rangeEnd: 1705916400000,
        minDuration: 3600000,
        maxResults: 10,
      };
      const result = validateConstraints(constraints);
      expect(result).toEqual(constraints);
    });

    test('should parse ISO strings in constraints', () => {
      const constraints = {
        rangeStart: '2026-02-15T00:00:00Z',
        rangeEnd: '2026-02-22T00:00:00Z',
        minDuration: 3600000,
      };
      const result = validateConstraints(constraints);
      
      expect(result.rangeStart).toBe(new Date('2026-02-15T00:00:00Z').getTime());
      expect(result.rangeEnd).toBe(new Date('2026-02-22T00:00:00Z').getTime());
    });

    test('should throw when rangeStart >= rangeEnd', () => {
      const constraints = {
        rangeStart: 1705916400000,
        rangeEnd: 1705312800000,
      };
      expect(() => validateConstraints(constraints))
        .toThrow('rangeStart must be before rangeEnd');
    });

    test('should throw on negative minDuration', () => {
      const constraints = {
        minDuration: -1000,
      };
      expect(() => validateConstraints(constraints))
        .toThrow('minDuration must be a positive number');
    });

    test('should throw on non-object', () => {
      expect(() => validateConstraints('not-an-object'))
        .toThrow('constraints must be an object');
    });

    test('should handle partial constraints', () => {
      const constraints = {
        minDuration: 3600000,
      };
      const result = validateConstraints(constraints);
      expect(result.minDuration).toBe(3600000);
    });
  });
});
