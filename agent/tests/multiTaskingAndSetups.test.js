/**
 * Tests for AURA Multi-Command Multitasking Engine & Workspace Setups
 */
'use strict';

const { tryExpandMultiOpen, splitTasks } = require('../../core/taskSplitter');
const { formatAppList, executeMulti } = require('../../core/multiExecutor');
const { findSetup, loadSetups, runSetup } = require('../../core/setupEngine');
const appLauncher = require('../../core/appLauncher');
const { defaultPlanner } = require('../src/planner/planner');

describe('AURA Multitasking Engine & Workspace Setups', () => {
  beforeEach(() => {
    jest.spyOn(appLauncher, 'launchApp').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('1. Task Splitter & Greedy Lookahead Tokenizer', () => {
    it('handles pure space-separated app list without connectors', () => {
      const input = 'open whatsapp youtube calculator vs code and edge';
      const expanded = tryExpandMultiOpen(input);
      expect(expanded).toEqual([
        'open whatsapp',
        'open youtube',
        'open calculator',
        'open vs code',
        'open edge',
      ]);
    });

    it('handles comma-separated app lists', () => {
      const input = 'open chrome, whatsapp, vscode, file explorer';
      const expanded = tryExpandMultiOpen(input);
      expect(expanded).toEqual([
        'open chrome',
        'open whatsapp',
        'open vscode',
        'open file explorer',
      ]);
    });

    it('handles chained "and" app lists', () => {
      const input = 'open edge and calculator and youtube';
      const expanded = tryExpandMultiOpen(input);
      expect(expanded).toEqual([
        'open edge',
        'open calculator',
        'open youtube',
      ]);
    });

    it('Stage 1 Atomic Intent Filter: returns null for compound commands with search/play/message verbs', () => {
      expect(tryExpandMultiOpen('open whatsapp and search for Kamal')).toBeNull();
      expect(tryExpandMultiOpen('open youtube and search for tamil songs')).toBeNull();
      expect(tryExpandMultiOpen('open chrome and play music')).toBeNull();
      expect(tryExpandMultiOpen('open whatsapp and message Abishek')).toBeNull();
    });

    it('splitTasks splits compound commands into distinct steps if not pure multi-open', () => {
      const tasks = splitTasks('open chrome and then open youtube');
      expect(tasks).toEqual(['open chrome', 'open youtube']);
    });
  });

  describe('2. MultiExecutor & Natural Confirmation Formatter', () => {
    it('formats single app name with proper capitalization', () => {
      expect(formatAppList(['whatsapp'])).toBe('WhatsApp');
    });

    it('formats two apps with "and"', () => {
      expect(formatAppList(['whatsapp', 'youtube'])).toBe('WhatsApp and YouTube');
    });

    it('formats 3+ apps with Oxford comma and special capitalization', () => {
      const list = ['whatsapp', 'youtube', 'calculator', 'vs code', 'chatgpt'];
      expect(formatAppList(list)).toBe('WhatsApp, YouTube, Calculator, VS Code, and ChatGPT');
    });

    it('executeMulti launches apps sequentially with delay and returns unified confirmation', async () => {
      const mockSpeak = jest.fn();
      const mockStep = jest.fn();

      const result = await executeMulti('open whatsapp and youtube', {
        speak: mockSpeak,
        onStep: mockStep,
        delayMs: 10,
      });

      expect(mockStep).toHaveBeenCalledTimes(2);
      expect(mockSpeak).toHaveBeenCalledWith('Opened WhatsApp and YouTube.');
      expect(result).toBe('Opened WhatsApp and YouTube.');
    });
  });

  describe('3. Workspace Setups Engine (Setup 1 & Setup 2)', () => {
    it('loads setups configuration successfully', () => {
      const setups = loadSetups();
      expect(setups['setup 1']).toBeDefined();
      expect(setups['setup 2']).toBeDefined();
      expect(setups['setup 1'].apps).toEqual(['chrome', 'whatsapp', 'vs code', 'file explorer']);
      expect(setups['setup 2'].apps).toEqual(['antigravity', 'file explorer', 'chatgpt', 'outlook', 'linkedin']);
    });

    it('matches Setup 1 by direct name and natural aliases', () => {
      expect(findSetup('setup 1')?.data.name).toBe('Dev & Communication Setup');
      expect(findSetup('open setup 1')?.data.name).toBe('Dev & Communication Setup');
      expect(findSetup('open my setup 1')?.data.name).toBe('Dev & Communication Setup');
      expect(findSetup('first setup')?.data.name).toBe('Dev & Communication Setup');
      expect(findSetup('dev setup')?.data.name).toBe('Dev & Communication Setup');
    });

    it('matches Setup 2 by direct name and natural aliases', () => {
      expect(findSetup('setup 2')?.data.name).toBe('Work & AI Setup');
      expect(findSetup('open setup 2')?.data.name).toBe('Work & AI Setup');
      expect(findSetup('open my setup 2')?.data.name).toBe('Work & AI Setup');
      expect(findSetup('second setup')?.data.name).toBe('Work & AI Setup');
      expect(findSetup('work setup')?.data.name).toBe('Work & AI Setup');
      expect(findSetup('ai setup')?.data.name).toBe('Work & AI Setup');
    });

    it('runSetup executes all setup apps with stagger and provides feedback', async () => {
      const mockSpeak = jest.fn();
      const mockStep = jest.fn();
      const setupData = {
        name: 'Test Setup',
        apps: ['calculator', 'notepad'],
      };

      const result = await runSetup(setupData, {
        speak: mockSpeak,
        onStep: mockStep,
        delayMs: 10,
      });

      expect(mockSpeak).toHaveBeenNthCalledWith(1, 'Starting Test Setup.');
      expect(mockStep).toHaveBeenCalledTimes(2);
      expect(mockSpeak).toHaveBeenNthCalledWith(2, 'Test Setup is ready.');
      expect(result).toBe('Test Setup is ready.');
    });
  });

  describe('4. End-to-End Planner Integration', () => {
    it('generates multi-step plan for greedy multi-app launch', async () => {
      const plan = await defaultPlanner.plan({
        taskId: 'test-multi-001',
        goal: 'open whatsapp youtube calculator vs code and edge',
        target: 'pc',
      });

      expect(plan.steps.length).toBe(5);
      expect(plan.steps.every((s) => s.tool === 'pc_launch_app')).toBe(true);
      expect(plan.steps[0].parameters.appName).toBe('whatsapp');
      expect(plan.steps[1].parameters.appName).toBe('youtube');
      expect(plan.steps[2].parameters.appName).toBe('calculator');
      expect(plan.steps[3].parameters.appName).toBe('vs code');
      expect(plan.steps[4].parameters.appName).toBe('edge');
    });

    it('generates multi-step plan for Setup 1', async () => {
      const plan = await defaultPlanner.plan({
        taskId: 'test-setup1-001',
        goal: 'open setup 1',
        target: 'pc',
      });

      expect(plan.setupName).toBe('Dev & Communication Setup');
      expect(plan.steps.length).toBe(4);
      expect(plan.steps.map((s) => s.parameters.appName)).toEqual([
        'chrome',
        'whatsapp',
        'vs code',
        'file explorer',
      ]);
    });

    it('generates multi-step plan for Setup 2', async () => {
      const plan = await defaultPlanner.plan({
        taskId: 'test-setup2-001',
        goal: 'open setup 2',
        target: 'pc',
      });

      expect(plan.setupName).toBe('Work & AI Setup');
      expect(plan.steps.length).toBe(5);
      expect(plan.steps.map((s) => s.parameters.appName)).toEqual([
        'antigravity',
        'file explorer',
        'chatgpt',
        'outlook',
        'linkedin',
      ]);
    });
  });
});
