CREATE TABLE IF NOT EXISTS cosmetics (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    type_value TEXT,
    rarity_value TEXT,
    image_small_icon TEXT,
    image_icon TEXT,
    added_date TEXT,
    added_at TIMESTAMPTZ,
    is_new BOOLEAN NOT NULL DEFAULT false,
    new_since TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS cosmetics_added_at_idx ON cosmetics (added_at);
CREATE INDEX IF NOT EXISTS cosmetics_is_new_idx ON cosmetics (is_new);

CREATE TABLE IF NOT EXISTS shop_entries (
    offer_id TEXT PRIMARY KEY,
    regular_price INT,
    final_price INT,
    in_date TIMESTAMPTZ,
    out_date TIMESTAMPTZ,
    is_bundle BOOLEAN NOT NULL DEFAULT false,
    bundle_name TEXT,
    bundle_image TEXT
);

CREATE INDEX IF NOT EXISTS shop_entries_in_date_idx ON shop_entries (in_date DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS shop_entry_items (
    offer_id TEXT NOT NULL REFERENCES shop_entries(offer_id) ON DELETE CASCADE,
    cosmetic_id TEXT NOT NULL,
    PRIMARY KEY (offer_id, cosmetic_id)
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users ((LOWER(email)));

CREATE TABLE IF NOT EXISTS user_wallets (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_created_idx
    ON wallet_transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inventory_items (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cosmetic_id TEXT NOT NULL REFERENCES cosmetics(id),
    quantity INT NOT NULL DEFAULT 1,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, cosmetic_id)
);