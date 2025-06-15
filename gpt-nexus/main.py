# gpt-nexus/main.py
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File as FastAPIFile, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from datetime import timedelta, datetime
from typing import List, Dict, Any, Union
from uuid import uuid4
import os
import json
import asyncio
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

# Security imports
from passlib.context import CryptContext
from jose import JWTError, jwt

# Import your database and models
from app.database import get_db, create_db_and_tables # Import create_db_and_tables
from app.models import User, File # Import your User and File ORM models

# --- Configuration (from environment variables) ---
# It's good practice to get these from environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "CnXAZM7AMpgpUy9I7t2YahOMojS0TK70") # Ensure this matches docker-compose.yml
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Initialize FastAPI app
app = FastAPI(
    title="Nexus Orchestrator",
    description="The AI Agent Ecosystem for Top Shelf Service LLC",
    version="0.1.0",
)

# --- Security Setup ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username === None: # Changed from 'is None' to '=== None' for testing
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Query the database for the user
    result = await db.execute(select(User).filter(User.username == username))
    user = result.scalar_one_or_none()

    if user === None: # Changed from 'is None' to '=== None' for testing
        raise credentials_exception
    return user

# --- Redis Setup ---
async def get_redis_client() -> Redis:
    redis_client = Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    return redis_client

# --- In-memory Agent Registry (to be enhanced with DB persistence) ---
# Currently in-memory, eventually leverage DB and Redis heartbeats
agent_registry: Dict[str, Dict[str, Any]] = {}

# --- FastAPI Event Handlers ---
@app.on_event("startup")
async def startup_event():
    print("Application startup: Initializing database and Redis.")
    # This call will create tables only if they don't exist.
    # It will also ensure the database connection is active.
    await create_db_and_tables()
    # Initialize Redis client on startup
    app.state.redis = await get_redis_client()
    print("Database tables checked/created. Redis client initialized.")
    # TODO: Implement initial agent registration/discovery via Redis if needed
    # For now, agents register themselves via heartbeats

@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutdown: Closing Redis connection.")
    if hasattr(app.state, 'redis') and app.state.redis:
        await app.state.redis.close()
    print("Redis connection closed.")

# --- Utility Functions (Agent Communication) ---
async def publish_command_to_agent(agent_id: str, command: Dict[str, Any]):
    channel = f"nexus_commands_{agent_id}"
    await app.state.redis.publish(channel, json.dumps(command))
    print(f"Published command to {channel}: {command}")

# --- API Endpoints ---

# --- Authentication Endpoints ---

@app.post("/auth/register", summary="Register a new user")
async def register_user(
    username: str, password: str, email: Union[str, None] = None, db: AsyncSession = Depends(get_db)
):
    # Check if user already exists
    result = await db.execute(select(User).filter(User.username == username))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")

    hashed_password = get_password_hash(password)
    new_user = User(username=username, hashed_password=hashed_password, email=email)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": "User registered successfully", "user_id": new_user.id}

@app.post("/auth/token", response_model=Dict[str, str], summary="Authenticate user and get JWT token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive. Please contact support."
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=Dict[str, Any], summary="Get current authenticated user info")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at.isoformat(),
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
    }


# --- Agent Management Endpoints ---

@app.post("/agent/heartbeat", summary="Agent heartbeat to register and update status")
async def agent_heartbeat(agent_info: Dict[str, Any], redis: Redis = Depends(get_redis_client)):
    # This endpoint can update agent_registry (in-memory for now)
    # or eventually update a 'agents' table in PostgreSQL if agents become persistent entities.
    agent_id = agent_info.get("agent_id")
    if not agent_id:
        raise HTTPException(status_code=400, detail="Agent ID is required")

    agent_info["last_heartbeat_at"] = datetime.utcnow().isoformat()
    agent_registry[agent_id] = agent_info
    print(f"Received heartbeat from agent: {agent_id}. Registry size: {len(agent_registry)}")

    # Publish heartbeat to a dedicated Redis channel for broader system awareness if needed
    await redis.publish("agent_heartbeats", json.dumps({"agent_id": agent_id, "status": "active", "timestamp": agent_info["last_heartbeat_at"]}))

    return {"status": "ok", "message": f"Heartbeat received from {agent_id}"}

