/**
 * AURA Frontend — Task History Page
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TaskSummary } from '../types/task';
import { TaskCard } from '../components/task/TaskCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Filter, RefreshCw } from 'lucide-react';

export const TaskHistory: React.FC = () => {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const statusOptions: { label: string; value: string }[] = [
    { label: 'All Operations', value: '' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Executing / Active', value: 'EXECUTING' },
    { label: 'Awaiting Approval', value: 'AWAITING_APPROVAL' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.listTasks({
        status: statusFilter || undefined,
        limit: 50,
      });
      setTasks(res.tasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Operation History
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Historical audit records and task execution logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-200 outline-none font-mono cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#111827]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching operation history..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No records match this filter"
          description="Try selecting a different status or create a new operation from the dashboard."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
