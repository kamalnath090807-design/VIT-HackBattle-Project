/**
 * AURA Agent — Tool Registry & Schema Catalog
 *
 * Source: docs/08-SECURITY.md §4, docs/11-INTEGRATION-CONTRACT.md §9
 *
 * Strict, deterministic tool registry.
 * The LLM cannot invent new tools. All tool executions must be validated here.
 */

const { RISK_LEVELS } = require('../../../shared/riskLevels');

const TOOL_DEFINITIONS = Object.freeze({
  weather_api: {
    name: 'weather_api',
    description: 'Fetch current weather conditions for a specified city',
    parameters: {
      city: { type: 'string', required: true, description: 'City name (e.g. Chennai, London)' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'weather',
  },
  github_issues: {
    name: 'github_issues',
    description: 'List recent issues from a public GitHub repository',
    parameters: {
      owner: { type: 'string', required: true, description: 'Repository owner' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      state: { type: 'string', required: false, default: 'open', enum: ['open', 'closed', 'all'] },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'github',
  },
  github_create_issue: {
    name: 'github_create_issue',
    description: 'Create a new issue in a GitHub repository (requires human approval)',
    parameters: {
      owner: { type: 'string', required: true, description: 'Repository owner' },
      repo: { type: 'string', required: true, description: 'Repository name' },
      title: { type: 'string', required: true, description: 'Issue title' },
      body: { type: 'string', required: false, description: 'Issue description' },
    },
    riskLevel: RISK_LEVELS.HIGH,
    requiresApproval: true,
    category: 'github',
  },
  calculator: {
    name: 'calculator',
    description: 'Perform safe arithmetic calculation on numeric expressions',
    parameters: {
      expression: { type: 'string', required: true, description: 'Mathematical expression (e.g. "42 * 2")' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'utility',
  },
  web_search: {
    name: 'web_search',
    description: 'Search documentation and factual web sources for a query',
    parameters: {
      query: { type: 'string', required: true, description: 'Search term or technical question' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'search',
  },
  system_time: {
    name: 'system_time',
    description: 'Get current system date, time, day of the week, and timezone',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'system',
  },
  calendar_view_events: {
    name: 'calendar_view_events',
    description: 'View scheduled calendar events, appointments, and calculate available free slots for a given date',
    parameters: {
      date: { type: 'string', required: false, description: 'Target date (e.g. "today", "tomorrow", or "YYYY-MM-DD")' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'calendar',
  },
  calendar_schedule_meeting: {
    name: 'calendar_schedule_meeting',
    description: 'Schedule a new calendar meeting or appointment with attendees (HIGH RISK: requires human approval)',
    parameters: {
      title: { type: 'string', required: true, description: 'Meeting title or subject' },
      date: { type: 'string', required: true, description: 'Date of the meeting (YYYY-MM-DD or tomorrow)' },
      time: { type: 'string', required: true, description: 'Meeting start time (e.g. "10:00 AM" or "14:30")' },
      durationMinutes: { type: 'number', required: false, description: 'Meeting duration in minutes (default 30)' },
      attendees: { type: 'string', required: false, description: 'Comma-separated attendee emails or names' },
    },
    riskLevel: RISK_LEVELS.HIGH,
    requiresApproval: true,
    category: 'calendar',
  },
  contact_resolve: {
    name: 'contact_resolve',
    description: 'Resolve a natural language contact name or alias (e.g. "Abishek") to verified channels (WhatsApp, Email, SMS) with ambiguity detection',
    parameters: {
      name: { type: 'string', required: true, description: 'Natural language name or alias of the person to contact' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'contacts',
  },
  send_message: {
    name: 'send_message',
    description: 'Dispatch an external message to a verified recipient via WhatsApp, Email, or SMS (HIGH RISK: requires explicit human approval)',
    parameters: {
      recipientName: { type: 'string', required: true, description: 'Recipient name (e.g. "Abishek")' },
      channel: { type: 'string', required: true, enum: ['whatsapp', 'email', 'sms'], description: 'Delivery channel' },
      destination: { type: 'string', required: true, description: 'Destination phone number (+E.164) or email address' },
      message: { type: 'string', required: true, description: 'Message content to transmit' },
      subject: { type: 'string', required: false, description: 'Subject line (used when channel is email)' },
    },
    riskLevel: RISK_LEVELS.HIGH,
    requiresApproval: true,
    category: 'messaging',
  },

  // ─── PC Automation Tools ───────────────────────────────────────────
  pc_launch_app: {
    name: 'pc_launch_app',
    description: 'Launch a desktop application on Windows (e.g. VS Code, Chrome, Spotify, Notepad)',
    parameters: {
      appName: { type: 'string', required: true, description: 'Application name or executable' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_type_text: {
    name: 'pc_type_text',
    description: 'Simulate human keystrokes with 15ms-45ms jitter and a 5-second countdown preparation buffer',
    parameters: {
      text: { type: 'string', required: true, description: 'Text or code to type' },
      countdownSeconds: { type: 'number', required: false, default: 5, description: 'Preparation countdown buffer' },
    },
    riskLevel: RISK_LEVELS.MEDIUM,
    category: 'pc_automation',
  },
  pc_restore_focus_and_paste: {
    name: 'pc_restore_focus_and_paste',
    description: 'Restores focus to a target window handle (HWND) and pastes clipboard text via Ctrl+V',
    parameters: {
      hwnd: { type: 'string', required: false, description: 'Window handle to restore' },
      text: { type: 'string', required: true, description: 'Text to paste' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_system_metrics: {
    name: 'pc_system_metrics',
    description: 'Retrieve live Windows system telemetry (CPU load %, RAM usage, Disk space, Battery)',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_close_process: {
    name: 'pc_close_process',
    description: 'Close an application process (HIGH RISK: requires approval, protected by kernel safety blacklist)',
    parameters: {
      processName: { type: 'string', required: true, description: 'Process name to terminate' },
    },
    riskLevel: RISK_LEVELS.HIGH,
    requiresApproval: true,
    category: 'pc_automation',
  },
  pc_solve_mcq: {
    name: 'pc_solve_mcq',
    description: 'Locates and clicks the correct answer option on an active exam/quiz screen via snippet-first grounding',
    parameters: {
      questionContext: { type: 'string', required: true, description: 'Question text and options' },
    },
    riskLevel: RISK_LEVELS.MEDIUM,
    category: 'pc_automation',
  },
  pc_read_screen: {
    name: 'pc_read_screen',
    description: 'Capture active PC desktop screen and extract visible text/code',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_open_file_or_folder: {
    name: 'pc_open_file_or_folder',
    description: 'Open any file or folder by name or path across the system. Defaults to opening in VS Code, opens in Notepad if requested, or Antigravity IDE if mentioned.',
    parameters: {
      target: { type: 'string', required: true, description: 'File or folder name or path to open' },
      editor: { type: 'string', required: false, description: 'Target editor preference: "vscode", "notepad", or "antigravity" (default: "vscode")' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_search_system: {
    name: 'pc_search_system',
    description: 'Search files, folders, and applications across the system by keyword',
    parameters: {
      query: { type: 'string', required: true, description: 'Search term' },
      category: { type: 'string', required: false, enum: ['file', 'folder', 'app', 'all'], description: 'Category to search' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_lock: {
    name: 'pc_lock',
    description: 'Lock Windows PC workstation session immediately',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_set_volume: {
    name: 'pc_set_volume',
    description: 'Control PC master audio volume: exact percentage (0-100), up, down, mute, unmute, silent',
    parameters: {
      action: { type: 'string', required: false, enum: ['up', 'down', 'mute', 'unmute', 'silent'], description: 'Volume action' },
      level: { type: 'number', required: false, description: 'Exact volume percentage (0 - 100)' },
      steps: { type: 'number', required: false, description: 'Number of volume step ticks (default: 5)' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_set_brightness: {
    name: 'pc_set_brightness',
    description: 'Set PC monitor screen brightness to exact percentage (0-100%)',
    parameters: {
      percentage: { type: 'number', required: true, description: 'Brightness percentage from 0 to 100' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_quick_settings: {
    name: 'pc_quick_settings',
    description: 'Control Windows 11 Action Center toggles: wifi, bluetooth, night_light, theme (dark/light), hotspot, airplane, energy_saver',
    parameters: {
      setting: {
        type: 'string',
        required: true,
        enum: ['wifi', 'bluetooth', 'night_light', 'theme', 'hotspot', 'airplane', 'energy_saver'],
        description: 'Quick setting tile to control',
      },
      state: {
        type: 'string',
        required: false,
        description: 'State or mode (e.g. on, off, dark, light)',
      },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },
  pc_power_control: {
    name: 'pc_power_control',
    description: 'Execute PC power state actions: shutdown/terminate with 5s countdown, reboot/restart with 5s countdown, sleep, or abort',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['shutdown', 'terminate', 'reboot', 'restart', 'sleep', 'abort'],
        description: 'Power action to execute',
      },
      delaySeconds: {
        type: 'number',
        required: false,
        description: 'Countdown delay in seconds before shutdown/reboot (default: 5)',
      },
    },
    riskLevel: RISK_LEVELS.HIGH,
    category: 'pc_automation',
  },
  pc_close_all_apps: {
    name: 'pc_close_all_apps',
    description: 'Close all open active applications while safely preserving VS Code, Antigravity IDE, terminal sessions, Node, Electron, and OS processes',
    parameters: {},
    riskLevel: RISK_LEVELS.MEDIUM,
    category: 'pc_automation',
  },
  pc_search_and_play: {
    name: 'pc_search_and_play',
    description: 'Search YouTube on PC and open results or playback in default browser',
    parameters: {
      query: { type: 'string', required: true, description: 'Search term or song title' },
      autoPlayIndex: { type: 'number', required: false, default: 1, description: 'Result index to play (default: 1)' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'pc_automation',
  },

  // ─── Mobile (Android ADB) Automation Tools ─────────────────────────
  phone_get_battery: {
    name: 'phone_get_battery',
    description: 'Check battery percentage, temperature, and charging state of connected Android phone',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_unlock: {
    name: 'phone_unlock',
    description: 'Wake screen and unlock Android lock screen using hardware keyevents',
    parameters: {
      pin: { type: 'string', required: false, description: 'Screen lock PIN' },
    },
    riskLevel: RISK_LEVELS.MEDIUM,
    category: 'mobile_automation',
  },
  phone_lock: {
    name: 'phone_lock',
    description: 'Lock phone screen and put device to sleep using KEYCODE_POWER',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_take_screenshot: {
    name: 'phone_take_screenshot',
    description: 'Capture screenshot on phone display over ADB and save to Desktop',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_launch_app: {
    name: 'phone_launch_app',
    description: 'Launch an Android application on phone by name or package',
    parameters: {
      app: { type: 'string', required: true, description: 'App name (e.g. whatsapp, youtube, spotify)' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_send_whatsapp: {
    name: 'phone_send_whatsapp',
    description: 'Send a WhatsApp message on phone using native Android ACTION_SEND intent (HIGH RISK: requires approval)',
    parameters: {
      recipientPhone: { type: 'string', required: true, description: 'Recipient phone number' },
      message: { type: 'string', required: true, description: 'Message content' },
    },
    riskLevel: RISK_LEVELS.HIGH,
    requiresApproval: true,
    category: 'mobile_automation',
  },
  phone_send_whatsapp_media: {
    name: 'phone_send_whatsapp_media',
    description: 'Pushes a file from PC to phone and attaches via WhatsApp UI (HIGH RISK: requires approval)',
    parameters: {
      recipientPhone: { type: 'string', required: true, description: 'Recipient phone number' },
      filePath: { type: 'string', required: true, description: 'Local file path to attach' },
      caption: { type: 'string', required: false, description: 'Attachment caption' },
    },
    riskLevel: RISK_LEVELS.HIGH,
    requiresApproval: true,
    category: 'mobile_automation',
  },
  phone_search_and_play: {
    name: 'phone_search_and_play',
    description: 'Search YouTube on phone and automatically select video by ordinal index',
    parameters: {
      query: { type: 'string', required: true, description: 'Search keywords' },
      autoPlayIndex: { type: 'number', required: false, default: 1, description: '1 for 1st video, 2 for 2nd' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_youtube_select: {
    name: 'phone_youtube_select',
    description: 'Select and start playing a specific ordinal video result (#1, #2, #3, etc.) on YouTube',
    parameters: {
      index: { type: 'number', required: false, default: 1, description: '1-based index of video (1 for first, 2 for second, etc.)' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_media_control: {
    name: 'phone_media_control',
    description: 'Control mobile media playback (play/pause, fast-forward 10s, rewind 10s, volume)',
    parameters: {
      action: { type: 'string', required: true, description: 'Media action: play, pause, forward_10, rewind_10, volume_set, next, prev' },
      level: { type: 'number', required: false, description: 'Volume level (0-100) if action is volume_set' },
      value: { type: 'string', required: false, description: 'Legacy value param' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_take_photo: {
    name: 'phone_take_photo',
    description: 'Capture a rapid camera photo or selfie on connected phone',
    parameters: {
      isSelfie: { type: 'boolean', required: false, default: false, description: 'True for front camera, false for rear' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_set_alarm: {
    name: 'phone_set_alarm',
    description: 'Set a native Android alarm via SET_ALARM intent',
    parameters: {
      hour: { type: 'number', required: true, description: 'Hour (0-23)' },
      minute: { type: 'number', required: true, description: 'Minute (0-59)' },
      message: { type: 'string', required: false, default: 'AURA Alarm', description: 'Alarm label' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_make_call: {
    name: 'phone_make_call',
    description: 'Initiate a cellular voice call to a phone number (HIGH RISK: requires human approval)',
    parameters: {
      phoneNumber: { type: 'string', required: true, description: 'Phone number to dial' },
    },
    riskLevel: RISK_LEVELS.HIGH,
    requiresApproval: true,
    category: 'mobile_automation',
  },
  phone_ai_call_message: {
    name: 'phone_ai_call_message',
    description: 'Call a contact, inject synthesized audio via Dalvik DEX helper, and record response (HIGH RISK)',
    parameters: {
      contact: { type: 'string', required: true, description: 'Recipient name or phone' },
      message: { type: 'string', required: true, description: 'Message to synthesize and play into call' },
    },
    riskLevel: RISK_LEVELS.HIGH,
    requiresApproval: true,
    category: 'mobile_automation',
  },
  phone_save_file: {
    name: 'phone_save_file',
    description: 'Save or push a file/photo from host PC directly to phone Pictures & Downloads and index into Android Gallery',
    parameters: {
      filePath: { type: 'string', required: true, description: 'Path to file on PC' },
      name: { type: 'string', required: false, description: 'Optional target filename' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_screen_record_start: {
    name: 'phone_screen_record_start',
    description: 'Start native screen recording on connected Android phone in background',
    parameters: {
      filename: { type: 'string', required: false, description: 'Optional custom recording name' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_screen_record_stop: {
    name: 'phone_screen_record_stop',
    description: 'Stop active screen recording on phone and pull the .mp4 video file to PC Downloads/AURA_Recordings',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_set_brightness: {
    name: 'phone_set_brightness',
    description: 'Set phone display screen brightness percentage (0-100%)',
    parameters: {
      percentage: { type: 'number', required: true, description: 'Brightness percentage (0 to 100)' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },
  phone_quick_settings: {
    name: 'phone_quick_settings',
    description: 'Control phone quick settings and hardware toggles (wifi, bluetooth, mobile data, flashlight/torch, ringer mode silent/vibrate/unmute, dnd, location, theme light/dark, autorotate)',
    parameters: {
      setting: { type: 'string', required: true, description: 'Setting name (e.g. wifi, bluetooth, mobile_data, flashlight, ringer_mode, dnd, location, theme, autorotate)' },
      state: { type: 'string', required: false, description: 'Target state or mode: on, off, enable, disable, silent, vibrate, unmute, normal, light, dark' },
      value: { type: 'string', required: false, description: 'Optional additional value parameter' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'mobile_automation',
  },

  // ─── Productivity & Memory Tools ──────────────────────────────────
  productivity_log_expense: {
    name: 'productivity_log_expense',
    description: 'Log an expense with category and compute monthly total',
    parameters: {
      amount: { type: 'number', required: true, description: 'Amount spent' },
      description: { type: 'string', required: true, description: 'Item or reason' },
      category: { type: 'string', required: false, default: 'general', description: 'Category (food, travel, etc.)' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'productivity',
  },
  productivity_daily_brief: {
    name: 'productivity_daily_brief',
    description: 'Generate an aggregated daily briefing of weather, habits, notes, and battery status',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'productivity',
  },
  memory_store_fact: {
    name: 'memory_store_fact',
    description: 'Store a custom fact or preference in persistent memory',
    parameters: {
      key: { type: 'string', required: true, description: 'Fact category or key' },
      fact: { type: 'string', required: true, description: 'Statement to remember' },
    },
    riskLevel: RISK_LEVELS.LOW,
    category: 'memory',
  },
  memory_get_profile: {
    name: 'memory_get_profile',
    description: 'Retrieve user profile, learned habits, and remembered facts from memory',
    parameters: {},
    riskLevel: RISK_LEVELS.LOW,
    category: 'memory',
  },

  // ─── Prohibited Tools (registered to enforce immediate blocking) ───
  run_shell_command: {
    name: 'run_shell_command',
    description: 'Execute arbitrary shell command on the host',
    parameters: { command: { type: 'string', required: true } },
    riskLevel: RISK_LEVELS.DISALLOWED,
    category: 'system',
  },
  database_query: {
    name: 'database_query',
    description: 'Execute arbitrary SQL on database',
    parameters: { sql: { type: 'string', required: true } },
    riskLevel: RISK_LEVELS.DISALLOWED,
    category: 'system',
  },
  delete_repo: {
    name: 'delete_repo',
    description: 'Delete a repository',
    parameters: { repo: { type: 'string', required: true } },
    riskLevel: RISK_LEVELS.DISALLOWED,
    category: 'system',
  },
});

/**
 * Retrieve a tool definition by name.
 * @param {string} toolName
 * @returns {Object|null}
 */
function getTool(toolName) {
  return TOOL_DEFINITIONS[toolName] || null;
}

/**
 * List all permitted public tools for frontend and LLM catalog.
 * @returns {Array<Object>}
 */
function listPublicTools() {
  return Object.values(TOOL_DEFINITIONS)
    .filter((t) => t.riskLevel !== RISK_LEVELS.DISALLOWED)
    .map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      riskLevel: t.riskLevel,
      requiresApproval: Boolean(t.requiresApproval),
      category: t.category,
    }));
}

/**
 * Validate input parameters against a tool definition schema.
 * @param {Object} tool
 * @param {Object} params
 * @returns {{valid: boolean, error?: string}}
 */
function validateParameters(tool, params = {}) {
  if (!tool || !tool.parameters) {
    return { valid: false, error: 'Invalid tool schema' };
  }

  for (const [paramName, schema] of Object.entries(tool.parameters)) {
    const value = params[paramName];
    if (schema.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `Missing required parameter: ${paramName}` };
    }
    if (value !== undefined && schema.type === 'string' && typeof value !== 'string') {
      return { valid: false, error: `Parameter ${paramName} must be a string` };
    }
    if (value !== undefined && schema.enum && !schema.enum.includes(value)) {
      return { valid: false, error: `Parameter ${paramName} must be one of: ${schema.enum.join(', ')}` };
    }
  }

  return { valid: true };
}

module.exports = {
  TOOL_DEFINITIONS,
  getTool,
  listPublicTools,
  validateParameters,
};