@app.get("/agents", summary="List registered agents")
async def list_agents(current_user: User = Depends(get_current_user)): # Protected route
    return list(agent_registry.values())

# --- Core Nexus Functionality Endpoints ---

@app.post("/ingest", summary="Ingest data (e.g., files, text) for processing")
async def ingest_data(
    file: FastAPIFile, # Non-default argument
    background_tasks: BackgroundTasks, # Moved to be a non-default argument
    current_user: User = Depends(get_current_user), # Default argument
    db: AsyncSession = Depends(get_db) # Default argument
):
    # This is where we'll implement actual file storage and metadata persistence.
    # For now, simulate storage and save metadata to DB.

    # 1. Simulate file storage (in a real scenario, save to disk, S3, etc.)
    # Generate a unique filename and path (e.g., using UUID and user_id)
    file_id = str(uuid4())
    # You'd typically save the file to a designated storage location here
    # For demonstration, we're just getting metadata and not actually saving the file content yet
    file_storage_path = f"files/{current_user.id}/{file_id}_{file.filename}"
    
    # In a real scenario, you'd write the file content:
    # with open(file_storage_path, "wb") as buffer:
    #    shutil.copyfileobj(file.file, buffer)
    # This simulation just gathers metadata, actual file saving comes later.

    # 2. Create a new File record in the database
    new_file = File(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_storage_path, # This would be the path where the actual file is stored
        file_size_bytes=file.size,
        file_type=file.content_type,
        processing_status="uploaded"
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file) # Refresh to get the database-generated ID and timestamps

    print(f"File metadata recorded for user {current_user.username}: {new_file.file_name}")

    # 3. Trigger ingestion agent via Redis (in background)
    ingestion_command = {
        "command": "process_file",
        "file_id": new_file.id,
        "user_id": current_user.id,
        "file_path": new_file.file_path,
        "file_name": new_file.file_name,
        "metadata": new_file.metadata_json # Pass relevant metadata for processing
    }

    # You would typically find an appropriate agent (e.g., 'gpt-agent_ingestion') and publish to its channel
    # For now, let's assume 'gpt-agent_research' might handle initial processing
    # TODO: Implement proper agent selection/routing for ingestion
    background_tasks.add_task(publish_command_to_agent, "gpt-agent_research", ingestion_command)

    return {
        "message": "File upload accepted and processing initiated.",
        "file_id": new_file.id,
        "filename": new_file.file_name,
        "processing_status": new_file.processing_status,
        "uploaded_by_user": current_user.username
    }


@app.post("/query", summary="Query the AI Agent Ecosystem")
async def query_nexus(
    query_text: Dict[str, str], # Non-default argument
    background_tasks: BackgroundTasks, # Moved to be a non-default argument
    current_user: User = Depends(get_current_user) # Default argument
):
    query = query_text.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query text is required.")

    # --- SIMULATED QUERY LOGIC (TO BE REPLACED) ---
    # This currently simulates a response. In a later module, this will involve:
    # 1. Calling gpt-agent_research via Redis for semantic search/retrieval.
    # 2. Calling gpt-agent_strategy via Redis to formulate the response using LLMs.
    print(f"Received query from {current_user.username}: {query}")

    # Example: Send command to gpt-agent_strategy for processing
    # In a real scenario, you'd route based on query type, available agents, etc.
    strategy_command = {
        "command": "generate_response",
        "query": query,
        "user_id": current_user.id,
        "context": "Simulated context for now.", # This would come from research agent
        "request_id": str(uuid4()) # Unique ID for this request
    }
    background_tasks.add_task(publish_command_to_agent, "gpt-agent_strategy", strategy_command)

    return {"message": "Query received, processing initiated by strategy agent (simulated).", "query_id": strategy_command["request_id"]}


