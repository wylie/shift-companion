ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id text,
  ADD COLUMN IF NOT EXISTS entra_object_id text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS user_principal_name text;

CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_entra_object_uidx
  ON users (tenant_id, entra_object_id);

CREATE INDEX IF NOT EXISTS users_tenant_email_idx
  ON users (tenant_id, email);

CREATE INDEX IF NOT EXISTS users_tenant_upn_idx
  ON users (tenant_id, user_principal_name);
