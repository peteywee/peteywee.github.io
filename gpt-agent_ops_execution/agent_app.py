# gpt-agent_ops_execution/agent_app.py
import asyncio
import httpx
import redis.asyncio as redis
import os
import json
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import subprocess # For executing shell commands

# --- Agent Configuration ---
AGENT_ID = "gpt-agent_ops_execution-001"
AGENT_NAME = "Operations Execution Agent Prime"
AGENT_TYPE = "ops_execution"
AGENT_CAPABILITIES = "Execute safe shell commands, list files"

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


async def execute_shell_command(command: str, args: List[str]) -> Dict[str, str]:
    """
    Executes a constrained shell command.
    WARNING: This is highly insecure if not carefully controlled.
    For demonstration, we whitelist simple commands.
    """
    WHILELISTED_COMMANDS = ["ls", "echo", "cat", "pwd", "date"]
    if command not in WHILELISTED_COMMANDS:
        return {"error": f"Command '{command}' is not whitelisted for execution."}

    full_command = [command] + args
    try:
        process = await asyncio.create_subprocess_exec(
            *full_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = await process.communicate()

        if process.returncode == 0:
            return {"stdout": stdout.strip(), "stderr": stderr.strip(), "success": True}
        else:
            return {"stdout": stdout.strip(), "stderr": stderr.strip(), "success": False, "return_code": process.returncode}
    except FileNotFoundError:
        return {"error": f"Command '{command}' not found. Check if it's installed and in PATH."}
    except Exception as e:
        return {"error": f"An unexpected error occurred during command execution: {e}"}


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
                            
if tool_call_payload.tool_name == "execute_shell_command":
    command = tool_call_payload.tool_arguments.get("command")
    args = tool_call_payload.tool_arguments.get("args", [])
    if isinstance(args, str): # Handle single string arg
        args = [args]
    result = await execute_shell_command(command, args)
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