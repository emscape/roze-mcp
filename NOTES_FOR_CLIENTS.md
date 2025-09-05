# Notes for Client Applications

This document explains how Astro and Flutter clients should consume the Roze API contract and when to use the MCP bridge vs direct API calls.

## Contract Consumption

### 1. OpenAPI Contract
- **Source of Truth**: `/contracts/openapi.yaml`
- **Access via MCP**: Use `contracts_read_openapi` tool
- **Version**: Check `info.version` field for contract version
- **Changelog**: See `info.description` for version history

### 2. JSON Schemas
- **Location**: `/schemas/` directory
- **Available schemas**:
  - `order.create.json` - Order creation payload validation
  - `subscribe.create.json` - Subscription creation payload validation
- **Access via MCP**: Use `contracts_read_schema` tool with schema name

## Environment Strategy

### Development (Emulator)
- **Use MCP Bridge**: ✅ Recommended for development and testing
- **Base URL**: Retrieved via `env_get_api_base(dev)`
- **Proxy Tools**: `api_orders_create(dev)`, `api_subscribe_create(dev)`
- **Benefits**: 
  - Shared contract validation
  - Consistent error handling
  - PII redaction in logs
  - Schema validation before API calls

### Production
- **Use Direct API Calls**: ✅ Required for production
- **MCP Proxy**: ❌ Blocked by design (`PROXY_MODE=dev-only`)
- **Authentication**: App Check + Firebase Auth required
- **Base URL**: Retrieved via `env_get_api_base(prod)` (for reference only)

## Implementation Guidelines

### Astro Frontend
```javascript
// Development - use MCP tools
const orderResult = await mcp.callTool('api_orders_create', {
  payload: orderData,
  target: 'dev'
});

// Production - direct API call
const response = await fetch(`${prodBaseUrl}/v1/orders`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'X-Firebase-AppCheck': appCheckToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});
```

### Flutter App
```dart
// Development - use MCP tools (if MCP client available)
final orderResult = await mcpClient.callTool('api_orders_create', {
  'payload': orderData,
  'target': 'dev'
});

// Production - direct Firebase callable function
final callable = FirebaseFunctions.instance.httpsCallable('createOrder');
final result = await callable.call(orderData);
```

## Security Considerations

### Why MCP Proxy is Dev-Only
1. **No Authentication**: MCP bridge doesn't handle user authentication
2. **No App Check**: Production requires Firebase App Check for security
3. **Audit Trail**: Production calls need user context for audit logs
4. **Rate Limiting**: Production has different rate limiting requirements

### Production Security Requirements
- ✅ Firebase Authentication (user context)
- ✅ Firebase App Check (app integrity)
- ✅ HTTPS with proper certificates
- ✅ Rate limiting and abuse protection
- ✅ Audit logging with user attribution

## Error Handling

### MCP Bridge Errors
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

### Validation Errors
```json
{
  "ok": false,
  "status": 400,
  "body": {
    "error": "Validation failed",
    "details": "customer.email: must be a valid email"
  }
}
```

## Health Checks

### Development
```javascript
const health = await mcp.callTool('healthz', { target: 'dev' });
// Returns: { ok: true, status: 200, target: 'dev' }
```

### Production
```javascript
const health = await mcp.callTool('healthz', { target: 'prod' });
// Use for monitoring, but make actual calls directly to production
```

## Best Practices

1. **Contract First**: Always validate against JSON schemas before API calls
2. **Environment Awareness**: Use appropriate method for each environment
3. **Error Handling**: Handle both validation and API errors gracefully
4. **Logging**: Never log PII in client applications
5. **Testing**: Use MCP bridge for consistent testing across both clients
6. **Production**: Always use direct authenticated calls in production

## Migration Path

1. **Phase 1**: Use MCP bridge for all development and testing
2. **Phase 2**: Implement direct production calls with proper authentication
3. **Phase 3**: Validate both paths work correctly
4. **Phase 4**: Deploy with confidence knowing dev/prod parity is maintained

## Support

For questions about:
- **Contract changes**: Check changelog in OpenAPI spec
- **MCP bridge issues**: Check server logs with `LOG_LEVEL=debug`
- **Production API issues**: Check Firebase Functions logs
- **Schema validation**: Use `contracts_read_schema` to get latest schemas
