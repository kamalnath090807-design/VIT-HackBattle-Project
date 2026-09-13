/**
 * AURA Frontend — Task Card Component
 * Source: docs/04-DESIGN-SYSTEM.md §5.2
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { TaskSummary } from '../../types/task';
import { StatusBadge } from '../common/StatusBadge';
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

export const TaskCard: React.FC<{ task: TaskSummary }> = ({ task }) => {
  const formattedDate = new Date(task.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-[#111827] border border-[#1F2937] hover:border-[#374151] rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-blue-950/20 group flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <StatusBadge status={task.status} size="sm" />
          <span className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
            <Clock className="w-3 h-3" />
            {formattedDate}
          </span>
        </div>

        <h3 className="text-base font-semibold text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
          {task.goal}
        </h3>
      </div>

      <div className="pt-4 border-t border-[#1F2937]/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>{task.stepCount !== undefined ? `${task.stepCount} Steps Planned` : 'Autonomous Plan'}</span>
        </div>

        <Link
          to={`/tasks/${task.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
