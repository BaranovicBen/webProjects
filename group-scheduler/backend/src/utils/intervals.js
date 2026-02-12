/**
 * Interval computation algorithms for finding free times
 * All times are in Unix timestamp (milliseconds)
 */

/**
 * Merge overlapping intervals for a single participant
 * @param {Array<[number, number]>} intervals - Array of [start, end] intervals
 * @returns {Array<[number, number]>} - Merged intervals
 */
function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];
  
  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];
    
    // If current interval overlaps with last merged, merge them
    if (current[0] <= lastMerged[1]) {
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}

/**
 * Clip intervals to a date range
 * @param {Array<[number, number]>} intervals - Array of [start, end] intervals
 * @param {number} rangeStart - Range start timestamp
 * @param {number} rangeEnd - Range end timestamp
 * @returns {Array<[number, number]>} - Clipped intervals
 */
function clipToRange(intervals, rangeStart, rangeEnd) {
  const clipped = [];
  
  for (const [start, end] of intervals) {
    // Skip intervals completely outside range
    if (end <= rangeStart || start >= rangeEnd) continue;
    
    // Clip to range boundaries
    const clippedStart = Math.max(start, rangeStart);
    const clippedEnd = Math.min(end, rangeEnd);
    
    if (clippedStart < clippedEnd) {
      clipped.push([clippedStart, clippedEnd]);
    }
  }
  
  return clipped;
}

/**
 * Compute free intervals from busy intervals within a range
 * @param {Array<[number, number]>} busyIntervals - Merged busy intervals
 * @param {number} rangeStart - Range start timestamp
 * @param {number} rangeEnd - Range end timestamp
 * @returns {Array<[number, number]>} - Free intervals
 */
function computeFreeIntervals(busyIntervals, rangeStart, rangeEnd) {
  if (busyIntervals.length === 0) {
    return [[rangeStart, rangeEnd]];
  }
  
  const free = [];
  let currentStart = rangeStart;
  
  for (const [busyStart, busyEnd] of busyIntervals) {
    // If there's a gap before this busy interval
    if (currentStart < busyStart) {
      free.push([currentStart, busyStart]);
    }
    currentStart = Math.max(currentStart, busyEnd);
  }
  
  // Add final free interval if any
  if (currentStart < rangeEnd) {
    free.push([currentStart, rangeEnd]);
  }
  
  return free;
}

/**
 * Intersect multiple sets of free intervals (find common free times)
 * @param {Array<Array<[number, number]>>} freeIntervalSets - Array of free interval arrays
 * @returns {Array<[number, number]>} - Intersected free intervals
 */
function intersectFreeIntervals(freeIntervalSets) {
  if (freeIntervalSets.length === 0) return [];
  if (freeIntervalSets.length === 1) return freeIntervalSets[0];
  
  let result = freeIntervalSets[0];
  
  for (let i = 1; i < freeIntervalSets.length; i++) {
    result = intersectTwoSets(result, freeIntervalSets[i]);
    if (result.length === 0) break; // Early exit if no overlap
  }
  
  return result;
}

/**
 * Intersect two sets of intervals
 * @param {Array<[number, number]>} set1 - First interval set
 * @param {Array<[number, number]>} set2 - Second interval set
 * @returns {Array<[number, number]>} - Intersected intervals
 */
function intersectTwoSets(set1, set2) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < set1.length && j < set2.length) {
    const [start1, end1] = set1[i];
    const [start2, end2] = set2[j];
    
    // Find overlap
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    
    if (overlapStart < overlapEnd) {
      result.push([overlapStart, overlapEnd]);
    }
    
    // Move to next interval
    if (end1 < end2) {
      i++;
    } else {
      j++;
    }
  }
  
  return result;
}

/**
 * Filter intervals by minimum duration
 * @param {Array<[number, number]>} intervals - Intervals to filter
 * @param {number} minDuration - Minimum duration in milliseconds
 * @returns {Array<[number, number]>} - Filtered intervals
 */
function filterByDuration(intervals, minDuration) {
  return intervals.filter(([start, end]) => (end - start) >= minDuration);
}

/**
 * Apply daily time windows to intervals (e.g., only 9am-5pm)
 * @param {Array<[number, number]>} intervals - Intervals to filter
 * @param {Array<{startHour: number, endHour: number}>} timeWindows - Daily time windows in hours
 * @returns {Array<[number, number]>} - Filtered intervals
 */
