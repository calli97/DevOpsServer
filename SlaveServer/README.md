# SlaveServer

The execution agent of the CI/CD system. Runs on each deployment server and receives instructions from the MasterServer to clone repositories, run builds, manage processes with PM2, and write Nginx configurations.

## How it works

```
MasterServer ──HTTP──► SlaveServer
                            │
                     git clone / git pull
                     npm install / npm run build
                     PM2 start / restart
                     Nginx config write + reload
```

The SlaveServer has no database or local state. Each request from the MasterServer includes all the necessary information: the branch, the clone line, build commands, config files to inject, and Nginx configs to write.

## Prerequisites

> **Required:** The server running the SlaveServer must have **SSH access to GitHub** configured. The system clones and pulls repositories using the SSH clone line (`git@github.com:...`). Without this, no deploy will work.

To set up SSH access:
```bash
ssh-keygen -t ed25519 -C "you@email.com"
cat ~/.ssh/id_ed25519.pub   # add this key in GitHub -> Settings -> SSH keys
ssh -T git@github.com       # verify the connection
```

Also required:
- Ubuntu / Debian
- Open port reachable from the MasterServer

## Installation

Run from inside the `SlaveServer/` directory:

```bash
chmod +x install.bash
./install.bash
```

The script automatically installs NVM, Node.js 22, and PM2 if not present, then prompts for configuration values, generates `src/config.ts`, compiles the app, and starts it with PM2.

## Configuration (`src/config.ts`)

| Field | Description |
|---|---|
| `port` | Port the server listens on |
| `apiKey` | Key the MasterServer must send in the `x-api-key` header |

Once installed, register this SlaveServer in the MasterServer via `POST /slave-servers` with the IP, port, and the same `apiKey`.

## Authentication

All endpoints require the header:

```
x-api-key: <apiKey>
```

Only the MasterServer should have access to this server. It is recommended to restrict the port to the MasterServer's IP using UFW:

```bash
sudo ufw allow from <MASTER_IP> to any port <PORT>
```

## Endpoints

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |

### Clone repository (`/clone`)
| Method | Path | Description |
|---|---|---|
| POST | `/clone` | Clone a repository onto the server |

Body:
```json
{
  "cloneLine": "git@github.com:user/repo.git",
  "path": "/home/deploy/apps"
}
```

- `cloneLine` — SSH clone line of the repository
- `path` — directory where the repo will be cloned into

Response:
```json
{
  "ok": true,
  "cloned": true
}
```

If the repo directory already exists, `cloned` will be `false` and it will not be cloned again.

### Run deploy (`/deploy`)
| Method | Path | Description |
|---|---|---|
| POST | `/deploy` | Pull, build, write configs, and start the app |

Body:
```json
{
  "instancePath": "/home/deploy/apps",
  "branch": "main",
  "cloneLine": "git@github.com:user/repo.git",
  "deploys": [
    {
      "name": "my-app",
      "startPath": "",
      "buildCommands": "[\"npm install\", \"npm run build\"]",
      "startCommands": "node dist/index.js",
      "started": false,
      "isStaticSite": false
    }
  ],
  "configFiles": [
    {
      "name": "env",
      "relativePath": ".env",
      "content": "PORT=3000\nDB_HOST=localhost"
    }
  ],
  "nginxConfigs": [
    {
      "name": "my-app-vhost",
      "path": "/etc/nginx/sites-enabled/my-app",
      "content": "server { ... }",
      "command": "sudo nginx -s reload"
    }
  ]
}
```

The SlaveServer executes in order:
1. `git pull origin <branch>` inside the repo directory
2. Writes each `configFile` to its relative path inside the repo
3. Writes each `nginxConfig` to disk and runs its `command`
4. Runs the `buildCommands` for each deploy
5. If `isStaticSite` is `false`, starts or restarts the process in PM2 using `startCommands`

Response:
```json
{
  "ok": true,
  "errors": []
}
```

If any deploy fails, `ok` will be `false` and `errors` will contain the deploy name and the error message.
