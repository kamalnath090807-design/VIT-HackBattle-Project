// core/appLauncher.js
'use strict';

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const userHome = os.homedir();
const antigravityCandidates = [
  path.join(userHome, 'AppData/Local/Programs/antigravity/Antigravity.exe'),
  path.join(userHome, 'AppData/Local/Programs/Antigravity IDE/Antigravity IDE.exe'),
  path.join(userHome, 'AppData/Local/Programs/AntiGravity/AntiGravity.exe'),
];
let defaultAntigravityPath = 'antigravity';
for (const p of antigravityCandidates) {
  if (fs.existsSync(p)) {
    defaultAntigravityPath = p;
    break;
  }
}

const APP_MAP = {
  // Browsers
  'chrome': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'google chrome': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'edge': 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'microsoft edge': 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',

  // Communication & Productivity
  'whatsapp': 'shell:AppsFolder\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm!App',
  'whatsapp desktop': 'shell:AppsFolder\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm!App',
  'vscode': 'code',
  'vs code': 'code',
  'file explorer': 'explorer',
  'explorer': 'explorer',
  'calculator': 'calc',
  'calc': 'calc',
  'notepad': 'notepad',
  'outlook': 'outlook',
  'spotify': 'spotify',
  'discord': 'discord',
  'terminal': 'wt',
  'cmd': 'cmd',
  'powershell': 'powershell',
  'task manager': 'taskmgr',
  'taskmgr': 'taskmgr',
  'settings': 'ms-settings:',

  // Dev & AI Tools
  'antigravity': defaultAntigravityPath,
  'antigravity ide': defaultAntigravityPath,
  'chatgpt': 'https://chatgpt.com/',
  'youtube': 'https://www.youtube.com/',
  'linkedin': 'https://www.linkedin.com/',
};

/**
 * Launches an application by name or key.
 * @param {string} name
 * @returns {Promise<boolean>}
 */
function launchApp(name) {
  return new Promise((resolve) => {
    if (!name || typeof name !== 'string') return resolve(false);
    const key = name.toLowerCase().trim();
    let target = APP_MAP[key] || key;

    // Check if systemIndexer has a resolved target
    try {
      const { systemIndexer } = require('../agent/src/automation/systemIndexer');
      const resolved = systemIndexer.resolveApp(key);
      if (resolved && resolved.target) {
        target = resolved.target;
      }
    } catch {}

    // Check if target is a web URL
    if (/^https?:\/\//i.test(target)) {
      exec(`powershell -Command "Start-Process '${target}'"`, (err) => {
        resolve(!err);
      });
      return;
    }

    // Use Windows 'start' to launch without blocking the event loop
    const cmd = `start "" "${target}"`;
    exec(cmd, { windowsHide: true, shell: true, timeout: 8000 }, (err) => {
      if (err) {
        // Fallback to direct shell execution if start "" fails
        exec(`start ${target}`, () => resolve(true));
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  launchApp,
  APP_MAP,
};
