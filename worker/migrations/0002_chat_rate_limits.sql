CREATE TABLE IF NOT EXISTS chat_rate_limits (
    ip_hash TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    requests INTEGER NOT NULL,
    PRIMARY KEY (ip_hash, window_start)
);
