CREATE TABLE IF NOT EXISTS cosmetics (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    type_value TEXT,
    rarity_value TEXT,
    image_small_icon TEXT,
    image_icon TEXT,
    added_date TEXT,
    added_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS cosmetics_added_at_idx ON cosmetics (added_at);
