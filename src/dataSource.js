const { dialog } = require('electron');
const fs = require('fs');
const Papa = require('papaparse');
const configManager = require('./config/configManager');

let members = []; // In-memory data store

/**
 * Loads data from a CSV file into the in-memory store.
 * @returns {Promise<Object>}
 */
async function loadDataFromCsv() {
  const dataConfig = configManager.getDataConfig();
  const errors = configManager.getErrors();
  
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'CSV', extensions: dataConfig.supportedCsvFormats }],
  });

  if (canceled || filePaths.length === 0) {
    return { error: errors.fileSelectionCanceled };
  }

  const filePath = filePaths[0];
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  return new Promise((resolve) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      complete: (results) => {
        const idPrefix = configManager.getDataConfig().idPrefixes.csv;
        members = results.data.map((m, index) => ({ 
          ...m, 
          id: `${idPrefix}-${index}-${Date.now()}`, 
          displayed: false 
        }));
        resolve({ data: members });
      },
      error: (error) => {
        resolve({ error: `${errors.csvParseError} ${error.message}` });
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
  const idPrefix = configManager.getDataConfig().idPrefixes.manual;
  const memberWithState = { ...newMember, id: `${idPrefix}-${Date.now()}`, displayed: false };
  members = [memberWithState, ...members];
  return members;
}

/**
 * Updates an existing member in the store.
 * @param {Object} updatedMember
 * @returns {Array} The updated members list.
 */
function updateMember(updatedMember) {
  const existingMember = members.find(m => m.id === updatedMember.id);
  if (!existingMember) {
    throw new Error(configManager.getErrors().memberNotFound);
  }
  
  members = members.map(m => (m.id === updatedMember.id ? updatedMember : m));
  return members;
}

/**
 * Marks a member as displayed.
 * @param {string} memberId
 * @returns {Array} The updated members list.
 */
function markAsDisplayed(memberId) {
  const existingMember = members.find(m => m.id === memberId);
  if (!existingMember) {
    throw new Error(configManager.getErrors().memberNotFound);
  }
  
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