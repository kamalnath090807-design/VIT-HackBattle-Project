/**
 * AURA Frontend — Status Badge Component
 * Source: docs/04-DESIGN-SYSTEM.md §5.6
 */

import React from 'react';
import { TaskStatus } from '../../types/task';
import {
  Clock,
  Loader2,
  AlertTriangle,
  Play,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Slash,
} from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide';

  switch (status) {
    case 'QUEUED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5" />
          QUEUED
        </span>
      );
    case 'PLANNING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 ${sizeClasses}`}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          PLANNING
        </span>
      );
    case 'AWAITING_APPROVAL':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          AWAITING APPROVAL
        </span>
      );
    case 'EXECUTING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 ${sizeClasses}`}>
          <Play className="w-3.5 h-3.5 fill-current" />
          EXECUTING
        </span>
      );
    case 'OBSERVING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 ${sizeClasses}`}>
          <Eye className="w-3.5 h-3.5" />
          OBSERVING
        </span>
      );
    case 'REPLANNING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 ${sizeClasses}`}>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          REPLANNING
        </span>
      );
    case 'VERIFYING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          VERIFYING
        </span>
      );
    case 'COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          COMPLETED
        </span>
      );
    case 'PARTIALLY_COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          PARTIAL
        </span>
      );
    case 'FAILED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5" />
          FAILED
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/30 ${sizeClasses}`}>
          <Slash className="w-3.5 h-3.5" />
          CANCELLED
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
