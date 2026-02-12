// iCal parsing utility
import ICAL from 'ical';

/**
 * Parse iCal file content and extract busy intervals
 * @param {string} icalContent - iCal file content
 * @param {number} rangeStart - Start of date range (Unix timestamp)
 * @param {number} rangeEnd - End of date range (Unix timestamp)
 * @returns {Array<[number, number]>} - Array of busy intervals
 */
export const parseICalToBusyIntervals = (icalContent, rangeStart, rangeEnd) => {
  try {
    const busyIntervals = [];
    const data = ICAL.parseICS(icalContent);
    
    for (const key in data) {
      const event = data[key];
      
      // Only process VEVENT types
      if (event.type !== 'VEVENT') continue;
      
      // Skip if no start/end
      if (!event.start || !event.end) continue;
      
      const startTime = new Date(event.start).getTime();
      const endTime = new Date(event.end).getTime();
      
      // Handle recurring events
      if (event.rrule) {
        const occurrences = expandRecurrence(event, rangeStart, rangeEnd);
        busyIntervals.push(...occurrences);
      } else {
        // Single event
        if (startTime < rangeEnd && endTime > rangeStart) {
          busyIntervals.push([startTime, endTime]);
        }
      }
    }
    
    return busyIntervals;
  } catch (error) {
    console.error('Error parsing iCal:', error);
    throw new Error('Failed to parse iCal file');
  }
};

/**
 * Expand recurring events within a date range
 * @param {object} event - VEVENT object
 * @param {number} rangeStart - Start of date range
 * @param {number} rangeEnd - End of date range
 * @returns {Array<[number, number]>} - Array of occurrences
 */
function expandRecurrence(event, rangeStart, rangeEnd) {
  const occurrences = [];
  
  try {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const duration = endDate.getTime() - startDate.getTime();
    
    // Get RRULE
    const rrule = event.rrule;
    
    // Simple weekly recurrence support
    if (rrule.freq === 'WEEKLY') {
      const count = rrule.count || 52; // Default to 1 year
      const interval = rrule.interval || 1;
      
      let currentDate = new Date(startDate);
      
      for (let i = 0; i < count; i++) {
        const occurrenceStart = currentDate.getTime();
        const occurrenceEnd = occurrenceStart + duration;
        
        // Check if within range
        if (occurrenceStart >= rangeStart && occurrenceEnd <= rangeEnd) {
          // Check if not excluded
          if (!isExcluded(occurrenceStart, event.exdate)) {
            occurrences.push([occurrenceStart, occurrenceEnd]);
          }
        }
        
        // Stop if past range
        if (occurrenceStart > rangeEnd) break;
        
        // Move to next occurrence
        currentDate.setDate(currentDate.getDate() + (7 * interval));
      }
    }
  } catch (error) {
    console.error('Error expanding recurrence:', error);
  }
  
  return occurrences;
}

/**
 * Check if a date is excluded by EXDATE
 * @param {number} timestamp - Timestamp to check
 * @param {Array} exdates - Array of excluded dates
 * @returns {boolean} - True if excluded
 */
function isExcluded(timestamp, exdates) {
  if (!exdates || !Array.isArray(exdates)) return false;
  
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  
  return exdates.some(exdate => {
    const exd = new Date(exdate);
    exd.setHours(0, 0, 0, 0);
    return exd.getTime() === date.getTime();
  });
}

/**
 * Generate a sample iCal file for testing
 */
export const generateSampleICal = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Group Scheduler//Sample Calendar//EN
BEGIN:VEVENT
UID:sample-1@groupscheduler.com
DTSTAMP:${formatICalDate(now)}
DTSTART:${formatICalDate(tomorrow)}T090000Z
DTEND:${formatICalDate(tomorrow)}T100000Z
SUMMARY:Morning Meeting
END:VEVENT
BEGIN:VEVENT
UID:sample-2@groupscheduler.com
DTSTAMP:${formatICalDate(now)}
DTSTART:${formatICalDate(tomorrow)}T140000Z
DTEND:${formatICalDate(tomorrow)}T150000Z
SUMMARY:Afternoon Call
END:VEVENT
END:VCALENDAR`;
};

/**
 * Format date for iCal format (YYYYMMDD)
 */
function formatICalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export default {
  parseICalToBusyIntervals,
  generateSampleICal,
};
