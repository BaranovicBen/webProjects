// Tests for interval computation algorithms
const {
  mergeIntervals,
  clipToRange,
  computeFreeIntervals,
  intersectFreeIntervals,
  intersectTwoSets,
  filterByDuration,
  applyTimeWindows,
  computeSharedFreeTimes,
} = require('../src/utils/intervals');

describe('Interval Algorithms', () => {
  describe('mergeIntervals', () => {
    test('should merge overlapping intervals', () => {
      const intervals = [
        [1000, 2000],
        [1500, 2500],
        [3000, 4000],
      ];
      const result = mergeIntervals(intervals);
      expect(result).toEqual([
        [1000, 2500],
        [3000, 4000],
      ]);
    });

    test('should handle non-overlapping intervals', () => {
      const intervals = [
        [1000, 2000],
        [3000, 4000],
        [5000, 6000],
      ];
      const result = mergeIntervals(intervals);
      expect(result).toEqual(intervals);
    });

    test('should handle empty array', () => {
      const result = mergeIntervals([]);
      expect(result).toEqual([]);
    });

    test('should handle single interval', () => {
      const intervals = [[1000, 2000]];
      const result = mergeIntervals(intervals);
      expect(result).toEqual(intervals);
    });

    test('should handle touching intervals', () => {
      const intervals = [
        [1000, 2000],
        [2000, 3000],
      ];
      const result = mergeIntervals(intervals);
      expect(result).toEqual([[1000, 3000]]);
    });
  });

  describe('clipToRange', () => {
    test('should clip intervals to range', () => {
      const intervals = [
        [500, 1500],
        [2000, 3000],
        [3500, 4500],
      ];
      const result = clipToRange(intervals, 1000, 4000);
      expect(result).toEqual([
        [1000, 1500],
        [2000, 3000],
        [3500, 4000],
      ]);
    });

    test('should exclude intervals outside range', () => {
      const intervals = [
        [100, 200],
        [1000, 2000],
        [5000, 6000],
      ];
      const result = clipToRange(intervals, 500, 4000);
      expect(result).toEqual([[1000, 2000]]);
    });
  });

  describe('computeFreeIntervals', () => {
    test('should compute free intervals from busy intervals', () => {
      const busyIntervals = [
        [1000, 2000],
        [3000, 4000],
      ];
      const result = computeFreeIntervals(busyIntervals, 0, 5000);
      expect(result).toEqual([
        [0, 1000],
        [2000, 3000],
        [4000, 5000],
      ]);
    });

    test('should return full range when no busy intervals', () => {
      const result = computeFreeIntervals([], 0, 5000);
      expect(result).toEqual([[0, 5000]]);
    });

    test('should handle busy intervals covering entire range', () => {
      const busyIntervals = [[0, 5000]];
      const result = computeFreeIntervals(busyIntervals, 0, 5000);
      expect(result).toEqual([]);
    });
  });

  describe('intersectTwoSets', () => {
    test('should intersect two interval sets', () => {
      const set1 = [
        [1000, 3000],
        [5000, 7000],
      ];
      const set2 = [
        [2000, 4000],
        [6000, 8000],
      ];
      const result = intersectTwoSets(set1, set2);
      expect(result).toEqual([
        [2000, 3000],
        [6000, 7000],
      ]);
    });

    test('should return empty for non-overlapping sets', () => {
      const set1 = [[1000, 2000]];
      const set2 = [[3000, 4000]];
      const result = intersectTwoSets(set1, set2);
      expect(result).toEqual([]);
    });
  });

  describe('intersectFreeIntervals', () => {
    test('should intersect multiple free interval sets', () => {
      const sets = [
        [[1000, 5000]],
        [[2000, 6000]],
        [[3000, 7000]],
      ];
      const result = intersectFreeIntervals(sets);
      expect(result).toEqual([[3000, 5000]]);
    });

    test('should handle no overlap', () => {
      const sets = [
        [[1000, 2000]],
        [[3000, 4000]],
      ];
      const result = intersectFreeIntervals(sets);
      expect(result).toEqual([]);
    });
  });

  describe('filterByDuration', () => {
    test('should filter intervals by minimum duration', () => {
      const intervals = [
        [1000, 2000], // 1000ms
        [3000, 5000], // 2000ms
        [6000, 6500], // 500ms
      ];
      const result = filterByDuration(intervals, 1000);
      expect(result).toEqual([
        [1000, 2000],
        [3000, 5000],
      ]);
    });
  });

  describe('applyTimeWindows', () => {
    test('should apply daily time windows', () => {
      // Create intervals spanning multiple days
      const dayStart = new Date('2024-01-01T00:00:00Z').getTime();
      const day2Start = new Date('2024-01-02T00:00:00Z').getTime();
      
      const intervals = [
        [dayStart, day2Start + 12 * 60 * 60 * 1000], // 2.5 days
      ];
      
      const timeWindows = [
        { startHour: 9, endHour: 17 }, // 9am-5pm
      ];
      
      const result = applyTimeWindows(intervals, timeWindows);
      
      // Should have windows for 3 days (Jan 1, 2, 3)
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('computeSharedFreeTimes', () => {
    test('should compute shared free times for multiple participants', () => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour;
      
      const participantBusy = [
        // Participant 1: busy 0-2h, 10-12h
        [
          [now, now + 2 * oneHour],
          [now + 10 * oneHour, now + 12 * oneHour],
        ],
        // Participant 2: busy 1-3h, 11-13h
        [
          [now + oneHour, now + 3 * oneHour],
          [now + 11 * oneHour, now + 13 * oneHour],
        ],
      ];
      
      const constraints = {
        rangeStart: now,
        rangeEnd: now + oneDay,
        minDuration: oneHour,
        maxResults: 10,
      };
      
      const result = computeSharedFreeTimes(participantBusy, constraints);
      
      expect(result.topResults).toBeDefined();
      expect(result.allResults).toBeDefined();
      expect(result.totalCount).toBeGreaterThan(0);
      
      // Verify all results meet minimum duration
      result.allResults.forEach(slot => {
        expect(slot.duration).toBeGreaterThanOrEqual(oneHour);
      });
    });

    test('should handle no shared free time', () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      const participantBusy = [
        [[now, now + oneDay]], // Participant 1 busy all day
        [[now, now + oneDay]], // Participant 2 busy all day
      ];
      
      const constraints = {
        rangeStart: now,
        rangeEnd: now + oneDay,
        minDuration: 60 * 60 * 1000,
        maxResults: 10,
      };
      
      const result = computeSharedFreeTimes(participantBusy, constraints);
      
      expect(result.totalCount).toBe(0);
      expect(result.allResults).toEqual([]);
    });
  });
});
