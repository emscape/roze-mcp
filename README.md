# Roze MCP Bridge Server

An MCP (Model Context Protocol) server that exposes shared tools for both VS Code windows (Astro site + Flutter app) to use the same API contract and secure Firebase Callable Functions.

## Features

- **Contract-first API**: OpenAPI spec as source of truth
- **Schema validation**: JSON Schema validation with AJV
- **Firebase Callable Functions**: Secure, authenticated Firebase functions
- **Authentication Support**: Handles Firebase Auth for secure operations
- **Type Safety**: Firebase SDK with proper error handling
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

# Start the server
npm run dev
```

## Available Tools

### Contract Management
- `contracts_readOpenAPI` - Returns OpenAPI specification
- `contracts_readSchema` - Returns JSON schema for specific endpoints

### Environment
- `env_getEndpoints` - Get Firebase Function endpoints

### API Calls (Firebase Callable Functions)
- `api_orders_create` - Create order with validation (requires authentication)
- `api_subscribe_create` - Create subscription with validation (authentication optional)
- `healthz` - Health check endpoint (no authentication required)

## Firebase Callable Functions

The server uses Firebase SDK to call these secure callable functions:
- **Health Check**: `firebase.functions().httpsCallable('healthz')`
- **Create Order**: `firebase.functions().httpsCallable('createOrder')` (authenticated)
- **Create Subscription**: `firebase.functions().httpsCallable('createSubscription')` (optional auth)

### Security Benefits:
- ✅ **Authentication Required**: createOrder requires user authentication
- ✅ **No Public HTTP Endpoints**: Functions only accessible via Firebase SDK
- ✅ **Audit Trail**: Orders track which user created them
- ✅ **Type Safety**: Better error handling with Firebase HttpsError

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
