# Roze MCP Bridge Server

An MCP (Model Context Protocol) server that exposes shared tools for both VS Code windows (Astro site + Flutter app) to use the same API contract and live Firebase Functions.

## Features

- **Contract-first API**: OpenAPI spec as source of truth
- **Schema validation**: JSON Schema validation with AJV
- **Live Firebase Functions**: Direct integration with production endpoints
- **No secrets**: No API keys needed, functions are publicly accessible
- **Health checks**: Built-in health monitoring
- **TypeScript**: Full type safety

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template (optional - only for log level)
cp .env.example .env

# Build the server
npm run build

# Start development server
npm run dev
```

## Available Tools

### Contract Management
- `contracts_readOpenAPI` - Returns OpenAPI specification
- `contracts_readSchema` - Returns JSON schema for specific endpoints

### Environment
- `env_getEndpoints` - Get Firebase Function endpoints

### API Calls (Live Firebase Functions)
- `api_orders_create` - Create order with validation
- `api_subscribe_create` - Create subscription with validation
- `healthz` - Health check endpoint

## Firebase Function Endpoints

The server connects directly to these live Firebase Functions:
- **Health Check**: `https://us-west1-myfriendroze-platform.cloudfunctions.net/healthz`
- **Create Order**: `https://us-west1-myfriendroze-platform.cloudfunctions.net/createOrder`
- **Create Subscription**: `https://us-west1-myfriendroze-platform.cloudfunctions.net/createSubscription`

## VS Code Integration

Add to your VS Code settings:

```json
{
  "augment.mcpServers": {
    "roze-bridge": {
      "command": "node",
      "args": ["c:\\repos\\roze-mcp\\dist\\server.js"],
      "env": {
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
