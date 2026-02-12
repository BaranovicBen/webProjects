// iCal parsing utility
import ICAL from 'ical.js';

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
    
    // Parse the iCal content
    const jcalData = ICAL.parse(icalContent);
    const comp = new ICAL.Component(jcalData);
    
    // Get all VEVENT components
    const vevents = comp.getAllSubcomponents('vevent');
    
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      
      // Get start and end times
      if (!event.startDate || !event.endDate) continue;
      
      // Check if event is recurring
      if (event.isRecurring()) {
        // Handle recurring events
        const startDate = ICAL.Time.fromJSDate(new Date(rangeStart), false);
        const endDate = ICAL.Time.fromJSDate(new Date(rangeEnd), false);
        
        const iterator = event.iterator(startDate);
        let next;
        
        while ((next = iterator.next())) {
          if (next.compare(endDate) > 0) break;
          
          const occurrenceStart = next.toJSDate().getTime();
          const duration = event.duration.toSeconds() * 1000;
          const occurrenceEnd = occurrenceStart + duration;
          
          if (occurrenceStart >= rangeStart && occurrenceEnd <= rangeEnd) {
            busyIntervals.push([occurrenceStart, occurrenceEnd]);
          }
        }
      } else {
        // Single event
        const startTime = event.startDate.toJSDate().getTime();
        const endTime = event.endDate.toJSDate().getTime();
        
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
