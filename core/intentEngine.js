/**
 * AURA — Intent & Automation Target Engine
 * Manages PC ⇄ Mobile automation mode, YouTube intent parsing, and context resolution.
 */
'use strict';

let _automationTarget = 'pc'; // 'pc' | 'mobile'

const ORDINAL_MAP = {
  first: 1, '1st': 1, top: 1, one: 1, '1': 1,
  second: 2, '2nd': 2, two: 2, '2': 2,
  third: 3, '3rd': 3, three: 3, '3': 3,
  fourth: 4, '4th': 4, four: 4, '4': 4,
  fifth: 5, '5th': 5, five: 5, '5': 5,
};

const YOUTUBE_PATTERNS = [
  // 1. Subsequent Selection (e.g. "play the second result", "select 2nd video", "play the third result on phone")
  {
    type: 'phone_youtube_select',
    regex: /^(?:(?:play|select|choose|click|tap|open)\s+(?:the\s+)?(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|top|[1-5])(?:\s+(?:one|result|video|option|song))?(?:\s+(?:on|in)\s+(?:youtube|phone))?)$/i,
    extract: (m) => {
      const ordWord = (m[1] || '1').toLowerCase().trim();
      return { index: ORDINAL_MAP[ordWord] || 1 };
    },
  },
  // Dedicated Trending Songs pattern (e.g. "trending songs", "trending songs in tamil", "trending chat", "trending playlist")
  {
    type: 'phone_youtube',
    regex: /^(?:(?:open\s+youtube\s+and\s+)?(?:play\s+)?trending\s+(?:songs?(?:\s+in\s+tamil)?|chat|playlist)|trending\s+songs?(?:\s+in\s+tamil)?)(?:\s+(?:on|in)\s+(?:phone|youtube|pc|computer))?$/i,
    extract: () => ({ query: 'trending songs in tamil', autoPlayIndex: 1 }),
  },
  // 2. Initial Launch & Play (e.g. "open youtube and play rathima on phone", "play rathima on youtube", "play tamil song", "open youtube and search for tamil songs and play it", "open youtube search tamil songs on pc")
  {
    type: 'phone_youtube',
    regex: /^(?:(?:open\s+youtube\s+(?:and\s+)?(?:search(?:\s+for)?|play)|open\s+youtube\s+search|search(?:\s+for)?|play)\s+)(.+?)(?:\s+(?:and\s+)?(?:play\s+it|play|select)\s*(?:it|the)?(?:\s+(?:first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|top|\d))?(?:\s+(?:one|result|video|song))?)?(?:\s+(?:on|in)\s+(?:my\s+|the\s+)?(?:phone|mobile|youtube|pc|computer|laptop|desktop|windows))?$/i,
    extract: (m) => {
      let raw = (m[1] || '').trim();
      const ordMatch = raw.match(/\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|top|[1-5])(?:\s+(?:one|result|video|song))?$/i) ||
                       (m[0] || '').match(/\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|top|[1-5])(?:\s+(?:one|result|video|song))?(?:\s+(?:on|in)\s+(?:my\s+|the\s+)?(?:phone|mobile|youtube|pc|computer|laptop|desktop|windows))?$/i);
      let autoPlayIndex = 1;
      if (ordMatch) {
        const w = ordMatch[1].toLowerCase();
        autoPlayIndex = ORDINAL_MAP[w] || 1;
      }
      let query = raw
        .replace(/\b(?:on|in|from|to)\s+(?:my\s+|the\s+)?(?:phone|mobile|youtube|pc|computer|laptop|desktop|windows)\b/gi, '')
        .replace(/\b(?:on|in)\s+pc\b/gi, '')
        .replace(/\s+pc\b/gi, '')
        .replace(/\s+(?:and\s+)?(?:play\s+it|play|select)\s*(?:it|the)?(?:\s+(?:first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|top|\d))?(?:\s+(?:one|result|video|song))?$/i, '')
        .replace(/\s+(?:first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|top|[1-5])(?:\s+(?:one|result|video|song))?$/i, '')
        .trim();
      if (!query || /^trending(?:\s+songs?|\s+chat|\s+playlist)?$/i.test(query.trim())) {
        query = 'trending songs in tamil';
      }
      return { query, autoPlayIndex };
    },
  },
  // 3. In-Video Media Controls (e.g. "skip 10 seconds", "rewind 10s", "pause phone", "resume video")
  {
    type: 'phone_media',
    regex: /^(?:skip|forward)(?:\s+forward)?(?:\s+by)?\s+(?:10\s*s(?:ec(?:ond)?s?)?|10)\s*(?:on\s+(?:the\s+|my\s+)?phone|in\s+video)?$/i,
    extract: () => ({ action: 'forward_10' }),
  },
  {
    type: 'phone_media',
    regex: /^(?:rewind|back|backward)(?:\s+by)?\s+(?:10\s*s(?:ec(?:ond)?s?)?|10)\s*(?:on\s+(?:the\s+|my\s+)?phone|in\s+video)?$/i,
    extract: () => ({ action: 'rewind_10' }),
  },
  {
    type: 'phone_media',
    regex: /^(?:pause\s+(?:phone|video|music|youtube)|pause)$/i,
    extract: () => ({ action: 'pause' }),
  },
  {
    type: 'phone_media',
    regex: /^(?:resume\s+(?:phone|video|music|youtube)|play\s+(?:phone|video)|resume)$/i,
    extract: () => ({ action: 'play' }),
  },
];

