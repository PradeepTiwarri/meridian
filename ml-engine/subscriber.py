"""
Meridian ML Engine — Redis Pub/Sub Subscriber
===============================================
Background worker that listens to the `meridian_telemetry_stream` channel
and forwards received events through the ML pipeline.

This runs as an asyncio task alongside the FastAPI server.
"""

from __future__ import annotations

import asyncio
import json
import logging

import redis.asyncio as aioredis

from models import TelemetryPayload

logger = logging.getLogger("meridian.subscriber")

CHANNEL = "meridian_telemetry_stream"


async def subscribe_to_telemetry(
    redis_url: str,
    process_fn,
) -> None:
    """
    Long-running coroutine that subscribes to the Redis Pub/Sub channel
    and processes each message through the ML pipeline.

    Args:
        redis_url:   Redis connection URL
        process_fn:  Async function to process each TelemetryPayload
    """
    # Create a separate Redis connection for Pub/Sub
    # (Pub/Sub connections can't be used for normal commands)
    sub_client = aioredis.from_url(redis_url, decode_responses=True)

    try:
        pubsub = sub_client.pubsub()
        await pubsub.subscribe(CHANNEL)
        logger.info(f"📡 Subscribed to Redis channel: {CHANNEL}")

        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            try:
                data = json.loads(message["data"])
                event = TelemetryPayload.model_validate(data)

                logger.info(
                    f"📨 Received {event.event_type} via Pub/Sub "
                    f"(session={event.session_id[:8]}...)"
                )

                # Process through the same ML pipeline
                await process_fn(event)

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON on {CHANNEL}: {message['data'][:100]}")
            except Exception as e:
                logger.error(f"Error processing Pub/Sub message: {e}")

    except asyncio.CancelledError:
        logger.info("Pub/Sub subscriber shutting down...")
    except Exception as e:
        logger.error(f"Pub/Sub connection error: {e}")
    finally:
        await pubsub.unsubscribe(CHANNEL)
        await sub_client.aclose()
        logger.info("Pub/Sub subscriber disconnected")
