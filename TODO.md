# Nexus Orchestrator - TODO List

This document outlines the planned future work, enhancements, and strategic objectives for the Nexus Orchestrator project.

## Phase 1: Core Functionality Enhancements

* **Refine Agent Capabilities (Beyond Simulation):**
    * **gpt-agent_comms:**
        * Integrate with a real email API (e.g., SendGrid, Mailgun) for sending actual emails.
        * (Optional) Integrate with an SMS API (e.g., Twilio) for sending real SMS messages.
        * (Optional) Basic integration with a chat platform (e.g., Slack/Teams API for internal notifications).
    * **gpt-agent_ops_execution:**
        * Expand whitelisted commands (e.g., `grep`, `find`, `curl` for internal endpoints).
        * Implement basic file read/write operations within a controlled directory.
        * Consider more secure execution environments (e.g., Docker-in-Docker, isolated environments) for arbitrary commands if needed.
    * **gpt-agent_research:**
        * Integrate with basic web scraping libraries (e.g., BeautifulSoup, Playwright) for real web lookups.
        * (Optional) Integrate with specific public APIs (e.g., weather, news).
    * **gpt-agent_strategy:**
        * Enhance planning logic: Move beyond hardcoded plans to a more dynamic, rule-based, or simple NLP-driven planning.
        * (Optional) Integrate a small, local LLM (e.g., using Llama.cpp) for more advanced planning/analysis.

* **Agent Management Features in Nexus:**
    * Implement Agent Deactivation/Reactivation in PostgreSQL.
    * Add a `DELETE` endpoint for agents.
    * Implement more detailed heartbeat metrics (e.g., agent load, last successful task).

## Phase 2: Operational Maturity & Scalability

* **User Interface / Dashboard:**
    * Develop a simple web-based dashboard (e.g., using Streamlit, Flask, or a light JS framework) to:
        * Visualize agent status (online/offline).
        * View live logs from Nexus and agents.
        * Allow manual command triggering for agents.
        * Display past task results.
* **Robust Monitoring & Alerting:**
    * Deploy Prometheus for metric collection (CPU, RAM, network, Docker container metrics).
    * Deploy Grafana for customizable dashboards to visualize system health.
    * Integrate Loki for centralized log aggregation from all Docker containers.
    * Configure alerting for critical failures (e.g., agent offline, high error rates).
* **Continuous Integration/Continuous Deployment (CI/CD):**
    * Set up GitHub Actions to automate:
        * Code linting and testing.
        * Docker image building and pushing to a registry (e.g., GitHub Container Registry, Docker Hub).
        * Automatic deployment to DigitalOcean Droplet upon `main` branch push.
* **Automated Backup Strategy:**
    * Implement regular automated backups of the PostgreSQL database (`pg_dump`) to an object storage service (e.g., DigitalOcean Spaces, S3).
    * Consider Droplet snapshots for full system backups.

## Phase 3: Advanced Capabilities & Security

* **Authentication & Authorization:**
    * Implement basic user authentication for Nexus API (e.g., API keys, OAuth2).
    * Add role-based access control (RBAC) for different users/systems interacting with Nexus.
* **Advanced Workflow Orchestration:**
    * Implement a state machine or workflow engine to manage complex, multi-step tasks across multiple agents.
    * Introduce task queuing (e.g., Celery, RabbitMQ) for more robust task delivery guarantees than basic Redis Pub/Sub.
* **Dynamic Agent Scaling:**
    * Implement auto-scaling logic based on demand or task queue length (e.g., using Docker Swarm or Kubernetes, though this adds complexity).
* **Advanced Secrets Management:**
    * Transition from `.env` to a more secure secrets management solution for production (e.g., Docker Secrets, HashiCorp Vault, cloud-specific secret managers).

---

*This list is a living document and will evolve as the project progresses.*
