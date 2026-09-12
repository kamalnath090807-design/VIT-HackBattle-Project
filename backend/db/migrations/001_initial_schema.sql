-- AURA — Initial Database Schema
-- Source of truth: docs/05-DATABASE.md §3
--
-- Run against Supabase SQL Editor.
-- Verify current schema state before executing to avoid destructive overwrites.

-- ============================================================
-- 1. tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  goal            TEXT NOT NULL CHECK (char_length(goal) <= 1000),
  status          TEXT NOT NULL DEFAULT 'QUEUED'
                    CHECK (status IN (
                      'QUEUED','PLANNING','AWAITING_APPROVAL','EXECUTING',
                      'OBSERVING','REPLANNING','VERIFYING','COMPLETED',
                      'PARTIALLY_COMPLETED','FAILED','CANCELLED'
                    )),
  plan            JSONB DEFAULT NULL,
  result          JSONB DEFAULT NULL,
  current_step_index INTEGER DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id    ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- ============================================================
-- 2. task_steps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  step_index      INTEGER NOT NULL,
  description     TEXT NOT NULL,
  tool_name       TEXT NOT NULL,
  params          JSONB DEFAULT '{}',
  risk_level      TEXT NOT NULL DEFAULT 'LOW'
                    CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
  status          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN (
                      'PENDING','EXECUTING','COMPLETED','FAILED',
                      'SKIPPED','AWAITING_APPROVAL','APPROVED','REJECTED'
                    )),
  result          JSONB DEFAULT NULL,
  error_message   TEXT DEFAULT NULL,
  started_at      TIMESTAMPTZ DEFAULT NULL,
  completed_at    TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (task_id, step_index)
);

CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON public.task_steps(task_id);

-- ============================================================
-- 3. approvals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  step_index      INTEGER NOT NULL,
  decision        TEXT DEFAULT NULL
                    CHECK (decision IS NULL OR decision IN ('APPROVED','REJECTED')),
  reason          TEXT DEFAULT NULL,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at      TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_approvals_task_id ON public.approvals(task_id);

-- ============================================================
-- 4. audit_logs (append-only — no UPDATE or DELETE)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  step_index      INTEGER DEFAULT NULL,
  action          TEXT NOT NULL,
  details         JSONB DEFAULT '{}',
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_task_id   ON public.audit_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- ============================================================
-- 5. tool_definitions (seed/static — may be file-based instead)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tool_definitions (
  name              TEXT PRIMARY KEY,
  description       TEXT NOT NULL,
  parameters_schema JSONB NOT NULL DEFAULT '{}',
  risk_level        TEXT NOT NULL DEFAULT 'LOW'
                      CHECK (risk_level IN ('LOW','MEDIUM','HIGH','DISALLOWED')),
  enabled           BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- 6. memory (P1 stretch — only implement if time allows)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  key             TEXT NOT NULL,
  value           JSONB NOT NULL,
  scope           TEXT NOT NULL DEFAULT 'task'
                    CHECK (scope IN ('task','user')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_user_id ON public.memory(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_key     ON public.memory(key);

-- ============================================================
-- 7. Row-Level Security (RLS)
-- ============================================================

-- Enable RLS on user-facing tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;

-- Tasks: users can only see/modify their own tasks
CREATE POLICY tasks_select_own ON public.tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY tasks_insert_own ON public.tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY tasks_update_own ON public.tasks
  FOR UPDATE USING (user_id = auth.uid());

-- Task steps: visible if user owns the parent task
CREATE POLICY task_steps_select_own ON public.task_steps
  FOR SELECT USING (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );

-- Approvals: visible if user owns the parent task
CREATE POLICY approvals_select_own ON public.approvals
  FOR SELECT USING (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );

-- Audit logs: visible if user owns the parent task
CREATE POLICY audit_logs_select_own ON public.audit_logs
  FOR SELECT USING (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );

-- Memory: users can only see their own memory
CREATE POLICY memory_select_own ON public.memory
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY memory_insert_own ON public.memory
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY memory_delete_own ON public.memory
  FOR DELETE USING (user_id = auth.uid());
