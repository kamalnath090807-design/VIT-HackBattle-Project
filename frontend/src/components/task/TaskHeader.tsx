/**
 * AURA Frontend — Task Header Component
 */

import React from 'react';
import { Task } from '../../types/task';
import { StatusBadge } from '../common/StatusBadge';
import { Copy, Check, Ban, Clock } from 'lucide-react';

interface TaskHeaderProps {
  task: Task;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({
  task,
  onCancel,
  isCancelling = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(task.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTerminal = ['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED'].includes(
    task.status
  );

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 mb-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
        <div className="flex items-center gap-3">
          <StatusBadge status={task.status} size="md" />
          <button
            onClick={copyId}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0A0E17] border border-[#1F2937] text-xs font-mono text-gray-400 hover:text-white transition-colors"
            title="Click to copy task ID"
          >
            <span>{task.id.slice(0, 8)}...{task.id.slice(-4)}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Created:{' '}
            {(() => {
              const rawDate = task.createdAt || (task as any).created_at;
              if (!rawDate) return 'Just now';
              const parsed = new Date(rawDate);
              return isNaN(parsed.getTime()) ? 'Just now' : parsed.toLocaleTimeString();
            })()}
          </span>
          {!isTerminal && onCancel && (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              {isCancelling ? 'Cancelling...' : 'Cancel Task'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {task.goal}
        </h1>
      </div>
    </div>
  );
};
