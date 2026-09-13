// core/setupEngine.js
'use strict';

const fs = require('fs');
const path = require('path');
const appLauncher = require('./appLauncher');

const SETUPS_FILE = path.join(__dirname, '../data/setups.json');

/**
 * Load workspace setups from setups.json
 * @returns {Object}
 */
function loadSetups() {
  try {
    if (fs.existsSync(SETUPS_FILE)) {
      return JSON.parse(fs.readFileSync(SETUPS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading setups.json:', e);
  }
  return {};
}

/**
 * Find a setup configuration by name or alias
 * @param {string} query
 * @returns {{ key: string, data: Object }|null}
 */
function findSetup(query) {
  if (!query || typeof query !== 'string') return null;
  const setups = loadSetups();
  let q = query.toLowerCase().trim();

  // Normalize common prefixes/suffixes
  q = q
    .replace(/^(?:please\s+)?(?:open|launch|start|run)\s+/i, '')
    .replace(/^(?:my|the)\s+/i, '')
    .trim();

  for (const [key, data] of Object.entries(setups)) {
    if (key === q || key === query.toLowerCase().trim()) {
      return { key, data };
    }
    if (Array.isArray(data.aliases)) {
      const match = data.aliases.some(
        (alias) =>
          alias.toLowerCase() === q ||
          alias.toLowerCase() === query.toLowerCase().trim() ||
          query.toLowerCase().trim().includes(alias.toLowerCase())
      );
      if (match) {
        return { key, data };
      }
    }
  }
  return null;
}

/**
 * Run a workspace setup: launches all applications with 700ms stagger.
 * @param {Object} setupData
 * @param {Object} [options]
 * @param {Function} [options.speak]
 * @param {Function} [options.onStep]
 * @param {number} [options.delayMs]
 * @returns {Promise<string>}
 */
async function runSetup(setupData, { speak = console.log, onStep = null, delayMs = 700 } = {}) {
  const apps = setupData.apps || [];
  if (apps.length === 0) return 'Setup is empty.';

  await speak(`Starting ${setupData.name || 'your setup'}.`);

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];
    if (onStep) await onStep(i + 1, apps.length, app);
    await appLauncher.launchApp(app);
    // 700ms stagger between apps for a smooth sequence
    if (i < apps.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const completionMsg = `${setupData.name || 'Setup'} is ready.`;
  await speak(completionMsg);
  return completionMsg;
}

module.exports = {
  findSetup,
  runSetup,
  loadSetups,
};
