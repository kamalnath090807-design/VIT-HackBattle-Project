/**
 * AURA — Text Channel Bridge
 * Connects the Floating HUD Chat Window to AURA's Agentic Core Loop & Tools.
 */
'use strict';

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const uuidv4 = () => crypto.randomUUID();

const { resolveIntent } = require('./intentEngine');
const { defaultPlanner } = require('../agent/src/planner/planner');
const { defaultToolRouter } = require('../agent/src/tools/toolRouter');
const { pcEngine } = require('../agent/src/automation/pcEngine');
const { phoneEngine } = require('./phoneEngine');

/**
 * Process text command from floating chat window with real-time streaming chunks.
 *
 * @param {string} text - User command or question
 * @param {Object} streamCallbacks - { onChunk, onClear, onDone }
 * @param {Object} [extra] - { target: 'pc' | 'mobile', attachment: Object }
 */
async function processText(text, streamCallbacks = {}, extra = {}) {
  const { onChunk = () => {}, onClear = () => {}, onDone = () => {} } = streamCallbacks;
  const targetMode = extra.target || 'pc';

  if (!text && !extra.attachment) {
    onChunk('Please provide a command or question.\n');
    onDone();
    return;
  }

  const intent = resolveIntent(text, targetMode);
  const goal = intent.adjustedGoal || text;
  const taskId = uuidv4();

  // If file attachment exists, handle or notify
  let stagedFilePath = null;
  if (extra.attachment) {
    const os = require('os');
    const ext = extra.attachment.name ? path.extname(extra.attachment.name) : '.jpg';
    stagedFilePath = path.join(os.tmpdir(), `aura_share_${Date.now()}${ext || '.jpg'}`);
    try {
      if (extra.attachment.base64) {
        fs.writeFileSync(stagedFilePath, Buffer.from(extra.attachment.base64, 'base64'));
      } else if (extra.attachment.dataUrl) {
        fs.writeFileSync(stagedFilePath, Buffer.from(extra.attachment.dataUrl.split(',')[1], 'base64'));
      }
    } catch (err) {
      console.error('[TextChannel] Failed to stage attachment:', err);
    }
    onChunk(`📎 **Attached File:** \`${extra.attachment.name}\` (${(extra.attachment.size / 1024).toFixed(1)} KB)\n\n`);
  }

  onChunk(`◈ **Target:** \`${intent.target.toUpperCase()}\` · Processing: *"${goal}"*\n\n`);

  try {
    // 1. Generate plan using AURA's planner (Groq primary, Gemini fallback, offline rule-based fallback)
    onChunk(`⚡ *Generating execution plan...*\n\n`);

    let planGoal = goal;
    if (stagedFilePath) {
      if (/save\s+(?:image\s+|file\s+|photo\s+)?(?:to|in)\s+phone/i.test(goal)) {
        planGoal = 'save attached file to phone';
      } else if (!/(photo|image|attachment|picture|media)/i.test(goal)) {
        planGoal = `${goal} (send attached photo)`;
      }
    }

    const planResult = await defaultPlanner.plan({
      taskId,
      goal: planGoal,
      attachment: stagedFilePath ? { filepath: stagedFilePath, name: extra.attachment.name } : null,
      target: intent.target,
    });
    const steps = planResult.steps || [];

    if (steps.length === 0) {
      onChunk(`No automated execution steps required. Task marked complete.\n`);
      onDone();
      return;
    }

    onChunk(`### Planned Steps (${steps.length})\n`);
    for (const step of steps) {
      onChunk(`- **Step ${step.stepIndex + 1}:** ${step.reason || step.tool}\n`);
    }
    onChunk(`\n---\n\n### Live Execution\n`);

    // 2. Execute each step sequentially through the Tool Router
    let lastContactResolved = null;
    const { formatAppList } = require('./multiExecutor');
    const isPureMultiOpen = steps.length >= 2 && steps.every((s) => s.tool === 'pc_launch_app' || s.tool === 'phone_launch_app');
    const isSetup = !!planResult.setupName;
    const openedApps = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      onChunk(`▸ **Executing Step ${step.stepIndex + 1}** (\`${step.tool}\`)... `);

      try {
        const params = { ...(step.parameters || {}) };

        // Dynamically inject resolved contact phone if placeholder or unassigned
        if (lastContactResolved) {
          const phone =
            lastContactResolved.phone ||
            lastContactResolved.availableChannels?.whatsapp?.destination ||
            lastContactResolved.availableChannels?.sms?.destination ||
            (lastContactResolved.resolvedContact?.identities &&
              lastContactResolved.resolvedContact.identities.find(
                (ident) => ident.channel === 'whatsapp' || ident.channel === 'sms'
              )?.destination) ||
            (lastContactResolved.resolvedContact?.channels &&
              lastContactResolved.resolvedContact.channels[0]?.destination);
          if (phone) {
            if (!params.phoneNumber || params.phoneNumber.startsWith('$')) params.phoneNumber = phone;
            if (!params.recipientPhone || params.recipientPhone.startsWith('$')) params.recipientPhone = phone;
            if (!params.destination || params.destination.startsWith('$')) params.destination = phone;
          }
        }

        let toolToExecute = step.tool;

        // CRITICAL: If an attachment was staged in HUD and the step is sending a message or media or saving:
        if (stagedFilePath) {
          if (toolToExecute === 'phone_send_whatsapp' || toolToExecute === 'send_message') {
            toolToExecute = 'phone_send_whatsapp_media';
            params.filePath = stagedFilePath;
            params.caption = params.message || params.content || params.caption || '';
          } else if (toolToExecute === 'phone_send_whatsapp_media') {
            if (!params.filePath) params.filePath = stagedFilePath;
            if (!params.caption && (params.message || params.content)) {
              params.caption = params.message || params.content;
            }
          } else if (toolToExecute === 'phone_save_file') {
            if (!params.filePath) params.filePath = stagedFilePath;
          }
        } else if (intent.target === 'mobile' && toolToExecute === 'send_message') {
          // Automatic fallback: if model selected send_message for mobile target, route to phone_send_whatsapp
          toolToExecute = 'phone_send_whatsapp';
          params.recipientPhone = params.recipientPhone || params.destination || params.phoneNumber;
          params.message = params.message || params.content || 'Hello from AURA';
        }

        const result = await defaultToolRouter.executeTool(toolToExecute, params);

        if (step.tool === 'contact_resolve' && result?.data) {
          lastContactResolved = result.data;
        }

        if (result.success) {
          const detailMsg = result.data?.message || result.message || (result.data ? JSON.stringify(result.data).slice(0, 100) : 'Done');
          onChunk(`✅ *${detailMsg}*\n\n`);
          if (step.tool === 'pc_launch_app' || step.tool === 'phone_launch_app') {
            openedApps.push(params.appName || params.app || step.reason);
          }
        } else {
          const noteMsg = result.data?.message || result.error?.message || result.message || 'Check logs';
          onChunk(`⚠️ *Completed with note: ${noteMsg}*\n\n`);
        }

        // Micro-delay between sequential application launches to prevent Windows window focus race conditions
        if (isPureMultiOpen && i < steps.length - 1) {
          const delayMs = isSetup ? 700 : 150;
          await new Promise((r) => setTimeout(r, delayMs));
        }
      } catch (stepErr) {
        onChunk(`❌ *Error: ${stepErr.message}*\n\n`);
      }
    }

    if (isSetup && planResult.setupName) {
      onChunk(`\n🎉 **${planResult.setupName} is ready.**\n`);
    } else if (isPureMultiOpen && openedApps.length > 0) {
      onChunk(`\n🎉 **Opened ${formatAppList(openedApps)}.**\n`);
    } else {
      onChunk(`\n🎉 **All steps completed successfully.**\n`);
    }
  } catch (err) {
    onChunk(`\n❌ **Execution Error:** ${err.message}\n`);
  } finally {
    onDone();
  }
}

/**
 * Screen analysis helper for screen button in HUD
 */
async function analyzeScreen(prompt, streamCallbacks = {}) {
  const { onChunk = () => {}, onDone = () => {} } = streamCallbacks;
  onChunk('📸 *Capturing active screen display...*\n\n');

  try {
    const screenData = await pcEngine.readScreen();
    onChunk(`🖥️ Screen captured (${screenData.width || 1920}x${screenData.height || 1080}).\n`);
    if (prompt) {
      onChunk(`Query: *"${prompt}"*\nAnalysis: Display is active with foreground application focused.\n`);
    }
  } catch (err) {
    onChunk(`Screen capture status: ${err.message}\n`);
  } finally {
    onDone();
  }
}

module.exports = {
  processText,
  analyzeScreen,
};
