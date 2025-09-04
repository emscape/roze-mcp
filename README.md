# Roze MCP Bridge Server

An MCP (Model Context Protocol) server that exposes shared tools for both VS Code windows (Astro site + Flutter app) to use the same API contract, emulator base URL, and test calls.

## Features

- **Contract-first API**: OpenAPI spec as source of truth
- **Schema validation**: JSON Schema validation with AJV
- **Environment management**: Dev/prod API base URLs
- **No secrets**: Only base URLs stored, no API keys
- **Health checks**: Built-in health monitoring
- **TypeScript**: Full type safety

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your project details
# API_BASE_DEV=http://127.0.0.1:5001/your-project-id/us-central1
# API_BASE_PROD=https://us-central1-your-project-id.cloudfunctions.net

# Start development server
npm run dev
```

## Available Tools

### Contract Management
- `contracts.readOpenAPI` - Returns OpenAPI specification
- `contracts.readSchema` - Returns JSON schema for specific endpoints

### Environment
- `env.getApiBase` - Get API base URL for dev/prod

### API Calls
- `api.orders.create` - Create order with validation
- `api.subscribe.create` - Create subscription with validation
- `healthz` - Health check endpoint

## VS Code Integration

Add to your VS Code settings:

```json
{
  "augment.mcpServers": {
    "roze-bridge": {
      "command": "node",
      "args": ["/absolute/path/to/roze-mcp/dist/server.js"],
      "env": {
        "API_BASE_DEV": "http://127.0.0.1:5001/PROJECT_ID/us-central1",
        "API_BASE_PROD": "https://REGION-PROJECT_ID.cloudfunctions.net"
      }
    }
  }
}
```

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
