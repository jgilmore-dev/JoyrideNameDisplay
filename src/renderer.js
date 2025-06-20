/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Banner from './banner.jsx';
import ControlPanel from './controlPanel.jsx';

// Determine the mode based on URL parameters
function getRenderMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has('banner') ? 'banner' : 'control-panel';
}

// Get the banner number if in banner mode
function getBannerNumber() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('banner') || '1', 10);
}

const container = document.getElementById('root');
const root = createRoot(container);

// Render the appropriate component based on mode
const mode = getRenderMode();

if (mode === 'banner') {
  const bannerNumber = getBannerNumber();
  console.log(`Rendering Banner ${bannerNumber}`);
  root.render(<Banner />);
} else {
  console.log('Rendering Control Panel');
  root.render(<ControlPanel />);
}
