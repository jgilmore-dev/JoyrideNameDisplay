/**
 * Formats an array of first names into a human-readable string.
 * - 1 name: "John"
 * - 2 names: "John and Sarah"
 * - 3+ names: "John, Sarah, and David"
 * @param {Object} member - The member object from the CSV data.
 * @returns {string} The formatted string of first names.
 */
export function formatFirstNames(member) {
  const names = [member.Member1, member.Member2, member.Member3, member.Member4].filter(Boolean);

  if (names.length === 0) {
    return '';
  }
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return names.join(' and ');
  }
  // For 3 or more names, use the Oxford comma.
  const last = names.pop();
  return `${names.join(', ')}, and ${last}`;
}

/**
 * Debounce utility function for performance optimization
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility function for performance optimization
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} The throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
} 