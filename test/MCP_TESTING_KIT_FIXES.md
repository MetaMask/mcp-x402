# mcp-testing-kit Fixes

This document describes the necessary fixes for mcp-testing-kit to eliminate ERROR messages during testing.

## Problem

When running tests with mcp-testing-kit v0.2.0, you see ERROR messages like:

```
ERROR  [TestTransport] Please connect to a server first!
```

These appear once per `connect()` call, even though all tests pass correctly.

## Root Causes

### 1. Missing `await` on `server.connect()`

**Location:** `index.ts:39` (original code)

**Issue:** The `connect()` function doesn't await the async `server.connect(transport)` call:

```typescript
export function connect(server: Server) {
  // ❌ Not async
  // ...
  const transport = new TestTransport(recieverCb);
  server.connect(transport); // ❌ Not awaited
  // Returns client immediately, but server may not be ready
}
```

**Fix:** Make the function async and await the connection:

```typescript
export async function connect(server: Server) {
  // ✅ Now async
  // ...
  const transport = new TestTransport(recieverCb);
  await server.connect(transport); // ✅ Now awaited
  // Server is fully connected before proceeding
}
```

### 2. Misleading Error in Placeholder `onmessage` Handler

**Location:** `index.ts:22-24` (original code)

**Issue:** The placeholder `onmessage` handler logs an error, but messages legitimately arrive during the MCP initialization handshake:

```typescript
class TestTransport implements Transport {
  // ...
  // MCP Server will override this method
  onmessage(message: JSONRPCMessage) {
    consola.error("[TestTransport] Please connect to a server first!"); // ❌ Misleading
  }
}
```

**Why This Happens:**

1. `server.connect(transport)` is called
2. During connection, MCP sends initialization messages
3. These messages arrive BEFORE the server has finished overriding the `onmessage` handler
4. They hit the placeholder handler, triggering the ERROR message
5. The server eventually overrides the handler and everything works fine

**Fix:** Make the placeholder a silent no-op or debug message:

```typescript
class TestTransport implements Transport {
  // ...
  // MCP Server will override this method after connection completes
  onmessage(message: JSONRPCMessage) {
    // Silent no-op - initialization messages during connection are expected
    // The server will override this handler once fully connected
  }
}
```

Or if you want to keep logging for debugging:

```typescript
    onmessage(message: JSONRPCMessage) {
        consola.debug("[TestTransport] Message received during initialization (expected)");
    }
```

## Complete Fix

### index.ts

```typescript
import { consola } from "consola";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  isJSONRPCError,
  isJSONRPCNotification,
  JSONRPCMessage,
  JSONRPCNotification,
  JSONRPCResponse,
  ListToolsResult,
  JSONRPCError,
  ListResourcesResult,
  ProgressNotificationSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  JSONRPCRequest,
  Request,
  ListPromptsRequestSchema,
  ListPromptsResult,
  isJSONRPCResponse,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

class TestTransport implements Transport {
  constructor(private recieverCb: (message: JSONRPCMessage) => void) {}

  async send(message: JSONRPCMessage) {
    this.recieverCb(message);
  }

  async start() {
    consola.debug("[TestTransport] Starting TEST transport");
  }

  async close() {
    consola.debug("[TestTransport] Closing TEST transport");
  }

  // MCP Server will override this method after connection completes
  onmessage(message: JSONRPCMessage) {
    // Silent no-op - initialization messages during connection are expected
    // The server will override this handler once fully connected
  }
}

type RPCResponse = JSONRPCResponse | JSONRPCError | JSONRPCNotification;

export async function connect(server: Server) {
  // ✅ Now async
  let _recieverCbs: ((message: RPCResponse) => void)[] = [];
  const { resolve, reject, promise } = Promise.withResolvers<RPCResponse>();
  let recieverCb = (message: RPCResponse) => {
    _recieverCbs.forEach((cb) => cb(message));
    if (isJSONRPCResponse(message)) {
      resolve(message);
    }
  };
  const transport = new TestTransport(recieverCb);
  await server.connect(transport); // ✅ Now awaited
  let _requestId = 1;

  function sendToServer<T extends RPCResponse>(message: Request): Promise<T> {
    const requestId = _requestId++;
    const request: JSONRPCRequest = {
      jsonrpc: "2.0",
      id: requestId,
      ...message,
      params: {
        ...message.params,
        _meta: {
          progressToken: requestId,
        },
      },
    };
    transport.onmessage?.(request);
    return promise as Promise<T>;
  }

  return {
    sendToServer: sendToServer,
    listTools: async () => {
      const message: JSONRPCResponse = await sendToServer({
        method: ListToolsRequestSchema.shape.method.value,
        params: {},
      });
      return message.result as ListToolsResult;
    },
    onNotification: (notificationCb: (message: JSONRPCMessage) => void) => {
      _recieverCbs.push((message: JSONRPCMessage) => {
        if (isJSONRPCNotification(message)) {
          notificationCb(message);
        }
      });
    },
    onError: (errorCb: (message: JSONRPCMessage) => void) => {
      _recieverCbs.push((message: JSONRPCMessage) => {
        if (isJSONRPCError(message)) {
          errorCb(message);
        }
      });
    },
    onProgress: (progressCb: (message: JSONRPCMessage) => void) => {
      _recieverCbs.push((message: JSONRPCMessage) => {
        if (
          isJSONRPCNotification(message) &&
          ProgressNotificationSchema.safeParse(message).success
        ) {
          progressCb(message);
        }
      });
    },
    callTool: async (tool: string, params: any = {}) => {
      const message = await sendToServer<JSONRPCResponse>({
        method: CallToolRequestSchema.shape.method.value,
        params: {
          name: tool,
          arguments: params,
        },
      });
      return message.result;
    },
    listResources: async () => {
      const message: JSONRPCResponse = await sendToServer({
        method: ListResourcesRequestSchema.shape.method.value,
      });
      return message.result as ListResourcesResult;
    },
    listPrompts: async () => {
      const message: JSONRPCResponse = await sendToServer({
        method: ListPromptsRequestSchema.shape.method.value,
      });
      return message.result as ListPromptsResult;
    },
    getPrompt: async (prompt: string, params: any = {}) => {
      const message = await sendToServer<JSONRPCResponse>({
        method: GetPromptRequestSchema.shape.method.value,
        params: {
          name: prompt,
          arguments: params,
        },
      });
      return message.result;
    },
  };
}

export function close(server: Server) {
  server.close();
}
```

## Testing the Fix

Before the fix:

```
ERROR  [TestTransport] Please connect to a server first!
ERROR  [TestTransport] Please connect to a server first!
ERROR  [TestTransport] Please connect to a server first!
...
✔ CreateX402PaymentHeader Tool (4 tests)
✔ LookupAddress Tool (3 tests)
```

After the fix:

```
✔ CreateX402PaymentHeader Tool (4 tests)
✔ LookupAddress Tool (3 tests)
```

Clean output with no ERROR messages!

## Related Issues

- The example code in `example/basic` has never been successfully run (vitest not installed)
- This bug affects all users of mcp-testing-kit v0.2.0
- Tests work correctly despite the ERROR messages, but the output is confusing

## PR Checklist

- [x] Make `connect()` function async
- [x] Add `await` to `server.connect(transport)` call
- [x] Remove or change ERROR message in placeholder `onmessage` handler
- [ ] Update TypeScript types if needed (connect signature changed)
- [ ] Update README examples to show `await connect(server)`
- [ ] Test with the example code
- [ ] Bump version to 0.2.1