function applyTimeWindows(intervals, timeWindows) {
  if (!timeWindows || timeWindows.length === 0) return intervals;
  
  const result = [];
  
  for (const [start, end] of intervals) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Process each day in the interval
    let currentDay = new Date(startDate);
    currentDay.setHours(0, 0, 0, 0);
    
    while (currentDay <= endDate) {
      for (const window of timeWindows) {
        const windowStart = new Date(currentDay);
        windowStart.setHours(window.startHour, 0, 0, 0);
        
        const windowEnd = new Date(currentDay);
        windowEnd.setHours(window.endHour, 0, 0, 0);
        
        // Intersect interval with window
        const intersectStart = Math.max(start, windowStart.getTime());
        const intersectEnd = Math.min(end, windowEnd.getTime());
        
        if (intersectStart < intersectEnd) {
          result.push([intersectStart, intersectEnd]);
        }
      }
      
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }
  
  return mergeIntervals(result);
}

/**
 * Rank and sort free slots by preference
 * @param {Array<[number, number]>} intervals - Free intervals
 * @param {object} preferences - Ranking preferences
 * @returns {Array<object>} - Ranked slots with metadata
 */
function rankSlots(intervals, preferences = {}) {
  const slots = intervals.map(([start, end]) => {
    const startDate = new Date(start);
    const duration = end - start;
    const isWeekend = startDate.getDay() === 0 || startDate.getDay() === 6;
    const hour = startDate.getHours();
    const isEarlyMorning = hour < 8;
    const isLateNight = hour >= 22;
    
    let score = 0;
    
    // Prefer longer slots
    score += duration / (1000 * 60 * 60); // Hours
    
    // Prefer earlier dates
    score -= (start - Date.now()) / (1000 * 60 * 60 * 24 * 7); // Weeks from now
    
    // Weekend preference for trips
    if (preferences.preferWeekends && isWeekend) {
      score += 5;
    }
    
    // Avoid late nights
    if (preferences.avoidLateNight && isLateNight) {
      score -= 3;
    }
    
    // Avoid early mornings
    if (preferences.avoidEarlyMorning && isEarlyMorning) {
      score -= 2;
    }
    
    return {
      start,
      end,
      duration,
      score,
      isWeekend,
      startDate: startDate.toISOString(),
    };
  });
  
  // Sort by score descending
  return slots.sort((a, b) => b.score - a.score);
}

/**
 * Main algorithm to compute shared free times
 * @param {Array<Array<[number, number]>>} participantBusyIntervals - Busy intervals per participant
 * @param {object} constraints - Scheduling constraints
 * @returns {Array<object>} - Ranked free slots
 */
function computeSharedFreeTimes(participantBusyIntervals, constraints) {
  const {
    rangeStart,
    rangeEnd,
    minDuration,
    timeWindows,
    preferences = {},
    maxResults = 10,
  } = constraints;
  
  // Step 1: Normalize and merge intervals per participant
  const normalizedBusy = participantBusyIntervals.map(intervals => {
    const merged = mergeIntervals(intervals);
    return clipToRange(merged, rangeStart, rangeEnd);
  });
  
  // Step 2: Compute free intervals per participant
  const freeIntervalSets = normalizedBusy.map(busyIntervals =>
    computeFreeIntervals(busyIntervals, rangeStart, rangeEnd)
  );
  
  // Step 3: Intersect all free intervals to find common free times
  let sharedFree = intersectFreeIntervals(freeIntervalSets);
  
  // Step 4: Apply time windows if specified
  if (timeWindows && timeWindows.length > 0) {
    sharedFree = applyTimeWindows(sharedFree, timeWindows);
  }
  
  // Step 5: Filter by minimum duration
  if (minDuration) {
    sharedFree = filterByDuration(sharedFree, minDuration);
  }
  
  // Step 6: Rank results
  const rankedSlots = rankSlots(sharedFree, preferences);
  
  // Return top N and full list
  return {
    topResults: rankedSlots.slice(0, maxResults),
    allResults: rankedSlots,
    totalCount: rankedSlots.length,
  };
}

module.exports = {
  mergeIntervals,
  clipToRange,
  computeFreeIntervals,
  intersectFreeIntervals,
  intersectTwoSets,
  filterByDuration,
  applyTimeWindows,
  rankSlots,
  computeSharedFreeTimes,
};
