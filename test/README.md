# MCP X402 Tests

This directory contains tests for the MCP X402 server tools using `mcp-testing-kit`.

## Running Tests

```bash
yarn test
```

## Known Issues

### ERROR Messages from TestTransport (FIXED in fork)

~~You may see ERROR messages like:~~

```
ERROR  [TestTransport] Please connect to a server first!
```

**Status:** ✅ **FIXED** - This project uses a fork of mcp-testing-kit with the necessary fixes applied.

**Root Causes (Fixed):**

1. **Missing `await`**: The `connect()` function didn't await `server.connect(transport)`, causing a race condition
2. **Misleading error log**: The placeholder `onmessage` handler logged errors for legitimate initialization messages

**Fixes Applied:**

1. Made `connect()` async and added `await` to `server.connect(transport)`
2. Changed the placeholder `onmessage` to a silent no-op (initialization messages are expected)

**Reference:** See [MCP_TESTING_KIT_FIXES.md](./MCP_TESTING_KIT_FIXES.md) for complete details and PR information.

**For upstream:** A PR is pending at https://github.com/thoughtspot/mcp-testing-kit with these fixes.

## Test Structure

- **test-helpers.ts** - Shared test utilities including a connection wrapper
- **lookup-address.test.ts** - Tests for the LookupAddress tool
- **create-x402-payment-header.test.ts** - Tests for the CreateX402PaymentHeader tool

Each test properly manages server lifecycle using try/finally blocks to ensure cleanup even if tests fail.
