CREATE TABLE IF NOT EXISTS articles (id TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 1, deleted INTEGER NOT NULL DEFAULT 0, body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS app_meta (id TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 1, body TEXT NOT NULL);
-- V35: KI-Kostenerfassung (legt der Server in Produktion selbst an)
CREATE TABLE IF NOT EXISTS ai_usage (ts INTEGER NOT NULL, route TEXT, model TEXT, input INTEGER, output INTEGER, usd REAL);
