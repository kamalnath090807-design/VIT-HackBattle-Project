/**
 * AURA Frontend — Operations Dashboard Page
 * Source: docs/04-DESIGN-SYSTEM.md §4.1
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { TaskSummary } from '../types/task';
import { GoalInput } from '../components/task/GoalInput';
import { TaskCard } from '../components/task/TaskCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { SystemTelemetryBar } from '../components/automation/SystemTelemetryBar';
import { AutomationModeSelector, AutomationMode } from '../components/automation/AutomationModeSelector';
import { MemoryInspectorModal } from '../components/automation/MemoryInspectorModal';
import { Activity, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<{ status: string; aiProvider: string } | null>(null);
  const [goalText, setGoalText] = useState('');
  const [automationMode, setAutomationMode] = useState<AutomationMode>('unified');
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, healthRes] = await Promise.allSettled([
        api.listTasks({ limit: 6 }),
        api.getHealth(),
      ]);

      if (tasksRes.status === 'fulfilled') {
        setTasks(tasksRes.value.tasks);
      }
      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (goal: string) => {
    const res = await api.createTask(goal);
    navigate(`/tasks/${res.task.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Live System & Mobile Telemetry Bar */}
      <SystemTelemetryBar onOpenMemoryModal={() => setIsMemoryModalOpen(true)} />

      {/* Hero Goal Input */}
      <GoalInput
        value={goalText}
        onValueChange={setGoalText}
        onSubmit={handleCreateTask}
      />

      {/* Automation Domain Mode Selector & Command Chips */}
      <AutomationModeSelector
        currentMode={automationMode}
        onModeChange={setAutomationMode}
        onSelectPrompt={(prompt) => setGoalText(prompt)}
      />

      {/* Memory Inspector Modal */}
      <MemoryInspectorModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />

      {/* System Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-mono uppercase">AI Provider</span>
            <p className="text-sm font-bold text-white capitalize">
              {health?.aiProvider || 'Groq Cloud (Primary)'}
            </p>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-mono uppercase">Safety Boundary</span>
            <p className="text-sm font-bold text-white">Deterministic Policy</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-mono uppercase">Backend Health</span>
            <p className="text-sm font-bold text-white">
              {health?.status === 'ok' ? 'Operational' : 'Online'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Tasks List */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Recent Operations</h2>
            <span className="text-xs text-gray-400 font-mono">({tasks.length})</span>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1F2937] text-gray-400 hover:text-white border border-[#1F2937] text-xs font-mono transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading recent tasks..." />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks executed yet"
            description="Submit a goal above to watch AURA plan, execute tools, and verify results."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
