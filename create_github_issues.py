import os
import requests
import json

# --- Configuration ---
# Get your GitHub Personal Access Token from an environment variable.
# IMPORTANT: Never hardcode your PAT directly in the script!
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
if not GITHUB_TOKEN:
    raise ValueError("GITHUB_TOKEN environment variable not set. Please set it before running the script.")

# Your repository details
# Replace 'peteywee' and 'nexus-orchestrator-project2' with your actual GitHub username/org and repository name.
GITHUB_OWNER = "peteywee"
GITHUB_REPO = "nexus-orchestrator-project2"
# Replace 'peteywee' with your GitHub username if you want to self-assign issues.
GITHUB_ASSIGNEE = "peteywee" 

# --- Function to Create an Issue ---
def create_github_issue(title, body, labels=None, assignees=None):
    """
    Creates a new issue in the specified GitHub repository.
    """
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/issues"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    data = {
        "title": title,
        "body": body,
        "labels": labels if labels is not None else [],
        "assignees": assignees if assignees is not None else []
    }

    print(f"Attempting to create issue: '{title}'...")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

        if response.status_code == 201:
            print(f"✅ Successfully created issue: '{title}'")
            print(f"   URL: {response.json().get('html_url')}")
        else:
            # This block might not be reached if raise_for_status() is used, but good for clarity.
            print(f"❌ Failed to create issue: '{title}' - Unexpected status code.")
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to create issue: '{title}' - Request error: {e}")
        if response is not None:
            print(f"   Response: {response.text}")
    except json.JSONDecodeError:
        print(f"❌ Failed to create issue: '{title}' - Invalid JSON response.")
        if response is not None:
            print(f"   Raw Response: {response.text}")
    print("-" * 50) # Separator

