CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  timezone text NOT NULL,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS departments_org_name_uidx
  ON departments (organization_id, name);
CREATE INDEX IF NOT EXISTS departments_organization_idx
  ON departments (organization_id);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('staff', 'manager')),
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_organization_idx
  ON users (organization_id);

CREATE TABLE IF NOT EXISTS department_memberships (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id text NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('staff', 'manager')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS department_memberships_uidx
  ON department_memberships (user_id, department_id);
CREATE INDEX IF NOT EXISTS department_memberships_user_idx
  ON department_memberships (user_id);
CREATE INDEX IF NOT EXISTS department_memberships_department_idx
  ON department_memberships (department_id);

CREATE TABLE IF NOT EXISTS unavailability_rules (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('weekly-recurring', 'one-time-date', 'date-range')),
  days_of_week jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_time time,
  end_time time,
  one_time_date date,
  start_date date,
  end_date date,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS unavailability_rules_user_idx
  ON unavailability_rules (user_id);
CREATE INDEX IF NOT EXISTS unavailability_rules_type_idx
  ON unavailability_rules (type);

CREATE TABLE IF NOT EXISTS shifts (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id text NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shifts_user_start_idx
  ON shifts (user_id, start_at);
CREATE INDEX IF NOT EXISTS shifts_department_start_idx
  ON shifts (department_id, start_at);

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  actor_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_actor_created_idx
  ON audit_events (actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS audit_events_type_idx
  ON audit_events (event_type);
