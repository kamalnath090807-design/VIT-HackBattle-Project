/**
 * AURA Agent — Memory, User Profiling & Persistence Engine
 *
 * Source: Master PC & Mobile Automation Specification (Part 3)
 *
 * Maintains a crash-safe, debounced persistent memory store (data/memory.json).
 * Automatically extracts facts from user input and injects profile context into prompts.
 */

const fs = require('fs');
const path = require('path');

const MEMORY_FILE_PATH = path.resolve(__dirname, '../../../data/memory.json');

const NAME_BLACKLIST = new Set([
  'not', 'just', 'here', 'going', 'trying', 'looking', 'using', 'doing',
  'ready', 'fine', 'good', 'bad', 'okay', 'ok', 'sorry', 'right', 'wrong',
  'sure', 'no', 'yes', 'happy', 'student', 'developer', 'working', 'thinking',
]);

const DEFAULT_MEMORY = {
  version: 5,
  user: {
    name: 'Abishek',
    age: null,
    occupation: 'Developer',
    location: null,
    favorites: {},
    preferences: { likes: [], dislikes: [], choices: [] },
    routine: { wakeTime: '07:00', sleepTime: '23:30', habits: [], schedule: [] },
    social: { friends: [], family: [] },
    interests: { tech: ['Node.js', 'AI', 'Android'], nonTech: [] },
  },
  facts: [],
  patterns: {
    frequentApps: {},
    frequentTopics: {},
    sessionCount: 1,
    totalTurns: 0,
    lastSeen: new Date().toISOString(),
  },
  expenses: [],
  notes: [],
  history: [],
  createdAt: new Date().toISOString(),
};

class MemoryEngine {
  constructor(filePath = MEMORY_FILE_PATH) {
    this.filePath = filePath;
    this.data = this.loadSync();
    this.debounceTimer = null;
    this.debounceMs = 1500;

    // Attach synchronous exit flushes
    if (typeof process !== 'undefined') {
      const flush = () => this.saveSync();
      process.on('SIGINT', flush);
      process.on('SIGTERM', flush);
    }
  }

  /**
   * Load memory from file or initialize with defaults.
   */
  loadSync() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[MemoryEngine] Failed to load memory.json, initializing defaults:', err.message);
    }
    return JSON.parse(JSON.stringify(DEFAULT_MEMORY));
  }

  /**
   * Synchronously save memory to disk.
   */
  saveSync() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[MemoryEngine] Error writing memory file:', err.message);
    }
  }

  /**
   * Debounced save to reduce disk I/O.
   */
  saveDebounced() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.saveSync();
      this.debounceTimer = null;
    }, this.debounceMs);
    if (this.debounceTimer && typeof this.debounceTimer.unref === 'function') {
      this.debounceTimer.unref();
    }
  }

  /**
   * Clear any pending timers.
   */
  cleanup() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Store a discrete fact in memory.
   */
  storeFact(key, fact) {
    if (!key || !fact) return;
    const existingIndex = this.data.facts.findIndex((f) => f.key === key);
    const entry = {
      key,
      fact,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.data.facts.splice(existingIndex, 1);
    }
    this.data.facts.push(entry);

    this.data.patterns.totalTurns += 1;
    this.data.patterns.lastSeen = new Date().toISOString();
    this.saveDebounced();
  }

  /**
   * Autonomously learn and extract facts from natural language user input.
   */
  learnFromInput(input) {
    if (!input || typeof input !== 'string') return null;
    const text = input.trim();
    const textLower = text.toLowerCase();

    // 1. Name detection: "my name is X" or "i am X"
    const nameMatch = text.match(/(?:my name is|i am)\s+([A-Za-z]+)/i);
    if (nameMatch) {
      const candidate = nameMatch[1].trim();
      if (!NAME_BLACKLIST.has(candidate.toLowerCase()) && candidate.length > 1) {
        this.data.user.name = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        this.storeFact('user_name', `User's name is ${this.data.user.name}`);
        return { type: 'name', value: this.data.user.name };
      }
    }

    // 2. Favorite item: "my favorite <item> is <value>"
    const favMatch = text.match(/my favorite\s+([A-Za-z]+)\s+is\s+(.+)/i);
    if (favMatch) {
      const category = favMatch[1].toLowerCase();
      const value = favMatch[2].replace(/[.!]+$/, '').trim();
      this.data.user.favorites[category] = value;
      this.storeFact(`favorite_${category}`, `User's favorite ${category} is ${value}`);
      return { type: 'favorite', category, value };
    }

    // 3. Explicit memory request: "remember that <fact>" or "note that <fact>"
    const remMatch = text.match(/(?:remember that|note that)\s+(.+)/i);
    if (remMatch) {
      const fact = remMatch[1].replace(/[.!]+$/, '').trim();
      const key = `fact_${Date.now()}`;
      this.storeFact(key, fact);
      return { type: 'fact', fact };
    }

    // 4. Preference like: "i love <item>" or "i like <item>"
    const likeMatch = text.match(/i\s+(?:love|like)\s+(.+)/i);
    if (likeMatch) {
      const item = likeMatch[1].replace(/[.!]+$/, '').trim();
      if (!this.data.user.preferences.likes.includes(item)) {
        this.data.user.preferences.likes.push(item);
        this.storeFact(`likes_${item.toLowerCase().replace(/\s+/g, '_')}`, `User likes ${item}`);
        return { type: 'like', item };
      }
    }

    return null;
  }

  /**
   * Compile user facts and profile into structured markdown context for LLMs.
   */
  buildAIContext() {
    const user = this.data.user || {};
    const facts = this.data.facts || [];
    const favorites = user.favorites || {};
    const favSummary = Object.entries(favorites)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const factsList = facts.slice(-5).map((f) => `- ${f.fact}`).join('\n');

    return `
[AURA Memory Context]
User: ${user.name || 'User'} (${user.occupation || 'Operator'})
${favSummary ? `Favorites: ${favSummary}` : ''}
${factsList ? `Remembered Facts:\n${factsList}` : ''}
`;
  }

  /**
   * Return complete user profile & metrics.
   */
  getUserProfile() {
    return {
      user: this.data.user,
      factsCount: this.data.facts.length,
      recentFacts: this.data.facts.slice(-10),
      patterns: this.data.patterns,
      historyCount: this.data.history.length,
    };
  }
}

// Export singleton instance and class
const memoryEngine = new MemoryEngine();

module.exports = {
  MemoryEngine,
  memoryEngine,
};
