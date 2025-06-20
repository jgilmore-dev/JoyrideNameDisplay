const { dialog } = require('electron');
const fs = require('fs');
const Papa = require('papaparse');

/**
 * Opens a file dialog for the user to select a CSV file, then reads and parses it.
 * @returns {Promise<Object>} A promise that resolves with the parsed data or an error message.
 */
async function loadData() {
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
        resolve({ data: results.data });
      },
      error: (error) => {
        resolve({ error: error.message });
      },
    });
  });
}

module.exports = {
  loadData,
}; 