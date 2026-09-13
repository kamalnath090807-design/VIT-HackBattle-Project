/**
 * AURA Frontend — Plan Viewer Component
 * Source: docs/04-DESIGN-SYSTEM.md §5.3
 */

import React from 'react';
import { TaskStep } from '../../types/step';
import { StepItem } from './StepItem';
import { ListOrdered } from 'lucide-react';

interface PlanViewerProps {
  steps?: TaskStep[];
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ steps = [] }) => {
  if (steps.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 mb-6 text-center text-gray-400">
        <p className="text-sm">No execution plan steps generated yet.</p>
      </div>
    );
  }

  const completedCount = steps.filter((s) => s.status === 'COMPLETED').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 mb-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">
            Autonomous Execution Plan
          </h2>
          <span className="text-xs text-gray-400 font-mono">
            ({completedCount}/{steps.length} completed)
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 w-full sm:w-48">
          <div className="flex-1 bg-[#0A0E17] h-2 rounded-full overflow-hidden border border-[#1F2937]">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-blue-400 font-bold">
            {progressPercent}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <StepItem key={step.stepIndex} step={step} />
        ))}
      </div>
    </div>
  );
};
