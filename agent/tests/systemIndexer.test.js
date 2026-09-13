/**
 * AURA Agent Tests — Universal System Indexer & File/App Opener
 */

const { SystemIndexer, systemIndexer } = require('../src/automation/systemIndexer');
const { getTool } = require('../src/tools/toolRegistry');
const { ToolRouter } = require('../src/tools/toolRouter');

describe('Universal System Indexer', () => {
  let indexer;

  beforeEach(() => {
    indexer = new SystemIndexer();
  });

  test('indexes system applications and includes common developer utilities', () => {
    expect(indexer.appIndex.size).toBeGreaterThan(10);
    const vscode = indexer.resolveApp('code');
    expect(vscode).toBeDefined();
    expect(vscode.name).toMatch(/Visual Studio Code/i);

    const notepad = indexer.resolveApp('notepad');
    expect(notepad).toBeDefined();
    expect(notepad.target).toMatch(/notepad/i);

    const antigravity = indexer.resolveApp('antigravity');
    expect(antigravity).toBeDefined();
  });

  test('resolves file and folder paths fuzzy across user workspaces', () => {
    const projectPath = indexer.resolvePath('VIT-HackBattle-Project');
    expect(projectPath).toBeDefined();
    expect(typeof projectPath).toBe('string');
  });

  test('determines editor preferences: vscode default, notepad, and antigravity', async () => {
    // Test that openFileOrFolder correctly parses editor options
    const target = 'package.json';

    // VS Code default
    const resDefault = await indexer.openFileOrFolder(target, 'vscode');
    expect(resDefault.success).toBe(true);
    expect(resDefault.editor).toBe('VS Code');

    // Notepad
    const resNotepad = await indexer.openFileOrFolder(target, 'notepad');
    expect(resNotepad.success).toBe(true);
    expect(resNotepad.editor).toBe('Notepad');

    // Antigravity IDE
    const resAntigravity = await indexer.openFileOrFolder(target, 'antigravity');
    expect(resAntigravity.success).toBe(true);
    expect(resAntigravity.editor).toBe('Antigravity IDE');
  });

  test('registers tools in catalog with valid parameter schemas', () => {
    const openTool = getTool('pc_open_file_or_folder');
    expect(openTool).toBeDefined();
    expect(openTool.parameters.target.required).toBe(true);

    const launchTool = getTool('pc_launch_app');
    expect(launchTool).toBeDefined();
    expect(launchTool.parameters.appName.required).toBe(true);

    const searchTool = getTool('pc_search_system');
    expect(searchTool).toBeDefined();
    expect(searchTool.parameters.query.required).toBe(true);
  });

  test('routes pc_open_file_or_folder through ToolRouter successfully', async () => {
    const router = new ToolRouter();
    const res = await router.executeTool('pc_open_file_or_folder', {
      target: 'package.json',
      editor: 'vscode',
    });
    expect(res.success).toBe(true);
    expect(res.data.editor).toBe('VS Code');
  });

  test('routes pc_search_system through ToolRouter successfully', async () => {
    const router = new ToolRouter();
    const res = await router.executeTool('pc_search_system', {
      query: 'code',
      category: 'all',
    });
    expect(res.success).toBe(true);
    expect(res.data.results.length).toBeGreaterThan(0);
  });
});
