# DevOpsServer

CI/CD system for automating deploys on VPS servers. When you push to GitHub, the webhook triggers the full pipeline automatically: pull, config injection, build, and process restart on the target server.

## Components

```
DevOpsServer/
├── MasterServer/   # Central server — orchestrator
├── SlaveServer/    # Execution agent — runs on each VPS
├── client/         # Web admin UI (React)
└── swagger/        # Static API tester (HTML)
```

The **MasterServer** and **SlaveServers** are the core of the system. The client and the API tester are auxiliary tools for configuring and testing it.

## Architecture

```
GitHub
  │  (webhook)
  ▼
MasterServer  ──── Database (MySQL / MariaDB / PostgreSQL)
  │  (HTTP + API key)
  ▼
SlaveServer(s)
  │
  ├── git pull
  ├── write config files (.env, etc.)
  ├── write Nginx vhost configs
  ├── run build commands
  └── start / restart with PM2
```

- **MasterServer**: receives the GitHub webhook, verifies the HMAC signature, determines which instances have `autoUpdate` enabled for the pushed branch, and instructs the corresponding SlaveServer to execute the deploy.
- **SlaveServer**: stateless agent installed on each VPS. Receives full instructions from the MasterServer and executes them: clones/updates the repo, injects config files, writes Nginx vhosts, runs build commands, and manages the process with PM2.

## Installation

Each component has its own `install.bash` script that sets up the environment (NVM, Node.js 22, PM2, Nginx) and starts the service. See the individual READMEs:

- [MasterServer](./MasterServer/README.md)
- [SlaveServer](./SlaveServer/README.md)
- [Client](./client/README.md)
- [API Tester](./swagger/README.md)

## Initial setup flow

1. Install the **MasterServer** on a VPS with internet access
2. Configure the webhook in GitHub pointing to `http://<master>:<port>/github/webhook`
3. Install a **SlaveServer** on each VPS where deploys will run
4. Register the slaves in the MasterServer via API or the web client
5. Create a Project (GitHub repo), a ProjectInstance (branch + path + slave), and one or more Deploys (build/start commands)
6. Enable `autoUpdate` on the instance — from that point every push triggers the deploy automatically

## Security

- All endpoints require the `x-api-key` header
- GitHub webhook verified with HMAC-SHA1 signature
- Firewall configured with UFW during installation
- Security headers via Helmet.js

## Tech stack

| Component | Stack |
|-----------|-------|
| MasterServer | Node.js 22, TypeScript, Express 5, TypeORM, MySQL/PG |
| SlaveServer | Node.js 22, TypeScript, Express 5 |
| Client | React 18, TypeScript, Vite, React Router 6 |
| API Tester | Plain HTML + CSS + JS (no dependencies) |
| Process manager | PM2 |
| Reverse proxy | Nginx |
