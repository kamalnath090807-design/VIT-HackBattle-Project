/**
 * AURA Frontend — Task Detail & Execution Monitoring Page
 * Source: docs/04-DESIGN-SYSTEM.md §4.1
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTaskPolling } from '../hooks/useTaskPolling';
import { api } from '../services/api';
import { AuditLogEntry } from '../types/audit';
import { TaskHeader } from '../components/task/TaskHeader';
import { PlanViewer } from '../components/task/PlanViewer';
import { TaskResult } from '../components/task/TaskResult';
import { AuditLogViewer } from '../components/task/AuditLogViewer';
import { ApprovalModal } from '../components/task/ApprovalModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { ArrowLeft } from 'lucide-react';

export const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { task, loading, error, refetch } = useTaskPolling(taskId, 2000);
  const [auditTrail, setAuditTrail] = useState<AuditLogEntry[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch audit trail when task updates
  useEffect(() => {
    if (taskId) {
      api
        .getAuditLog(taskId)
        .then((res) => setAuditTrail(res.auditTrail || []))
        .catch(() => {});
    }
  }, [taskId, task?.status]);

  if (loading && !task) {
    return <LoadingSpinner label="Connecting to task telemetry..." size="lg" />;
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <ErrorState
          title="Task Telemetry Error"
          message={error || 'Could not retrieve task details.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  // Check if any step requires human approval
  const stepsList = task.steps || task.plan?.steps || [];
  const currIdx = task.currentStepIndex !== undefined ? task.currentStepIndex : (task as any).current_step_index;

  const pendingApprovalStep =
    stepsList.find(
      (s) => s.status === 'AWAITING_APPROVAL' || s.riskLevel === 'HIGH' || (s as any).risk_level === 'HIGH'
    ) ||
    (currIdx !== null && currIdx !== undefined && stepsList[currIdx]
      ? stepsList[currIdx]
      : null);

  const activeApprovalStep =
    pendingApprovalStep ||
    (task.status === 'AWAITING_APPROVAL'
      ? {
          stepIndex: currIdx ?? 0,
          description: task.goal || 'Action requires user approval',
          tool: 'external_action',
          riskLevel: 'HIGH' as const,
          status: 'AWAITING_APPROVAL' as const,
        }
      : null);

  const showApprovalModal =
    task.status === 'AWAITING_APPROVAL' && Boolean(activeApprovalStep);

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED', reason?: string) => {
    if (!activeApprovalStep) return;
    await api.submitApproval(task.id, activeApprovalStep.stepIndex, decision, reason);
    await refetch();
  };

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await api.cancelTask(task.id);
      await refetch();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Task Header */}
      <TaskHeader
        task={task}
        onCancel={handleCancel}
        isCancelling={isCancelling}
      />

      {/* Verified Task Result (if completed) */}
      {task.result && <TaskResult result={task.result} />}

      {/* Plan Steps Tree */}
      <PlanViewer steps={task.steps || task.plan?.steps} />

      {/* Immutable Audit Log */}
      <AuditLogViewer auditTrail={auditTrail} />

      {/* Human Approval Modal (Pops up on AWAITING_APPROVAL) */}
      {activeApprovalStep && (
        <ApprovalModal
          step={activeApprovalStep}
          isOpen={showApprovalModal}
          onDecision={handleDecision}
        />
      )}
    </div>
  );
};
