"""
Meridian ML Engine — River Online Regression Pipeline
======================================================
Uses River's online learning to continuously train and predict
price multipliers from streaming telemetry data.

Pipeline: StandardScaler → HoeffdingTreeRegressor

The model:
  1. Receives features + a heuristic target multiplier
  2. Calls learn_one(features, target) to update the model
  3. Calls predict_one(features) to get the live prediction
  4. If the prediction is outside the [0.90, 1.10] safe zone,
     the RevOps Agent audits it against revenue playbooks.
  5. Returns the final multiplier, clamped to [0.80, 1.30]
"""

from __future__ import annotations

import logging
 
from river import compose, preprocessing, forest

from models import FeatureVector

logger = logging.getLogger("meridian.ml_pipeline")

# =============================================================================
# Multiplier bounds — prevent extreme pricing
# =============================================================================
MIN_MULTIPLIER = 0.85  # Max 15% discount
MAX_MULTIPLIER = 1.30  # Max 30% markup

# RevOps audit thresholds — outside this range triggers LLM review
SAFE_ZONE_LOW = 0.90
SAFE_ZONE_HIGH = 1.10


# =============================================================================
# River Pipeline — initialized once at module level
# =============================================================================

def _build_pipeline() -> compose.Pipeline:
    """
    Upgraded from single Hoeffding Tree to an Adaptive Random Forest.
    This runs multiple trees in parallel, heavily increasing accuracy
    and naturally resisting noise.
    """
    return compose.Pipeline(
        preprocessing.StandardScaler(),
        forest.ARFRegressor(
            n_models=10,          # Runs 10 decision trees in parallel
            grace_period=50,      # Samples before splitting
            aggregation_method='mean',
        ),
    )


# Global model instance — shared across all requests
# River models are lightweight and designed for single-threaded online updates.
# In production, you'd use a model registry or per-worker instances.
model = _build_pipeline()

# Track if the model has been trained at all
_samples_seen: int = 0


# EMA blending weight — higher = more inertia (smoother curves)
EMA_ALPHA = 0.30  # 30% new prediction, 70% current price


def train_and_predict(
    features: FeatureVector,
    target: float,
    product_id: str = "",
    current_stock: int = 100,
    event_type: str = "",
    skip_audit: bool = False,
    current_multiplier: float = 1.0,
) -> tuple[float, bool]:
    """
    Online learning cycle:
      1. learn_one(x, y) — update the model with the new data point
      2. predict_one(x) — get the live prediction
      3. If prediction is outside safe zone [0.90, 1.10], trigger RevOps audit
         (unless skip_audit is True due to cooldown)
      4. Return (final_multiplier, was_audited)

    Args:
        features: Engineered feature vector
        target: Heuristic target multiplier for online learning
        product_id: Product being priced (for RevOps context)
        current_stock: Current stock level (for RevOps context)
        event_type: Recent event type (for RevOps context)
        skip_audit: If True, skip the LLM audit (cooldown active)

    Returns (multiplier, was_audited) tuple.
    """
    global _samples_seen

    x = features.to_dict()

    # ─── Train ───────────────────────────────────────────────────
    model.learn_one(x, target)
    _samples_seen += 1

    # ─── Predict ─────────────────────────────────────────────────
    raw_prediction = model.predict_one(x)

    # Early predictions (before enough data) may be 0.0 or wild
    if raw_prediction is None or raw_prediction == 0.0:
        raw_prediction = target

    # ─── EMA Smoothing ───────────────────────────────────────────
    # Blend the new prediction with the current price to prevent
    # jumps and create smooth, continuous market curves.
    smoothed = (current_multiplier * (1 - EMA_ALPHA)) + (raw_prediction * EMA_ALPHA)

    # Clamp to safe bounds
    multiplier = max(MIN_MULTIPLIER, min(MAX_MULTIPLIER, smoothed))

    logger.info(
        f"🧠 ML #{_samples_seen}: target={target:.3f} "
        f"raw={raw_prediction:.4f} ema={smoothed:.4f} final={multiplier:.4f}"
    )

    was_audited = False

    # ─── RevOps Audit (outside safe zone) ────────────────────────
    if multiplier < SAFE_ZONE_LOW or multiplier > SAFE_ZONE_HIGH:
        if skip_audit:
            logger.info(
                f"⏳ [REVOPS COOLDOWN] multiplier={multiplier:.4f} outside safe zone "
                f"but audit skipped (cooldown active for {product_id})"
            )
        else:
            logger.info(
                f"⚡ [REVOPS TRIGGER] multiplier={multiplier:.4f} "
                f"outside safe zone [{SAFE_ZONE_LOW}, {SAFE_ZONE_HIGH}]"
            )
            try:
                from revops_agent import get_revops_agent

                agent = get_revops_agent()
                decision = agent.audit_price(
                    product_id=product_id,
                    current_stock=current_stock,
                    proposed_multiplier=multiplier,
                    recent_events=f"Latest event: {event_type}",
                )

                logger.info(
                    f"🤖 [REVOPS AUDIT] {decision.action}: "
                    f"ML={multiplier:.4f} → Agent={decision.final_multiplier:.4f}"
                )
                logger.info(f"📝 [REVOPS REASON] {decision.reasoning}")

                # Use the agent's decision
                multiplier = decision.final_multiplier
                was_audited = True

            except Exception as e:
                logger.error(
                    f"❌ [REVOPS ERROR] Agent failed: {e}. "
                    f"Using ML prediction as fallback."
                )
                # On any agent error, keep the ML prediction
    else:
        logger.debug(
            f"✅ multiplier={multiplier:.4f} in safe zone — skipping RevOps audit"
        )

    return multiplier, was_audited


def get_model_stats() -> dict:
    """Return basic stats about the model for the health endpoint."""
    return {
        "samples_seen": _samples_seen,
        "model_type": "StandardScaler | HoeffdingTreeRegressor",
        "multiplier_bounds": [MIN_MULTIPLIER, MAX_MULTIPLIER],
        "safe_zone": [SAFE_ZONE_LOW, SAFE_ZONE_HIGH],
        "revops_enabled": True,
    }