function parseYouTubeCommand(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = clean.match(pattern.regex);
    if (match) {
      const params = pattern.extract(match);
      return {
        type: pattern.type,
        params,
      };
    }
  }
  return null;
}

function setTarget(target) {
  _automationTarget = target === 'mobile' ? 'mobile' : 'pc';
  return _automationTarget;
}

function getTarget() {
  return _automationTarget;
}

/**
 * Resolve whether command targets PC or Mobile
 * @param {string} text - User command string
 * @param {string} [explicitTarget] - Target from UI toggle ('pc' | 'mobile')
 */
function resolveIntent(text, explicitTarget = null) {
  const target = explicitTarget || _automationTarget;
  const lower = (text || '').toLowerCase().trim();

  const hasPhoneKeywords = /\b(on phone|in phone|my phone|to phone|into phone|the phone|phone|on mobile|in mobile|my mobile|the mobile|mobile|android|save to phone|save in phone|torch|flashlight)\b/i.test(lower);
  const hasPcKeywords = /\b(on pc|in pc|my pc|to pc|into pc|pc|on computer|in computer|my computer|computer|on laptop|in laptop|my laptop|laptop|on desktop|in desktop|my desktop|desktop|vs code|vscode|notepad|antigravity|cmd|terminal)\b/i.test(lower);

  let finalTarget = target;
  if (hasPhoneKeywords && !hasPcKeywords) {
    finalTarget = 'mobile';
  } else if (hasPcKeywords && !hasPhoneKeywords) {
    finalTarget = 'pc';
  }

  // Symmetrically steer generic commands based on active target mode
  let adjustedGoal = text;
  const { tryExpandMultiOpen } = require('./taskSplitter');
  const { findSetup } = require('./setupEngine');
  const isMultiOpen = !!tryExpandMultiOpen(text);
  const isSetup = !!findSetup(text);

  if (isMultiOpen || isSetup) {
    adjustedGoal = text;
  } else if (finalTarget === 'mobile' && !hasPhoneKeywords) {
    if (
      /\b(unlock|wake|lock|volume|vol|vloume|battery|screenshot|camera|selfie|selfi|alarm|youtube|spotify|call|dial|message|whatsapp|photo|image|share|pause|resume|skip|rewind|mute|silent|unmute|vibrat|bright|torch|flashlight|wifi|bluetooth|record|dnd|theme|rotate|location|play|song|songs|music|trending|open|launch|free\s*fire|freefire|instagram|insta|chrome|app|apps)\b/i.test(
        lower
      )
    ) {
      adjustedGoal = `${text} on phone`;
    }
  } else if (finalTarget === 'pc' && !hasPcKeywords) {
    if (
      /\b(lock|volume|vol|vloume|mute|unmute|silent|bright|wifi|bluetooth|night light|theme|dark mode|light mode|hotspot|airplane|energy saver|battery saver|shutdown|terminate|reboot|restart|sleep|close all apps|screenshot|record screen|start recording|stop recording|finish record|play|song|songs|music|youtube|trending)\b/i.test(
        lower
      )
    ) {
      adjustedGoal = `${text} on pc`;
    }
  }

  const youtubeIntent = parseYouTubeCommand(text);

  return {
    target: finalTarget,
    originalText: text,
    adjustedGoal,
    isMobile: finalTarget === 'mobile',
    youtubeIntent,
  };
}

module.exports = {
  setTarget,
  getTarget,
  resolveIntent,
  parseYouTubeCommand,
  ORDINAL_MAP,
  YOUTUBE_PATTERNS,
};
