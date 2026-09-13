/**
 * AURA Agent — Productivity Engines (Expenses, Habits, Notes, Daily Briefing)
 *
 * Source: Master PC & Mobile Automation Specification (Part 8 & Critical Enhancements)
 */

const { memoryEngine } = require('./memoryEngine');

class ProductivityEngine {
  constructor(memEngine = memoryEngine) {
    this.memory = memEngine;
  }

  /**
   * Log an expense entry.
   * @param {number} amount
   * @param {string} description
   * @param {string} [category='general']
   */
  logExpense(amount, description, category = 'general') {
    const numAmount = parseFloat(amount) || 0;
    const entry = {
      id: `exp-${Date.now()}`,
      amount: numAmount,
      description: description || 'Expense',
      category: category.toLowerCase(),
      timestamp: new Date().toISOString(),
    };

    if (!Array.isArray(this.memory.data.expenses)) {
      this.memory.data.expenses = [];
    }

    this.memory.data.expenses.push(entry);
    this.memory.storeFact(`expense_${entry.id}`, `Spent ₹${numAmount} on ${entry.description}`);
    this.memory.saveDebounced();

    return {
      success: true,
      entry,
      monthlyTotal: this.getMonthlyTotal(),
    };
  }

  /**
   * Compute monthly expense total.
   */
  getMonthlyTotal() {
    const expenses = this.memory.data.expenses || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter((e) => {
        const d = new Date(e.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  /**
   * Add a tracked habit.
   * @param {string} name
   * @param {string} time
   */
  addHabit(name, time) {
    if (!name) throw new Error('Habit name is required');
    const routine = this.memory.data.user.routine;
    if (!Array.isArray(routine.habits)) {
      routine.habits = [];
    }

    const existing = routine.habits.find((h) => h.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.time = time || existing.time;
    } else {
      routine.habits.push({
        name,
        time: time || '09:00',
        streak: 0,
        completedToday: false,
      });
    }

    this.memory.storeFact(`habit_${name.toLowerCase()}`, `Daily habit: ${name} at ${time || '09:00'}`);
    this.memory.saveDebounced();

    return { success: true, habits: routine.habits };
  }

  /**
   * Mark habit as completed for today.
   * @param {string} name
   */
  markHabitDone(name) {
    const habits = this.memory.data.user.routine.habits || [];
    const habit = habits.find((h) => h.name.toLowerCase().includes(name.toLowerCase()));
    if (!habit) {
      return { success: false, error: `Habit "${name}" not found` };
    }

    habit.completedToday = true;
    habit.streak = (habit.streak || 0) + 1;
    this.memory.saveDebounced();

    return {
      success: true,
      habit,
      message: `Completed "${habit.name}"! Current streak: ${habit.streak} days.`,
    };
  }

  /**
   * Add a persistent note.
   * @param {string} content
   * @param {string} [title]
   * @param {boolean} [pinned=false]
   */
  addNote(content, title = 'Quick Note', pinned = false) {
    if (!content) throw new Error('Note content is required');
    if (!Array.isArray(this.memory.data.notes)) {
      this.memory.data.notes = [];
    }

    const note = {
      id: `note-${Date.now()}`,
      title,
      content,
      pinned: Boolean(pinned),
      timestamp: new Date().toISOString(),
    };

    this.memory.data.notes.push(note);
    this.memory.saveDebounced();

    return { success: true, note };
  }

  /**
   * Generate an aggregated Daily Briefing.
   * Combines user profile, active habits, expenses, and notes.
   */
  generateDailyBrief() {
    const user = this.memory.data.user || {};
    const routine = user.routine || {};
    const habits = routine.habits || [];
    const monthlyExpenses = this.getMonthlyTotal();
    const notes = (this.memory.data.notes || []).filter((n) => n.pinned);

    const completedHabits = habits.filter((h) => h.completedToday).length;
    const pendingHabits = habits.filter((h) => !h.completedToday);

    const brief = {
      greeting: `Good day, ${user.name || 'Operator'}! Here is your AURA Daily Briefing:`,
      userProfile: {
        name: user.name,
        role: user.occupation,
      },
      habitsSummary: {
        total: habits.length,
        completed: completedHabits,
        pending: pendingHabits.map((h) => `${h.name} (${h.time})`),
      },
      expenses: {
        monthlyTotal: monthlyExpenses,
      },
      pinnedNotes: notes.map((n) => n.content),
      generatedAt: new Date().toISOString(),
    };

    brief.summary = `${brief.greeting} ${completedHabits}/${habits.length} habits completed. ₹${monthlyExpenses} spent this month. ${notes.length} pinned notes.`;

    return brief;
  }
}

const productivityEngine = new ProductivityEngine();

module.exports = {
  ProductivityEngine,
  productivityEngine,
};
