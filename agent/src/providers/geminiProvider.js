/**
 * AURA Agent — Google Gemini LLM Provider Adapter (Fallback)
 *
 * Source: docs/02-ARCHITECTURE.md §4, docs/11-INTEGRATION-CONTRACT.md §8
 *
 * Fallback provider providing high context and reliable failover.
 * Normalizes requests and responses to the standard AURA plan structure.
 */

const { BaseLLMProvider } = require('./baseProvider');
const { memoryEngine } = require('../automation/memoryEngine');
const { parseYouTubeCommand } = require('../../../core/intentEngine');

class GeminiProvider extends BaseLLMProvider {
  constructor(options = {}) {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY || '';
    const model = options.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    super('gemini', model);
    this.apiKey = apiKey;
    this.timeoutMs = options.timeoutMs || 15000;
  }

  /**
   * Generate a structured plan for a given goal.
   * @param {Object} planRequest
   * @returns {Promise<Object>} NormalizedPlanResult
   */
  async generatePlan(planRequest) {
    const startTime = Date.now();
    const memoryContext = memoryEngine.buildAIContext();
    const toolsDesc = (planRequest.tools || [])
      .map(
        (t) =>
          `- ${t.name} (Risk: ${t.riskLevel || 'LOW'}): ${t.description}. Params: ${JSON.stringify(t.parameters)}`
      )
      .join('\n');

    const promptText = `You are the AURA autonomous planning and execution engine.
${memoryContext}

Decompose the user's goal into a sequential, bounded execution plan.
Constraints:
1. Maximum ${planRequest.maxSteps || 10} steps.
2. Only use tools from the provided catalog:
${toolsDesc}

Guidelines for Automation, Contacts, and Device Actions:
- Mobile / Phone Automation (target: "mobile" or when user mentions phone/mobile/whatsapp/call/sms):
  * "Unlock phone / unlock my phone": use "phone_unlock" {}
  * "Lock phone": use "phone_lock" {}
  * "Phone battery": use "phone_get_battery" {}
  * "Call <person> / phone call": Step 1: use "contact_resolve" {"name": "<person>"}, Step 2: use "phone_make_call" {"phoneNumber": "$step[0].phone"} (HIGH RISK)
  * "Message <person> on phone / WhatsApp / SMS": Step 1: use "contact_resolve" {"name": "<person>"}, Step 2: use "phone_send_whatsapp" {"recipientPhone": "$step[0].phone", "message": "<message_text>"} (HIGH RISK)
  * "Send photo / image / attachment / recent to <person> on WhatsApp" OR whenever an attachment is provided: Step 1: use "contact_resolve" {"name": "<person>"}, Step 2: use "phone_send_whatsapp_media" {"recipientPhone": "$step[0].phone", "caption": "<optional_caption_or_message>"} (HIGH RISK)
  * "Open <app> on phone": use "phone_launch_app" {"app": "<name>"}
  * "Play on phone / YouTube / open YouTube and play <query>": use "phone_search_and_play" {"query": "<query>", "autoPlayIndex": 1}
  * "Play the second / third / Nth result / select video": use "phone_youtube_select" {"index": 2}
  * "Skip 10 seconds / forward 10s": use "phone_media_control" {"action": "forward_10"}
  * "Rewind 10 seconds / back 10s": use "phone_media_control" {"action": "rewind_10"}
  * "Pause video / pause phone": use "phone_media_control" {"action": "pause"}
  * "Resume video / play phone": use "phone_media_control" {"action": "play"}
  * "Phone volume to <N>% / vol <N> / vloume <N>%": use "phone_media_control" {"action": "volume_set", "level": <num>}
  * "Mute phone / put phone in silent": use "phone_quick_settings" {"setting": "ringer_mode", "state": "silent"}
  * "Vibration mode / vibrate phone": use "phone_quick_settings" {"setting": "ringer_mode", "state": "vibrate"}
  * "Unmute phone / normal mode": use "phone_quick_settings" {"setting": "ringer_mode", "state": "normal"}
  * "Set brightness to <N>%": use "phone_set_brightness" {"percentage": <num>}
  * "Save to phone / save in phone / save image": use "phone_save_file" {"filePath": "<path>"}
  * "Record screen / start screen recording": use "phone_screen_record_start" {}
  * "Finish record / stop recording": use "phone_screen_record_stop" {}
  * "Turn on/off wifi, bluetooth, internet, flashlight, torch, dnd, location, auto rotate, dark/light theme": use "phone_quick_settings" {"setting": "<name>", "state": "on" | "off" | "light" | "dark"}
  * "Take photo/selfie": use "phone_take_photo" {"isSelfie": boolean}
- PC Automation & System Controls (target: "pc"):
  * "Lock PC / lock screen / lock workstation": use "pc_lock" {}
  * "Volume <N>% / vol <N> / mute / unmute / silent": use "pc_set_volume" {"level": <num>, "action": "mute" | "unmute" | "up" | "down"}
  * "Brightness <N>% / set brightness to <N>": use "pc_set_brightness" {"percentage": <num>}
  * "Turn on/off wifi, bluetooth, night light, theme (dark/light), hotspot, airplane mode, energy saver": use "pc_quick_settings" {"setting": "<name>", "state": "on" | "off" | "dark" | "light"}
  * "Shutdown / terminate / reboot / restart / sleep": use "pc_power_control" {"action": "shutdown" | "terminate" | "reboot" | "restart" | "sleep" | "abort", "delaySeconds": 5}
  * "Close all apps / close active applications": use "pc_close_all_apps" {}
  * "Open <file/folder>": use "pc_open_file_or_folder" {"target": "<name_or_path>", "editor": "vscode" | "notepad" | "antigravity"}
    - DEFAULT editor is ALWAYS "vscode".
    - If user explicitly says "open in notepad" or mentions "notepad", set "editor": "notepad".
    - If user mentions "antigravity" or "antigravity ide", set "editor": "antigravity".
  * "Play on PC / YouTube on PC / open YouTube and search/play <query> / search <query> on YouTube": use "pc_search_and_play" {"query": "<clean_query_without_on_pc>", "autoPlayIndex": 1}
  * "Setup 1 / Setup 2 / open setup <N>": use sequential "pc_launch_app" for each app in that setup
  * "Open <app1> <app2> <app3> / open <app1>, <app2> and <app3>": use sequential "pc_launch_app" {"appName": "<name>"} for each app
  * "Launch <app> / Open <app>": use "pc_launch_app" {"appName": "<name>"}
  * "Search system / find files or apps": use "pc_search_system" {"query": "<term>", "category": "all"}
  * "Type <text>": use "pc_type_text" {"text": "<text>"}
  * "System specs/telemetry": use "pc_system_metrics" {}
  * "Solve quiz/mcq": use "pc_solve_mcq" {"questionContext": "..."}
- Productivity & Memory:
  * "Log expense <amt> for <item>": use "productivity_log_expense" {"amount": <num>, "description": "<item>"}
  * "Daily brief / morning briefing": use "productivity_daily_brief" {}
  * "Remember <fact>": use "memory_store_fact" {"key": "<category>", "fact": "<statement>"}
- Messaging (PC Desktop Only):
  * ONLY use "send_message" for desktop notifications or emails when target is PC and NOT a phone call/message.

3. Respond ONLY with valid JSON in this exact structure:
{
  "steps": [
    {
      "stepIndex": 0,
      "tool": "tool_name",
      "parameters": { ... },
      "reason": "Why this step is needed",
      "expectedOutcome": "What this step will produce"
    }
  ],
  "estimatedRisk": "LOW" | "MEDIUM" | "HIGH"
}

User Goal: "${planRequest.goal}"`;

    if (!this.apiKey || this.apiKey === '<gemini-api-key>') {
      return this._generateOfflinePlan(planRequest, startTime);
    }

    const candidateModels = [
      this.model,
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    let lastError = null;

    for (const modelName of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errText = await response.text();
          const err = new Error(`Gemini API (${modelName}) returned HTTP ${response.status}: ${errText}`);
          err.statusCode = response.status;
          lastError = err;
          // If 429 rate limit or 503 unavailable, try next candidate model
          if (response.status === 429 || response.status === 503 || response.status === 404) {
            continue;
          }
          throw err;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(rawText);

        return {
          success: true,
          provider: 'gemini',
          model: modelName,
          plan: {
            steps: (parsed.steps || []).map((step, idx) => ({
              stepIndex: idx,
              tool: step.tool,
              parameters: step.parameters || {},
              reason: step.reason || '',
              expectedOutcome: step.expectedOutcome || '',
            })),
            estimatedRisk: parsed.estimatedRisk || 'LOW',
          },
          usage: {
            promptTokens: data.usageMetadata?.promptTokenCount || 0,
            completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata?.totalTokenCount || 0,
          },
          latencyMs: Date.now() - startTime,
          rawError: null,
        };
      } catch (err) {
        clearTimeout(timeout);
        lastError = err;
        if (err.name === 'AbortError') {
          const timeoutErr = new Error(`Gemini API request timed out after ${this.timeoutMs}ms`);
          timeoutErr.code = 'TIMEOUT';
          throw timeoutErr;
        }
        if (err.statusCode !== 429 && err.statusCode !== 503 && err.statusCode !== 404) {
          throw err;
        }
      }
    }

    // If all online models exhausted, throw the last rate limit error to allow provider failover
    throw lastError || new Error('All Gemini candidate models failed');
  }

