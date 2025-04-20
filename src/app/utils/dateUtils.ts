import { parseISO, addHours } from 'date-fns';

export const formatTimeOnly = (time: string): string => {
  // Check for various time formats
  
  // If already in "7:00 PM" format, return as is
  if (/^\d{1,2}:\d{2} [AP]M$/.test(time)) {
    return time;
  }
  
  // Handle 24-hour format like "20:00:00"
  const militaryTimePattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const match = time.match(militaryTimePattern);
  
  if (match) {
    // Extract hours and minutes
    const hours = parseInt(match[1], 10);
    const minutes = match[2];
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM    
    return `${hours12}:${minutes} ${period}`;
  }
  
  // If no pattern matches, return the original string
  return time;
};

// Existing formatDateOnly likely has timezone issues
export function formatDateOnly(date: string | Date | null): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
export function formatDatePreserveDayAndYear(dateString: string | null | Date): string {
  if (!dateString) return "";
  
  let year, month, day;
  
  if (dateString instanceof Date) {
    year = dateString.getFullYear();
    month = dateString.getMonth() + 1;
    day = dateString.getDate();
  } else if (typeof dateString === 'string') {
    try {
      const datePart = dateString.split('T')[0];
      const parts = datePart.split('-');
      
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        const fallbackDate = new Date(dateString);
        year = fallbackDate.getFullYear();
        month = fallbackDate.getMonth() + 1;
        day = fallbackDate.getDate();
      }
    } catch (e) {
      console.error("Date parsing error:", e);
      return "Invalid Date";
    }
  } else {
    return "Invalid Date";
  }
  
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

// Update the formatDatePreserveDay function
export function formatDatePreserveDay(dateString: string | null | Date): string {
  if (!dateString) return "";
  
  let year, month, day;
  
  if (dateString instanceof Date) {
    // Handle Date object
    year = dateString.getFullYear();
    month = dateString.getMonth() + 1;
    day = dateString.getDate();
  } else if (typeof dateString === 'string') {
    // Better ISO string handling
    try {
      // This handles ISO strings like "2025-03-18T00:00:00.000Z"
      const datePart = dateString.split('T')[0];
      const parts = datePart.split('-');
      
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        // Fallback to browser parsing if format is unexpected
        const fallbackDate = new Date(dateString);
        year = fallbackDate.getFullYear();
        month = fallbackDate.getMonth() + 1;
        day = fallbackDate.getDate();
      }
    } catch (e) {
      console.error("Date parsing error:", e);
      return "Invalid Date";
    }
  } else {
    return "Invalid Date";
  }
  
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function formatDateTimeRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

/**
 * Interpret a YYYY-MM-DD date and HH:mm:ss time as
 * America/New_York (EST), and return a UTC Date.
 * Assumes EST (UTC-5) without daylight saving time.
 */
export function estDateTimeToUtc(date: string, time: string): Date {
  // Parse the combined date+time string
  const localDate = parseISO(`${date}T${time}`);
  
  // Add 5 hours to convert from EST to UTC
  return addHours(localDate, 5);
}
