"""
Meridian Phase 4 — Revenue Playbook Seeder
============================================
Seeds the Supabase `playbooks` table with 3 revenue policy documents,
embedded using HuggingFace's all-MiniLM-L6-v2 (384-dim vectors).

Usage:
    pip install supabase sentence-transformers
    python seed_playbooks.py

Prerequisites:
    - Run supabase_setup.sql in Supabase SQL Editor first
    - Set SUPABASE_URL and SUPABASE_ANON_KEY in ml-engine/.env
"""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env")
    sys.exit(1)


# =============================================================================
# Revenue Playbooks — Hardcoded policy documents
# =============================================================================

PLAYBOOKS = [
    {
        "content": (
            "## Enterprise Tier Pricing Policy\n\n"
            "**SKU:** MRD-APG-001 (Enterprise API Gateway)\n\n"
            "**Rule:** Never discount the Enterprise API Gateway below a 1.0 multiplier. "
            "The base cost of this product is too high and margins are thin. "
            "Any multiplier below 1.0 would result in selling below cost.\n\n"
            "**Action:** If the ML model proposes a multiplier < 1.0 for MRD-APG-001, "
            "OVERRIDE the price and set the multiplier to exactly 1.0.\n\n"
            "**Reasoning:** Enterprise products have fixed infrastructure costs. "
            "Discounting them erodes platform profitability and sets bad precedent "
            "with enterprise clients who negotiate based on published pricing."
        ),
        "metadata": {
            "policy_type": "floor_price",
            "affected_skus": ["MRD-APG-001"],
            "min_multiplier": 1.0,
            "severity": "critical",
        },
    },
    {
        "content": (
            "## High Inventory Clearance Policy\n\n"
            "**Trigger:** Stock level > 80 units AND demand velocity is low.\n\n"
            "**Rule:** If stock is above 80 and demand is low (few cart additions "
            "in the rolling window), aggressive discounts down to a 0.85 multiplier "
            "are approved to clear excess inventory.\n\n"
            "**Action:** APPROVE multipliers as low as 0.85 when stock > 80. "
            "If the ML model proposes below 0.85, OVERRIDE to 0.85.\n\n"
            "**Reasoning:** Holding excess inventory ties up capital and incurs "
            "storage costs. Controlled discounting is preferable to stagnant stock. "
            "This policy does NOT apply to Enterprise tier products."
        ),
        "metadata": {
            "policy_type": "clearance",
            "stock_threshold": 80,
            "min_multiplier": 0.85,
            "severity": "standard",
        },
    },
    {
        "content": (
            "## Low Stock Surge Pricing Rule\n\n"
            "**Trigger:** Stock drops below 10 units for any product.\n\n"
            "**Rule:** If stock drops below 10, allow surge pricing up to a 1.30 "
            "multiplier to throttle demand and prevent stockouts.\n\n"
            "**Action:** APPROVE multipliers up to 1.30 when stock < 10. "
            "If the ML model proposes above 1.30, OVERRIDE to 1.30.\n\n"
            "**Reasoning:** When inventory is critically low, surge pricing serves "
            "as a natural demand throttle. This prevents stockouts while maximizing "
            "revenue per unit. Monitor customer sentiment — if complaints spike, "
            "consider capping at 1.20 instead."
        ),
        "metadata": {
            "policy_type": "surge_cap",
            "stock_threshold": 10,
            "max_multiplier": 1.30,
            "severity": "standard",
        },
    },
]


# =============================================================================
# Embedding & Upload
# =============================================================================

def main():
    print("📚 Meridian RevOps — Playbook Seeder")
    print("=" * 50)

    # ─── 1. Initialize embedding model ───────────────────────
    print("\n🔄 Loading embedding model (all-MiniLM-L6-v2)...")
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("✅ Embedding model loaded")

    # ─── 2. Connect to Supabase ──────────────────────────────
    print(f"\n🔄 Connecting to Supabase: {SUPABASE_URL[:40]}...")
    from supabase import create_client

    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    print("✅ Supabase client initialized")

    # ─── 3. Check for existing playbooks ─────────────────────
    existing = supabase.table("playbooks").select("id").execute()
    if existing.data and len(existing.data) > 0:
        print(f"\n⚠️  Found {len(existing.data)} existing playbooks.")
        response = input("   Delete and re-seed? (y/N): ").strip().lower()
        if response == "y":
            supabase.table("playbooks").delete().neq("id", 0).execute()
            print("   🗑️  Cleared existing playbooks")
        else:
            print("   Skipping seed. Existing playbooks preserved.")
            return

    # ─── 4. Embed and upload each playbook ───────────────────
    print(f"\n📝 Seeding {len(PLAYBOOKS)} playbooks...\n")

    for i, playbook in enumerate(PLAYBOOKS, 1):
        content = playbook["content"]
        metadata = playbook["metadata"]

        # Generate embedding
        embedding = model.encode(content).tolist()
        dim = len(embedding)

        # Upload to Supabase
        row = {
            "content": content,
            "metadata": metadata,
            "embedding": embedding,
        }

        result = supabase.table("playbooks").insert(row).execute()

        policy = metadata.get("policy_type", "unknown")
        print(f"   ✅ [{i}/{len(PLAYBOOKS)}] {policy} — {dim}-dim embedding uploaded")

    # ─── 5. Verify ───────────────────────────────────────────
    print("\n" + "=" * 50)
    verify = supabase.table("playbooks").select("id, metadata").execute()
    print(f"✅ Verification: {len(verify.data)} playbooks in Supabase")
    for row in verify.data:
        meta = row.get("metadata", {})
        print(f"   • ID {row['id']}: {meta.get('policy_type', 'unknown')} "
              f"(severity: {meta.get('severity', 'n/a')})")

    print("\n🎉 Playbook seeding complete! Ready for RevOps Agent.")


if __name__ == "__main__":
    main()
