-- Migration number: 0001 	 2026-07-31T11:15:14.999Z

CREATE TABLE push_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repository TEXT NOT NULL,
  received_at TEXT NOT NULL,
  compare_url TEXT NOT NULL DEFAULT '',
  delivery_id TEXT UNIQUE
);

CREATE INDEX idx_push_events_received_at ON push_events (received_at DESC);
