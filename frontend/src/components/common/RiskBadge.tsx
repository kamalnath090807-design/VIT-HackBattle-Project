/**
 * AURA Frontend — Risk Level Badge Component
 * Source: docs/04-DESIGN-SYSTEM.md §5.7, docs/08-SECURITY.md §4
 */

import React from 'react';
import { RiskLevel } from '../../types/step';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface RiskBadgeProps {
  riskLevel: RiskLevel;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ riskLevel, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (riskLevel) {
    case 'LOW':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          LOW RISK
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          MEDIUM
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          HIGH RISK
        </span>
      );
    case 'DISALLOWED':
      return (
        <span className={`inline-flex items-center gap-1 font-bold rounded-md bg-red-950 text-red-400 border border-red-800 ${sizeClasses}`}>
          <ShieldX className="w-3.5 h-3.5" />
          PROHIBITED
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-md bg-gray-500/10 text-gray-400 ${sizeClasses}`}>
          {riskLevel}
        </span>
      );
  }
};
