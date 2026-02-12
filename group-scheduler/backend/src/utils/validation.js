/**
 * Validation utilities for API inputs
 */

/**
 * Normalize and validate busy intervals
 * Accepts:
 * - Array of arrays: [[start, end], ...]
 * - Array of objects: [{start, end}, ...]
 * - Where start/end can be timestamps (numbers) or ISO strings
 * 
 * Returns: Array of [number, number] tuples with Unix timestamps
 * 
 * @param {Array} intervals - Input intervals in various formats
 * @returns {Array<[number, number]>} - Normalized intervals
 * @throws {Error} - If validation fails
 */
function normalizeBusyIntervals(intervals) {
  if (!Array.isArray(intervals)) {
    throw new Error('busyIntervals must be an array');
  }

  const normalized = [];

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    let start, end;

    // Handle array format: [start, end]
    if (Array.isArray(interval)) {
      if (interval.length !== 2) {
        throw new Error(`Interval at index ${i} must have exactly 2 elements [start, end]`);
      }
      [start, end] = interval;
    }
    // Handle object format: {start, end}
    else if (typeof interval === 'object' && interval !== null) {
      if (!('start' in interval) || !('end' in interval)) {
        throw new Error(`Interval at index ${i} must have 'start' and 'end' properties`);
      }
      start = interval.start;
      end = interval.end;
    }
    else {
      throw new Error(`Interval at index ${i} must be an array or object`);
    }

    // Convert to timestamps
    const startTimestamp = parseTimestamp(start, `start of interval ${i}`);
    const endTimestamp = parseTimestamp(end, `end of interval ${i}`);

    // Validate range
    if (startTimestamp >= endTimestamp) {
      throw new Error(`Interval at index ${i}: start must be before end`);
    }

    // Validate reasonable range (not more than 10 years in future, not before 2020)
    const minTimestamp = new Date('2020-01-01').getTime();
    const maxTimestamp = Date.now() + (10 * 365 * 24 * 60 * 60 * 1000);

    if (startTimestamp < minTimestamp) {
      throw new Error(`Interval at index ${i}: start date is too far in the past`);
    }

    if (endTimestamp > maxTimestamp) {
      throw new Error(`Interval at index ${i}: end date is too far in the future`);
    }

    normalized.push([startTimestamp, endTimestamp]);
  }

  return normalized;
}

/**
 * Parse a timestamp from various formats
 * @param {string|number} value - Timestamp as number or ISO string
 * @param {string} fieldName - Name of field for error messages
 * @returns {number} - Unix timestamp in milliseconds
 * @throws {Error} - If parsing fails
 */
function parseTimestamp(value, fieldName) {
  // Already a number (Unix timestamp)
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${fieldName} must be a valid positive number`);
    }
    return value;
  }

  // String - try to parse as ISO date
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    if (isNaN(timestamp)) {
      throw new Error(`${fieldName} is not a valid date string`);
    }
    return timestamp;
  }

  throw new Error(`${fieldName} must be a number or ISO date string`);
}

/**
 * Validate session constraints
 * @param {object} constraints - Constraints object
 * @returns {object} - Validated and normalized constraints
 */
function validateConstraints(constraints) {
  if (!constraints || typeof constraints !== 'object') {
    throw new Error('constraints must be an object');
  }

  const validated = { ...constraints };

  // Parse timestamps if they exist
  if ('rangeStart' in constraints) {
    validated.rangeStart = parseTimestamp(constraints.rangeStart, 'rangeStart');
  }

  if ('rangeEnd' in constraints) {
    validated.rangeEnd = parseTimestamp(constraints.rangeEnd, 'rangeEnd');
  }

  // Validate range
  if (validated.rangeStart && validated.rangeEnd) {
    if (validated.rangeStart >= validated.rangeEnd) {
      throw new Error('rangeStart must be before rangeEnd');
    }
  }

  // Validate minDuration
  if ('minDuration' in constraints) {
    if (typeof constraints.minDuration !== 'number' || constraints.minDuration <= 0) {
      throw new Error('minDuration must be a positive number');
    }
  }

  // Validate maxResults
  if ('maxResults' in constraints) {
    if (typeof constraints.maxResults !== 'number' || constraints.maxResults <= 0) {
      throw new Error('maxResults must be a positive number');
    }
  }

  return validated;
}

module.exports = {
  normalizeBusyIntervals,
  parseTimestamp,
  validateConstraints,
};
