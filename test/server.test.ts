import { describe, it } from "node:test";
import assert from "node:assert";
import { createServer } from "../src/server.js";
import { connect, close } from "mcp-testing-kit";

describe("Server", () => {
  describe("createServer", () => {
    it("should create a server instance", () => {
      const server = createServer();

      assert.ok(server, "Server should be created");
      assert.ok(
        typeof server.connect === "function",
        "Server should have connect method",
      );
      assert.ok(
        typeof server.close === "function",
        "Server should have close method",
      );
      assert.ok(
        typeof server.tool === "function",
        "Server should have tool method",
      );
    });

    it("should register CreateX402PaymentHeader tool", async () => {
      const server = createServer();
      try {
        const client = await connect(server);
        const tools = await client.listTools();

        const createHeaderTool = tools.tools.find(
          (tool) => tool.name === "CreateX402PaymentHeader",
        );

        assert.ok(
          createHeaderTool,
          "CreateX402PaymentHeader tool should be registered",
        );
        assert.strictEqual(createHeaderTool.name, "CreateX402PaymentHeader");
        assert.strictEqual(
          createHeaderTool.description,
          "Create the X402 payment headers for a given payment request as per https://www.x402.org/",
        );
      } finally {
        await close(server);
      }
    });

    it("should register LookupAddress tool", async () => {
      const server = createServer();
      try {
        const client = await connect(server);
        const tools = await client.listTools();

        const lookupAddressTool = tools.tools.find(
          (tool) => tool.name === "LookupAddress",
        );

        assert.ok(lookupAddressTool, "LookupAddress tool should be registered");
        assert.strictEqual(lookupAddressTool.name, "LookupAddress");
        assert.strictEqual(
          lookupAddressTool.description,
          "Lookup the address for account that is used to sign the payment header. Lazily create the account if it does not exist.",
        );
      } finally {
        await close(server);
      }
    });

    it("should register exactly 2 tools", async () => {
      const server = createServer();
      try {
        const client = await connect(server);
        const tools = await client.listTools();

        assert.strictEqual(
          tools.tools.length,
          2,
          "Server should have exactly 2 tools registered",
        );
      } finally {
        await close(server);
      }
    });

    it("should have correct server metadata", async () => {
      const server = createServer();
      try {
        const client = await connect(server);

        // Verify the server provides the expected tools
        const tools = await client.listTools();

        // Server should register the expected tools
        assert.ok(
          tools.tools.length > 0,
          "Server should have registered tools",
        );

        const toolNames = tools.tools.map((t) => t.name);
        assert.ok(
          toolNames.includes("CreateX402PaymentHeader"),
          "Should have CreateX402PaymentHeader tool",
        );
        assert.ok(
          toolNames.includes("LookupAddress"),
          "Should have LookupAddress tool",
        );
      } finally {
        await close(server);
      }
    });

    it("should allow multiple server instances", async () => {
      const server1 = createServer();
      const server2 = createServer();

      assert.ok(server1, "First server should be created");
      assert.ok(server2, "Second server should be created");
      assert.notStrictEqual(
        server1,
        server2,
        "Servers should be different instances",
      );

      // Verify both servers work independently
      try {
        const client1 = await connect(server1);
        const client2 = await connect(server2);

        const tools1 = await client1.listTools();
        const tools2 = await client2.listTools();

        assert.strictEqual(
          tools1.tools.length,
          2,
          "First server should have 2 tools",
        );
        assert.strictEqual(
          tools2.tools.length,
          2,
          "Second server should have 2 tools",
        );

        await close(server1);
        await close(server2);
      } catch (error) {
        await close(server1);
        await close(server2);
        throw error;
      }
    });
  });

  describe("Server Tools Integration", () => {
    it("CreateX402PaymentHeader tool should be callable", async () => {
      const server = createServer();
      try {
        const client = await connect(server);

        const result = await client.callTool("CreateX402PaymentHeader", {
          x402Version: 1,
          accepts: [
            {
              scheme: "exact",
              network: "base-sepolia",
              maxAmountRequired: "1000000",
              payTo: "0x1234567890123456789012345678901234567890",
              maxTimeoutSeconds: 3600,
              asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
              extra: {
                name: "USD Coin",
                version: "2",
              },
            },
          ],
        });

        assert.ok(result, "Tool should return a result");
        assert.ok(result.content, "Result should have content");
      } finally {
        await close(server);
      }
    });

    it("LookupAddress tool should be callable", async () => {
      const server = createServer();
      try {
        const client = await connect(server);

        const result = await client.callTool("LookupAddress", {});

        assert.ok(result, "Tool should return a result");
        assert.ok(result.content, "Result should have content");
        assert.strictEqual(result.content.length, 1);
        assert.strictEqual(result.content[0].type, "text");
        assert.match(
          result.content[0].text,
          /^0x[a-fA-F0-9]{40}$/,
          "Should return valid address",
        );
      } finally {
        await close(server);
      }
    });
  });
});
