/**
 * AURA Frontend — Task Polling Hook
 *
 * Polls GET /api/v1/tasks/:taskId every 2 seconds while task is active.
 * Automatically stops polling on terminal states (COMPLETED, FAILED, CANCELLED).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { Task } from '../types/task';

const ACTIVE_STATES = [
  'QUEUED',
  'PLANNING',
  'AWAITING_APPROVAL',
  'EXECUTING',
  'OBSERVING',
  'REPLANNING',
  'VERIFYING',
];

export function useTaskPolling(taskId: string | undefined, intervalMs = 2000) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isPollingRef = useRef(true);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await api.getTask(taskId);
      setTask(res.task);
      setError(null);

      // Stop polling if task entered terminal state
      if (res.task && !ACTIVE_STATES.includes(res.task.status)) {
        isPollingRef.current = false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task');
      isPollingRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    isPollingRef.current = true;
    setLoading(true);
    fetchTask();

    const interval = setInterval(() => {
      if (isPollingRef.current) {
        fetchTask();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [taskId, fetchTask, intervalMs]);

  return { task, loading, error, refetch: fetchTask };
}