  _generateOfflinePlan(planRequest, startTime) {
    const goalLower = (planRequest.goal || '').toLowerCase();
    const isMobile = goalLower.includes('phone') || goalLower.includes('mobile') || goalLower.includes('android') || planRequest.target === 'mobile';
    const contactEngine = require('../../../core/contactEngine');

    // ── 0. Workspace Setups Engine (Setup 1 & Setup 2) ──────────────────────
    const { findSetup } = require('../../../core/setupEngine');
    const setupMatch = findSetup(planRequest.goal);
    if (setupMatch) {
      const setup = setupMatch.data;
      const steps = setup.apps.map((app, idx) => ({
        stepIndex: idx,
        tool: 'pc_launch_app',
        parameters: { appName: app },
        reason: `Launch "${app}" for ${setup.name}`,
        expectedOutcome: `Application "${app}" launched for ${setup.name}`,
      }));
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: { steps, estimatedRisk: 'LOW', setupName: setup.name, isSetup: true },
        usage: { promptTokens: 40, completionTokens: 40, totalTokens: 80 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    }

    // ── 0b. Greedy Multi-App Launching Engine ──────────────────────────────
    const { tryExpandMultiOpen } = require('../../../core/taskSplitter');
    const multiOpen = tryExpandMultiOpen(planRequest.goal);
    if (multiOpen && multiOpen.length >= 2) {
      const steps = multiOpen.map((cmd, idx) => {
        const app = cmd.replace(/^(?:please\s+)?(?:open|launch|start)\s+/i, '').trim();
        return {
          stepIndex: idx,
          tool: isMobile ? 'phone_launch_app' : 'pc_launch_app',
          parameters: isMobile ? { app } : { appName: app },
          reason: `Launch application "${app}"`,
          expectedOutcome: `Application "${app}" opened`,
        };
      });
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: { steps, estimatedRisk: 'LOW', isMultiOpen: true },
        usage: { promptTokens: 40, completionTokens: 40, totalTokens: 80 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    }

    // ── 1. Call on Phone / Outbound Calling ─────────────────────────────────
    if (goalLower.startsWith('call ') || goalLower.includes('call ') || goalLower.startsWith('dial ') || goalLower.includes('dial ')) {
      let targetName = 'Manoj';
      if (goalLower.includes('abishek') || goalLower.includes('abi')) targetName = 'Abishek';
      else if (goalLower.includes('bala')) targetName = 'Balasupramani';
      else if (goalLower.includes('kamal')) targetName = 'Kamal';
      else if (goalLower.includes('elango')) targetName = 'Elango';
      else {
        const m = planRequest.goal.match(/(?:call|dial)\s+([a-zA-Z0-9_+]+)/i);
        if (m && !['phone', 'mobile', 'android', 'the'].includes(m[1].toLowerCase())) {
          targetName = m[1];
        }
      }

      const resolved = contactEngine.resolveContact(targetName);
      const displayName = resolved?.name || targetName;
      const phoneNum = resolved?.phone || '+919876543211';

      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'contact_resolve',
              parameters: { name: displayName },
              reason: `Resolve contact "${displayName}" to verified cellular line`,
              expectedOutcome: `Verified identity and phone number for ${displayName}`,
            },
            {
              stepIndex: 1,
              tool: 'phone_make_call',
              parameters: { phoneNumber: phoneNum },
              reason: `Dispatch native cellular call to ${displayName} (${phoneNum}) on phone (HIGH RISK: requires human approval)`,
              expectedOutcome: `Outbound phone call initiated to ${displayName}`,
            },
          ],
          estimatedRisk: 'HIGH',
        },
        usage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    }

