/**
 * AURA Frontend — Registered Tool Catalog Page
 * Source: docs/03-API-CONTRACT.md §6.8
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ToolDefinition } from '../types/tool';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Wrench, Code2 } from 'lucide-react';

export const Tools: React.FC = () => {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTools()
      .then((res) => setTools(res.tools))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Registered Tool Catalog
        </h1>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Authorized agent action space governed by the deterministic policy engine
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="Querying tool registry..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-blue-400">
                    <Wrench className="w-4 h-4" />
                    {tool.name}
                  </span>
                  <RiskBadge riskLevel={tool.riskLevel} size="sm" />
                </div>

                <p className="text-sm text-gray-300 mb-4">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1F2937] text-xs font-mono">
                <span className="text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-gray-400" /> Parameter Schema
                </span>
                <pre className="p-2.5 bg-[#0A0E17] border border-[#1F2937]/50 rounded-lg text-gray-300 text-[11px] overflow-x-auto">
                  {JSON.stringify(tool.parameters, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
