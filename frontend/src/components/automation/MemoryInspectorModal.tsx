import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { X, Database, Plus, CheckCircle, Award, DollarSign, BookOpen, SunMedium } from 'lucide-react';

interface MemoryInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryInspectorModal: React.FC<MemoryInspectorModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<any>(null);
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New fact form state
  const [newKey, setNewKey] = useState('');
  const [newFact, setNewFact] = useState('');
  const [addingFact, setAddingFact] = useState(false);

  // New expense form state
  const [expenseAmt, setExpenseAmt] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCat, setExpenseCat] = useState('general');
  const [addingExpense, setAddingExpense] = useState(false);

  const loadMemoryData = async () => {
    try {
      setLoading(true);
      const [profRes, briefRes] = await Promise.allSettled([
        api.getMemoryProfile(),
        api.getProductivityBrief(),
      ]);

      if (profRes.status === 'fulfilled') {
        setProfile(profRes.value);
      }
      if (briefRes.status === 'fulfilled') {
        setBrief(briefRes.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMemoryData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newFact.trim()) return;
    try {
      setAddingFact(true);
      await api.storeFact(newKey.trim(), newFact.trim());
      setNewKey('');
      setNewFact('');
      await loadMemoryData();
    } catch (err) {
      console.error('Failed to store fact:', err);
    } finally {
      setAddingFact(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmt);
    if (!amt || !expenseDesc.trim()) return;
    try {
      setAddingExpense(true);
      await api.logExpense(amt, expenseDesc.trim(), expenseCat);
      setExpenseAmt('');
      setExpenseDesc('');
      await loadMemoryData();
    } catch (err) {
      console.error('Failed to log expense:', err);
    } finally {
      setAddingExpense(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937] bg-[#0B0F17]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AURA Memory & Productivity Ledger</h2>
              <p className="text-xs text-gray-400 font-mono">
                data/memory.json • {profile?.factsCount || 0} discrete facts learned
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1F2937] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-300">
          {loading ? (
            <div className="py-12 text-center text-gray-400 font-mono">Loading AURA memory profile...</div>
          ) : (
            <>
              {/* Daily Brief Banner */}
              {brief?.summary && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/30 to-purple-900/20 border border-indigo-500/30">
                  <div className="flex items-center gap-2 mb-1.5 text-indigo-300 font-bold text-xs uppercase tracking-wider font-mono">
                    <SunMedium className="w-4 h-4 text-amber-400" />
                    Automated Daily Briefing
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed font-mono">{brief.summary}</p>
                </div>
              )}

              {/* User Profile & Habit Streaks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Card */}
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1F2937]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase font-mono mb-3">Operator Profile</h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-[#1F2937] pb-1.5">
                      <span className="text-gray-500">Name:</span>
                      <span className="text-white font-bold">{profile?.user?.name || 'Abishek'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1F2937] pb-1.5">
                      <span className="text-gray-500">Role:</span>
                      <span className="text-white">{profile?.user?.occupation || 'Lead Engineer'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1F2937] pb-1.5">
                      <span className="text-gray-500">Total Interactions:</span>
                      <span className="text-indigo-400">{profile?.patterns?.totalTurns || 12} commands</span>
                    </div>
                  </div>
                </div>

                {/* Habits Streak Card */}
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1F2937]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase font-mono">Habits & Streaks</h3>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    {(profile?.user?.habits || [
                      { habit: 'Morning Gym', streakDays: 8 },
                      { habit: 'HackBattle Sync', streakDays: 2 },
                    ]).map((h: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between border-b border-[#1F2937] pb-1.5">
                        <span className="flex items-center gap-1.5 text-gray-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          {h.habit}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          🔥 {h.streakDays || 1} day streak
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expense Ledger */}
              <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1F2937]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase font-mono flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Productivity Expense Ledger
                  </h3>
                </div>

                <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={expenseAmt}
                    onChange={(e) => setExpenseAmt(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Description (e.g. Coffee)"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={expenseCat}
                    onChange={(e) => setExpenseCat(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="general">General</option>
                    <option value="food">Food</option>
                    <option value="travel">Travel</option>
                    <option value="cloud">Cloud</option>
                  </select>
                  <button
                    type="submit"
                    disabled={addingExpense}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log
                  </button>
                </form>
              </div>

              {/* Discrete Facts & Preferences */}
              <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1F2937]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase font-mono flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    Remembered Facts & Preferences
                  </h3>
                </div>

                {/* Add Fact Form */}
                <form onSubmit={handleAddFact} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Key (e.g. editor)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Fact (e.g. Uses VS Code Dark Modern)"
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={addingFact}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Store Fact
                  </button>
                </form>

                {/* Facts List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(profile?.recentFacts || []).map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#111827] border border-[#1F2937] text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-indigo-400 font-bold">{f.key}:</span>
                        <span className="text-gray-200 truncate">{f.fact}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                        {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
