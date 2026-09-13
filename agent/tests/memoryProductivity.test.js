/**
 * Tests for MemoryEngine and ProductivityEngine
 */

const { MemoryEngine } = require('../src/automation/memoryEngine');
const { ProductivityEngine } = require('../src/automation/productivityEngine');
const path = require('path');
const fs = require('fs');

describe('MemoryEngine & ProductivityEngine', () => {
  const testMemoryFile = path.resolve(__dirname, 'test_memory.json');
  let memory;
  let productivity;

  beforeEach(() => {
    if (fs.existsSync(testMemoryFile)) {
      fs.unlinkSync(testMemoryFile);
    }
    memory = new MemoryEngine(testMemoryFile);
    productivity = new ProductivityEngine(memory);
  });

  afterAll(() => {
    if (fs.existsSync(testMemoryFile)) {
      fs.unlinkSync(testMemoryFile);
    }
  });

  it('1. Learns facts from natural language input with blacklist protection', () => {
    // Should NOT store blacklisted adjectives as names
    const negative = memory.learnFromInput('I am not feeling well');
    expect(negative).toBeNull();
    expect(memory.data.user.name).toBe('Abishek');

    // Should store valid name
    const positiveName = memory.learnFromInput('My name is Kamal');
    expect(positiveName).toEqual({ type: 'name', value: 'Kamal' });
    expect(memory.data.user.name).toBe('Kamal');

    // Should store favorite IDE
    const fav = memory.learnFromInput('My favorite IDE is VS Code');
    expect(fav).toEqual({ type: 'favorite', category: 'ide', value: 'VS Code' });
    expect(memory.data.user.favorites.ide).toBe('VS Code');

    // Should store explicit fact
    const fact = memory.learnFromInput('Remember that the meeting is at 11 AM');
    expect(fact.type).toBe('fact');
    expect(fact.fact).toBe('the meeting is at 11 AM');
  });

  it('2. Builds concise AI context containing known profile and facts', () => {
    memory.storeFact('project', 'Working on AURA Hackathon');
    const context = memory.buildAIContext();
    expect(context).toContain('[AURA Memory Context]');
    expect(context).toContain('Working on AURA Hackathon');
  });

  it('3. Logs expenses and computes monthly sums', () => {
    const r1 = productivity.logExpense(350, 'Dinner', 'food');
    expect(r1.success).toBe(true);
    expect(r1.entry.amount).toBe(350);

    const r2 = productivity.logExpense(150, 'Cab', 'travel');
    expect(r2.monthlyTotal).toBe(500);
  });

  it('4. Tracks daily habits and streaks', () => {
    productivity.addHabit('Read Documentation', '08:00');
    const habits = memory.data.user.routine.habits;
    expect(habits.some((h) => h.name === 'Read Documentation')).toBe(true);

    const result = productivity.markHabitDone('Read Documentation');
    expect(result.success).toBe(true);
    expect(result.habit.streak).toBe(1);
    expect(result.habit.completedToday).toBe(true);
  });

  it('5. Generates structured daily briefing', () => {
    productivity.addNote('Review pull requests', 'Dev Task', true);
    const brief = productivity.generateDailyBrief();
    expect(brief.greeting).toBeDefined();
    expect(brief.habitsSummary).toBeDefined();
    expect(brief.expenses).toBeDefined();
    expect(brief.pinnedNotes).toContain('Review pull requests');
  });
});