# --- Define all your issues ---
all_issues_data = [
    {
        "title": "🚀 P1: Implement Robust System Monitoring & Alerting",
        "body": "As our AI agent ecosystem is now live, establishing comprehensive monitoring, centralized logging, and automated alerting is the single most critical immediate step. This will provide real-time visibility into the system's health, performance, and allow for proactive identification and resolution of issues, preventing blind spots and ensuring operational stability. This is paramount for maintaining a reliable service for Top Shelf Service LLC.\n\n**Tasks (Todos):**\n- [ ] **1.1 Centralized Logging & Log Aggregation:**\n    - [ ] Configure all Docker containers (Nexus, Redis, Postgres, all agents) to log effectively to `stdout`/`stderr`.\n    - [ ] Research and select a centralized logging solution (e.g., DigitalOcean's logging, ELK stack, or a dedicated log management service).\n    - [ ] Implement and integrate the chosen logging solution across all services.\n- [ ] **1.2 System & Application Health Monitoring:**\n    - [ ] Define and implement health check endpoints for Nexus and each individual AI agent.\n    - [ ] Research and implement a metric collection system (e.g., Prometheus) to gather system and application-level metrics (CPU, memory, network, Redis ops, DB connections, API response times).\n    - [ ] Create informative dashboards (e.g., using Grafana) to visualize key performance indicators (KPIs) and system health.\n- [ ] **1.3 Automated Alerting:**\n    - [ ] Configure alerts for critical events (e.g., agent heartbeat failures, Nexus 5xx errors, high resource utilization, database disconnects).\n    - [ ] Integrate alerts with a notification channel (e.g., Slack, Email, PagerDuty) for immediate notification of critical events.",
        "labels": ["priority:critical", "observability", "devops", "enhancement"],
        "assignees": [GITHUB_ASSIGNEE]
    },
    {
        "title": "✨ P2: Build User-Friendly Interaction Interface (Web UI / CLI)",
        "body": "To maximize the usability and accessibility of the Nexus Orchestrator, we need a dedicated interface for easier interaction beyond direct API calls. This will simplify sending commands to agents and viewing their responses for both development and potential operational use.\n\n**Tasks (Todos):**\n- [ ] **2.1 Choose Interaction Medium:** Decide between building a simple web UI or a robust command-line interface (CLI) tool.\n    - [ ] If Web UI: Select a lightweight frontend framework (e.g., basic HTML/CSS/JS, Vue.js, React).\n    - [ ] If CLI: Select a Python CLI framework (e.g., `Click`, `argparse`).\n- [ ] **2.2 Design & Implement Core Interaction Flows:**\n    - [ ] Ability to send requests/commands to specific AI agents via Nexus.\n    - [ ] Ability to display agent responses clearly.\n    - [ ] (Optional) Basic status display for active agents.\n- [ ] **2.3 Integrate with Nexus API:**\n    - [ ] Develop the necessary frontend/CLI code to securely communicate with the Nexus Orchestrator's API.\n- [ ] **2.4 Deploy the Interface:**\n    - [ ] If Web UI: Deploy as a static site or integrate with the existing Nginx setup.\n    - [ ] If CLI: Ensure it's easily runnable and distributable.",
        "labels": ["priority:high", "feature", "frontend", "usability"],
        "assignees": [GITHUB_ASSIGNEE]
    },
    {
        "title": "🛡️ P3: Fortify Agent Robustness & Error Handling",
        "body": "While our agents are functional, a truly resilient system handles unexpected scenarios gracefully. This issue focuses on making agent communication and processing more robust, reducing points of failure and improving overall system stability.\n\n**Tasks (Todos):**\n- [ ] **3.1 Message Validation & Schema Enforcement:**\n    - [ ] Implement strict input validation for all messages processed by Nexus before dispatching to agents.\n    - [ ] Implement strict input validation within each agent for incoming messages from Nexus.\n    - [ ] Utilize Pydantic models effectively for data serialization and validation where applicable.\n- [ ] **3.2 Robust Error Reporting & Logging from Agents:**\n    - [ ] Standardize error reporting mechanisms for all agents to consistently send detailed error messages back to Nexus.\n    - [ ] Ensure all agent-side errors are logged comprehensively and are easily searchable (integrating with Priority 1's logging).\n- [ ] **3.3 Implement Retry Mechanisms / Idempotency:**\n    - [ ] For critical agent actions (especially those involving external services or `gpt-agent_ops_execution`), implement intelligent retry mechanisms with exponential backoff.\n    - [ ] Identify and implement idempotency patterns where appropriate to prevent unintended side effects from retries (e.g., avoiding duplicate operations).\n    - [ ] Consider implementing a Dead Letter Queue (DLQ) for messages that consistently fail processing.",
        "labels": ["priority:high", "reliability", "bug", "refinement"],
        "assignees": [GITHUB_ASSIGNEE]
    },
    {
        "title": "🔒 P4: Critical Security Audit & Hardening for Ops Execution Agent",
        "body": "The `gpt-agent_ops_execution` agent's ability to execute shell commands poses a significant security risk if not meticulously managed. A dedicated audit and hardening process are essential to prevent potential vulnerabilities and unauthorized access or command execution.\n\n**Tasks (Todos):**\n- [ ] **4.1 Review & Enforce Least Privilege:**\n    - [ ] Conduct a thorough review of the Docker container for `gpt-agent_ops_execution` to ensure it operates with the absolute minimum necessary permissions.\n    - [ ] Verify that its execution environment (e.g., the user it runs as inside the container) has restricted access.\n- [ ] **4.2 Implement Advanced Sandboxing/Isolation:**\n    - [ ] Research and implement further sandboxing measures for executed commands (e.g., Linux capabilities, seccomp profiles, AppArmor, or even executing commands in a transient, highly restricted sub-container/VM).\n    - [ ] Evaluate the current whitelist for `ops_execution` commands for any potential side-channel attacks or unintended functionality.\n- [ ] **4.3 Input Sanitization & Escaping:**\n    - [ ] Rigorously review all input paths that lead to command execution by `gpt-agent_ops_execution`.\n    - [ ] Implement robust input sanitization and shell escaping mechanisms to prevent command injection vulnerabilities.\n- [ ] **4.4 Regular Security Scans:**\n    - [ ] Integrate static analysis security testing (SAST) tools into your CI/CD pipeline for code vulnerabilities.\n    - [ ] (Optional) Consider dynamic analysis security testing (DAST) for the live system.",
        "labels": ["priority:critical", "security", "hardening", "risk-mitigation"],
        "assignees": [GITHUB_ASSIGNEE]
    },
    {
        "title": "➕ P5: Expand AI Agent Fleet & Enhance Capabilities",
        "body": "With a stable and secure foundation, we can now strategically expand the intelligence and automation capabilities of our ecosystem. This involves identifying the next high-value agent or significant enhancement to existing agents.\n\n**Tasks (Todos):**\n- [ ] **5.1 Identify Next High-Value Agent/Capability:**\n    - [ ] Brainstorm and prioritize the next key business problem or automation opportunity for Top Shelf Service LLC that an AI agent could solve (e.g., CRM integration, advanced data analysis, specialized external API integrations, self-healing capabilities).\n- [ ] **5.2 Design New Agent/Enhancement Specification:**\n    - [ ] Detail the purpose, required inputs, expected outputs, and internal logic for the chosen new agent or enhancement.\n- [ ] **5.2 Develop & Test New Agent/Enhancement:**\n    - [ ] Utilize `generate_agents.py` to rapidly scaffold new agent types.\n    - [ ] Write and rigorously test the new agent's logic.\n- [ ] **5.3 Deploy New Agent:**\n    - [ ] Leverage the existing GitHub Actions CI/CD pipeline to deploy the new agent to the DigitalOcean Droplet.",
        "labels": ["priority:medium", "feature", "innovation", "roadmap"],
        "assignees": [GITHUB_ASSIGNEE]
    },
    {
        "title": "📚 P6: Develop Comprehensive Documentation & Runbooks",
        "body": "As the AI ecosystem grows in complexity and importance, thorough documentation becomes indispensable for maintainability, troubleshooting, and potentially onboarding new contributors or understanding the system years down the line.\n\n**Tasks (Todos):**\n- [ ] **6.1 API Documentation Refinement:**\n    - [ ] Enhance the FastAPI auto-generated OpenAPI documentation with more detailed explanations, usage examples, and error codes.\n- [ ] **6.2 System Architecture & Deployment Guide:**\n    - [ ] Create a high-level overview of the entire ecosystem's architecture (Nexus, agents, message broker, database, security layers).\n    - [ ] Document detailed step-by-step instructions for deploying the entire system from scratch on a new environment.\n- [ ] **6.3 Agent Specific Documentation:**\n    - [ ] For each AI agent, create a dedicated document outlining its purpose, specific capabilities, expected inputs, outputs, and any limitations or prerequisites.\n- [ ] **6.4 Troubleshooting Runbooks:**\n    - [ ] Develop guides for common issues, including diagnostic steps, potential causes, and resolution procedures (leveraging insights from Priority 1's monitoring).\n- [ ] **6.5 (Optional) Contribution Guidelines:**\n    - [ ] If future collaboration is anticipated, create guidelines for how others can contribute to the project (code style, testing, pull request process).",
        "labels": ["priority:medium", "documentation", "onboarding", "maintainability"],
        "assignees": [GITHUB_ASSIGNEE]
    }
]

# --- Main execution ---
if __name__ == "__main__":
    print("Starting GitHub Issue creation script...\n")
    for issue_data in all_issues_data:
        create_github_issue(
            title=issue_data["title"],
            body=issue_data["body"],
            labels=issue_data.get("labels"),
            assignees=issue_data.get("assignees")
        )
    print("\nScript finished.")
