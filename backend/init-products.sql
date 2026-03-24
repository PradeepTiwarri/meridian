-- =============================================================================
-- Meridian Ecosystem — Supabase Products Table Setup
-- =============================================================================
-- Run this script in the Supabase SQL Editor to create the products table
-- and seed it with the 5 mock B2B products.
--
-- Prices are stored in USD cents (integer) for safe arithmetic.
-- e.g., 249900 = $2,499.00
-- =============================================================================

-- 1. Create the products table
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sku         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  base_price  INTEGER NOT NULL,          -- USD cents
  category    TEXT NOT NULL,
  tier        TEXT NOT NULL CHECK (tier IN ('Enterprise', 'Standard', 'Premium')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Create an index on SKU for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);

-- 3. Enable Row Level Security (Supabase best practice)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Allow public read access (the storefront is a public catalog)
CREATE POLICY "Allow public read access on products"
  ON products
  FOR SELECT
  USING (true);

-- 5. Seed the 5 mock B2B products
-- Using INSERT ... ON CONFLICT to make this script idempotent
INSERT INTO products (id, sku, name, description, base_price, category, tier)
VALUES
  (
    'prod_001',
    'MRD-APG-001',
    'Enterprise API Gateway',
    'High-throughput API gateway supporting up to 10M requests/month with built-in rate limiting, OAuth 2.0, and real-time analytics. Includes dedicated support and 99.99% SLA.',
    249900,
    'Infrastructure',
    'Enterprise'
  ),
  (
    'prod_002',
    'MRD-CSN-002',
    'Standard Cloud Storage Node',
    '5TB of S3-compatible object storage with geo-redundant replication across 3 availability zones. Includes automated backups, versioning, and lifecycle policies.',
    89900,
    'Storage',
    'Standard'
  ),
  (
    'prod_003',
    'MRD-GPU-003',
    'Dedicated GPU Cluster',
    '4x NVIDIA A100 80GB GPUs with NVLink interconnect for ML training and inference workloads. Pre-configured with CUDA 12, PyTorch, and TensorFlow. Billed per compute-hour.',
    1299900,
    'Compute',
    'Enterprise'
  ),
  (
    'prod_004',
    'MRD-K8S-004',
    'Managed Kubernetes Orchestrator',
    'Fully managed K8s control plane with auto-scaling node pools, Istio service mesh, and integrated CI/CD pipelines. Supports up to 500 pods with zero-downtime deployments.',
    179900,
    'Platform',
    'Premium'
  ),
  (
    'prod_005',
    'MRD-RAP-005',
    'Real-Time Analytics Pipeline',
    'Stream processing engine built on Apache Flink with sub-second latency. Ingests up to 1M events/sec with exactly-once semantics, pre-built connectors for Kafka, Redis, and PostgreSQL.',
    349900,
    'Data',
    'Premium'
  )
ON CONFLICT (sku) DO NOTHING;

-- 6. Verify the insert
SELECT id, sku, name, base_price, category, tier FROM products ORDER BY created_at;
