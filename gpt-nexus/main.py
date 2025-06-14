# gpt-nexus/main.py
from fastapi import FastAPI, WebSocket, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
import asyncpg
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import redis.asyncio as redis # NEW: Import async Redis client
import asyncio # NEW: For managing async tasks

app = FastAPI()

# --- Database Connection Setup ---
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")
POSTGRES_DB = os.getenv("POSTGRES_DB")

# --- Redis Client Initialization ---
# This will be initialized in the startup event
redis_client: Optional[redis.Redis] = None
PUBSUB_CHANNEL_ORCHESTRATOR_INBOX = "orchestrator_inbox" # Channel where agents send messages TO Nexus
PUBSUB_CHANNEL_AGENT_COMMANDS_PREFIX = "agent_commands:" # Prefix for channels where Nexus sends commands TO agents

async def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = await asyncpg.connect(
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            database=POSTGRES_DB
        )
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

# --- Agent Management Pydantic Models ---

class AgentRegistration(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    capabilities: str = "" # Optional field, can be JSON string

class AgentHeartbeat(BaseModel):
    agent_id: str

class AgentInfo(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    agent_status: str
    last_heartbeat: datetime
    created_at: datetime
    capabilities: str

# --- Tool/Function Calling Schemas (OpenAI-style) ---

class FunctionParameters(BaseModel):
    type: str = "object"
    properties: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="A mapping of parameter names to their JSON Schema definitions.")
    required: List[str] = Field(default_factory=list, description="A list of required parameter names.")
    model_config = {'extra': 'forbid'}

class ToolDefinition(BaseModel):
    name: str = Field(..., description="The name of the function to call. Must be unique.")
    description: Optional[str] = Field(None, description="A brief description of what the function does.")
    parameters: FunctionParameters = Field(..., description="The input parameters of the function, described as a JSON Schema object.")
    type: str = "function"

class ToolCall(BaseModel):
    tool_name: str = Field(..., description="The name of the tool chosen by the AI.")
    tool_arguments: Dict[str, Any] = Field(..., description="The arguments to call the tool with, as a JSON object matching the tool's schema.")

# --- Redis Pub/Sub Pydantic Models ---
class RedisMessage(BaseModel):
    sender_id: str
    message_type: str # e.g., "command", "result", "status_update"
    payload: Dict[str, Any] # The actual data to be sent

# --- FastAPI Lifespan Events ---

@app.on_event("startup")
async def startup_event():
    global redis_client
    try:
        redis_client = redis.Redis(host=os.getenv("REDIS_HOST"), port=int(os.getenv("REDIS_PORT")), decode_responses=True)
        await redis_client.ping() # Test connection
        print("Connected to Redis successfully!")
        # Start a background task to listen for messages on Nexus's inbox channel
        asyncio.create_task(redis_listener())
    except Exception as e:
        print(f"Could not connect to Redis: {e}")
        redis_client = None # Ensure client is None if connection fails
        # Depending on criticality, you might want to raise an exception to prevent app startup

@app.on_event("shutdown")
async def shutdown_event():
    if redis_client:
        await redis_client.close()
        print("Redis connection closed.")

# --- Redis Listener Background Task ---

async def redis_listener():
    """
    Listens for messages on the orchestrator's inbox channel.
    This runs continuously in the background.
    """
    if not redis_client:
        print("Redis client not initialized, cannot start listener.")
        return

    try:
        # Subscribe to Nexus's general inbox channel
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(PUBSUB_CHANNEL_ORCHESTRATOR_INBOX)
        print(f"Subscribed to Redis channel: {PUBSUB_CHANNEL_ORCHESTRATOR_INBOX}")

        while True:
            # Listen for messages with a timeout to allow for graceful shutdown
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                channel = message['channel']
                data = message['data']
                print(f"Redis message received on channel '{channel}': {data}")
                # Here, you would parse 'data' (which should be a JSON string)
                # and dispatch to appropriate handlers within Nexus.
                try:
                    msg = RedisMessage.model_validate_json(data)
                    print(f"Parsed Redis message from {msg.sender_id}, type: {msg.message_type}, payload: {msg.payload}")
                    # Example dispatch logic:
                    if msg.message_type == "result":
                        print(f"Agent {msg.sender_id} reported result: {msg.payload}")
                        # Store result in DB, update agent status, etc.
                    elif msg.message_type == "status_update":
                        print(f"Agent {msg.sender_id} status update: {msg.payload}")
                        # Update agent status in DB
                    # Add more message types and handlers as your system evolves
                except Exception as parse_error:
                    print(f"Error parsing Redis message: {parse_error}. Raw data: {data}")

            await asyncio.sleep(0.01) # Small sleep to prevent busy-waiting
    except asyncio.CancelledError:
        print("Redis listener task cancelled.")
    except Exception as e:
        print(f"Redis listener error: {e}")
    finally:
        if pubsub:
            await pubsub.unsubscribe(PUBSUB_CHANNEL_ORCHESTRATOR_INBOX)
            print(f"Unsubscribed from Redis channel: {PUBSUB_CHANNEL_ORCHESTRATOR_INBOX}")


# --- FastAPI Endpoints ---

@app.get("/")
async def read_root():
    return {"message": "Nexus Orchestrator is running and healthy!"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection established.")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received from client: {data}")
            # Simple echo for now, later integrate with agents
            await websocket.send_text(f"Message text was: {data}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        print("WebSocket connection closed.")

@app.post("/agents/register", response_model=AgentInfo, status_code=status.HTTP_201_CREATED)
async def register_agent(agent: AgentRegistration):
    """Registers a new agent with the Nexus Orchestrator."""
    conn = None
    try:
        conn = await get_db_connection()
        existing_agent = await conn.fetchrow("SELECT * FROM agents WHERE agent_id = $1", agent.agent_id)

        if existing_agent:
            query = """
                UPDATE agents
                SET agent_name = $1, agent_type = $2, capabilities = $3,
                    agent_status = 'online', last_heartbeat = NOW()
                WHERE agent_id = $4
                RETURNING *;
            """
            registered_agent = await conn.fetchrow(
                query, agent.agent_name, agent.agent_type, agent.capabilities, agent.agent_id
            )
            print(f"Agent {agent.agent_id} re-registered/updated.")
        else:
            query = """
                INSERT INTO agents (agent_id, agent_name, agent_type, capabilities, agent_status, last_heartbeat)
                VALUES ($1, $2, $3, $4, 'online', NOW())
                RETURNING *;
            """
            registered_agent = await conn.fetchrow(
                query, agent.agent_id, agent.agent_name, agent.agent_type, agent.capabilities
            )
            print(f"Agent {agent.agent_id} registered successfully.")

        if registered_agent:
            return AgentInfo(**registered_agent)
        else:
            raise HTTPException(status_code=500, detail="Failed to register/update agent.")

    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Agent with this ID already exists.")
    except Exception as e:
        print(f"Error during agent registration: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    finally:
        if conn:
            await conn.close()


@app.post("/agents/heartbeat", response_model=AgentInfo)
async def agent_heartbeat(heartbeat: AgentHeartbeat):
    """Receives a heartbeat from an agent, updating its last_heartbeat and status."""
    conn = None
    try:
        conn = await get_db_connection()
        query = """
            UPDATE agents
            SET last_heartbeat = NOW(), agent_status = 'online'
            WHERE agent_id = $1
            RETURNING *;
        """
        updated_agent = await conn.fetchrow(query, heartbeat.agent_id)

        if not updated_agent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

        print(f"Heartbeat received from agent: {heartbeat.agent_id}")
        return AgentInfo(**updated_agent)
    except Exception as e:
        print(f"Error processing heartbeat for {heartbeat.agent_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    finally:
        if conn:
            await conn.close()

@app.get("/agents/list_active", response_model=list[AgentInfo])
async def list_active_agents(heartbeat_threshold_minutes: int = 5):
    """Lists agents that have sent a heartbeat within the specified threshold."""
    conn = None
    try:
        conn = await get_db_connection()
        query = """
            SELECT *
            FROM agents
            WHERE last_heartbeat >= NOW() - INTERVAL '1 minute' * $1
            AND agent_status = 'online';
        """
        active_agents = await conn.fetch(query, heartbeat_threshold_minutes)

        offline_threshold = datetime.now(timezone.utc) - timedelta(minutes=heartbeat_threshold_minutes)
        await conn.execute(
            "UPDATE agents SET agent_status = 'offline' WHERE last_heartbeat < $1 AND agent_status = 'online';",
            offline_threshold
        )

        print(f"Listing active agents (heartbeat within {heartbeat_threshold_minutes} minutes). Found {len(active_agents)}.")
        return [AgentInfo(**agent) for agent in active_agents]
    except Exception as e:
        print(f"Error listing active agents: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    finally:
        if conn:
            await conn.close()

@app.get("/tools/list_definitions", response_model=List[ToolDefinition])
async def list_tool_definitions():
    """
    Exposes a list of tool definitions (functions) in an OpenAI-like JSON Schema format.
    These are example tools that your agents could potentially "offer" or "interpret".
    """
    example_tools = [
        ToolDefinition(
            name="send_communication",
            description="Sends a message to a recipient via a specified channel (email, sms, chat).",
            parameters=FunctionParameters(
                properties={
                    "recipient": {"type": "string", "description": "The recipient's identifier (email, phone, chat_id)."},
                    "channel": {"type": "string", "enum": ["email", "sms", "chat"], "description": "The communication channel."},
                    "message_content": {"type": "string", "description": "The content of the message to send."},
                    "subject": {"type": "string", "description": "Subject line for email, or short summary for chat/sms.", "nullable": True}
                },
                required=["recipient", "channel", "message_content"]
            )
        ),
        ToolDefinition(
            name="get_agent_status",
            description="Retrieves the current status of a specific agent by its ID.",
            parameters=FunctionParameters(
                properties={
                    "agent_id": {"type": "string", "description": "The unique identifier of the agent."}
                },
                required=["agent_id"]
            )
        )
    ]
    return example_tools

# --- New Endpoints for Redis Pub/Sub ---

@app.post("/redis/publish", status_code=status.HTTP_202_ACCEPTED)
async def publish_message(channel: str, message: RedisMessage):
    """
    Publishes a message to a specific Redis channel.
    This can be used by Nexus to send commands to agents, or by external systems
    to send messages to Nexus's inbox (orchestrator_inbox).
    """
    if not redis_client:
        raise HTTPException(status_code=500, detail="Redis client not initialized.")
    
    try:
        message_json = message.model_dump_json() # Use model_dump_json() for Pydantic v2
        await redis_client.publish(channel, message_json)
        print(f"Published to Redis channel '{channel}': {message_json}")
        return {"status": "message published", "channel": channel}
    except Exception as e:
        print(f"Error publishing to Redis channel '{channel}': {e}")
        raise HTTPException(status_code=500, detail=f"Failed to publish message: {e}")

# Example of how Nexus might instruct an agent using a tool call via Redis
@app.post("/command_agent_with_tool", status_code=status.HTTP_202_ACCEPTED)
async def command_agent_with_tool(agent_id: str, tool_call: ToolCall):
    """
    Sends a tool call command to a specific agent via Redis Pub/Sub.
    The agent subscribed to its specific command channel would receive and execute this.
    """
    if not redis_client:
        raise HTTPException(status_code=500, detail="Redis client not initialized.")

    command_channel = f"{PUBSUB_CHANNEL_AGENT_COMMANDS_PREFIX}{agent_id}"
    
    # Wrap the tool_call in our generic RedisMessage format
    message_to_send = RedisMessage(
        sender_id="nexus_orchestrator",
        message_type="tool_command",
        payload={
            "tool_name": tool_call.tool_name,
            "tool_arguments": tool_call.tool_arguments
        }
    )
    
    try:
        message_json = message_to_send.model_dump_json()
        await redis_client.publish(command_channel, message_json)
        print(f"Commanded agent '{agent_id}' on channel '{command_channel}' with tool '{tool_call.tool_name}'.")
        return {"status": "command sent", "agent_id": agent_id, "tool_name": tool_call.tool_name}
    except Exception as e:
        print(f"Error commanding agent '{agent_id}': {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send command to agent: {e}")
