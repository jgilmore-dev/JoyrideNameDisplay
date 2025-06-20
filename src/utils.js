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