-- BORRADOR SIN APLICAR. Revisar y probar en un proyecto de prueba antes de usar (ver db/README.md).
-- Esquema inicial de Sentinel para Postgres con PostGIS (pensado para Supabase).
-- Convenciones: ids uuid, tiempos en timestamptz (UTC), geometrías en geography(…, 4326).

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ───────────────────────── organizaciones y personas ─────────────────────────
create table orgs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  plan       text not null default 'comunitario' check (plan in ('comunitario','productor','empresa','enterprise')),
  created_at timestamptz not null default now()
);

create table memberships (
  org_id     uuid not null references orgs(id) on delete cascade,
  user_id    uuid not null,                       -- auth.users.id (Supabase) o uid de Firebase durante la migración
  role       text not null check (role in ('owner','admin','operator','viewer')),
  site_ids   uuid[],                              -- null = todos los sitios de la organización
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on memberships (user_id);

create table sites (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs(id) on delete cascade,
  name       text not null,
  region_id  text,
  center     geography(point, 4326),
  settings   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index sites_org_idx on sites (org_id);

-- zonas, rutas, líneas y sensores: lo que hoy vive en el documento JSON del espacio de trabajo
create table features (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs(id) on delete cascade,
  site_id    uuid not null references sites(id) on delete cascade,
  role       text not null check (role in ('zone','line','route','sensor')),
  name       text not null default '',
  geom       geography(geometry, 4326) not null,
  props      jsonb not null default '{}'::jsonb,  -- modo de dibujo, dron asignado, tipo de sensor, buffer, etc.
  updated_at timestamptz not null default now()
);
create index features_site_idx on features (site_id);
create index features_geom_idx on features using gist (geom);

-- ───────────────────────────── detecciones y alertas ─────────────────────────────
create table observations (
  id          bigint generated always as identity primary key,
  source      text not null,                      -- 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT', 'GOES19_FDCF', …
  acquired_at timestamptz not null,               -- cuándo lo vio el satélite
  received_at timestamptz not null default now(), -- cuándo lo recibimos (latencia = received_at - acquired_at)
  geom        geography(point, 4326) not null,
  frp         real,
  confidence  smallint check (confidence between 0 and 2),
  score       smallint check (score between 0 and 100),
  noise       text check (noise in ('static','industrial')),
  fresh       boolean,
  unique (source, acquired_at, geom)
);
create index observations_time_idx on observations (acquired_at desc);
create index observations_geom_idx on observations using gist (geom);

create table incidents (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  site_id     uuid references sites(id) on delete set null,
  status      text not null default 'detected'
              check (status in ('detected','verified','in_control','contained','extinguished','closed','false_positive')),
  assignee    uuid,
  sla_due_at  timestamptz,
  centroid    geography(point, 4326),
  area_ha     real,
  opened_at   timestamptz not null default now(),
  closed_at   timestamptz
);
create index incidents_org_status_idx on incidents (org_id, status);

create table alerts (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  site_id      uuid references sites(id) on delete set null,
  incident_id  uuid references incidents(id) on delete set null,
  kind         text not null,                     -- 'zone_fire' | 'risk' | 'activity' | …
  severity     text not null check (severity in ('info','watch','high','critical')),
  status       text not null default 'new' check (status in ('new','ack','attending','resolved')),
  detail       text,
  dedupe_key   text not null,                     -- hash(hazard, celda H3, ventana de 6 h)
  created_at   timestamptz not null default now(),
  acked_at     timestamptz,
  unique (org_id, dedupe_key)
);
create index alerts_org_status_idx on alerts (org_id, status, created_at desc);

create table incident_notes (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  org_id      uuid not null references orgs(id) on delete cascade,
  author      uuid not null,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create table tasks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  incident_id uuid references incidents(id) on delete cascade,
  kind        text not null,                      -- 'verify' | 'dispatch' | 'notify' | …
  assignee    uuid,
  status      text not null default 'open' check (status in ('open','in_progress','done','cancelled')),
  due_at      timestamptz,
  created_at  timestamptz not null default now()
);

-- ───────────────────────── contactos, escalamiento y entregas ─────────────────────────
create table contacts (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references orgs(id) on delete cascade,
  name      text not null,
  email     text,
  whatsapp  text,                                 -- E.164; dato personal (Ley 25.326)
  site_ids  uuid[]
);

create table escalation_policies (
  id       uuid primary key default gen_random_uuid(),
  org_id   uuid not null references orgs(id) on delete cascade,
  site_id  uuid references sites(id) on delete cascade,
  steps    jsonb not null                          -- [{"afterMin":0,"contact":"…","channel":"whatsapp"}, …]
);

-- cola de salida idempotente: reintentar nunca duplica un mensaje
create table deliveries (
  id         bigint generated always as identity primary key,
  alert_id   uuid not null references alerts(id) on delete cascade,
  channel    text not null check (channel in ('whatsapp','email','push','sms','webhook')),
  recipient  text not null,
  status     text not null default 'pending' check (status in ('pending','sent','failed','delivered')),
  attempts   smallint not null default 0,
  last_error text,
  sent_at    timestamptz,
  unique (alert_id, channel, recipient)
);

-- ─────────────────────────────── auditoría (solo agregar) ───────────────────────────────
create table audit_log (
  id        bigint generated always as identity primary key,
  org_id    uuid not null,
  actor     uuid,
  at        timestamptz not null default now(),
  entity    text not null,
  entity_id text,
  action    text not null,
  diff      jsonb
);
create index audit_org_time_idx on audit_log (org_id, at desc);
revoke update, delete on audit_log from public, anon, authenticated;

-- ─────────────────────────────── seguridad por fila ───────────────────────────────
-- Auxiliar: rol del usuario actual en una organización (null si no es miembro).
create or replace function org_role(p_org uuid) returns text
language sql stable security definer set search_path = '' as $$
  select role from public.memberships where org_id = p_org and user_id = auth.uid()
$$;

alter table orgs                enable row level security;
alter table memberships         enable row level security;
alter table sites               enable row level security;
alter table features            enable row level security;
alter table incidents           enable row level security;
alter table alerts              enable row level security;
alter table incident_notes      enable row level security;
alter table tasks               enable row level security;
alter table contacts            enable row level security;
alter table escalation_policies enable row level security;
alter table deliveries          enable row level security;
alter table audit_log           enable row level security;
-- observations: datos satelitales abiertos, legibles por cualquier usuario autenticado; solo el servicio escribe.
alter table observations enable row level security;
create policy observations_read on observations for select to authenticated using (true);
revoke insert, update, delete on observations from anon, authenticated;
revoke all on deliveries, audit_log from anon, authenticated;
grant select on audit_log to authenticated;  -- la política audit_read decide quién la ve

-- org_id y site_id no se cambian después de crear la fila (evita mover datos entre organizaciones).
create or replace function forbid_scope_change() returns trigger
language plpgsql as $$
begin
  if new.org_id is distinct from old.org_id then
    raise exception 'org_id es inmutable';
  end if;
  return new;
end $$;
create trigger features_scope before update on features for each row execute function forbid_scope_change();
create trigger incidents_scope before update on incidents for each row execute function forbid_scope_change();
create trigger alerts_scope before update on alerts for each row execute function forbid_scope_change();
create trigger tasks_scope before update on tasks for each row execute function forbid_scope_change();
create trigger contacts_scope before update on contacts for each row execute function forbid_scope_change();
create trigger policies_scope before update on escalation_policies for each row execute function forbid_scope_change();

create index if not exists incident_notes_org_idx on incident_notes (org_id);
create index if not exists tasks_org_idx on tasks (org_id);
create index if not exists contacts_org_idx on contacts (org_id);
create index if not exists policies_org_idx on escalation_policies (org_id);
create index if not exists features_org_idx on features (org_id);
create index if not exists incidents_site_idx on incidents (site_id);

create policy orgs_read on orgs for select using (org_role(id) is not null);

create policy memberships_read on memberships for select
  using (user_id = auth.uid() or org_role(org_id) in ('owner','admin'));
create policy memberships_write on memberships for all
  using (org_role(org_id) = 'owner') with check (org_role(org_id) = 'owner');

-- lectura para cualquier miembro; escritura solo operador o superior
create policy sites_read   on sites    for select using (org_role(org_id) is not null);
create policy sites_write  on sites    for all using (org_role(org_id) in ('owner','admin'))
                                           with check (org_role(org_id) in ('owner','admin'));
create policy features_read  on features for select using (org_role(org_id) is not null);
create policy features_write on features for all using (org_role(org_id) in ('owner','admin','operator'))
                                              with check (org_role(org_id) in ('owner','admin','operator'));

create policy incidents_read   on incidents for select using (org_role(org_id) is not null);
create policy incidents_update on incidents for update using (org_role(org_id) in ('owner','admin','operator'))
                                                      with check (org_role(org_id) in ('owner','admin','operator'));
-- crear y borrar incidentes lo hace el servicio, no el cliente

create policy alerts_read   on alerts for select using (org_role(org_id) is not null);
create policy alerts_update on alerts for update using (org_role(org_id) in ('owner','admin','operator'))
                                                with check (org_role(org_id) in ('owner','admin','operator'));

create policy notes_read   on incident_notes for select using (org_role(org_id) is not null);
create policy notes_insert on incident_notes for insert with check (org_role(org_id) in ('owner','admin','operator') and author = auth.uid());

create policy tasks_read  on tasks for select using (org_role(org_id) is not null);
create policy tasks_write on tasks for all using (org_role(org_id) in ('owner','admin','operator'))
                                         with check (org_role(org_id) in ('owner','admin','operator'));

create policy contacts_read  on contacts for select using (org_role(org_id) in ('owner','admin','operator'));
create policy contacts_write on contacts for all using (org_role(org_id) in ('owner','admin'))
                                              with check (org_role(org_id) in ('owner','admin'));

create policy policies_read  on escalation_policies for select using (org_role(org_id) in ('owner','admin','operator'));
create policy policies_write on escalation_policies for all using (org_role(org_id) in ('owner','admin'))
                                                       with check (org_role(org_id) in ('owner','admin'));

create policy audit_read on audit_log for select using (org_role(org_id) in ('owner','admin'));
-- deliveries y audit_log solo se escriben desde el servidor con la clave de servicio

-- PENDIENTE antes de usar: restringir por memberships.site_ids (hoy un 'viewer' ve todos los sitios de su organización).
