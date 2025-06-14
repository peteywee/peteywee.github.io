# generate_agents.py
import os
import json
from jinja2 import Environment, FileSystemLoader

# --- Agent Definitions ---
# This dictionary defines all your agent types and their specific implementations.
# You can easily add more agents here.
AGENTS_CONFIG = [
    {
        "agent_id_prefix": "gpt-agent_comms",
        "agent_id": "gpt-agent_comms-001",
        "agent_name": "Communication Agent Prime",
        "agent_type": "comms",
        "agent_capabilities": "Send SMS, Email, Real-time Chat",
        "tool_implementations": """
async def send_communication(recipient: str, channel: str, message_content: str, subject: Optional[str] = None) -> Dict[str, str]:
    \"\"\"Simulates sending a message via a communication channel.\"\"\"
    print(f"Simulating sending message via {channel} to {recipient}: '{message_content}' (Subject: {subject})")
    # In a real agent, this would integrate with Twilio, SendGrid, etc.
    return {"status": "success", "message": f"Message sent via {channel} to {recipient}."}
""",
        "tool_dispatch_logic": """
if tool_call_payload.tool_name == "send_communication":
    recipient = tool_call_payload.tool_arguments.get("recipient")
    channel = tool_call_payload.tool_arguments.get("channel")
    message_content = tool_call_payload.tool_arguments.get("message_content")
    subject = tool_call_payload.tool_arguments.get("subject")
    result = await send_communication(recipient, channel, message_content, subject)
else:
    result = {"error": f"Unknown tool: {tool_call_payload.tool_name}"}
"""
    },
    {
        "agent_id_prefix": "gpt-agent_ops_execution",
        "agent_id": "gpt-agent_ops_execution-001",
        "agent_name": "Operations Execution Agent Prime",
        "agent_type": "ops_execution",
        "agent_capabilities": "Execute safe shell commands, list files",
        "tool_implementations": """
async def execute_shell_command(command: str, args: List[str]) -> Dict[str, str]:
    \"\"\"
    Executes a constrained shell command.
    WARNING: This is highly insecure if not carefully controlled.
    For demonstration, we whitelist simple commands.
    \"\"\"
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
""",
        "tool_dispatch_logic": """
if tool_call_payload.tool_name == "execute_shell_command":
    command = tool_call_payload.tool_arguments.get("command")
    args = tool_call_payload.tool_arguments.get("args", [])
    if isinstance(args, str): # Handle single string arg
        args = [args]
    result = await execute_shell_command(command, args)
else:
    result = {"error": f"Unknown tool: {tool_call_payload.tool_name}"}
"""
    },
    {
        "agent_id_prefix": "gpt-agent_research",
        "agent_id": "gpt-agent_research-001",
        "agent_name": "Research Agent Prime",
        "agent_type": "research",
        "agent_capabilities": "Simulated web research, internal document lookup",
        "tool_implementations": """
async def perform_research(query: str, source: str = "web_mock") -> Dict[str, str]:
    \"\"\"Performs a simulated research lookup.\"\"\"
    print(f"Performing research for query: '{query}' from source: '{source}'")
    if source == "web_mock":
        if "AI-driven services" in query.lower():
            return {"result": "AI-driven services are rapidly expanding, particularly in logistics and automation. Increased demand is projected over the next 5 years.", "source": "simulated_web_search"}
        elif "project alpha" in query.lower():
            return {"result": "Project Alpha information: The new automated testing procedure has significantly boosted efficiency. Details are in internal Q2 report.", "source": "simulated_web_search"}
        else:
            return {"result": f"Simulated web search for '{query}' found no direct match.", "source": "simulated_web_search"}
    elif source == "internal_docs":
        file_path = os.path.join("/app/mock_data", "report_q2_2025.txt")
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                content = f.read()
                if query.lower() in content.lower():
                    return {"result": f"Found relevant info in '{file_path}': \\n---\\n{content}\\n---", "source": "internal_document"}
                else:
                    return {"result": f"Found internal document '{file_path}', but query '{query}' not found within.", "source": "internal_document"}
        else:
            return {"error": "Internal document 'report_q2_2025.txt' not found.", "source": "internal_document_error"}
    else:
        return {"error": f"Unknown research source: {source}", "source": "invalid_source"}
""",
        "tool_dispatch_logic": """
if tool_call_payload.tool_name == "perform_research":
    query = tool_call_payload.tool_arguments.get("query")
    source = tool_call_payload.tool_arguments.get("source", "web_mock")
    result = await perform_research(query, source)
else:
    result = {"error": f"Unknown tool: {tool_call_payload.tool_name}"}
"""
    },
    {
        "agent_id_prefix": "gpt-agent_strategy",
        "agent_id": "gpt-agent_strategy-001",
        "agent_name": "Strategy Agent Prime",
        "agent_type": "strategy",
        "agent_capabilities": "Task planning, request analysis",
        "tool_implementations": """
async def plan_task(request: str) -> Dict[str, Any]:
    \"\"\"Simulates planning a task based on a high-level request.\"\"\"
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
""",
        "tool_dispatch_logic": """
if tool_call_payload.tool_name == "plan_task":
    request = tool_call_payload.tool_arguments.get("request")
    result = await plan_task(request)
else:
    result = {"error": f"Unknown tool: {tool_call_payload.tool_name}"}
"""
    }
]

