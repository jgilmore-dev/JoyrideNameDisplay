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

/**
 * Validates member data
 * @param {Object} member - The member object to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateMemberData(member) {
  const errors = [];

  // Check if member data is provided
  if (!member || typeof member !== 'object') {
    return { isValid: false, errors: ['Member data is required'] };
  }

  // Check for required fields
  if (member.Member1 === undefined || member.Member1 === null) {
    errors.push('Member1 is required');
  } else if (typeof member.Member1 === 'string' && member.Member1.trim() === '') {
    errors.push('Member1 cannot be empty');
  }

  if (member.LastName === undefined || member.LastName === null) {
    errors.push('LastName is required');
  } else if (typeof member.LastName === 'string' && member.LastName.trim() === '') {
    errors.push('LastName cannot be empty');
  }

  // Invalidate if names contain HTML tags
  const htmlTagRegex = /<[^>]+>/;
  if (typeof member.Member1 === 'string' && htmlTagRegex.test(member.Member1)) {
    errors.push('Member1 contains invalid characters');
  }
  if (typeof member.LastName === 'string' && htmlTagRegex.test(member.LastName)) {
    errors.push('LastName contains invalid characters');
  }

  // Check for ID
  if (!member.id) {
    errors.push('ID is required');
  }

  // Check for maximum length (1000 characters)
  const maxLength = 1000;
  if (member.Member1 && typeof member.Member1 === 'string' && member.Member1.length >= maxLength) {
    errors.push('Member1 exceeds maximum length');
  }
  if (member.LastName && typeof member.LastName === 'string' && member.LastName.length >= maxLength) {
    errors.push('LastName exceeds maximum length');
  }

  // Check for circular references
  try {
    JSON.stringify(member);
  } catch (e) {
    errors.push('Invalid member data structure');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates venue configuration
 * @param {Object} config - The venue configuration to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateVenueConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    return { isValid: false, errors: ['Venue configuration is required'] };
  }

  // Check for venue name
  if (!config.venueName || config.venueName.trim() === '') {
    errors.push('Venue name is required');
  }

  // Check for color format in displaySettings
  if (config.displaySettings && config.displaySettings.defaultColor && !/^#[0-9A-Fa-f]{6}$/.test(config.displaySettings.defaultColor)) {
    errors.push('Invalid color format');
  }

  // Check for font size format in displaySettings
  if (config.displaySettings && config.displaySettings.defaultFontSize && !/^\d+px$/.test(config.displaySettings.defaultFontSize)) {
    errors.push('Invalid font size format');
  }

  // Check for banner configuration
  if (config.banners && config.banners.count !== undefined && config.banners.count < 1) {
    errors.push('Invalid banner count');
  }

  // Check for deeply nested objects (limit depth)
  const checkDepth = (obj, depth = 0) => {
    if (depth > 5) {
      errors.push('Configuration too deeply nested');
      return;
    }
    if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => checkDepth(value, depth + 1));
    }
  };
  checkDepth(config);

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates banner configuration
 * @param {Object} config - The banner configuration to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateBannerConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    return { isValid: false, errors: ['Banner configuration is required'] };
  }

  // Check for banner ID (can be 'id' or 'bannerId')
  const bannerId = config.id || config.bannerId;
  if (!bannerId) {
    errors.push('Valid banner ID is required');
  } else if (typeof bannerId !== 'number' || bannerId <= 0) {
    errors.push('Invalid banner ID');
  }

  // Check for position coordinates
  if (config.position) {
    if (config.position.x !== undefined && (typeof config.position.x !== 'number' || config.position.x < 0)) {
      errors.push('Invalid position coordinates');
    }
    if (config.position.y !== undefined && (typeof config.position.y !== 'number' || config.position.y < 0)) {
      errors.push('Invalid position coordinates');
    }
    if (config.position.width !== undefined && (typeof config.position.width !== 'number' || config.position.width <= 0)) {
      errors.push('Invalid dimensions');
    }
    if (config.position.height !== undefined && (typeof config.position.height !== 'number' || config.position.height <= 0)) {
      errors.push('Invalid dimensions');
    }
  }

  // Check for individual position properties
  if (config.x !== undefined && (typeof config.x !== 'number' || config.x < 0)) {
    errors.push('Invalid X coordinate');
  }
  if (config.y !== undefined && (typeof config.y !== 'number' || config.y < 0)) {
    errors.push('Invalid Y coordinate');
  }
  if (config.width !== undefined && (typeof config.width !== 'number' || config.width <= 0)) {
    errors.push('Invalid width');
  }
  if (config.height !== undefined && (typeof config.height !== 'number' || config.height <= 0)) {
    errors.push('Invalid height');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Sanitizes input to prevent XSS and other security issues
 * @param {string} input - The input string to sanitize
 * @returns {string} The sanitized string
 */
export function sanitizeInput(input) {
  if (input === null || input === undefined) {
    return '';
  }

  if (typeof input !== 'string') {
    input = String(input);
  }

  // Remove <script>...</script> blocks and their content
  input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove HTML tags
  input = input.replace(/<[^>]*>/g, '');
  // Remove common SQL injection patterns (but preserve apostrophes in names)
  input = input.replace(/("|;|--|\/\*|\*\/|union|select|insert|update|delete|drop|create|alter)/gi, '');
  // Replace newlines, tabs, and multiple spaces with single space
  input = input.replace(/[\n\r\t]+/g, ' ');
  input = input.replace(/\s+/g, ' ');
  // Trim whitespace
  input = input.trim();
  return input;
} 