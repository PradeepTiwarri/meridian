"""
Meridian Phase 4 — RevOps Auditor Agent
=========================================
A LangChain-powered AI agent that governs the ML pricing model.

When the ML model proposes a severe price swing, this agent:
  1. Retrieves relevant revenue playbooks from Supabase pgvector
  2. Routes to the appropriate LLM (fast 8B or heavy 70B)
  3. Returns a strict APPROVE/OVERRIDE decision with reasoning

Output Schema:
  {"action": "APPROVE"|"OVERRIDE", "final_multiplier": float, "reasoning": str}
"""

from __future__ import annotations

import json
import logging
import os
import re
import time

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Literal

load_dotenv()

logger = logging.getLogger("meridian.revops")

# =============================================================================
# Pydantic Output Schema
# =============================================================================

class AuditDecision(BaseModel):
    """Strict output format for the RevOps Agent."""
    action: Literal["APPROVE", "OVERRIDE"] = Field(
        description="APPROVE the ML multiplier or OVERRIDE it with a corrected value"
    )
    final_multiplier: float = Field(
        description="The approved or corrected price multiplier (0.80 - 1.30)"
    )
    reasoning: str = Field(
        description="Brief explanation of why this decision was made"
    )


# =============================================================================
# RevOps Agent
# =============================================================================

# The system prompt that turns the LLM into a strict RevOps Manager
REVOPS_SYSTEM_PROMPT = """\
You are a strict Revenue Operations (RevOps) Manager for Meridian, an enterprise B2B platform.

Your job is to audit price multipliers proposed by our ML pricing model. You must decide \
whether to APPROVE or OVERRIDE the proposed multiplier based on our revenue playbooks.

## Revenue Playbook Rules:
{playbook_rules}

## Current Context:
- Product ID: {product_id}
- Current Stock Level: {current_stock} units
- Proposed ML Multiplier: {proposed_multiplier}
- Recent Events: {recent_events}

## Instructions:
1. Compare the proposed multiplier against the playbook rules above.
2. Consider the stock level and recent market events.
3. If the multiplier violates any playbook rule, OVERRIDE it with a compliant value.
4. If the multiplier is within policy bounds, APPROVE it.
5. Always provide clear reasoning.

## Response Format:
You MUST respond with ONLY a valid JSON object matching this exact schema:
{{"action": "APPROVE" or "OVERRIDE", "final_multiplier": <float>, "reasoning": "<string>"}}

Do NOT include any text before or after the JSON. Only output the JSON object."""


