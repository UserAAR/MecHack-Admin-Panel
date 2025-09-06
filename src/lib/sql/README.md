# Database schema for new admin features

Run the following SQL in Supabase to create required tables.

```sql
-- Audit logs for activity tracking
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  ip text,
  user_agent text,
  metadata jsonb
);

-- Optional index for faster queries
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs(action);

-- Deploy triggers history + cooldown reference
create table if not exists public.deploy_triggers (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  triggered_by uuid,
  triggered_by_email text
);

-- RLS (optional): allow inserts by authenticated users
alter table public.audit_logs enable row level security;
create policy audit_insert on public.audit_logs for insert to authenticated using (true) with check (true);

alter table public.deploy_triggers enable row level security;
create policy deploy_insert on public.deploy_triggers for insert to authenticated using (true) with check (true);
create policy deploy_select on public.deploy_triggers for select to authenticated using (true);
``` 