    // ── 2. WhatsApp Photo / Image / Media Sharing ────────────────────────────
    if (
      (planRequest.attachment || goalLower.includes('photo') || goalLower.includes('image') || goalLower.includes('attachment') || goalLower.includes('picture') || goalLower.includes('recent')) &&
      (goalLower.includes('send') || goalLower.includes('share') || goalLower.includes('whatsapp') || goalLower.includes('message'))
    ) {
      let targetName = 'Abishek';
      if (goalLower.includes('manoj')) targetName = 'Manoj L';
      else if (goalLower.includes('bala')) targetName = 'Balasupramani';
      else if (goalLower.includes('kamal')) targetName = 'Kamal';
      else if (goalLower.includes('elango')) targetName = 'Elango';

      const resolved = contactEngine.resolveContact(targetName);
      const displayName = resolved?.name || targetName;
      const phoneNum = resolved?.phone || '+919042629740';

      const captionMatch = planRequest.goal.match(/(?:with\s+caption|caption):\s*(.+)$/i);
      let caption = captionMatch ? captionMatch[1].trim() : '';
      if (!caption) {
        caption = planRequest.goal
          .replace(/\(send\s+attached\s+photo\)/gi, '')
          .replace(/^(?:message|send(?:\s+to)?|whatsapp|share(?:\s+with)?)\s+[a-zA-Z\s]+?(?:on\s+whatsapp|in\s+phone|on\s+phone)?(?:\s+with\s+caption)?/i, '')
          .replace(/(?:on\s+whatsapp|in\s+phone|on\s+phone)$/i, '')
          .trim();
        if (caption.toLowerCase() === targetName.toLowerCase() || caption.toLowerCase() === 'on whatsapp') caption = '';
      }
      const pathMatch = planRequest.goal.match(/([a-zA-Z]:\\[^\s"']+\.(?:jpg|jpeg|png|webp|gif))/i);
      const filePath = pathMatch ? pathMatch[1] : (planRequest.attachment?.filepath || '');

      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'contact_resolve',
              parameters: { name: displayName },
              reason: `Resolve contact "${displayName}" for WhatsApp media dispatch`,
              expectedOutcome: `Verified phone number for ${displayName}`,
            },
            {
              stepIndex: 1,
              tool: 'phone_send_whatsapp_media',
              parameters: {
                recipientPhone: phoneNum,
                filePath,
                caption,
              },
              reason: `Stage media, broadcast to MediaStore, deep-link to WhatsApp, and send photo to ${displayName} (${phoneNum}) (HIGH RISK: requires human approval)`,
              expectedOutcome: `Photo successfully shared to ${displayName} on WhatsApp`,
            },
          ],
          estimatedRisk: 'HIGH',
        },
        usage: { promptTokens: 50, completionTokens: 40, totalTokens: 90 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    }

    // ── 3. Messaging Task (Mobile WhatsApp vs PC) ───────────────────────────
    if (
      (goalLower.includes('message') || goalLower.includes('whatsapp') || goalLower.includes('email') || goalLower.includes('sms')) &&
      !/^(please\s+)?(open|launch|start|run)\s+(the\s+)?whatsapp\b/i.test(goalLower.trim())
    ) {
      let targetName = 'Abishek';
      if (goalLower.includes('manoj')) targetName = 'Manoj L';
      else if (goalLower.includes('bala')) targetName = 'Balasupramani';
      else if (goalLower.includes('kamal')) targetName = 'Kamal';
      else if (goalLower.includes('elango')) targetName = 'Elango';

      const resolved = contactEngine.resolveContact(targetName);
      const recipientName = resolved?.name || targetName;
      const phoneNum = resolved?.phone || '+919042629740';

      const isWhatsApp = goalLower.includes('whatsapp');
      const isEmail = goalLower.includes('email');
      const isSMS = goalLower.includes('sms');
      const isAll = goalLower.includes('all available') || goalLower.includes('all channels');
      const isMobile = goalLower.includes('phone') || goalLower.includes('mobile') || goalLower.includes('android') || planRequest.target === 'mobile';

      // Extract message content cleanly
      let msg = 'Work is done.';
      const quoteMatch = planRequest.goal.match(/["']([^"']+)["']/);
      const colonMatch = planRequest.goal.match(/:\s*(.+)$/);
      if (quoteMatch) {
        msg = quoteMatch[1];
      } else if (colonMatch) {
        msg = colonMatch[1];
      } else {
        const cleanMsg = planRequest.goal
          .replace(/^(please\s+)?(message|whatsapp|text|send\s+message\s+(?:to\s+)?)\s*/i, '')
          .replace(new RegExp(`^(manoj|manoj l|abishek|abi|kamal|bala|balasupramani|elango)\\s*`, 'i'), '')
          .replace(/\s+(in|on)\s+(phone|whatsapp|mobile)$/i, '')
          .trim();
        if (cleanMsg) msg = cleanMsg;
      }

      const steps = [
        {
          stepIndex: 0,
          tool: 'contact_resolve',
          parameters: { name: recipientName },
          reason: `Resolve natural language contact "${recipientName}" to verified communication channels`,
          expectedOutcome: `Verified identity for ${recipientName}`,
        },
      ];

      let idx = 1;
      // If mobile target or user says "in phone", use mobile phone_send_whatsapp
      if (isMobile && (isWhatsApp || !isEmail)) {
        steps.push({
          stepIndex: idx++,
          tool: 'phone_send_whatsapp',
          parameters: {
            recipientPhone: phoneNum,
            message: msg,
          },
          reason: `Send message to ${recipientName} on WhatsApp via Android deep link and automate send tap (HIGH RISK: requires human approval)`,
          expectedOutcome: `WhatsApp message "${msg}" dispatched to ${recipientName} on phone`,
        });
      } else {
        if (isWhatsApp || isAll || (!isEmail && !isSMS)) {
          steps.push({
            stepIndex: idx++,
            tool: 'send_message',
            parameters: {
              recipientName,
              channel: 'whatsapp',
              destination: phoneNum,
              message: msg,
            },
            reason: `Open WhatsApp application, navigate to ${recipientName} (${phoneNum}), type "${msg}", and dispatch message`,
            expectedOutcome: `WhatsApp opened, chat focused, message "${msg}" typed and sent`,
          });
        }

        if (isEmail || isAll) {
          steps.push({
            stepIndex: idx++,
            tool: 'send_message',
            parameters: {
              recipientName,
              channel: 'email',
              destination: resolved?.email || 'team@aura.team',
              message: msg,
              subject: `Update from AURA: ${msg}`,
            },
            reason: `Send email notification to ${recipientName}`,
            expectedOutcome: 'Email message dispatched',
          });
        }

        if (isSMS || isAll) {
          steps.push({
            stepIndex: idx++,
            tool: 'send_message',
            parameters: {
              recipientName,
              channel: 'sms',
              destination: phoneNum,
              message: msg,
            },
            reason: `Send SMS message to ${recipientName}`,
            expectedOutcome: 'SMS dispatched',
          });
        }
      }

      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: { steps, estimatedRisk: 'HIGH' },
        usage: { promptTokens: 60, completionTokens: 50, totalTokens: 110 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    // ── YouTube & Media Playback (PC & Mobile) ──
    } else if (
      parseYouTubeCommand(planRequest.goal) ||
      ((goalLower.includes('youtube') || goalLower.includes('trending') || (goalLower.startsWith('play ') && !goalLower.includes('free fire'))) &&
        (goalLower.includes('search') || goalLower.includes('play') || goalLower.includes('song') || goalLower.includes('video') || goalLower.includes('music') || goalLower.includes('trending') || goalLower.includes('tamil')))
    ) {
      const yt = parseYouTubeCommand(planRequest.goal);
      if (yt && yt.type === 'phone_youtube_select') {
        const idx = yt.params.index || 1;
        return {
          success: true,
          provider: 'gemini',
          model: `${this.model}-offline`,
          plan: {
            steps: [
              {
                stepIndex: 0,
                tool: 'phone_youtube_select',
                parameters: { index: idx },
                reason: `Select and play video result #${idx} on YouTube via calibrated touch coordinates`,
                expectedOutcome: `Video #${idx} playing on phone`,
              },
            ],
            estimatedRisk: 'LOW',
          },
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latencyMs: Date.now() - startTime,
          rawError: null,
        };
      } else if (yt && yt.type === 'phone_media') {
        return {
          success: true,
          provider: 'gemini',
          model: `${this.model}-offline`,
          plan: {
            steps: [
              {
                stepIndex: 0,
                tool: 'phone_media_control',
                parameters: { action: yt.params.action, level: yt.params.level },
                reason: `Control media on phone: ${yt.params.action}`,
                expectedOutcome: `Media action ${yt.params.action} executed`,
              },
            ],
            estimatedRisk: 'LOW',
          },
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latencyMs: Date.now() - startTime,
          rawError: null,
        };
      } else {
        let cleanQuery = yt?.params?.query || planRequest.goal;
        cleanQuery = cleanQuery
          .replace(/\b(?:on|in|from|to)\s+(?:my\s+|the\s+)?(?:pc|computer|laptop|desktop|windows|phone|mobile|android)\b/gi, '')
          .replace(/\b(?:on|in)\s+pc\b/gi, '')
          .replace(/\s+pc\b/gi, '')
          .replace(/\b(?:on|in|from|to)\s+youtube\b/gi, '')
          .replace(/^(?:(?:please\s+)?(?:open\s+youtube\s+)?(?:and\s+)?(?:search(?:\s+for)?|play)|open\s+youtube(?:\s+search)?)\s+/i, '')
          .replace(/\s+(?:and\s+)?(?:play\s+it|play|select)\s*(?:it|the)?(?:\s+(?:first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|top|\d))?(?:\s+(?:one|result|video|song))?$/i, '')
          .replace(/^(?:(?:search(?:\s+for)?|play)\s+)/i, '')
          .replace(/\b(?:on|in)\s+(?:my\s+|the\s+)?(?:pc|computer|laptop|desktop|windows|phone|mobile|android)\b/gi, '')
          .trim();

        if (!cleanQuery || /^trending(?:\s+songs?|\s+chat|\s+playlist)?$/i.test(cleanQuery)) {
          cleanQuery = 'trending songs in tamil';
        }

        const ordMatch = planRequest.goal.match(/(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|\#\d+)/i);
        let autoPlayIndex = yt?.params?.autoPlayIndex || 1;
        if (ordMatch) {
          const o = ordMatch[1].toLowerCase();
          if (o === 'second' || o === '2nd' || o === '#2') autoPlayIndex = 2;
          else if (o === 'third' || o === '3rd' || o === '#3') autoPlayIndex = 3;
          else if (o === 'fourth' || o === '4th' || o === '#4') autoPlayIndex = 4;
          else if (o === 'fifth' || o === '5th' || o === '#5') autoPlayIndex = 5;
        }

        const isPcYt = (!isMobile && (planRequest.target === 'pc' || goalLower.includes('pc') || goalLower.includes('computer'))) && !goalLower.includes('phone') && !goalLower.includes('mobile');
        return {
          success: true,
          provider: 'gemini',
          model: `${this.model}-offline`,
          plan: {
            steps: [
              {
                stepIndex: 0,
                tool: isPcYt ? 'pc_search_and_play' : 'phone_search_and_play',
                parameters: { query: cleanQuery, autoPlayIndex },
                reason: isPcYt
                  ? `Search YouTube on PC for "${cleanQuery}" and play video #${autoPlayIndex}`
                  : `Search YouTube on phone for "${cleanQuery}" and play video #${autoPlayIndex}`,
                expectedOutcome: isPcYt
                  ? `Playing on YouTube on PC`
                  : `Playing result #${autoPlayIndex} for "${cleanQuery}" on YouTube`,
              },
            ],
            estimatedRisk: 'LOW',
          },
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latencyMs: Date.now() - startTime,
          rawError: null,
        };
      }
    } else if ((goalLower.startsWith('open ') || goalLower.startsWith('launch ') || goalLower.includes('open in ') || ((goalLower.includes('file') || goalLower.includes('folder')) && !goalLower.includes('save')))) {
      if (isMobile) {
        let cleanApp = planRequest.goal
          .replace(/^(please\s+)?(open|launch)\s+/i, '')
          .replace(/\s+(on|in)\s+(phone|mobile|android)$/i, '')
          .replace(/^(the|my)\s+/i, '')
          .replace(/\s+app(lication)?$/i, '')
          .trim();
        return {
          success: true,
          provider: 'gemini',
          model: `${this.model}-offline`,
          plan: {
            steps: [
              {
                stepIndex: 0,
                tool: 'phone_launch_app',
                parameters: { app: cleanApp || 'app' },
                reason: `Launch application "${cleanApp}" on connected Android phone`,
                expectedOutcome: `Application "${cleanApp}" launched on phone`,
              },
            ],
            estimatedRisk: 'LOW',
          },
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latencyMs: Date.now() - startTime,
          rawError: null,
        };
      }

      const isNotepad = goalLower.includes('notepad');
      const isAntigravity = goalLower.includes('antigravity');
      const editor = isNotepad ? 'notepad' : isAntigravity ? 'antigravity' : 'vscode';

      let cleanTarget = planRequest.goal
        .replace(/^(please\s+)?(open|launch)\s+/i, '')
        .replace(/\s+in\s+(vscode|vs\s*code|notepad|antigravity(\s*ide)?)/i, '')
        .replace(/\s+(on|in)\s+(pc|computer|laptop|desktop|windows)$/i, '')
        .replace(/\s+(file|folder|directory|project)$/i, '')
        .trim();

      const isExplicitFileOrFolder =
        /\b(file|folder|directory|project|repo|codebase)\b/i.test(planRequest.goal) ||
        /\.[a-zA-Z0-9]{1,5}$/.test(cleanTarget) ||
        /[\\\/]/.test(cleanTarget) ||
        /\b(in\s+(vscode|vs\s*code|notepad|antigravity))\b/i.test(planRequest.goal);

      const steps = !isExplicitFileOrFolder
        ? [
            {
              stepIndex: 0,
              tool: 'pc_launch_app',
              parameters: { appName: cleanTarget },
              reason: `Launch desktop application "${cleanTarget}"`,
              expectedOutcome: `Application "${cleanTarget}" opened`,
            },
          ]
        : [
            {
              stepIndex: 0,
              tool: 'pc_open_file_or_folder',
              parameters: { target: cleanTarget || planRequest.goal, editor },
              reason: `Open "${cleanTarget || 'target'}" in ${editor === 'notepad' ? 'Notepad' : editor === 'antigravity' ? 'Antigravity IDE' : 'VS Code'}`,
              expectedOutcome: `File or folder "${cleanTarget}" launched in ${editor}`,
            },
          ];

      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: { steps, estimatedRisk: 'LOW' },
        usage: { promptTokens: 50, completionTokens: 40, totalTokens: 90 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    } else if (goalLower.includes('search system') || goalLower.includes('find file') || goalLower.includes('search file')) {
      const q = planRequest.goal.replace(/.*(search\s+system|find\s+file|search\s+file)\s*(for\s*)?/i, '').trim();
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'pc_search_system',
              parameters: { query: q || 'project', category: 'all' },
              reason: `Search system for "${q || 'query'}"`,
              expectedOutcome: 'List of matching applications, files, and folders',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    // ── Save File / Photo to Phone ──
    } else if (
      (goalLower.includes('save') && (goalLower.includes('phone') || isMobile)) ||
      goalLower.startsWith('save to phone') || goalLower.startsWith('save in phone')
    ) {
      const pathMatch = planRequest.goal.match(/([a-zA-Z]:\\[^\s"']+\.(?:jpg|jpeg|png|webp|gif|mp4))/i);
      const filePath = pathMatch ? pathMatch[1] : (planRequest.attachment?.filepath || '');
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'phone_save_file',
              parameters: { filePath, name: planRequest.attachment?.name || 'aura_saved' },
              reason: 'Save photo/file to phone Gallery and Downloads with MediaStore indexing',
              expectedOutcome: 'File saved to phone storage and indexed in Gallery',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    // ── Screen Recording (Stop) ──
    } else if (
      goalLower.includes('finish record') || goalLower.includes('stop record') || goalLower.includes('end record')
    ) {
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'phone_screen_record_stop',
              parameters: {},
              reason: 'Stop screen recording on phone and pull MP4 video to PC Downloads/AURA_Recordings',
              expectedOutcome: 'Screen recording finalized and pulled to PC',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    // ── Screen Recording (Start) ──
    } else if (
      goalLower.includes('record screen') || goalLower.includes('screen record') || goalLower.includes('start record') ||
      (goalLower.includes('record') && (goalLower.includes('phone') || isMobile))
    ) {
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'phone_screen_record_start',
              parameters: {},
              reason: 'Launch background screen recording on phone via Android screenrecord',
              expectedOutcome: 'Screen recording active on phone',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    // ── PC Power Controls (terminate, shutdown, reboot, restart, sleep, abort) ──
    } else if (
      goalLower.includes('shutdown') || goalLower.includes('terminate') ||
      goalLower.includes('reboot') || goalLower.includes('restart') ||
      (goalLower.includes('sleep') && !goalLower.includes('track') && !goalLower.includes('alarm')) ||
      goalLower.includes('abort shutdown') || goalLower.includes('cancel shutdown')
    ) {
      let action = 'shutdown';
      if (goalLower.includes('reboot') || goalLower.includes('restart')) action = 'reboot';
      else if (goalLower.includes('sleep')) action = 'sleep';
      else if (goalLower.includes('abort') || goalLower.includes('cancel')) action = 'abort';
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'pc_power_control',
              parameters: { action, delaySeconds: 5 },
              reason: `Execute PC power command "${action}" with 5-second countdown safety buffer`,
              expectedOutcome: `PC ${action} initiated`,
            },
          ],
          estimatedRisk: 'HIGH',
        },
        usage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    // ── Close All Apps (PC) ──
    } else if (
      goalLower.includes('close all') || goalLower.includes('close apps') || goalLower.includes('close applications') ||
      goalLower.includes('quit all')
    ) {
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'pc_close_all_apps',
              parameters: {},
              reason: 'Close all open active applications while safely preserving IDE and terminal sessions',
              expectedOutcome: 'Active application windows closed',
            },
          ],
          estimatedRisk: 'MEDIUM',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    // ── Brightness (PC vs Phone) ──
    } else if (goalLower.includes('brightness') || (goalLower.includes('bright') && !goalLower.includes('brief'))) {
      const pctMatch = planRequest.goal.match(/(\d{1,3})\s*(?:%|percent)?/);
      const percentage = pctMatch ? parseInt(pctMatch[1], 10) : (goalLower.includes('max') ? 100 : (goalLower.includes('low') || goalLower.includes('min') ? 15 : 80));
      const isPhoneBright = (isMobile && !goalLower.includes('pc') && !goalLower.includes('computer') && !goalLower.includes('laptop')) || goalLower.includes('phone') || goalLower.includes('mobile');
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: isPhoneBright ? 'phone_set_brightness' : 'pc_set_brightness',
              parameters: { percentage },
              reason: isPhoneBright ? `Set phone screen brightness to ${percentage}%` : `Set PC screen brightness to ${percentage}% via WMI`,
              expectedOutcome: `${isPhoneBright ? 'Phone' : 'PC'} screen brightness adjusted to ${percentage}%`,
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    // ── Volume / Mute / Unmute / Silent (PC vs Phone) ──
    } else if (
      /\b(?:vol|volume|vloume)\b/i.test(planRequest.goal) ||
      goalLower.includes('mute') || goalLower.includes('silent') || goalLower.includes('unmute') || goalLower.includes('sound')
    ) {
      const volNumMatch = planRequest.goal.match(/(?:vol|volume|vloume)\s*(?:to\s*)?(\d{1,3})/i) ||
                          planRequest.goal.match(/(\d{1,3})\s*(?:%|percent)?\s*(?:vol|volume|vloume)/i) ||
                          planRequest.goal.match(/^(?:vol|vloume)\s+(\d{1,3})/i) ||
                          planRequest.goal.match(/(\d{1,3})/);
      const isMute = goalLower.includes('mute') || goalLower.includes('silent');
      const isUnmute = goalLower.includes('unmute');
      const isDown = goalLower.includes('down') || goalLower.includes('lower') || goalLower.includes('decrease') || goalLower.includes('reduce');
      const level = volNumMatch ? parseInt(volNumMatch[1], 10) : null;
      const isPhoneVol = (isMobile && !goalLower.includes('pc') && !goalLower.includes('computer') && !goalLower.includes('laptop')) || goalLower.includes('phone') || goalLower.includes('mobile');

      if (isPhoneVol) {
        let tool = 'phone_quick_settings';
        let parameters = { setting: 'ringer_mode', state: 'silent' };
        let reason = 'Set phone to Silent/Mute mode via AudioManager and global mode_ringer';
        if (level !== null) {
          tool = 'phone_quick_settings';
          parameters = { setting: 'volume', level };
          reason = `Set phone volume to ${level}%`;
        } else if (isUnmute) {
          parameters = { setting: 'ringer_mode', state: 'normal' };
          reason = 'Unmute phone ringer';
        } else if (!isMute) {
          tool = 'phone_media_control';
          parameters = { action: isDown ? 'volume_down' : 'volume_up' };
          reason = 'Adjust phone audio volume';
        }
        return {
          success: true,
          provider: 'gemini',
          model: `${this.model}-offline`,
          plan: {
            steps: [{ stepIndex: 0, tool, parameters, reason, expectedOutcome: 'Phone volume adjusted' }],
            estimatedRisk: 'LOW',
          },
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latencyMs: Date.now() - startTime,
          rawError: null,
        };
      } else {
        // PC Volume
        let parameters = { action: isMute ? 'mute' : isUnmute ? 'unmute' : isDown ? 'down' : 'up', steps: 5 };
        if (level !== null) parameters = { level };
        return {
          success: true,
          provider: 'gemini',
          model: `${this.model}-offline`,
          plan: {
            steps: [
              {
                stepIndex: 0,
                tool: 'pc_set_volume',
                parameters,
                reason: level !== null ? `Set PC master volume to ${level}%` : `Adjust PC master volume: ${parameters.action}`,
                expectedOutcome: `PC master audio updated`,
              },
            ],
            estimatedRisk: 'LOW',
          },
          usage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
          latencyMs: Date.now() - startTime,
          rawError: null,
        };
      }
    // ── Quick Settings (WiFi, Bluetooth, Night Light, Theme, Hotspot, Airplane, Energy Saver) ──
    } else if (
      goalLower.includes('wifi') || goalLower.includes('wi-fi') ||
      goalLower.includes('bluetooth') || goalLower.includes('bt') ||
      goalLower.includes('flashlight') || goalLower.includes('torch') ||
      goalLower.includes('dnd') || goalLower.includes('disturb') ||
      goalLower.includes('night light') ||
      goalLower.includes('hotspot') || goalLower.includes('airplane') ||
      goalLower.includes('energy saver') || goalLower.includes('battery saver') ||
      goalLower.includes('theme') || goalLower.includes('dark mode') || goalLower.includes('light mode') ||
      goalLower.includes('location')
    ) {
      const isPhoneQS = (isMobile && !goalLower.includes('pc') && !goalLower.includes('computer') && !goalLower.includes('laptop')) || goalLower.includes('phone') || goalLower.includes('torch') || goalLower.includes('flashlight');
      if (isPhoneQS) {
        let setting = 'wifi';
        if (goalLower.includes('wifi') || goalLower.includes('wi-fi')) setting = 'wifi';
        else if (goalLower.includes('bluetooth') || goalLower.includes('bt')) setting = 'bluetooth';
        else if (goalLower.includes('data') || goalLower.includes('internet')) setting = 'mobile_data';
        else if (goalLower.includes('flashlight') || goalLower.includes('torch')) setting = 'flashlight';
        else if (goalLower.includes('dnd') || goalLower.includes('disturb') || goalLower.includes('zen')) setting = 'dnd';
        else if (goalLower.includes('location') || goalLower.includes('gps')) setting = 'location';
        else if (goalLower.includes('theme') || goalLower.includes('dark mode') || goalLower.includes('light mode')) setting = 'theme';
        else if (goalLower.includes('rotate') || goalLower.includes('rotation')) setting = 'autorotate';

        const isOff = goalLower.includes('off') || goalLower.includes('disable') || goalLower.includes('deactivate');
        let state = isOff ? 'off' : 'on';
        if (setting === 'theme') state = goalLower.includes('light') ? 'light' : 'dark';

        return {
          success: true,
          provider: 'gemini',
          model: `${this.model}-offline`,
          plan: {
            steps: [
              {
                stepIndex: 0,
                tool: 'phone_quick_settings',
                parameters: { setting, state },
                reason: `Toggle phone quick setting "${setting}" to ${state}`,
                expectedOutcome: `Phone ${setting} set to ${state}`,
              },
            ],
            estimatedRisk: 'LOW',
          },
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latencyMs: Date.now() - startTime,
          rawError: null,
        };
      } else {
        // PC Quick Settings
        let setting = 'wifi';
        if (goalLower.includes('wifi') || goalLower.includes('wi-fi')) setting = 'wifi';
        else if (goalLower.includes('bluetooth') || goalLower.includes('bt')) setting = 'bluetooth';
        else if (goalLower.includes('night light')) setting = 'night_light';
        else if (goalLower.includes('hotspot')) setting = 'hotspot';
        else if (goalLower.includes('airplane')) setting = 'airplane';
        else if (goalLower.includes('energy saver') || goalLower.includes('battery saver')) setting = 'energy_saver';
        else if (goalLower.includes('theme') || goalLower.includes('dark mode') || goalLower.includes('light mode')) setting = 'theme';

        const isOff = goalLower.includes('off') || goalLower.includes('disable') || goalLower.includes('deactivate');
        let state = isOff ? 'off' : 'on';
        if (setting === 'theme') state = goalLower.includes('light') ? 'light' : 'dark';

        return {
          success: true,
          provider: 'gemini',
          model: `${this.model}-offline`,
          plan: {
            steps: [
              {
                stepIndex: 0,
                tool: 'pc_quick_settings',
                parameters: { setting, state },
                reason: `Toggle PC quick setting "${setting}" to ${state}`,
                expectedOutcome: `PC ${setting} set to ${state}`,
              },
            ],
            estimatedRisk: 'LOW',
          },
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          latencyMs: Date.now() - startTime,
          rawError: null,
        };
      }
    } else if (goalLower.startsWith('type ') || goalLower.includes('type text') || goalLower.includes('type code')) {
      const rawText = planRequest.goal.replace(/^(please\s+)?type\s+/i, '').replace(/^['"]|['"]$/g, '');
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'pc_type_text',
              parameters: { text: rawText, countdownSeconds: 3 },
              reason: `Type text with human-like jitter simulation`,
              expectedOutcome: 'Text typed successfully',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    } else if (goalLower.includes('specs') || goalLower.includes('telemetry') || goalLower.includes('system info') || goalLower.includes('cpu') || goalLower.includes('ram')) {
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'pc_system_metrics',
              parameters: {},
              reason: 'Retrieve live Windows CPU, RAM, and disk metrics',
              expectedOutcome: 'Live system telemetry metrics',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    } else if (
      goalLower.includes('unlock') ||
      (goalLower.includes('wake') && (isMobile || goalLower.includes('phone') || goalLower.includes('screen')))
    ) {
      const pinMatch = planRequest.goal.match(/\b(?:pin|code|password)\s*(?:is\s*)?(\d{4,8})\b/i);
      const pin = pinMatch ? pinMatch[1] : '090807';
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'phone_unlock',
              parameters: { pin },
              reason: 'Wake screen, swipe up, and input hardware keyevents for PIN',
              expectedOutcome: 'Phone unlocked successfully',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    } else if (!goalLower.includes('unlock') && goalLower.includes('lock')) {
      const isPhoneLock = (isMobile && !goalLower.includes('pc') && !goalLower.includes('computer') && !goalLower.includes('laptop')) || goalLower.includes('phone') || goalLower.includes('mobile');
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: isPhoneLock ? 'phone_lock' : 'pc_lock',
              parameters: {},
              reason: isPhoneLock ? 'Turn off screen and lock Android device via KEYCODE_POWER' : 'Lock Windows PC workstation session immediately',
              expectedOutcome: isPhoneLock ? 'Phone locked successfully' : 'PC screen locked successfully',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    } else if (goalLower.includes('battery') && (goalLower.includes('phone') || isMobile)) {
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'phone_get_battery',
              parameters: {},
              reason: 'Inspect phone battery level, charging status, and temperature via dumpsys battery',
              expectedOutcome: 'Live Android battery metrics',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    } else if (goalLower.includes('screenshot') && (goalLower.includes('phone') || isMobile)) {
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'phone_take_screenshot',
              parameters: {},
              reason: 'Capture Android display via screencap and pull to host PC Desktop',
              expectedOutcome: 'Screenshot saved to Desktop',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    } else if (
      /(selfie|selfi|front camera)/i.test(goalLower) ||
      ((goalLower.includes('photo') || goalLower.includes('picture') || goalLower.includes('snap')) &&
        (goalLower.includes('phone') || isMobile))
    ) {
      const isSelfie = /(selfie|selfi|front)/i.test(goalLower);
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'phone_take_photo',
              parameters: { isSelfie },
              reason: `Rapid chained camera capture on phone (${isSelfie ? 'front selfie' : 'rear photo'})`,
              expectedOutcome: 'Photo captured and saved to Gallery',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    } else if (goalLower.includes('alarm') && (goalLower.includes('phone') || isMobile)) {
      const timeMatch = planRequest.goal.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      let hour = 7, minute = 0;
      if (timeMatch) {
        hour = parseInt(timeMatch[1], 10);
        minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        if (timeMatch[3] && timeMatch[3].toLowerCase() === 'pm' && hour < 12) hour += 12;
      }
      return {
        success: true,
        provider: 'gemini',
        model: `${this.model}-offline`,
        plan: {
          steps: [
            {
              stepIndex: 0,
              tool: 'phone_set_alarm',
              parameters: { hour, minute, message: 'AURA Alarm' },
              reason: `Set alarm on phone for ${hour}:${String(minute).padStart(2, '0')}`,
              expectedOutcome: 'Alarm set on phone',
            },
          ],
          estimatedRisk: 'LOW',
        },
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        latencyMs: Date.now() - startTime,
        rawError: null,
      };
    }

    return {
      success: true,
      provider: 'gemini',
      model: `${this.model}-offline`,
      plan: {
        steps: [
          {
            stepIndex: 0,
            tool: 'web_search',
            parameters: { query: planRequest.goal },
            reason: 'Fallback search query generated by Gemini adapter',
            expectedOutcome: 'Search results and summary',
          },
        ],
        estimatedRisk: 'LOW',
      },
      usage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
      latencyMs: Date.now() - startTime,
      rawError: null,
    };
  }

  async chatCompletion(chatRequest) {
    return {
      success: true,
      provider: 'gemini',
      model: this.model,
      content: 'Gemini fallback chat completion',
    };
  }
}

module.exports = { GeminiProvider };
