CREATE TABLE IF NOT EXISTS academic_programs (id text PRIMARY KEY,name text NOT NULL,degree text NOT NULL,source_url text NOT NULL,official boolean NOT NULL,requirements jsonb NOT NULL,retrieved_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS refresh_runs (id text PRIMARY KEY,kind text NOT NULL,status text NOT NULL,started_at timestamptz NOT NULL,finished_at timestamptz NOT NULL,duration_ms integer NOT NULL,records integer NOT NULL DEFAULT 0,detail text);
CREATE INDEX IF NOT EXISTS refresh_runs_kind_time_idx ON refresh_runs(kind,started_at);
