CREATE TABLE IF NOT EXISTS calendar_subscriptions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS calendar_subscriptions_token_hash_uidx
  ON calendar_subscriptions (token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS calendar_subscriptions_user_uidx
  ON calendar_subscriptions (user_id);
