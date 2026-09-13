/**
 * Tests for compoundSplitter
 */

const { splitCompoundGoal } = require('../src/planner/compoundSplitter');

describe('compoundSplitter', () => {
  it('1. Returns single task for simple sentence', () => {
    expect(splitCompoundGoal('message abishek hi')).toEqual(['message abishek hi']);
  });

  it('2. Splits sequential goals using "then" and "and then"', () => {
    const compound = 'Open VS Code, then check my phone battery, and then set alarm for 7:00 am';
    const parts = splitCompoundGoal(compound);
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('Open VS Code');
    expect(parts[1]).toBe('check my phone battery');
    expect(parts[2]).toBe('set alarm for 7:00 am');
  });

  it('3. Splits imperative conjunctions using "and"', () => {
    const compound = 'Open Chrome and search for React docs';
    const parts = splitCompoundGoal(compound);
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe('Open Chrome');
    expect(parts[1]).toBe('search for React docs');
  });

  it('4. Expands greedy multi-open without connectors: "open whatsapp youtube calculator vs code and edge"', () => {
    const compound = 'open whatsapp youtube calculator vs code and edge';
    const parts = splitCompoundGoal(compound);
    expect(parts).toEqual([
      'open whatsapp',
      'open youtube',
      'open calculator',
      'open vs code',
      'open edge',
    ]);
  });

  it('5. Expands comma-separated multi-open: "open chrome, whatsapp, vscode, file explorer"', () => {
    const compound = 'open chrome, whatsapp, vscode, file explorer';
    const parts = splitCompoundGoal(compound);
    expect(parts).toEqual([
      'open chrome',
      'open whatsapp',
      'open vscode',
      'open file explorer',
    ]);
  });

  it('6. Expands multi-open with "and": "open edge and calculator and youtube"', () => {
    const compound = 'open edge and calculator and youtube';
    const parts = splitCompoundGoal(compound);
    expect(parts).toEqual([
      'open edge',
      'open calculator',
      'open youtube',
    ]);
  });

  it('7. Preserves compound action with search verb: "open WhatsApp and search for Kamal"', () => {
    const compound = 'open WhatsApp and search for Kamal';
    const parts = splitCompoundGoal(compound);
    expect(parts).toEqual(['open WhatsApp', 'search for Kamal']);
  });
});
