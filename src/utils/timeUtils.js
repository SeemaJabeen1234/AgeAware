/**
 * Format seconds into a human-readable time string
 * 
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string (e.g., "2h 30m" or "45m 20s")
 */
export const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) {
    return '--';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

/**
 * Format milliseconds into a human-readable time string
 * 
 * @param {number} ms - Time in milliseconds
 * @returns {string} - Formatted time string
 */
export const formatTimeFromMs = (ms) => {
  return formatTime(ms / 1000);
};

/**
 * Convert hours and minutes to seconds
 * 
 * @param {number} hours - Hours
 * @param {number} minutes - Minutes
 * @returns {number} - Total time in seconds
 */
export const timeToSeconds = (hours, minutes) => {
  return (hours * 3600) + (minutes * 60);
};

/**
 * Format a date to a readable string
 * 
 * @param {Date|string|number} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return d.toLocaleDateString(undefined, options);
};

/**
 * Check if two dates are on the same day
 * 
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @returns {boolean} - Whether dates are on the same day
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Get a relative time string (e.g., "2 hours ago", "yesterday")
 * 
 * @param {Date|string|number} date - Date to format
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 6) {
    return formatDate(date);
  } else if (diffDay > 1) {
    return `${diffDay} days ago`;
  } else if (diffDay === 1) {
    return 'yesterday';
  } else if (diffHour >= 1) {
    return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  } else if (diffMin >= 1) {
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  } else {
    return 'just now';
  }
};
