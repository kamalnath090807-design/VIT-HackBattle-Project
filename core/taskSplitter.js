// core/taskSplitter.js
'use strict';

const MULTI_OPEN_APPS = [
  'whatsapp', 'youtube', 'calculator', 'vs code', 'vscode', 'edge',
  'microsoft edge', 'chrome', 'google chrome', 'file explorer', 'explorer',
  'antigravity', 'antigravity ide', 'chatgpt', 'outlook', 'linkedin', 'spotify', 'notepad',
  'discord', 'terminal', 'cmd', 'powershell', 'task manager', 'taskmgr',
  'camera', 'free fire', 'freefire', 'settings', 'paint', 'figma', 'vlc'
];

// Sort longest first to prevent 'code' matching before 'vs code', or 'explorer' before 'file explorer'
const SORTED_APPS = [...MULTI_OPEN_APPS].sort((a, b) => b.length - a.length);

/**
 * Checks if input is "open app1 app2 app3" or "open app1, app2 and app3"
 * Returns array of normalized commands: ['open app1', 'open app2', ...]
 * @param {string} rawInput
 * @returns {Array<string>|null}
 */
function tryExpandMultiOpen(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const t = rawInput.toLowerCase().trim();
  if (!/^(?:please\s+)?(?:open|launch|start)\s+/i.test(t)) return null;

  const rest = t.replace(/^(?:please\s+)?(?:open|launch|start)\s+/i, '').trim();

  // Stage 1: Atomic Intent Filter
  // If there are search/action verbs, treat as compound action, not pure multi-open
  // e.g. "open whatsapp and search for kamal", "open youtube search tamil songs"
  if (/\b(search(?:\s+for)?|find|play|type|look\s+up|message|send|saying|solve)\b/i.test(rest)) {
    return null;
  }

  // ── Strategy A: Delimiter split (comma, and, &, then, also) ────────────────
  const parts = rest
    .split(/\s*,\s*|\s+and\s+|\s+&\s+|\s+then\s+|\s+also\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const matchedFromParts = [];
  let allPartsValid = true;
  for (const part of parts) {
    const candidate = SORTED_APPS.find((a) => a === part || part === a + ' app');
    if (candidate) {
      matchedFromParts.push(candidate);
    } else {
      allPartsValid = false;
      break;
    }
  }

  if (allPartsValid && matchedFromParts.length >= 2) {
    return matchedFromParts.map((app) => `open ${app}`);
  }

  // ── Strategy B: Greedy Tokenizer (Space-separated app list without connectors) ──
  // Handles: "open whatsapp youtube calculator vs code and edge"
  const tokens = rest.split(/[\s,;&]+/).filter(Boolean);
  const resolved = [];
  let i = 0;

  while (i < tokens.length) {
    // 2-word lookahead (e.g. "vs code", "file explorer", "microsoft edge", "google chrome")
    if (i + 1 < tokens.length) {
      const pair = `${tokens[i]} ${tokens[i + 1]}`.toLowerCase();
      const matchPair = SORTED_APPS.find((a) => a === pair);
      if (matchPair) {
        resolved.push(matchPair);
        i += 2;
        continue;
      }
    }

    // Skip connector words
    const single = tokens[i].toLowerCase();
    if (/^(and|then|also|with|&)$/.test(single)) {
      i++;
      continue;
    }

    // 1-word match (e.g. "whatsapp", "youtube", "calculator", "edge", "chrome")
    const matchSingle = SORTED_APPS.find((a) => a === single);
    if (matchSingle) {
      resolved.push(matchSingle);
    }
    i++;
  }

  if (resolved.length >= 2) {
    return resolved.map((app) => `open ${app}`);
  }

  return null;
}

/**
 * Split general compound tasks or multi-open commands
 * @param {string} rawInput
 * @returns {Array<string>}
 */
function splitTasks(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return [];
  const multi = tryExpandMultiOpen(rawInput);
  if (multi) return multi;

  // Fallback split on connectors for general multi-command inputs
  const CONNECTOR_RE = /\b(and\s+then|then\s+after|after\s+that|followed\s+by|then|also|and)\b/gi;
  if (!CONNECTOR_RE.test(rawInput)) return [rawInput];

  return rawInput
    .split(CONNECTOR_RE)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && !/^(and\s+then|then\s+after|after\s+that|followed\s+by|then|also|and)$/i.test(s));
}

module.exports = {
  splitTasks,
  tryExpandMultiOpen,
  SORTED_APPS,
  MULTI_OPEN_APPS,
};
