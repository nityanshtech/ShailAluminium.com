 CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('page_view', 'link_click')),
    session_id TEXT NOT NULL,
    path TEXT NOT NULL,
    source TEXT NOT NULL,
    target TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS analytics_timestamp_type
    ON analytics_events(timestamp, type);
CREATE INDEX IF NOT EXISTS analytics_session_timestamp
    ON analytics_events(session_id, timestamp);

CREATE TABLE IF NOT EXISTS login_attempts (
    ip_hash TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    failures INTEGER NOT NULL,
    PRIMARY KEY (ip_hash, window_start)
);
