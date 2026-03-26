import { Product } from "./types";

// =============================================================================
// Meridian Storefront — Static Mock Product Catalog
// =============================================================================
// Prices are stored in USD cents for safe arithmetic (no floating-point drift).
// Display prices by dividing by 100 → (basePrice / 100).toFixed(2)
// =============================================================================

export const products: Product[] = [
  {
    id: "prod_001",
    sku: "MRD-APG-001",
    name: "Enterprise API Gateway",
    description:
      "High-throughput API gateway supporting up to 10M requests/month with built-in rate limiting, OAuth 2.0, and real-time analytics. Includes dedicated support and 99.99% SLA.",
    basePrice: 249900, // $2,499.00
    category: "Infrastructure",
    tier: "Enterprise",
  },
  {
    id: "prod_002",
    sku: "MRD-CSN-002",
    name: "Standard Cloud Storage Node",
    description:
      "5TB of S3-compatible object storage with geo-redundant replication across 3 availability zones. Includes automated backups, versioning, and lifecycle policies.",
    basePrice: 89900, // $899.00
    category: "Storage",
    tier: "Standard",
  },
  {
    id: "prod_003",
    sku: "MRD-GPU-003",
    name: "Dedicated GPU Cluster",
    description:
      "4x NVIDIA A100 80GB GPUs with NVLink interconnect for ML training and inference workloads. Pre-configured with CUDA 12, PyTorch, and TensorFlow. Billed per compute-hour.",
    basePrice: 1299900, // $12,999.00
    category: "Compute",
    tier: "Enterprise",
  },
  {
    id: "prod_004",
    sku: "MRD-K8S-004",
    name: "Managed Kubernetes Orchestrator",
    description:
      "Fully managed K8s control plane with auto-scaling node pools, Istio service mesh, and integrated CI/CD pipelines. Supports up to 500 pods with zero-downtime deployments.",
    basePrice: 179900, // $1,799.00
    category: "Platform",
    tier: "Premium",
  },
  {
    id: "prod_005",
    sku: "MRD-RAP-005",
    name: "Real-Time Analytics Pipeline",
    description:
      "Stream processing engine built on Apache Flink with sub-second latency. Ingests up to 1M events/sec with exactly-once semantics, pre-built connectors for Kafka, Redis, and PostgreSQL.",
    basePrice: 349900, // $3,499.00
    category: "Data",
    tier: "Premium",
  },
];

// ---------------------------------------------------------------------------
// Helper: Format cents → display price string
// ---------------------------------------------------------------------------
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