# --- Jinja2 Environment Setup ---
# Use the current directory as the base for templates
script_dir = os.path.dirname(os.path.abspath(__file__))
env = Environment(loader=FileSystemLoader(os.path.join(script_dir, "templates")),
                  trim_blocks=True, # Remove leading newlines from blocks
                  lstrip_blocks=True) # Remove leading spaces/tabs from blocks

# Load templates
dockerfile_template = env.get_template("Dockerfile.j2")
requirements_template = env.get_template("requirements.txt.j2")
agent_app_template = env.get_template("agent_app.py.j2")

# --- Agent Generation Logic ---
def generate_agent_files():
    for agent_data in AGENTS_CONFIG:
        agent_dir = os.path.join(script_dir, agent_data["agent_id_prefix"])
        os.makedirs(agent_dir, exist_ok=True) # Create agent directory

        # If it's the research agent, create mock_data dir
        if agent_data["agent_id_prefix"] == "gpt-agent_research":
            mock_data_dir = os.path.join(agent_dir, "mock_data")
            os.makedirs(mock_data_dir, exist_ok=True)
            mock_file_path = os.path.join(mock_data_dir, "report_q2_2025.txt")
            if not os.path.exists(mock_file_path):
                with open(mock_file_path, "w") as f:
                    f.write("""Confidential Internal Report - Q2 2025 Summary:
Project Alpha saw a 15% increase in efficiency due to new automated testing.
Project Beta encountered delays due to supply chain issues, impacting Q2 by 8%.
Market trends indicate a growing demand for AI-driven services in logistics.
Top Shelf Service LLC is well-positioned to capitalize on this with its Nexus system.
""")
                print(f"Created mock_data/report_q2_2025.txt for {agent_data['agent_id_prefix']}")


        # Render Dockerfile
        dockerfile_content = dockerfile_template.render(agent_data)
        with open(os.path.join(agent_dir, "Dockerfile"), "w") as f:
            f.write(dockerfile_content)
        print(f"Generated Dockerfile for {agent_data['agent_id_prefix']}")

        # Render requirements.txt
        requirements_content = requirements_template.render(agent_data)
        with open(os.path.join(agent_dir, "requirements.txt"), "w") as f:
            f.write(requirements_content)
        print(f"Generated requirements.txt for {agent_data['agent_id_prefix']}")

        # Render agent_app.py
        agent_app_content = agent_app_template.render(agent_data)
        with open(os.path.join(agent_dir, "agent_app.py"), "w") as f:
            f.write(agent_app_content)
        print(f"Generated agent_app.py for {agent_data['agent_id_prefix']}")

# --- Main Execution ---
if __name__ == "__main__":
    # Ensure Jinja2 is installed
    try:
        import jinja2
    except ImportError:
        print("Jinja2 is not installed. Please install it: pip install Jinja2")
        exit(1)

    generate_agent_files()
    print("\nAll agent files generated successfully!")
    print("Next: Remember to update your docker-compose.yml to include these new services.")
    print("Then: Run 'docker-compose down && docker-compose up -d --build' to apply changes.")
