# gpt-agent_strategy/agent_app.py
import asyncio
import httpx
import redis.asyncio as redis
import os
import json
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

# --- Agent Configuration ---
AGENT_ID = "gpt-agent_strategy-001"
AGENT_NAME = "Strategy Agent Prime"
AGENT_TYPE = "strategy"
AGENT_CAPABILITIES = "Task planning, request analysis"

NEXUS_ORCHESTRATOR_URL = "http://gpt-nexus:8000"
HEARTBEAT_INTERVAL_SECONDS = 10

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

PUBSUB_CHANNEL_ORCHESTRATOR_INBOX = "orchestrator_inbox"
PUBSUB_CHANNEL_AGENT_COMMANDS = f"agent_commands:{AGENT_ID}"

# --- Pydantic Models (Copied for consistency) ---
class AgentRegistration(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    capabilities: str = ""

class RedisMessage(BaseModel):
    sender_id: str
    message_type: str
    payload: Dict[str, Any]

class ToolCallPayload(BaseModel):
    tool_name: str
    tool_arguments: Dict[str, Any]

# --- Agent Specific Tool Implementations ---


async def plan_task(request: str) -> Dict[str, Any]:
    """Simulates planning a task based on a high-level request."""
    print(f"Strategy Agent received request to plan: '{request}'")
    if "research topic X and email client Y" in request.lower():
        plan = [
            {"tool_name": "perform_research", "tool_arguments": {"query": "topic X", "source": "internal_docs"}},
            {"tool_name": "send_communication", "tool_arguments": {"recipient": "client Y", "channel": "email", "message_content": "Research results for topic X: [research_result_placeholder]"}}
        ]
        return {"plan": plan, "description": "Planned research and email task."}
    elif "list all agents" in request.lower():
        plan = [
            {"tool_name": "get_agent_status", "tool_arguments": {"agent_id": "all"}}
        ]
        return {"plan": plan, "description": "Planned to list all agents."}
    else:
        return {"plan": [], "description": f"No specific plan defined for: '{request}'. Needs manual review."}


# --- Generic Agent Functions ---

async def register_agent():
    async with httpx.AsyncClient() as client:
        registration_data = AgentRegistration(
            agent_id=AGENT_ID, agent_name=AGENT_NAME, agent_type=AGENT_TYPE, capabilities=AGENT_CAPABILITIES
        ).model_dump_json()
        try:
            print(f"Attempting to register agent {AGENT_ID}...")
            response = await client.post(f"{NEXUS_ORCHESTRATOR_URL}/agents/register", content=registration_data, headers={"Content-Type": "application/json"}, timeout=5.0)
            response.raise_for_status()
            print(f"Agent {AGENT_ID} registered successfully.")
        except Exception as e: print(f"Failed to register agent {AGENT_ID}: {e}")

async def send_heartbeat():
    async with httpx.AsyncClient() as client:
        heartbeat_data = {"agent_id": AGENT_ID}
        try:
            response = await client.post(f"{NEXUS_ORCHESTRATOR_URL}/agents/heartbeat", json=heartbeat_data, timeout=5.0)
            response.raise_for_status()
        except Exception as e: print(f"Failed to send heartbeat for {AGENT_ID}: {e}")

async def heartbeat_task():
    while True:
        await send_heartbeat()
        await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)

async def redis_listener(redis_conn: redis.Redis):
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe(PUBSUB_CHANNEL_AGENT_COMMANDS)
    print(f"Agent {AGENT_ID} subscribed to Redis channel: {PUBSUB_CHANNEL_AGENT_COMMANDS}")

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                channel = message['channel'].decode('utf-8')
                data = message['data'].decode('utf-8')
                print(f"Agent {AGENT_ID} received Redis message on channel '{channel}': {data}")

                try:
                    msg = RedisMessage.model_validate_json(data)
                    if msg.message_type == "tool_command":
                        print(f"Agent {AGENT_ID} received tool command from {msg.sender_id}: {msg.payload}")
                        try:
                            tool_call_payload = ToolCallPayload.model_validate(msg.payload)
                            result = {}
                            # --- Tool Dispatch Logic (Generated) ---
                            
if tool_call_payload.tool_name == "plan_task":
    request = tool_call_payload.tool_arguments.get("request")
    result = await plan_task(request)
else:
    result = {"error": f"Unknown tool: {tool_call_payload.tool_name}"}

                            # --- End Tool Dispatch Logic ---

                            response_message = RedisMessage(
                                sender_id=AGENT_ID, message_type="result", payload=result
                            )
                            await redis_conn.publish(PUBSUB_CHANNEL_ORCHESTRATOR_INBOX, response_message.model_dump_json())
                            print(f"Agent {AGENT_ID} sent result back to Nexus.")

                        except Exception as tool_error:
                            error_msg = f"Error processing tool command in agent: {tool_error}"
                            print(error_msg)
                            error_response = RedisMessage(sender_id=AGENT_ID, message_type="error", payload={"error": error_msg})
                            await redis_conn.publish(PUBSUB_CHANNEL_ORCHESTRATOR_INBOX, error_response.model_dump_json())

                    else:
                        print(f"Agent {AGENT_ID} received unhandled message type: {msg.message_type}")

                except Exception as parse_error:
                    print(f"Error parsing Redis message in agent: {parse_error}. Raw data: {data}")

            await asyncio.sleep(0.01)
    except asyncio.CancelledError: print(f"Agent {AGENT_ID} Redis listener task cancelled.")
    except Exception as e: print(f"Agent {AGENT_ID} Redis listener error: {e}")
    finally:
        if pubsub: await pubsub.unsubscribe(PUBSUB_CHANNEL_AGENT_COMMANDS)

async def main():
    print(f"Starting {AGENT_NAME} ({AGENT_ID})...")
    redis_conn = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    try: await redis_conn.ping(); print("Agent connected to Redis successfully!")
    except Exception as e: print(f"Agent could not connect to Redis: {e}. Exiting."); return

    await register_agent()
    heartbeat_task_obj = asyncio.create_task(heartbeat_task())
    redis_listener_task_obj = asyncio.create_task(redis_listener(redis_conn))

    try: await asyncio.gather(heartbeat_task_obj, redis_listener_task_obj)
    except asyncio.CancelledError: print(f"Agent {AGENT_ID} main task cancelled.")
    finally:
        heartbeat_task_obj.cancel(); redis_listener_task_obj.cancel()
        await asyncio.gather(heartbeat_task_obj, redis_listener_task_obj, return_exceptions=True)
        if redis_conn: await redis_conn.close(); print("Agent Redis connection closed.")
        print(f"Agent {AGENT_ID} shutting down.")

if __name__ == "__main__":
    asyncio.run(main())