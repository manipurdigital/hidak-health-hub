
-- 1) Call sessions and participants tables

create table if not exists public.call_sessions (
  id uuid not null default gen_random_uuid() primary key,
  consultation_id uuid not null,
  channel_name text not null,
  call_type text not null default 'video',
  status text not null default 'ringing', -- ringing | active | declined | missed | ended | failed
  initiator_user_id uuid not null,
  accepted_at timestamptz,
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- Reference consultations for integrity (safe - public schema)
alter table public.call_sessions
  add constraint call_sessions_consultation_fk
  foreign key (consultation_id) references public.consultations(id) on delete cascade;

create index if not exists idx_call_sessions_consultation_id on public.call_sessions(consultation_id);
create index if not exists idx_call_sessions_status on public.call_sessions(status);

create table if not exists public.call_participants (
  id uuid not null default gen_random_uuid() primary key,
  call_id uuid not null,
  user_id uuid not null, -- auth.users is not referenced per best practices
  role text not null,    -- 'doctor' | 'patient'
  rtc_uid text,
  joined_at timestamptz,
  left_at timestamptz,
  is_audio_muted boolean not null default false,
  is_video_muted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.call_participants
  add constraint call_participants_call_fk
  foreign key (call_id) references public.call_sessions(id) on delete cascade;

create index if not exists idx_call_participants_call_id on public.call_participants(call_id);
create index if not exists idx_call_participants_user_id on public.call_participants(user_id);

-- 2) Enable RLS
alter table public.call_sessions enable row level security;
alter table public.call_participants enable row level security;

-- 3) RLS policies for call_sessions

-- Select: participants in the consultation (patient or mapped doctor) OR initiator can view
create policy "Participants can view their call_sessions"
on public.call_sessions
for select
using (
  initiator_user_id = auth.uid()
  or exists (
    select 1
    from public.consultations c
    left join public.doctors d on d.id = c.doctor_id
    where c.id = call_sessions.consultation_id
      and (c.patient_id = auth.uid() or d.user_id = auth.uid())
  )
);

-- Insert: only a participant of the consultation can create, and must be the initiator
create policy "Participants can create call_sessions for their consultation"
on public.call_sessions
for insert
with check (
  initiator_user_id = auth.uid()
  and exists (
    select 1
    from public.consultations c
    left join public.doctors d on d.id = c.doctor_id
    where c.id = consultation_id
      and (c.patient_id = auth.uid() or d.user_id = auth.uid())
  )
);

-- Update: participants of the consultation (patient or mapped doctor) OR initiator can update
create policy "Participants can update call_sessions"
on public.call_sessions
for update
using (
  initiator_user_id = auth.uid()
  or exists (
    select 1
    from public.consultations c
    left join public.doctors d on d.id = c.doctor_id
    where c.id = call_sessions.consultation_id
      and (c.patient_id = auth.uid() or d.user_id = auth.uid())
  )
)
with check (
  initiator_user_id = auth.uid()
  or exists (
    select 1
    from public.consultations c
    left join public.doctors d on d.id = c.doctor_id
    where c.id = call_sessions.consultation_id
      and (c.patient_id = auth.uid() or d.user_id = auth.uid())
  )
);

-- 4) RLS policies for call_participants

-- Select: participants of the call OR anyone who is part of the linked consultation (doctor/patient)
create policy "View participant rows for your calls"
on public.call_participants
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.call_sessions cs
    join public.consultations c on c.id = cs.consultation_id
    left join public.doctors d on d.id = c.doctor_id
    where cs.id = call_participants.call_id
      and (c.patient_id = auth.uid() or d.user_id = auth.uid())
  )
);

-- Insert: allow creating participant rows only for valid consultation participants (patient or mapped doctor)
-- and only by the initiator or the participant themselves
create policy "Create participant rows for consultation participants"
on public.call_participants
for insert
with check (
  exists (
    select 1
    from public.call_sessions cs
    join public.consultations c on c.id = cs.consultation_id
    left join public.doctors d on d.id = c.doctor_id
    where cs.id = call_id
      and (
        user_id in (c.patient_id, d.user_id)
      )
      and (auth.uid() = user_id or auth.uid() = cs.initiator_user_id)
  )
);

-- Update: participants can update their own participant row
create policy "Update your own participant row"
on public.call_participants
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
