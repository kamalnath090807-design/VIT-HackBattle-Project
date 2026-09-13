/**
 * AURA Frontend — Step Item Component
 * Source: docs/04-DESIGN-SYSTEM.md §5.3
 */

import React, { useState } from 'react';
import { TaskStep } from '../../types/step';
import { RiskBadge } from '../common/RiskBadge';
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Wrench,
  Code2,
} from 'lucide-react';

export const StepItem: React.FC<{ step: TaskStep }> = ({ step }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (step.status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'EXECUTING':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'AWAITING_APPROVAL':
        return <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />;
      case 'FAILED':
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-[#0A0E17] border border-[#1F2937] rounded-xl p-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">{getStatusIcon()}</div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-gray-400">
                STEP {step.stepIndex + 1}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20">
                <Wrench className="w-3 h-3" />
                {step.tool}
              </span>
              <RiskBadge riskLevel={step.riskLevel} size="sm" />
            </div>

            <p className="text-sm font-medium text-gray-200">
              {step.description}
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#1F2937] transition-colors"
          title="Toggle execution payload"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-[#1F2937] text-xs space-y-3 font-mono">
          {step.params && Object.keys(step.params).length > 0 && (
            <div>
              <span className="text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Code2 className="w-3 h-3" /> Tool Parameters
              </span>
              <pre className="bg-[#111827] p-2.5 rounded-lg text-gray-300 overflow-x-auto border border-[#1F2937]/50">
                {JSON.stringify(step.params, null, 2)}
              </pre>
            </div>
          )}

          {step.result && (
            <div>
              <span className="text-emerald-400 uppercase tracking-wider block mb-1">
                Execution Output / Evidence
              </span>
              <pre className="bg-[#111827] p-2.5 rounded-lg text-emerald-300/90 overflow-x-auto border border-emerald-500/20">
                {JSON.stringify(step.result, null, 2)}
              </pre>
            </div>
          )}

          {step.error && (
            <div>
              <span className="text-rose-400 uppercase tracking-wider block mb-1">
                Step Error
              </span>
              <pre className="bg-rose-950/30 p-2.5 rounded-lg text-rose-300 overflow-x-auto border border-rose-500/30">
                {step.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
