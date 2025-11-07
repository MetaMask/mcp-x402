import { describe, it } from "node:test";
import assert from "node:assert";
import {connect, close } from "mcp-testing-kit";
import { createServer } from "../../src/server.js";

describe("CreateX402PaymentHeader Tool", () => {
  const validPaymentRequirements = [
    {
      scheme: "exact" as const,
      network: "base-sepolia" as const,
      maxAmountRequired: "1000000000000000000", // 1 token in wei (18 decimals)
      payTo: "0x1234567890123456789012345678901234567890",
      maxTimeoutSeconds: 3600, // 1 hour
      asset: "0x0987654321098765432109876543210987654321", // token contract address
    },
  ];

  it("should list CreateX402PaymentHeader tool", async () => {
    const testServer = createServer();
    try {
      const client = await connect(testServer);
      const tools = await client.listTools();

      const createHeaderTool = tools.tools.find(
        (tool) => tool.name === "CreateX402PaymentHeader"
      );

      assert.ok(createHeaderTool, "CreateX402PaymentHeader tool should be defined");
      assert.strictEqual(createHeaderTool.name, "CreateX402PaymentHeader");
      assert.strictEqual(
        createHeaderTool.description,
        "Create the payment headers for a given payment request"
      );
    } finally {
      await close(testServer);
    }
  });

  it("should create a valid X402 payment header", async () => {
    const testServer = createServer();
    try {
      const client = await connect(testServer);

      const result = await client.callTool("CreateX402PaymentHeader", {
        x402Version: 1,
        accepts: validPaymentRequirements,
      });

      assert.ok(result.content, "Result should have content");
      assert.strictEqual(result.content.length, 1);
      assert.strictEqual(result.content[0].type, "text");

      const headerBase64 = result.content[0].text;

      // Verify it's a valid base64 string
      assert.ok(headerBase64, "Header should not be empty");
      assert.match(headerBase64, /^[A-Za-z0-9+/]+=*$/, "Should be valid base64");

      // Decode and verify the structure
      const decoded = JSON.parse(Buffer.from(headerBase64, "base64").toString());

      assert.strictEqual(decoded.x402Version, 1);
      assert.strictEqual(decoded.scheme, "exact");
      assert.strictEqual(decoded.network, "base-sepolia");
      assert.ok(decoded.payload, "Payload should exist");
      assert.ok(decoded.payload.signature, "Signature should exist");
      assert.match(decoded.payload.signature, /^0x[a-fA-F0-9]+$/, "Signature should be hex");
      assert.ok(decoded.payload.authorization, "Authorization should exist");
    } finally {
      await close(testServer);
    }
  });

  it("should create header with valid authorization fields", async () => {
    const testServer = createServer();
    try {
      const client = await connect(testServer);

      const result = await client.callTool("CreateX402PaymentHeader", {
        x402Version: 1,
        accepts: validPaymentRequirements,
      });

      const headerBase64 = result.content[0].text;
      const decoded = JSON.parse(Buffer.from(headerBase64, "base64").toString());
      const auth = decoded.payload.authorization;

      // Verify authorization fields
      assert.match(auth.from, /^0x[a-fA-F0-9]{40}$/, "from should be valid address");
      assert.strictEqual(
        auth.to.toLowerCase(),
        validPaymentRequirements[0].payTo.toLowerCase(),
        "to should match payTo"
      );
      assert.strictEqual(
        auth.value,
        validPaymentRequirements[0].maxAmountRequired,
        "value should match maxAmountRequired"
      );
      assert.ok(auth.validAfter, "validAfter should exist");
      assert.ok(auth.validBefore, "validBefore should exist");
      assert.ok(auth.nonce, "nonce should exist");

      // Verify timestamps are reasonable
      const now = Math.floor(Date.now() / 1000);
      const validAfter = parseInt(auth.validAfter);
      const validBefore = parseInt(auth.validBefore);

      assert.ok(validAfter < now + 60, "validAfter should be in the past or near present");
      assert.ok(validBefore > now, "validBefore should be in the future");
      assert.ok(
        validBefore - validAfter <= validPaymentRequirements[0].maxTimeoutSeconds + 700,
        "Time window should respect maxTimeoutSeconds (with buffer for validAfter)"
      );
    } finally {
      await close(testServer);
    }
  });

  it("should use default x402Version of 1 when not specified", async () => {
    const testServer = createServer();
    try {
      const client = await connect(testServer);

      const result = await client.callTool("CreateX402PaymentHeader", {
        accepts: validPaymentRequirements,
      });

      const headerBase64 = result.content[0].text;
      const decoded = JSON.parse(Buffer.from(headerBase64, "base64").toString());

      assert.strictEqual(decoded.x402Version, 1, "Should default to version 1");
    } finally {
      await close(testServer);
    }
  });
});
