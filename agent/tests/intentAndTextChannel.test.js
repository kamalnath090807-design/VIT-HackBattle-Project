/**
 * Tests for IntentEngine & TextChannel
 */

const { setTarget, getTarget, resolveIntent } = require('../../core/intentEngine');
const { processText } = require('../../core/textChannel');

describe('IntentEngine', () => {
  beforeEach(() => {
    setTarget('pc');
  });

  it('1. Toggles automation target between PC and Mobile', () => {
    expect(getTarget()).toBe('pc');
    setTarget('mobile');
    expect(getTarget()).toBe('mobile');
    setTarget('pc');
    expect(getTarget()).toBe('pc');
  });

  it('2. Resolves intent based on mode and keywords', () => {
    // Explicit phone keyword overrides PC mode
    const res1 = resolveIntent('take a selfie on phone', 'pc');
    expect(res1.target).toBe('mobile');
    expect(res1.isMobile).toBe(true);

    // Explicit PC keyword overrides Mobile mode
    const res2 = resolveIntent('open file in vs code', 'mobile');
    expect(res2.target).toBe('pc');
    expect(res2.isMobile).toBe(false);

    // Steers generic mobile-capable command when in mobile mode
    const res3 = resolveIntent('volume to 50%', 'mobile');
    expect(res3.target).toBe('mobile');
    expect(res3.adjustedGoal).toContain('on phone');
  });
});

