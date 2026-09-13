/**
 * AURA Frontend — Audit Log Viewer Component
 * Source: docs/04-DESIGN-SYSTEM.md §5.5
 */

import React, { useState } from 'react';
import { AuditLogEntry } from '../../types/audit';
import { ScrollText, ChevronDown, ChevronUp, Clock, Tag } from 'lucide-react';

export const AuditLogViewer: React.FC<{ auditTrail?: AuditLogEntry[] }> = ({
  auditTrail = [],
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (auditTrail.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 mb-6 text-center text-gray-500">
        <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Audit trail is currently recording...</p>
      </div>
    );
  }

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('STARTED')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (action.includes('PASSED') || action.includes('COMPLETED') || action.includes('GRANTED')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (action.includes('FAILED') || action.includes('DENIED') || action.includes('REJECTED')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (action.includes('APPROVAL') || action.includes('FAILOVER')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 mb-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-white tracking-wide">
          Immutable Audit Trail
        </h2>
        <span className="text-xs text-gray-400 font-mono">
          ({auditTrail.length} records verified)
        </span>
      </div>

      <div className="space-y-2">
        {auditTrail.map((entry, idx) => {
          const isExpanded = expandedIndex === idx;
          const time = new Date(entry.timestamp).toLocaleTimeString();

          return (
            <div
              key={entry.id || idx}
              className="bg-[#0A0E17] border border-[#1F2937] rounded-xl p-3 text-xs font-mono transition-colors"
            >
              <div
                onClick={() => toggleExpand(idx)}
                className="flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {time}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-bold ${getActionColor(
                      entry.action
                    )}`}
                  >
                    <Tag className="w-3 h-3" />
                    {entry.action}
                  </span>
                  {entry.stepIndex !== null && entry.stepIndex !== undefined && (
                    <span className="text-gray-500 text-[11px]">
                      Step {entry.stepIndex + 1}
                    </span>
                  )}
                </div>

                <div className="text-gray-500 hover:text-white">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && entry.details && (
                <div className="mt-3 pt-2.5 border-t border-[#1F2937]">
                  <pre className="bg-[#111827] p-2.5 rounded text-gray-300 overflow-x-auto text-[11px]">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
