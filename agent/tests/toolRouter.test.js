const { defaultToolRouter } = require('../src/tools/toolRouter');
const { pcEngine } = require('../src/automation/pcEngine');
const { phoneEngine } = require('../src/automation/phoneEngine');
const { productivityEngine } = require('../src/automation/productivityEngine');
const { memoryEngine } = require('../src/automation/memoryEngine');

describe('ToolRouter Automation Dispatch', () => {
  test('executes pc_system_metrics via toolRouter', async () => {
    jest.spyOn(pcEngine, 'getSystemMetrics').mockResolvedValueOnce({
      cpu: { loadPercent: 18 },
      ram: { usedPercent: 55 },
      disk: { freeGb: 120 },
      battery: { percent: 90, isCharging: true }
    });

    const res = await defaultToolRouter.executeTool('pc_system_metrics', {});
    expect(res.success).toBe(true);
    expect(res.data.cpu.loadPercent).toBe(18);
    expect(res.data.battery.percent).toBe(90);
  });

  test('executes phone_get_battery via toolRouter', async () => {
    jest.spyOn(phoneEngine, 'getBattery').mockResolvedValueOnce({
      connected: true,
      level: 82,
      isCharging: false,
      temperatureC: 31.4
    });

    const res = await defaultToolRouter.executeTool('phone_get_battery', {});
    expect(res.success).toBe(true);
    expect(res.data.level).toBe(82);
  });

  test('executes productivity_log_expense and computes sum', async () => {
    const res = await defaultToolRouter.executeTool('productivity_log_expense', {
      amount: 150,
      description: 'Test coffee',
      category: 'food'
    });

    expect(res.success).toBe(true);
    expect(res.data.entry.amount).toBe(150);
    expect(res.data.entry.description).toBe('Test coffee');
    expect(res.data.monthlyTotal).toBeGreaterThanOrEqual(150);
  });

  test('executes memory_store_fact and memory_get_profile', async () => {
    const storeRes = await defaultToolRouter.executeTool('memory_store_fact', {
      key: 'preferred_editor',
      fact: 'VS Code with dark theme'
    });
    expect(storeRes.success).toBe(true);

    const profileRes = await defaultToolRouter.executeTool('memory_get_profile', {});
    expect(profileRes.success).toBe(true);
    expect(profileRes.data.recentFacts.some((f) => f.key === 'preferred_editor')).toBe(true);
  });

  test('executes pc_solve_mcq with snippet grounding', async () => {
    jest.spyOn(pcEngine, 'solveMCQ').mockResolvedValueOnce({
      action: '2_DOT_CLICK',
      detectedSnippet: 'Event-driven non-blocking I/O',
      confidence: 0.94,
      targetCoordinates: { x: 420, y: 580 },
      nextButtonCoordinates: { x: 880, y: 920 },
      executed: true
    });

    const res = await defaultToolRouter.executeTool('pc_solve_mcq', {
      questionContext: 'What is Node.js primary concurrency model?'
    });
    expect(res.success).toBe(true);
    expect(res.data.action).toBe('2_DOT_CLICK');
    expect(res.data.confidence).toBe(0.94);
  });

  test('executes pc_lock, pc_set_volume, and pc_set_brightness via toolRouter', async () => {
    jest.spyOn(pcEngine, 'lockPC').mockResolvedValueOnce({ success: true, message: 'PC locked' });
    const lockRes = await defaultToolRouter.executeTool('pc_lock', {});
    expect(lockRes.success).toBe(true);

    jest.spyOn(pcEngine, 'setVolume').mockResolvedValueOnce({ success: true, volume: 40 });
    const volRes = await defaultToolRouter.executeTool('pc_set_volume', { level: 40 });
    expect(volRes.success).toBe(true);

    jest.spyOn(pcEngine, 'setBrightness').mockResolvedValueOnce({ success: true, brightness: 80 });
    const brightRes = await defaultToolRouter.executeTool('pc_set_brightness', { percentage: 80 });
    expect(brightRes.success).toBe(true);
  });

  test('executes pc_power_control, pc_close_all_apps, and pc_quick_settings via toolRouter', async () => {
    jest.spyOn(pcEngine, 'powerCommand').mockResolvedValueOnce({ success: true, action: 'shutdown', countdownSeconds: 5 });
    const pwrRes = await defaultToolRouter.executeTool('pc_power_control', { action: 'shutdown', delaySeconds: 5 });
    expect(pwrRes.success).toBe(true);

    jest.spyOn(pcEngine, 'closeAllApps').mockResolvedValueOnce({ success: true, count: 2, closedApps: ['notepad', 'calc'] });
    const closeRes = await defaultToolRouter.executeTool('pc_close_all_apps', {});
    expect(closeRes.success).toBe(true);

    jest.spyOn(pcEngine, 'toggleQuickSetting').mockResolvedValueOnce({ success: true, setting: 'wifi', state: 'off' });
    const qsRes = await defaultToolRouter.executeTool('pc_quick_settings', { setting: 'wifi', state: 'off' });
    expect(qsRes.success).toBe(true);

    jest.spyOn(pcEngine, 'searchAndPlayYouTube').mockResolvedValueOnce({ success: true, query: 'trending songs in tamil', message: 'Opened YouTube' });
    const ytRes = await defaultToolRouter.executeTool('pc_search_and_play', { query: 'trending songs in tamil', autoPlayIndex: 1 });
    expect(ytRes.success).toBe(true);
    expect(ytRes.data.query).toBe('trending songs in tamil');
  });
});

