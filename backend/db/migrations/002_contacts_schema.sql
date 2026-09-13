-- AURA — Contacts & Multi-Channel Messaging Schema
-- Source of truth: docs/05-DATABASE.md & Implementation Plan
--
-- Run against Supabase SQL Editor.

-- ============================================================
-- 1. contacts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL CHECK (char_length(display_name) <= 255),
  aliases         TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_display_name ON public.contacts(display_name);

-- ============================================================
-- 2. contact_identities
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_identities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id          UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel             TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
  provider            TEXT NOT NULL,
  external_id         TEXT DEFAULT NULL,
  normalized_value    TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'verified'
                        CHECK (verification_status IN ('verified', 'unverified', 'stale')),
  source              TEXT NOT NULL
                        CHECK (source IN ('user_import', 'authorized_email', 'authorized_contact_provider')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, channel, normalized_value)
);

CREATE INDEX IF NOT EXISTS idx_contact_identities_contact_id ON public.contact_identities(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_identities_channel ON public.contact_identities(channel);
CREATE INDEX IF NOT EXISTS idx_contact_identities_normalized ON public.contact_identities(normalized_value);

-- ============================================================
-- 3. Row-Level Security (RLS)
-- ============================================================
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_identities ENABLE ROW LEVEL SECURITY;

-- Users can only access their own contacts
CREATE POLICY contacts_user_isolation ON public.contacts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only access identities belonging to their contacts
CREATE POLICY contact_identities_user_isolation ON public.contact_identities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_identities.contact_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_identities.contact_id
      AND c.user_id = auth.uid()
    )
  );
