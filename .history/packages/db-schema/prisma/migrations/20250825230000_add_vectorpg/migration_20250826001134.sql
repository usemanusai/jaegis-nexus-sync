-- Ensure pgvector extension exists in this database and shadow DB
CREATE EXTENSION IF NOT EXISTS vector;

-- Add native pgvector column and index
ALTER TABLE "Embedding" ADD COLUMN "vectorPg" vector(1536);

-- Backfill existing rows
UPDATE "Embedding" SET "vectorPg" = (
  SELECT ('[' || string_agg((val)::text, ',') || ']')::vector
  FROM unnest("vector") AS val
)
WHERE "vector" IS NOT NULL AND cardinality("vector") = "dim";

-- Create ivfflat index (Euclidean)
CREATE INDEX IF NOT EXISTS embedding_vector_ivfflat ON "Embedding" USING ivfflat ("vectorPg" vector_l2_ops) WITH (lists = 100);

