# Roze MCP Bridge Server

A hardened MCP (Model Context Protocol) server that provides dev-only proxies and contract tools for both Astro and Flutter clients to share one API contract without exposing production endpoints.

## Features

- **Contract-first API**: OpenAPI spec as source of truth
- **Schema validation**: JSON Schema validation with AJV before proxying
- **Dev-only proxies**: Secure proxy mode that blocks production calls
- **PII redaction**: Safe logging with email/amount redaction
- **Environment management**: Separate dev (emulator) and prod base URLs
- **Health checks**: Built-in health monitoring for both environments
- **TypeScript**: Full type safety with structured error responses

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template (optional - only for log level)
cp .env.example .env

# Build the server
npm run build

# Start the server
npm run dev
```

## Available Tools

### Contract Management
- `contracts_read_openapi` - Returns OpenAPI specification with version and changelog
- `contracts_read_schema` - Returns JSON schema for specific endpoints (`order.create`, `subscribe.create`)

### Environment
- `env_get_api_base(target)` - Get API base URL for dev (emulator) or prod environment

### API Calls (Dev-Only Proxies)
- `api_orders_create(payload, target)` - Create order with validation (dev-only proxy)
- `api_subscribe_create(payload, target)` - Create subscription with validation (dev-only proxy)
- `healthz(target)` - Health check for target environment

## Tool Arguments

| Tool | Arguments | Description |
|------|-----------|-------------|
| `contracts_read_openapi` | None | Returns full OpenAPI spec |
| `contracts_read_schema` | `name: "order.create" \| "subscribe.create"` | Returns specific JSON schema |
| `env_get_api_base` | `target: "dev" \| "prod"` | Returns base URL for environment |
| `api_orders_create` | `payload: object, target: "dev" \| "prod"` | Creates order (prod blocked) |
| `api_subscribe_create` | `payload: object, target: "dev" \| "prod"` | Creates subscription (prod blocked) |
| `healthz` | `target: "dev" \| "prod"` | Health check for environment |

## Dev-Only Proxy Policy

**Development (`target: "dev"`)**: ✅ Allowed
- Proxies to emulator base URL
- Full validation and error handling
- Safe for development and testing

**Production (`target: "prod"`)**: ❌ Blocked
- Returns structured error with clear message
- Prevents accidental production calls from MCP
- Forces proper authentication in app clients

### Production Block Response
```json
{
  "ok": false,
  "status": 403,
  "body": {
    "error": "Proxy disabled in prod; call from app clients with App Check/Auth",
    "target": "prod",
    "proxyMode": "dev-only"
  }
}
```

## VS Code Integration

Add to your VS Code settings:

```json
{
  "augment.mcpServers": {
    "roze-bridge": {
      "command": "node",
      "args": ["c:\\repos\\roze-mcp\\dist\\server.js"],
      "env": {
        "API_BASE_DEV": "http://127.0.0.1:5001/PROJECT_ID/us-central1",
        "API_BASE_PROD": "https://REGION-PROJECT_ID.cloudfunctions.net",
        "PROXY_MODE": "dev-only",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

Or in Augment Settings UI:
- **Name**: `roze-bridge`
- **Command**: `node c:\repos\roze-mcp\dist\server.js`
- **Environment Variables**:
  - `API_BASE_DEV`: `http://127.0.0.1:5001/PROJECT_ID/us-central1`
  - `API_BASE_PROD`: `https://REGION-PROJECT_ID.cloudfunctions.net`
  - `PROXY_MODE`: `dev-only` (recommended)
  - `LOG_LEVEL`: `info` (optional)

## Development

```bash
npm run dev          # Start with hot reload
npm run build        # Build TypeScript
npm run start        # Run built server
npm run check:schemas # Validate schemas
```

## Architecture

- `src/server.ts` - MCP server entrypoint
- `src/mcp.ts` - Tool registration and validation
- `src/http.ts` - HTTP client helpers
- `src/config.ts` - Environment configuration
- `schemas/` - JSON Schema definitions
- `contracts/` - OpenAPI specifications
