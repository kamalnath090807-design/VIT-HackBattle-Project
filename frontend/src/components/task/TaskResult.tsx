/**
 * AURA Frontend — Task Result & Evidence Component
 */

import React from 'react';
import { TaskResult as TaskResultType } from '../../types/task';
import { CheckCircle, ShieldCheck, Database } from 'lucide-react';

export const TaskResult: React.FC<{ result?: TaskResultType | null }> = ({ result }) => {
  if (!result) return null;

  return (
    <div className="bg-[#111827] border-2 border-emerald-500/40 rounded-2xl p-6 mb-6 shadow-2xl shadow-emerald-500/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Verified Execution Outcome
            {result.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Outcome verified by AURA Verifier against initial goal criteria
          </p>
        </div>
      </div>

      <div className="bg-[#0A0E17] border border-[#1F2937] rounded-xl p-4 mb-4">
        <p className="text-sm font-medium text-gray-200 leading-relaxed">
          {result.summary}
        </p>
      </div>

      {result.evidence && Object.keys(result.evidence).length > 0 && (
        <div>
          <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" /> Supporting Concrete Evidence
          </h4>
          <pre className="bg-[#0A0E17] p-3 rounded-xl border border-[#1F2937] text-xs font-mono text-emerald-300/90 overflow-x-auto">
            {JSON.stringify(result.evidence, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
