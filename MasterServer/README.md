# MasterServer

The central server of the CI/CD system. Exposes a REST API that orchestrates application deployments across one or more SlaveServers, manages project configuration in a database, and listens to GitHub webhooks to trigger automatic deploys.

## How it works

```
GitHub ──webhook──► MasterServer ──HTTP──► SlaveServer(s)
                         │
                      Database
               (projects, instances, deploys)
```

1. The MasterServer stores the definition of each project and its instances in the database (branch, path, deploys, config files, Nginx configs).
2. When GitHub fires a webhook (push), the MasterServer identifies which instances have `autoUpdate: true` on that branch and instructs the corresponding SlaveServer to pull, build, and restart.
3. Deploys can also be triggered manually via the API.

## Prerequisites

> **Required:** The server running the MasterServer must have **SSH access to GitHub** configured. The system clones and pulls repositories using the SSH clone line (`git@github.com:...`). Without this, no deploy will work.

To set up SSH access:
```bash
ssh-keygen -t ed25519 -C "you@email.com"
cat ~/.ssh/id_ed25519.pub   # add this key in GitHub -> Settings -> SSH keys
ssh -T git@github.com       # verify the connection
```

Also required:
- Ubuntu / Debian
- MySQL, MariaDB, or PostgreSQL (the database must exist before installing)
- Open port reachable from GitHub webhooks and from SlaveServers

## Installation

Run from inside the `MasterServer/` directory:

```bash
chmod +x install.bash
./install.bash
```

The script automatically installs NVM, Node.js 22, PM2, and Nginx if not present, then prompts for configuration values, generates `src/config.ts`, compiles the app, and starts it with PM2.

## Configuration (`src/config.ts`)

| Field | Description |
|---|---|
| `port` | Port the server listens on |
| `githubWebhookSecret` | Secret configured in GitHub -> Settings -> Webhooks |
| `apiKey` | Key clients must send in the `x-api-key` header |
| `database.type` | `mysql`, `mariadb`, or `postgres` |
| `database.host` | Database host |
| `database.port` | Database port |
| `database.username` | Database user |
| `database.password` | Database password |
| `database.database` | Database name |

## Authentication

All endpoints (except `POST /github/webhook`) require the header:

```
x-api-key: <apiKey>
```

The GitHub webhook is authenticated via HMAC signature using `githubWebhookSecret`.

## Endpoints

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |

### Projects (`/projects`)
| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List all projects |
| GET | `/projects/:id` | Get project by ID |
| POST | `/projects` | Create project |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |

A **Project** represents a GitHub repository. Main fields:
- `name` — identifier name
- `repository` — repository name
- `cloneLine` — full SSH clone line (e.g. `git@github.com:user/repo.git`)

### Project Instances (`/project-instances`)
| Method | Path | Description |
|---|---|---|
| GET | `/project-instances` | List all instances |
| GET | `/project-instances/:id` | Get instance by ID |
| POST | `/project-instances` | Create instance |
| PUT | `/project-instances/:id` | Update instance |
| DELETE | `/project-instances/:id` | Delete instance |

A **ProjectInstance** is a concrete deployment of a project. Fields:
- `name` — instance name
- `branch` — Git branch to track
- `path` — path on the SlaveServer where the repo is cloned
- `autoUpdate` — if `true`, redeploys automatically on webhook push to the tracked branch
- `afterDeployCommands` — commands to run after a deploy
- `slaveServer` — assigned SlaveServer (if null, runs on the MasterServer itself)

### Deploys (`/deploys`)
| Method | Path | Description |
|---|---|---|
| GET | `/deploys` | List all deploys |
| GET | `/deploys/:id` | Get deploy by ID |
| POST | `/deploys` | Create deploy |
| PUT | `/deploys/:id` | Update deploy |
| DELETE | `/deploys/:id` | Delete deploy |
| POST | `/deploys/:id/start` | Start or restart deploy |
| POST | `/deploys/:id/stop` | Stop deploy |

A **Deploy** defines how to start an application within an instance. Fields:
- `name` — PM2 process name
- `startPath` — subdirectory inside the repo where the app lives
- `buildCommands` — JSON array of build commands (e.g. `["npm install", "npm run build"]`)
- `startCommands` — command to start the app (e.g. `node dist/index.js`)
- `isStaticSite` — if `true`, only runs the build without launching a PM2 process

### Config Files (`/config-files`)
| Method | Path | Description |
|---|---|---|
| GET | `/config-files` | List all config files |
| GET | `/config-files/:id` | Get by ID |
| POST | `/config-files` | Create config file |
| PUT | `/config-files/:id` | Update config file |
| DELETE | `/config-files/:id` | Delete config file |

A **ConfigFile** is a file the MasterServer injects into the repo before each build (e.g. `.env`, `config.ts`). Fields:
- `name` — identifier name
- `relativePath` — relative path inside the repo where the file is written
- `content` — file content

### Nginx Configs (`/nginx-configs`)
| Method | Path | Description |
|---|---|---|
| GET | `/nginx-configs` | List all Nginx configs |
| GET | `/nginx-configs/:id` | Get by ID |
| POST | `/nginx-configs` | Create Nginx config |
| PUT | `/nginx-configs/:id` | Update Nginx config |
| DELETE | `/nginx-configs/:id` | Delete Nginx config |

A **NginxConfig** is a vhost that the SlaveServer writes to disk and reloads in Nginx during a deploy. Fields:
- `name` — identifier name
- `path` — path on disk where the vhost file is written
- `content` — Nginx configuration file content
- `command` — command to reload Nginx (e.g. `sudo nginx -s reload`)

### Slave Servers (`/slave-servers`)
| Method | Path | Description |
|---|---|---|
| GET | `/slave-servers` | List all slave servers |
| GET | `/slave-servers/:id` | Get by ID |
| POST | `/slave-servers` | Register new slave |
| PUT | `/slave-servers/:id` | Update slave |
| DELETE | `/slave-servers/:id` | Delete slave |

Fields of a **SlaveServer**:
- `nombre` — identifier name
- `host` — base URL of the slave, including protocol (e.g. `http://192.168.1.10` or `https://slave.example.com`)
- `puerto` — port the SlaveServer listens on (optional; omit if the port is already in the host URL or using a default port)
- `apiKey` — the API key configured on that SlaveServer

### GitHub Webhook (`/github/webhook`)
| Method | Path | Description |
|---|---|---|
| POST | `/github/webhook` | Receive GitHub push events |

Configure in GitHub -> Settings -> Webhooks pointing to `http://<ip>:<port>/github/webhook` with the same secret set in `config.ts`.
