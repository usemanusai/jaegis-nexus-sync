-- Add native pgvector column and index
ALTER TABLE "Embedding" ADD COLUMN "vectorPg" vector;
-- Backfill existing rows (copy floats into vector where dim matches)
UPDATE "Embedding" SET "vectorPg" = to_vector(ARRAY(SELECT unnest("vector"))::real[])
WHERE "vector" IS NOT NULL AND cardinality("vector") = "dim";
-- Create HNSW or ivfflat index depending on pgvector version (using ivfflat here)
CREATE INDEX IF NOT EXISTS embedding_vector_ivfflat ON "Embedding" USING ivfflat ("vectorPg") WITH (lists = 100);

