/**
 * AURA Agent — Compound Intent Splitter & Deconstruction
 *
 * Source: Master PC & Mobile Automation Specification (Part 4)
 *
 * Deconstructs multi-intent compound sentences into discrete atomic task objectives.
 */

const { tryExpandMultiOpen } = require('../../../core/taskSplitter');

const SPLIT_REGEX = /\s*(?:,\s*then\s+|;\s*then\s+|\s+then\s+|,\s*and\s+then\s+|\s+and\s+then\s+|,\s*after\s+that\s+|\s+after\s+that\s+|;\s*)\s*/i;

const IMPERATIVE_VERBS = new Set([
  'open', 'launch', 'start', 'close', 'kill', 'type', 'read', 'search',
  'check', 'solve', 'set', 'mute', 'call', 'send', 'message', 'take',
  'play', 'pause', 'resume', 'unlock', 'lock', 'log', 'add', 'remember', 'note',
]);

/**
 * Split a complex multi-task goal into sequential sub-tasks.
 * @param {string} goal
 * @returns {Array<string>} Array of atomic goal strings
 */
function splitCompoundGoal(goal) {
  if (!goal || typeof goal !== 'string') return [];
  const trimmed = goal.trim();

  // Multi-app tokenizer (e.g. "open whatsapp youtube calculator vs code and edge")
  const multiOpen = tryExpandMultiOpen(trimmed);
  if (multiOpen && multiOpen.length >= 2) {
    return multiOpen;
  }

  // 1. Primary sequence split via conjunctions ("then", "and then", "after that", ";")
  const primaryParts = trimmed.split(SPLIT_REGEX).map((p) => p.trim()).filter(Boolean);

  const subTasks = [];

  for (const part of primaryParts) {
    // 2. Secondary check for "and" connecting two distinct imperative actions
    // e.g. "Open Chrome and search for React docs"
    const andMatch = part.match(/(.+?)\s+and\s+([a-z]+(?:\s+.+)?)/i);
    if (andMatch) {
      const firstVerb = andMatch[1].trim().split(/\s+/)[0].toLowerCase();
      const secondVerb = andMatch[2].trim().split(/\s+/)[0].toLowerCase();

      if (IMPERATIVE_VERBS.has(firstVerb) && IMPERATIVE_VERBS.has(secondVerb)) {
        subTasks.push(andMatch[1].trim());
        subTasks.push(andMatch[2].trim());
        continue;
      }
    }

    subTasks.push(part);
  }

  return subTasks.length > 0 ? subTasks : [trimmed];
}

module.exports = {
  splitCompoundGoal,
  SPLIT_REGEX,
};