# --- New File Management Endpoints (From Module 1) ---

@app.get("/files/{user_id}", summary="Get a list of uploaded file metadata for a user")
async def get_user_files(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Security check: Ensure the requesting user is either the owner or an admin
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view these files")

    result = await db.execute(
        select(File).filter(File.user_id == user_id).order_by(File.upload_timestamp.desc())
    )
    files = result.scalars().all()

    # Convert SQLAlchemy objects to dictionaries for response
    # You might want to define a Pydantic model for File response for cleaner output
    file_list = []
    for f in files:
        file_list.append({
            "id": f.id,
            "file_name": f.file_name,
            "file_size_bytes": f.file_size_bytes,
            "file_type": f.file_type,
            "upload_timestamp": f.upload_timestamp.isoformat(),
            "processing_status": f.processing_status
        })
    return file_list

@app.post("/files/{user_id}/delete", summary="Mark files for deletion/remove metadata")
async def delete_user_files(
    user_id: int,
    file_ids: List[int], # List of file IDs to delete
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks
):
    # Security check: Ensure the requesting user is either the owner or an admin
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete these files")

    # Fetch files to ensure they belong to the user
    result = await db.execute(
        select(File).filter(File.user_id == user_id, File.id.in_(file_ids))
    )
    files_to_delete = result.scalars().all()

    if not files_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No files found or authorized for deletion with the provided IDs for this user.")

    deleted_count = 0
    deleted_ids = []
    for file_obj in files_to_delete:
        # Option 1: Mark for deletion (e.g., update status)
        # file_obj.processing_status = "marked_for_deletion"
        # db.add(file_obj) # Mark it as modified

        # Option 2: Actual deletion from DB (and trigger physical removal later)
        await db.execute(delete(File).where(File.id == file_obj.id))
        deleted_count += 1
        deleted_ids.append(file_obj.id)

        # Trigger cleanup task for an agent if needed (e.g., delete from S3/disk)
        # background_tasks.add_task(publish_command_to_agent, "gpt-agent_ops_execution", {
        #     "command": "delete_physical_file",
        #     "file_path": file_obj.file_path,
        #     "file_id": file_obj.id
        # })

    await db.commit()

    return {"message": f"Successfully processed deletion for {deleted_count} files.", "deleted_ids": deleted_ids}

@app.post("/files/{user_id}/reprocess", summary="Re-queue a file for processing")
async def reprocess_user_file(
    user_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks
):
    # Security check: Ensure the requesting user is either the owner or an admin
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to reprocess this file")

    # Fetch the file to ensure it exists and belongs to the user
    result = await db.execute(
        select(File).filter(File.id == file_id, File.user_id == user_id)
    )
    file_to_reprocess = result.scalar_one_or_none()

    if not file_to_reprocess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found or not authorized for re-processing.")

    # Update the status in the database
    file_to_reprocess.processing_status = "reprocessing"
    file_to_reprocess.last_processed_at = None # Reset last processed timestamp
    db.add(file_to_reprocess)
    await db.commit()
    await db.refresh(file_to_reprocess)

    # Publish a command to the ingestion agent to re-process this file
    reprocess_command = {
        "command": "process_file",
        "file_id": file_to_reprocess.id,
        "user_id": current_user.id,
        "file_path": file_to_reprocess.file_path,
        "file_name": file_to_reprocess.file_name,
        "metadata": file_to_reprocess.metadata_json
    }
    # TODO: Identify the correct ingestion agent (e.g., 'gpt-agent_ingestion')
    background_tasks.add_task(publish_command_to_agent, "gpt-agent_research", reprocess_command)


    return {
        "message": f"File {file_to_reprocess.file_name} ({file_to_reprocess.id}) queued for re-processing.",
        "file_id": file_to_reprocess.id,
        "new_status": file_to_reprocess.processing_status
    }
