const { dialog } = require('electron');
const fs = require('fs');
const Papa = require('papaparse');

let members = []; // In-memory data store

/**
 * Loads data from a CSV file into the in-memory store.
 * @returns {Promise<Object>}
 */
async function loadDataFromCsv() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });

  if (canceled || filePaths.length === 0) {
    return { error: 'File selection was canceled.' };
  }

  const filePath = filePaths[0];
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  return new Promise((resolve) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      complete: (results) => {
        members = results.data.map((m, index) => ({ ...m, id: `csv-${index}-${Date.now()}`, displayed: false }));
        resolve({ data: members });
      },
      error: (error) => {
        resolve({ error: error.message });
      },
    });
  });
}

/**
 * Returns the current list of members.
 * @returns {Array}
 */
function getMembers() {
  return members;
}

/**
 * Adds a new member to the in-memory store.
 * @param {Object} newMember
 * @returns {Array} The updated members list.
 */
function addMember(newMember) {
  const memberWithState = { ...newMember, id: `manual-${Date.now()}`, displayed: false };
  members = [memberWithState, ...members];
  return members;
}

/**
 * Updates an existing member in the store.
 * @param {Object} updatedMember
 * @returns {Array} The updated members list.
 */
function updateMember(updatedMember) {
  members = members.map(m => (m.id === updatedMember.id ? updatedMember : m));
  return members;
}

/**
 * Marks a member as displayed.
 * @param {string} memberId
 * @returns {Array} The updated members list.
 */
function markAsDisplayed(memberId) {
  members = members.map(m => (m.id === memberId ? { ...m, displayed: true } : m));
  return members;
}

module.exports = {
  loadDataFromCsv,
  getMembers,
  addMember,
  updateMember,
  markAsDisplayed,
}; 