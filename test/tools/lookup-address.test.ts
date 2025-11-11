import { describe, it } from "node:test";
import assert from "node:assert";
import { connect, close } from "mcp-testing-kit";
import { createServer } from "../../src/server.js";

describe("LookupAddress Tool", () => {
  it("should list LookupAddress tool", async () => {
    const server = createServer();
    try {
      const client = await connect(server);
      const tools = await client.listTools();

      const lookupAddressTool = tools.tools.find(
        (tool) => tool.name === "LookupAddress",
      );

      assert.ok(lookupAddressTool, "LookupAddress tool should be defined");
      assert.strictEqual(lookupAddressTool.name, "LookupAddress");
      assert.strictEqual(
        lookupAddressTool.description,
        "Lookup the address for account that is used to sign the payment header. Lazily create the account if it does not exist.",
      );
    } finally {
      await close(server);
    }
  });

  it("should return a valid Ethereum address", async () => {
    const server = createServer();
    try {
      const client = await connect(server);
      const result = await client.callTool("LookupAddress", {});

      assert.ok(result.content, "Result should have content");
      assert.strictEqual(result.content.length, 1);
      assert.strictEqual(result.content[0].type, "text");

      const address = result.content[0].text;

      // Check that the address is a valid Ethereum address (0x followed by 40 hex chars)
      assert.match(address, /^0x[a-fA-F0-9]{40}$/);
    } finally {
      await close(server);
    }
  });

  it("should return the same address on multiple calls", async () => {
    const server1 = createServer();
    let address1: string;

    try {
      const client = await connect(server1);
      const result1 = await client.callTool("LookupAddress", {});
      address1 = result1.content[0].text;
    } finally {
      await close(server1);
    }

    // Create new server and call again
    const server2 = createServer();
    try {
      const client2 = await connect(server2);
      const result2 = await client2.callTool("LookupAddress", {});
      const address2 = result2.content[0].text;

      // Should return the same address
      assert.strictEqual(address1, address2);
    } finally {
      await close(server2);
    }
  });
});
