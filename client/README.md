# Client — DevOps Web UI

React + TypeScript web interface for managing the deploy system. Lets you create and edit projects, instances, deploys, and config files without calling the API manually.

> This is a complementary tool. The core of the system is the MasterServer and SlaveServers; the client is an administration UI.

## Stack

- React 18 + TypeScript
- Vite (build/dev server)
- React Router v6

## Usage

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # outputs to dist/
npm run preview  # serves the build locally
```

On first open the app will ask for the MasterServer URL and API key. Both are stored in `localStorage` and persist between reloads.

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Configure the connection to the MasterServer |
| `/projects` | Project list (GitHub repos) |
| `/projects/:id` | Project detail — associated instances |
| `/instances/:id` | Instance detail — deploys, config files |

## Structure

```
src/
├── api.ts              # HTTP client for the MasterServer
├── App.tsx             # routes
├── pages/
│   ├── Login.tsx
│   ├── Projects.tsx
│   ├── ProjectDetail.tsx
│   └── InstanceDetail.tsx
└── main.tsx
```

## Requirements

- MasterServer running and reachable
- API key configured in the MasterServer
- Node.js 18+
