/**
 * AURA Frontend — Goal Input Component
 * Source: docs/04-DESIGN-SYSTEM.md §5.1
 */

import React, { useState } from 'react';
import { Send, Sparkles, Terminal } from 'lucide-react';

interface GoalInputProps {
  onSubmit: (goal: string) => Promise<void>;
  disabled?: boolean;
  value?: string;
  onValueChange?: (val: string) => void;
}

export const GoalInput: React.FC<GoalInputProps> = ({
  onSubmit,
  disabled = false,
  value: controlledValue,
  onValueChange,
}) => {
  const [internalGoal, setInternalGoal] = useState('');
  const goal = controlledValue !== undefined ? controlledValue : internalGoal;
  const setGoal = (val: string) => {
    if (onValueChange) onValueChange(val);
    else setInternalGoal(val);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleGoals = [
    'Check my schedule for tomorrow and schedule a team sync meeting at 11:00 AM',
    'Check the current weather in Chennai and summarize conditions',
    'Calculate (125 * 45) / 5 and verify the mathematical accuracy',
    'Create a tracking issue for critical authentication timeout',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = goal.trim();
    if (!trimmed || isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSubmit(trimmed);
      setGoal('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch task. Please verify backend connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-3 text-blue-400 font-mono text-xs uppercase tracking-wider">
        <Terminal className="w-4 h-4" />
        Autonomous Goal Dispatch
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
        What would you like AURA to accomplish?
      </h2>
      <p className="text-sm text-gray-400 mb-5">
        Enter a multi-step objective. AURA will plan steps, inspect tool risk policies, execute real tools, and verify the final outcome.
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-mono">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value.slice(0, 1000))}
            placeholder="E.g., Check weather in Chennai and compute humidity delta..."
            rows={3}
            disabled={disabled || isSubmitting}
            className="w-full bg-[#0A0E17] border border-[#1F2937] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-4 text-sm text-white placeholder-gray-500 resize-none transition-all outline-none font-sans"
          />
          <div className="absolute bottom-3 right-3 text-[11px] text-gray-500 font-mono">
            {goal.length}/1000
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Prompts:
            </span>
            {sampleGoals.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setGoal(sample)}
                className="text-xs bg-[#1F2937]/50 hover:bg-[#1F2937] text-gray-300 px-2.5 py-1 rounded-md border border-[#1F2937] transition-colors truncate max-w-[200px]"
                title={sample}
              >
                {sample.slice(0, 24)}...
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!goal.trim() || disabled || isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-blue-600/20 disabled:shadow-none transition-all"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Dispatching...' : 'Execute Task'}
          </button>
        </div>
      </form>
    </div>
  );
};