describe('TextChannel', () => {
  it('3. Streams real-time chunks and terminates with onDone', async () => {
    const chunks = [];
    let isDone = false;

    await processText('check system battery', {
      onChunk: (c) => chunks.push(c),
      onDone: () => { isDone = true; }
    }, { target: 'pc' });

    expect(isDone).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
    const combined = chunks.join('');
    expect(combined).toContain('Target:');
  });

  it('4. Automatically routes attached file to phone_send_whatsapp_media with caption', async () => {
    const { defaultToolRouter } = require('../src/tools/toolRouter');
    const spy = jest.spyOn(defaultToolRouter, 'executeTool').mockImplementation(async (tool, params) => {
      if (tool === 'contact_resolve') {
        return { success: true, data: { name: 'Abishek', phone: '+919042629740' } };
      }
      return { success: true, message: `Mocked ${tool} execution` };
    });

    const chunks = [];
    let isDone = false;
    const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    await processText('message abishek hi da potta', {
      onChunk: (c) => chunks.push(c),
      onDone: () => { isDone = true; }
    }, {
      target: 'mobile',
      attachment: {
        name: 'sample.png',
        type: 'image/png',
        size: 1024,
        base64: dummyBase64,
      }
    });

    expect(isDone).toBe(true);
    const executedTools = spy.mock.calls.map(call => call[0]);
    expect(executedTools).toContain('phone_send_whatsapp_media');

    // Find parameters passed to phone_send_whatsapp_media
    const mediaCall = spy.mock.calls.find(call => call[0] === 'phone_send_whatsapp_media');
    expect(mediaCall).toBeDefined();
    const mediaParams = mediaCall[1];
    expect(mediaParams.filePath).toBeDefined();
    expect(mediaParams.filePath).toContain('.png');
    expect(mediaParams.caption).toContain('hi da potta');

    spy.mockRestore();
  });

  it('5. Routes "save to phone" with attachment to phone_save_file', async () => {
    const { defaultToolRouter } = require('../src/tools/toolRouter');
    const spy = jest.spyOn(defaultToolRouter, 'executeTool').mockImplementation(async (tool, params) => {
      return { success: true, message: `Mocked ${tool}` };
    });

    const chunks = [];
    let isDone = false;
    await processText('save to phone', {
      onChunk: (c) => chunks.push(c),
      onDone: () => { isDone = true; }
    }, {
      target: 'mobile',
      attachment: {
        name: 'test_photo.jpg',
        type: 'image/jpeg',
        size: 2048,
        base64: 'AAAA',
      }
    });

    expect(isDone).toBe(true);
    const executedTools = spy.mock.calls.map(c => c[0]);
    expect(executedTools).toContain('phone_save_file');
    const saveCall = spy.mock.calls.find(c => c[0] === 'phone_save_file');
    expect(saveCall[1].filePath).toBeDefined();
    spy.mockRestore();
  });

  it('6. Routes "share abishek" with attachment to phone_send_whatsapp_media', async () => {
    const { defaultToolRouter } = require('../src/tools/toolRouter');
    const spy = jest.spyOn(defaultToolRouter, 'executeTool').mockImplementation(async (tool, params) => {
      if (tool === 'contact_resolve') {
        return { success: true, data: { name: 'Abishek', phone: '+919042629740' } };
      }
      return { success: true, message: `Mocked ${tool}` };
    });

    const chunks = [];
    let isDone = false;
    await processText('share abishek photo preview', {
      onChunk: (c) => chunks.push(c),
      onDone: () => { isDone = true; }
    }, {
      target: 'mobile',
      attachment: {
        name: 'doc.png',
        type: 'image/png',
        size: 1024,
        base64: 'AAAA',
      }
    });

    expect(isDone).toBe(true);
    const executedTools = spy.mock.calls.map(c => c[0]);
    expect(executedTools).toContain('phone_send_whatsapp_media');
    spy.mockRestore();
  });

  it('7. Correctly plans and executes "mute my phone" and "put my phone in silent"', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const plan1 = await defaultPlanner.plan({ goal: 'mute my phone', target: 'mobile' });
    expect(plan1.steps[0].tool).toBe('phone_quick_settings');
    expect(plan1.steps[0].parameters.setting).toBe('ringer_mode');
    expect(plan1.steps[0].parameters.state).toBe('silent');

    const plan2 = await defaultPlanner.plan({ goal: 'put my phone in silent', target: 'mobile' });
    expect(plan2.steps[0].tool).toBe('phone_quick_settings');
    expect(plan2.steps[0].parameters.setting).toBe('ringer_mode');
    expect(plan2.steps[0].parameters.state).toBe('silent');
  });

  it('8. Correctly plans and executes "vol 30" and "vloume 50 percent"', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const plan1 = await defaultPlanner.plan({ goal: 'vol 30', target: 'mobile' });
    expect(plan1.steps[0].tool).toBe('phone_media_control');
    expect(plan1.steps[0].parameters.action).toBe('volume_set');
    expect(plan1.steps[0].parameters.level).toBe(30);

    const plan2 = await defaultPlanner.plan({ goal: 'vloume 50 percent', target: 'mobile' });
    expect(plan2.steps[0].tool).toBe('phone_media_control');
    expect(plan2.steps[0].parameters.action).toBe('volume_set');
    expect(plan2.steps[0].parameters.level).toBe(50);
  });

  it('9. Correctly plans screen recording start and stop', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const plan1 = await defaultPlanner.plan({ goal: 'record screen', target: 'mobile' });
    expect(plan1.steps[0].tool).toBe('phone_screen_record_start');

    const plan2 = await defaultPlanner.plan({ goal: 'finish record', target: 'mobile' });
    expect(plan2.steps[0].tool).toBe('phone_screen_record_stop');
  });

  it('10. Correctly plans brightness, flashlight, and theme toggles', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const plan1 = await defaultPlanner.plan({ goal: 'brightness 80%', target: 'mobile' });
    expect(plan1.steps[0].tool).toBe('phone_set_brightness');
    expect(plan1.steps[0].parameters.percentage).toBe(80);

    const plan2 = await defaultPlanner.plan({ goal: 'turn on flashlight', target: 'mobile' });
    expect(plan2.steps[0].tool).toBe('phone_quick_settings');
    expect(plan2.steps[0].parameters.setting).toBe('flashlight');

    const plan3 = await defaultPlanner.plan({ goal: 'change to light theme', target: 'mobile' });
    expect(plan3.steps[0].tool).toBe('phone_quick_settings');
    expect(plan3.steps[0].parameters.setting).toBe('theme');
    expect(plan3.steps[0].parameters.state).toBe('light');
  });

  it('11. Symmetric Target Switching & Location Override', () => {
    const { resolveIntent } = require('../../core/intentEngine');
    expect(resolveIntent('lock', 'pc').target).toBe('pc');
    expect(resolveIntent('lock', 'mobile').target).toBe('mobile');
    expect(resolveIntent('lock my phone', 'pc').target).toBe('mobile');
    expect(resolveIntent('lock on pc', 'mobile').target).toBe('pc');
    expect(resolveIntent('mute on phone', 'pc').target).toBe('mobile');
    expect(resolveIntent('mute pc', 'mobile').target).toBe('pc');
  });

  it('12. Correctly plans PC Lock, Volume, and Brightness in PC Mode', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const lockPlan = await defaultPlanner.plan({ goal: 'lock', target: 'pc' });
    expect(lockPlan.steps[0].tool).toBe('pc_lock');

    const volPlan = await defaultPlanner.plan({ goal: 'vol 30', target: 'pc' });
    expect(volPlan.steps[0].tool).toBe('pc_set_volume');
    expect(volPlan.steps[0].parameters.level).toBe(30);

    const mutePlan = await defaultPlanner.plan({ goal: 'mute', target: 'pc' });
    expect(mutePlan.steps[0].tool).toBe('pc_set_volume');
    expect(mutePlan.steps[0].parameters.action).toBe('mute');

    const brightPlan = await defaultPlanner.plan({ goal: 'brightness 80%', target: 'pc' });
    expect(brightPlan.steps[0].tool).toBe('pc_set_brightness');
    expect(brightPlan.steps[0].parameters.percentage).toBe(80);
  });

  it('13. Correctly plans PC Power Commands (shutdown in 5s, reboot in 5s, sleep)', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const shutdownPlan = await defaultPlanner.plan({ goal: 'terminate', target: 'pc' });
    expect(shutdownPlan.steps[0].tool).toBe('pc_power_control');
    expect(shutdownPlan.steps[0].parameters.action).toBe('shutdown');
    expect(shutdownPlan.steps[0].parameters.delaySeconds).toBe(5);

    const rebootPlan = await defaultPlanner.plan({ goal: 'reboot', target: 'pc' });
    expect(rebootPlan.steps[0].tool).toBe('pc_power_control');
    expect(rebootPlan.steps[0].parameters.action).toBe('reboot');
    expect(rebootPlan.steps[0].parameters.delaySeconds).toBe(5);

    const sleepPlan = await defaultPlanner.plan({ goal: 'sleep', target: 'pc' });
    expect(sleepPlan.steps[0].tool).toBe('pc_power_control');
    expect(sleepPlan.steps[0].parameters.action).toBe('sleep');
  });

  it('14. Correctly plans and routes "close all apps" in PC Mode', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const plan = await defaultPlanner.plan({ goal: 'close all apps', target: 'pc' });
    expect(plan.steps[0].tool).toBe('pc_close_all_apps');
  });

  it('15. Correctly plans PC Quick Settings (WiFi, Theme)', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const wifiPlan = await defaultPlanner.plan({ goal: 'wifi off', target: 'pc' });
    expect(wifiPlan.steps[0].tool).toBe('pc_quick_settings');
    expect(wifiPlan.steps[0].parameters.setting).toBe('wifi');
    expect(wifiPlan.steps[0].parameters.state).toBe('off');

    const themePlan = await defaultPlanner.plan({ goal: 'dark mode', target: 'pc' });
    expect(themePlan.steps[0].tool).toBe('pc_quick_settings');
    expect(themePlan.steps[0].parameters.setting).toBe('theme');
    expect(themePlan.steps[0].parameters.state).toBe('dark');
  });

  it('16. Correctly plans "open vs code" as pc_launch_app', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const plan = await defaultPlanner.plan({ goal: 'open vs code', target: 'pc' });
    expect(plan.steps[0].tool).toBe('pc_launch_app');
    expect(plan.steps[0].parameters.appName).toBe('vs code');
  });

  it('17. Correctly plans "code terminate" as pc_power_control shutdown in 5s', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const plan = await defaultPlanner.plan({ goal: 'code terminate', target: 'pc' });
    expect(plan.steps[0].tool).toBe('pc_power_control');
    expect(plan.steps[0].parameters.action).toBe('shutdown');
    expect(plan.steps[0].parameters.delaySeconds).toBe(5);
  });

  it('18. Correctly plans "trending songs" on phone as phone_search_and_play with Tamil default', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const plan = await defaultPlanner.plan({ goal: 'play trending songs', target: 'mobile' });
    expect(plan.steps[0].tool).toBe('phone_search_and_play');
    expect(plan.steps[0].parameters.query).toBe('trending songs in tamil');
    expect(plan.steps[0].parameters.autoPlayIndex).toBe(1);
  });

  it('19. Correctly plans "play trending songs in tamil" on PC as pc_search_and_play', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const plan = await defaultPlanner.plan({ goal: 'play trending songs in tamil', target: 'pc' });
    expect(plan.steps[0].tool).toBe('pc_search_and_play');
    expect(plan.steps[0].parameters.query).toBe('trending songs in tamil');
    expect(plan.steps[0].parameters.autoPlayIndex).toBe(1);
  });

  it('19b. Strips "on pc" from YouTube search queries on PC', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const { resolveIntent } = require('../../core/intentEngine');
    const queries = [
      { input: 'play tamil song', expected: 'tamil song' },
      { input: 'open youtube and search for tamil songs and play it', expected: 'tamil songs' },
      { input: 'open youtube search tamil songs', expected: 'tamil songs' },
    ];
    for (const q of queries) {
      const intent = resolveIntent(q.input, 'pc');
      const plan = await defaultPlanner.plan({ goal: intent.adjustedGoal, target: intent.target });
      expect(plan.steps[0].tool).toBe('pc_search_and_play');
      expect(plan.steps[0].parameters.query).toBe(q.expected);
    }
  });

  it('20. Correctly plans "unlock", "unlock the phone", and "unlock my phone" as phone_unlock', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    for (const phrase of ['unlock', 'unlock the phone', 'unlock my phone']) {
      const intent = resolveIntent(phrase, 'mobile');
      const plan = await defaultPlanner.plan({ goal: intent.adjustedGoal, target: intent.target });
      expect(plan.steps[0].tool).toBe('phone_unlock');
    }
  });

  it('21. Correctly plans "open whatsapp" on phone as phone_launch_app without sending messages', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const intent = resolveIntent('open whatsapp', 'mobile');
    const plan = await defaultPlanner.plan({ goal: intent.adjustedGoal, target: intent.target });
    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0].tool).toBe('phone_launch_app');
    expect(plan.steps[0].parameters.app.toLowerCase()).toContain('whatsapp');
  });

  it('22. Correctly plans "open camera" and "open free fire" on phone as phone_launch_app', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const camIntent = resolveIntent('open camera', 'mobile');
    const camPlan = await defaultPlanner.plan({ goal: camIntent.adjustedGoal, target: camIntent.target });
    expect(camPlan.steps[0].tool).toBe('phone_launch_app');
    expect(camPlan.steps[0].parameters.app.toLowerCase()).toContain('camera');

    const ffIntent = resolveIntent('open free fire', 'mobile');
    const ffPlan = await defaultPlanner.plan({ goal: ffIntent.adjustedGoal, target: ffIntent.target });
    expect(ffPlan.steps[0].tool).toBe('phone_launch_app');
    expect(ffPlan.steps[0].parameters.app.toLowerCase()).toContain('free fire');
  });

  it('23. Correctly plans typo "take a selfi" as phone_take_photo', async () => {
    const { defaultPlanner } = require('../src/planner/planner');
    const intent = resolveIntent('take a selfi', 'mobile');
    const plan = await defaultPlanner.plan({ goal: intent.adjustedGoal, target: intent.target });
    expect(plan.steps[0].tool).toBe('phone_take_photo');
    expect(plan.steps[0].parameters.isSelfie).toBe(true);
  });
});