class RevOpsAgent:
    """
    LangChain agent that audits ML price predictions against
    revenue playbooks stored in Supabase pgvector.
    """

    def __init__(self):
        """Initialize the agent with embedding model, Supabase client, and LLM instances."""
        logger.info("🤖 Initializing RevOps Agent...")

        # ─── Redis publisher for agent monologue broadcast ───────────
        import redis as sync_redis
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self._redis_pub = sync_redis.from_url(redis_url)
        logger.info("   ✅ Redis publisher connected (agent broadcast)")

        # ─── Embedding model (direct SentenceTransformer, no LangChain wrapper) ──
        from sentence_transformers import SentenceTransformer
        self._embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("   ✅ Embedding model loaded (all-MiniLM-L6-v2)")

        # ─── Supabase client (direct, no LangChain wrapper) ──────────
        from supabase import create_client

        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")

        self._supabase = create_client(supabase_url, supabase_key)
        logger.info("   ✅ Supabase client connected")

        # ─── LLM instances (tiered routing) ──────────────────────────
        from langchain_groq import ChatGroq

        groq_key = os.getenv("GROQ_API_KEY")

        self._fast_llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=groq_key,
            temperature=0.0,
            max_tokens=512,
        )

        self._heavy_llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=groq_key,
            temperature=0.0,
            max_tokens=1024,
        )
        logger.info("   ✅ LLMs initialized (fast=8B, heavy=70B)")
        logger.info("🤖 RevOps Agent ready")

    def _broadcast(self, step: str, message: str, product_id: str = "") -> None:
        """Broadcast agent monologue step to Redis for the admin dashboard."""
        try:
            payload = json.dumps({
                "step": step,
                "message": message,
                "product_id": product_id,
                "timestamp": time.time(),
            })
            self._redis_pub.publish("meridian_agent_logs", payload)
        except Exception:
            pass  # Never let broadcast failures affect the audit

    def _retrieve_playbooks(
        self,
        product_id: str,
        current_stock: int,
        proposed_multiplier: float,
    ) -> str:
        """
        Retrieve relevant playbook rules via direct Supabase RPC call
        to the match_playbooks function (cosine similarity search).
        """
        # Build a natural language query describing the situation
        query_parts = [f"pricing policy for product {product_id}"]

        if current_stock < 10:
            query_parts.append("low stock surge pricing")
        elif current_stock > 80:
            query_parts.append("high inventory clearance discount")

        if proposed_multiplier < 1.0:
            query_parts.append("discount pricing policy floor price")
        elif proposed_multiplier > 1.10:
            query_parts.append("surge pricing cap maximum multiplier")

        query = " ".join(query_parts)

        # Embed the query using SentenceTransformer directly
        query_embedding = self._embed_model.encode(query).tolist()

        # Call our match_playbooks RPC function
        result = self._supabase.rpc(
            "match_playbooks",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.3,
                "match_count": 3,
            },
        ).execute()

        if not result.data:
            return (
                "No specific playbook rules found. Use general pricing guidelines: "
                "multipliers should stay between 0.85 and 1.30."
            )

        rules = []
        for i, row in enumerate(result.data, 1):
            rules.append(f"### Rule {i} (similarity={row.get('similarity', 0):.3f}):\n{row['content']}")

        return "\n\n".join(rules)

    def _select_llm(self, proposed_multiplier: float):
        """
        Route to the appropriate LLM based on severity.
        - Safe zone [0.90, 1.10]: fast 8B model (standard compliance)
        - Outside: heavy 70B model (market shift analysis)
        """
        if 0.90 <= proposed_multiplier <= 1.10:
            logger.info("   🟢 Routing to fast LLM (llama-3.1-8b)")
            return self._fast_llm
        else:
            severity = "DEEP DISCOUNT" if proposed_multiplier < 0.90 else "HEAVY SURGE"
            logger.info(f"   🔴 Routing to heavy LLM (llama-3.3-70b) — {severity}")
            return self._heavy_llm

    def _parse_decision(self, raw_output: str, proposed_multiplier: float) -> AuditDecision:
        """
        Parse the LLM's JSON output into an AuditDecision.
        Includes fallback handling for malformed responses.
        """
        # Try to extract JSON from the response
        text = raw_output.strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)

        # Try direct JSON parse
        try:
            data = json.loads(text)
            return AuditDecision(**data)
        except (json.JSONDecodeError, Exception):
            pass

        # Try to find JSON object in the text
        json_match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                return AuditDecision(**data)
            except (json.JSONDecodeError, Exception):
                pass

        # Fallback: couldn't parse → approve with warning
        logger.warning(f"⚠️  Failed to parse LLM output, approving by default: {text[:200]}")
        return AuditDecision(
            action="APPROVE",
            final_multiplier=proposed_multiplier,
            reasoning=f"[PARSE FALLBACK] LLM output could not be parsed. Approving ML prediction as-is.",
        )

    def audit_price(
        self,
        product_id: str,
        current_stock: int,
        proposed_multiplier: float,
        recent_events: str = "N/A",
    ) -> AuditDecision:
        """
        Audit a proposed ML price multiplier against revenue playbooks.

        Args:
            product_id: The product being priced
            current_stock: Current inventory level
            proposed_multiplier: Raw ML model output
            recent_events: Description of recent telemetry events

        Returns:
            AuditDecision with action (APPROVE/OVERRIDE), final_multiplier, reasoning
        """
        logger.info(
            f"🔍 [REVOPS AUDIT] Auditing {product_id}: "
            f"multiplier={proposed_multiplier:.4f} stock={current_stock}"
        )

        # ── Broadcast: TRIGGER ───────────────────────────────────
        self._broadcast(
            "TRIGGER",
            f"Anomaly detected: Multiplier {proposed_multiplier:.4f} "
            f"exceeds safe zone [0.90, 1.10] for {product_id} (stock={current_stock}).",
            product_id,
        )

        # 1. Retrieve relevant playbook rules
        playbook_rules = self._retrieve_playbooks(
            product_id, current_stock, proposed_multiplier
        )
        logger.info(f"   📚 Retrieved playbook rules ({len(playbook_rules)} chars)")

        # ── Broadcast: RETRIEVAL ─────────────────────────────────
        self._broadcast(
            "RETRIEVAL",
            f"Searched Supabase pgvector for pricing rules. "
            f"Retrieved {len(playbook_rules)} chars of playbook context.",
            product_id,
        )

        # 2. Select LLM based on severity
        llm = self._select_llm(proposed_multiplier)
        severity = "HEAVY" if proposed_multiplier < 0.90 or proposed_multiplier > 1.10 else "STANDARD"
        model_name = "Llama 3.3 70B" if severity == "HEAVY" else "Llama 3.1 8B"

        # ── Broadcast: REASONING ─────────────────────────────────
        self._broadcast(
            "REASONING",
            f"Routing to {model_name} for {severity.lower()} analysis. "
            f"Proposed multiplier: {proposed_multiplier:.4f}.",
            product_id,
        )

        # 3. Build the prompt
        prompt = REVOPS_SYSTEM_PROMPT.format(
            playbook_rules=playbook_rules,
            product_id=product_id,
            current_stock=current_stock,
            proposed_multiplier=f"{proposed_multiplier:.4f}",
            recent_events=recent_events,
        )

        # 4. Invoke the LLM
        try:
            response = llm.invoke(prompt)
            raw_text = response.content
            logger.info(f"   💬 LLM response: {raw_text[:200]}")
        except Exception as e:
            logger.error(f"   ❌ LLM call failed: {e}")
            self._broadcast(
                "DECISION",
                f"ERROR: LLM call failed — {str(e)[:100]}. Approving ML prediction as fallback.",
                product_id,
            )
            return AuditDecision(
                action="APPROVE",
                final_multiplier=proposed_multiplier,
                reasoning=f"[LLM ERROR] {str(e)}. Approving ML prediction as fallback.",
            )

        # 5. Parse the decision
        decision = self._parse_decision(raw_text, proposed_multiplier)

        # 6. Safety clamp the final multiplier
        decision.final_multiplier = max(0.80, min(1.30, decision.final_multiplier))

        # 7. Log the decision
        emoji = "✅" if decision.action == "APPROVE" else "🔄"
        logger.info(
            f"   {emoji} [REVOPS DECISION] {decision.action}: "
            f"{proposed_multiplier:.4f} → {decision.final_multiplier:.4f}"
        )
        logger.info(f"   📝 Reasoning: {decision.reasoning}")

        # ── Broadcast: DECISION ──────────────────────────────────
        self._broadcast(
            "DECISION",
            f"{decision.action}: ML={proposed_multiplier:.4f} → "
            f"Final={decision.final_multiplier:.4f}. {decision.reasoning}",
            product_id,
        )

        return decision


# =============================================================================
# Singleton — lazy initialization (embedding model is heavy)
# =============================================================================

_agent_instance: RevOpsAgent | None = None


def get_revops_agent() -> RevOpsAgent:
    """Get or create the singleton RevOps Agent instance."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = RevOpsAgent()
    return _agent_instance
