# Nexus Orchestrator - Known Issues & Considerations

This document lists current limitations, potential issues, and areas requiring attention for robust production deployment of the Nexus Orchestrator.

## Deployment & Environment Considerations

* **Dynamic Local IP for SSH (UFW):**
    * If the local machine's public IP for SSH access changes, the UFW rule on the Droplet needs to be updated.
    * **Resolution:** Implement a Dynamic DNS (DDNS) client on the local machine and a script on the Droplet to update UFW, or switch to SSH access via Cloudflare Tunnel for greater security and resilience.
* **Persistent `docker-proxy` Processes:**
    * Occasionally, `docker-proxy` processes may not terminate cleanly, holding onto ports (e.g., 8000, 6379, 5432).
    * **Resolution:** Requires manual `sudo kill -9 <PID>` and `sudo systemctl restart docker` or `docker system prune` to clear. Long-term, investigate root cause or implement automated daemon restarts on port conflicts.
* **Native Service Conflicts:**
    * Running native installations of services (e.g., PostgreSQL, Redis) on the host machine can conflict with Docker container port bindings.
    * **Resolution:** Ensure native services are stopped and disabled (e.g., `sudo systemctl disable postgresql`) when Dockerized versions are intended for use.
* **`scp` File Transfer Robustness:**
    * Initial `scp` transfers can be finicky due to SSH key issues, permissions, or context.
    * **Resolution:** Always verify target directory and use `--allow-unrelated-histories` on initial `git pull` if remote has content. Consider `rsync` for more robust synchronization.

## Security Considerations

* **Agent Shell Execution (`gpt-agent_ops_execution`):**
    * The current `execute_shell_command` is whitelisted but still executes directly on the container's OS. This is a **significant security risk** in production.
    * **Resolution:** For arbitrary or untrusted commands, implement strict sandboxing (e.g., isolated Docker containers per task, Firecracker microVMs, or specialized execution environments) and robust input validation.
* **Authentication/Authorization:**
    * The Nexus Orchestrator API is currently open to anyone who can reach `topshelfservicepros.com`.
    * **Resolution:** Implement an authentication layer (e.g., API keys, OAuth2) for Nexus API endpoints.
* **Secrets Management:**
    * Currently relies on `.env` files for secrets, copied manually to the Droplet.
    * **Resolution:** For production, implement Docker Secrets, HashiCorp Vault, or cloud-specific secret management services.

## Current Limitations

* **Agent Tool Execution is Simulated:**
    * Most agent functions (e.g., `send_communication`, `perform_research`) currently only print output to logs and do not integrate with real external services.
    * **Resolution:** Integrate with actual APIs (Twilio, SendGrid, custom external services).
* **Redis Pub/Sub Delivery Guarantees:**
    * Redis Pub/Sub is a fire-and-forget mechanism; messages are not guaranteed to be delivered if subscribers are offline.
    * **Resolution:** For critical, guaranteed tasks, consider integrating a dedicated message queue (e.g., Celery with RabbitMQ/Redis as backend) for tasks, using Pub/Sub only for real-time notifications.
* **Error Handling and Reporting:**
    * Basic exception handling is present, but more robust error reporting (e.g., dedicated error logs, alerting via communication agent) is needed for production.
* **No Centralized State for Workflows:**
    * Currently, there's no central state management for complex, multi-step workflows initiated by `gpt-agent_strategy`.
    * **Resolution:** Implement a workflow engine or state machine within Nexus or a dedicated workflow agent.

---

*This list is a living document and will be updated as the project evolves and new challenges are identified.*
