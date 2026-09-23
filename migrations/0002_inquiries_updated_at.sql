ALTER TABLE inquiries ADD COLUMN updated_at TEXT;

UPDATE inquiries SET updated_at = created_at WHERE updated_at IS NULL;
