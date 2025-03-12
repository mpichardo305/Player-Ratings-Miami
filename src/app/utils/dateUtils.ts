export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

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

// New function to preserve dates without timezone shifting
export function formatDatePreserveDay(dateString: string | null): string {
  if (!dateString) return "";
  
  // Parse the date parts directly from the YYYY-MM-DD format
  const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
  
  // Create date with the exact components (months are 0-indexed in JS Date)
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
