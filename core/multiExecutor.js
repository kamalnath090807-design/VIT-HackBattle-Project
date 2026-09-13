// core/multiExecutor.js
'use strict';

const { splitTasks } = require('./taskSplitter');
const appLauncher = require('./appLauncher');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Format an array of application names into natural English.
 * e.g. ["whatsapp", "youtube", "calculator", "vs code", "edge"]
 * -> "WhatsApp, YouTube, Calculator, VS Code, and Edge"
 * @param {Array<string>} names
 * @returns {string}
 */
function formatAppList(names) {
  if (!names || names.length === 0) return '';
  const specialCaps = {
    'whatsapp': 'WhatsApp',
    'youtube': 'YouTube',
    'vscode': 'VS Code',
    'vs code': 'VS Code',
    'chatgpt': 'ChatGPT',
    'linkedin': 'LinkedIn',
    'cmd': 'CMD',
    'vlc': 'VLC',
  };

  const cap = (s) => {
    const lower = s.toLowerCase().trim();
    if (specialCaps[lower]) return specialCaps[lower];
    return s
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const formatted = names.map(cap);
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
}

/**
 * Executes a multi-command or multi-open input with 150ms stagger
 * and unified voice/text confirmation.
 * @param {string} rawInput
 * @param {Object} [options]
 * @param {Function} [options.speak]
 * @param {Function} [options.onStep]
 * @param {number} [options.delayMs]
 * @returns {Promise<string>}
 */
async function executeMulti(rawInput, { speak = console.log, onStep = null, delayMs = 150 } = {}) {
  const tasks = splitTasks(rawInput);
  if (!tasks || tasks.length === 0) return '';

  const openedApps = [];
  const isPureMultiOpen = tasks.every((t) => /^(?:open|launch|start)\s+/i.test(t));

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const appName = task.replace(/^(?:open|launch|start)\s+/i, '').trim();

    if (onStep) {
      await onStep(i + 1, tasks.length, appName);
    }

    try {
      await appLauncher.launchApp(appName);
      openedApps.push(appName);
    } catch (e) {
      console.error(`[MultiExecutor] Failed to launch: ${appName}`, e);
    }

    // Micro-delay between launches to prevent Windows window focus conflicts
    if (i < tasks.length - 1) {
      await sleep(delayMs);
    }
  }

  // Unified voice/text confirmation at the end
  if (isPureMultiOpen && openedApps.length > 0) {
    const message = `Opened ${formatAppList(openedApps)}.`;
    await speak(message);
    return message;
  }

  return `Completed ${tasks.length} tasks.`;
}

module.exports = {
  executeMulti,
  formatAppList,
  sleep,
};
