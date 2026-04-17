-- ============================================================
-- Chroma Aura — Initial Schema
-- Run once in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── quotas ───────────────────────────────────────────────────
-- Replaces the in-memory Map in server-quota.ts.
-- key = "user_{clerkId}" | "fp_{visitorId}" | "ip_{addr}"
create table if not exists quotas (
  key          text        primary key,
  ops_used     integer     not null default 0,
  period_start text        not null,          -- "YYYY-MM-DD" or "permanent"
  updated_at   timestamptz not null default now()
);

-- ── projects ─────────────────────────────────────────────────
-- Replaces localStorage "chroma_aura_history".
create table if not exists projects (
  id               uuid        primary key default gen_random_uuid(),
  user_id          text        not null,       -- Clerk userId
  title            text,
  thumbnail_url    text,                        -- Supabase Storage path
  canvas_state_url text,                        -- Supabase Storage path (full res)
  lineart_url      text,                        -- original AI lineart URL
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists projects_user_id_idx
  on projects (user_id, created_at desc);

-- ── generation_log ───────────────────────────────────────────
-- Audit trail for every AI operation (generate / autocolor).
create table if not exists generation_log (
  id           uuid        primary key default gen_random_uuid(),
  user_id      text,                            -- null = guest
  quota_key    text        not null,            -- same key as quotas.key
  op_type      text        not null,            -- 'generate' | 'autocolor'
  quota_source text        not null,            -- 'plan' | 'permanent' | 'guest'
  created_at   timestamptz not null default now()
);

create index if not exists generation_log_user_id_idx
  on generation_log (user_id, created_at desc);

-- ── Storage bucket ───────────────────────────────────────────
-- Create manually in: Supabase Dashboard → Storage → New Bucket
--   Name: projects
--   Public: false
