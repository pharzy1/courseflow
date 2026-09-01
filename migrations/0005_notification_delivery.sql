ALTER TABLE enrollment_alerts ADD COLUMN IF NOT EXISTS email_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE enrollment_alerts ADD COLUMN IF NOT EXISTS provider_message_id text;
ALTER TABLE enrollment_alerts ADD COLUMN IF NOT EXISTS last_email_attempt_at timestamptz;
CREATE TABLE IF NOT EXISTS notification_preferences (user_id text PRIMARY KEY REFERENCES user_profiles(id),email_enabled boolean NOT NULL DEFAULT false,frequency text NOT NULL DEFAULT 'immediate',quiet_start integer NOT NULL DEFAULT 22,quiet_end integer NOT NULL DEFAULT 7,timezone text NOT NULL DEFAULT 'America/Los_Angeles',unsubscribed_at timestamptz,updated_at timestamptz NOT NULL);
