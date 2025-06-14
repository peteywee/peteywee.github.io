# gpt-nexus/main.py
from fastapi import FastAPI, WebSocket, HTTPException, status
from pydantic import BaseModel
import asyncpg
import os
from datetime import datetime, timedelta, timezone

app = FastAPI()

# --- Database Connection Setup ---
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")
POSTGRES_DB = os.getenv("POSTGRES_DB")

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

# --- Pydantic Models for Request/Response Validation ---

class AgentRegistration(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    capabilities: str = "" # Optional field

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

