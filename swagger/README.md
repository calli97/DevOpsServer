# API Tester

Static HTTP client (plain HTML + CSS + JS, no dependencies) for testing all MasterServer endpoints directly from the browser.

> Not a real Swagger/OpenAPI UI — it's a custom testing interface. Use it to explore and debug the API without needing Postman or curl.

## Usage

Open `index.html` directly in the browser (no server required).

Enter in the top bar:
- **Base URL**: MasterServer address (e.g. `http://localhost:3040`)
- **API Key**: the `x-api-key` value configured in the MasterServer

Both values are persisted in `localStorage`.

## Covered endpoints

| Section | Operations |
|---------|------------|
| Status | `GET /status` — health check |
| Projects | Full CRUD |
| Project Instances | CRUD + start + restart |
| Deploys | CRUD + start + stop |
| Config Files | Full CRUD |
| Slave Servers | Full CRUD |

Each endpoint has a form with the relevant fields and shows the response with JSON syntax highlighting, HTTP status code, and response time.

## When to use it

- Verify the MasterServer responds correctly after installing it
- Register slave servers and projects during initial setup
- Debug a failed deploy (check the state of instances/deploys)
- Test API changes during development
