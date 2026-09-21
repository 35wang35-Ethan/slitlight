CREATE TABLE inquiries (
    id TEXT PRIMARY KEY NOT NULL,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    website_or_social TEXT,
    case_summary TEXT NOT NULL,
    problem TEXT NOT NULL,
    email TEXT NOT NULL,
    contact TEXT,
    privacy_consent INTEGER NOT NULL CHECK (privacy_consent IN (0, 1)),
    consented_at TEXT,
    source TEXT NOT NULL DEFAULT 'direct',
    status TEXT NOT NULL DEFAULT 'new' CHECK (
        status IN ('new', 'contacted', 'discovery', 'quoted', 'active', 'completed', 'declined')
    ),
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT
);

CREATE INDEX inquiries_created_at_idx ON inquiries (created_at);
CREATE INDEX inquiries_status_created_at_idx ON inquiries (status, created_at);
