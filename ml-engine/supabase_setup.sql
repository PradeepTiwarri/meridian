-- =============================================================================
-- Meridian Phase 4 — RevOps Auditor: Supabase Vector Database Setup
-- =============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard → SQL → New Query).
--
-- This creates:
--   1. The pgvector extension for embedding storage
--   2. A `playbooks` table to store revenue playbook rules + embeddings  
--   3. A `match_playbooks` function for cosine similarity search
-- =============================================================================

-- ─── 1. Enable pgvector extension ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── 2. Create playbooks table ──────────────────────────────────────────────
-- Uses vector(384) to match the all-MiniLM-L6-v2 embedding dimensions.
CREATE TABLE IF NOT EXISTS playbooks (
    id          BIGSERIAL PRIMARY KEY,
    content     TEXT NOT NULL,
    metadata    JSONB DEFAULT '{}'::JSONB,
    embedding   VECTOR(384),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS playbooks_embedding_idx
    ON playbooks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 10);

-- ─── 3. Cosine similarity search function ───────────────────────────────────
-- Used by LangChain / the RevOps Agent to retrieve relevant playbook rules.
--
-- Usage:
--   SELECT * FROM match_playbooks(
--     query_embedding := '[0.1, 0.2, ...]'::vector,
--     match_threshold := 0.7,
--     match_count := 3
--   );
-- =============================================================================

CREATE OR REPLACE FUNCTION match_playbooks (
    query_embedding VECTOR(384),
    match_threshold FLOAT DEFAULT 0.5,
    match_count     INT   DEFAULT 3
)
RETURNS TABLE (
    id         BIGINT,
    content    TEXT,
    metadata   JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.content,
        p.metadata,
        1 - (p.embedding <=> query_embedding) AS similarity
    FROM playbooks p
    WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ─── Verification ───────────────────────────────────────────────────────────
-- After running, confirm with:
--   SELECT COUNT(*) FROM playbooks;  -- Should return 0 (empty, ready for seeding)
--   SELECT proname FROM pg_proc WHERE proname = 'match_playbooks';  -- Should return 1 row
