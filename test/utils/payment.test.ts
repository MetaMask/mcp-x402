import { describe, it } from "node:test";
import assert from "node:assert";
import { createPaymentHeader } from "../../src/utils/payment.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { PaymentRequirements } from "../../src/types/x402-types.js";

describe("Payment Utils", () => {
  describe("createPaymentHeader", () => {
    const testAccount = privateKeyToAccount(generatePrivateKey());

    const validPaymentRequirements: PaymentRequirements[] = [
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
    ];

    it("should create a valid payment header", async () => {
      const header = await createPaymentHeader(testAccount, 1, validPaymentRequirements);

      // Should return a base64 encoded string
      assert.ok(header, "Header should not be empty");
      assert.match(header, /^[A-Za-z0-9+/]+=*$/, "Should be valid base64");

      // Should be decodable
      const decoded = JSON.parse(Buffer.from(header, "base64").toString());
      assert.ok(decoded, "Should be decodable JSON");
      assert.ok(decoded.x402Version, "Should have x402Version");
      assert.ok(decoded.payload, "Should have payload");
    });

    it("should create header with correct structure when decoded", async () => {
      const header = await createPaymentHeader(testAccount, 1, validPaymentRequirements);
      const decoded = JSON.parse(Buffer.from(header, "base64").toString());

      // Verify top-level structure
      assert.strictEqual(decoded.x402Version, 1);
      assert.strictEqual(decoded.scheme, "exact");
      assert.strictEqual(decoded.network, "base-sepolia");
      assert.ok(decoded.payload, "Payload should exist");
    });

    it("should create header with valid signature", async () => {
      const header = await createPaymentHeader(testAccount, 1, validPaymentRequirements);
      const decoded = JSON.parse(Buffer.from(header, "base64").toString());

      // Verify signature exists and is valid hex
      assert.ok(decoded.payload.signature, "Signature should exist");
      assert.match(decoded.payload.signature, /^0x[a-fA-F0-9]+$/, "Signature should be hex");
      assert.strictEqual(decoded.payload.signature.length, 132, "Signature should be 65 bytes");
    });

    it("should create header with valid authorization fields", async () => {
      const header = await createPaymentHeader(testAccount, 1, validPaymentRequirements);
      const decoded = JSON.parse(Buffer.from(header, "base64").toString());
      const auth = decoded.payload.authorization;

      // Verify authorization structure
      assert.ok(auth, "Authorization should exist");
      assert.strictEqual(auth.from, testAccount.address);
      assert.strictEqual(
        auth.to.toLowerCase(),
        validPaymentRequirements[0].payTo.toLowerCase()
      );
      assert.strictEqual(auth.value, validPaymentRequirements[0].maxAmountRequired);
      assert.ok(auth.validAfter, "validAfter should exist");
      assert.ok(auth.validBefore, "validBefore should exist");
      assert.ok(auth.nonce, "nonce should exist");
    });

    it("should create header with valid timestamps", async () => {
      const header = await createPaymentHeader(testAccount, 1, validPaymentRequirements);
      const decoded = JSON.parse(Buffer.from(header, "base64").toString());
      const auth = decoded.payload.authorization;

      const now = Math.floor(Date.now() / 1000);
      const validAfter = parseInt(auth.validAfter);
      const validBefore = parseInt(auth.validBefore);

      // validAfter should be in the past (10 minutes buffer)
      assert.ok(validAfter < now + 60, "validAfter should be in the past or near present");

      // validBefore should be in the future
      assert.ok(validBefore > now, "validBefore should be in the future");

      // Time window should respect maxTimeoutSeconds (with buffer for validAfter)
      const timeWindow = validBefore - validAfter;
      assert.ok(
        timeWindow <= validPaymentRequirements[0].maxTimeoutSeconds + 700,
        "Time window should respect maxTimeoutSeconds"
      );
    });

    it("should create different headers on each call due to unique nonces", async () => {
      const header1 = await createPaymentHeader(testAccount, 1, validPaymentRequirements);
      const header2 = await createPaymentHeader(testAccount, 1, validPaymentRequirements);

      // Headers should be different because nonces are random
      assert.notStrictEqual(header1, header2);

      const decoded1 = JSON.parse(Buffer.from(header1, "base64").toString());
      const decoded2 = JSON.parse(Buffer.from(header2, "base64").toString());

      // Nonces should be different
      assert.notStrictEqual(
        decoded1.payload.authorization.nonce,
        decoded2.payload.authorization.nonce
      );

      // Signatures should be different
      assert.notStrictEqual(
        decoded1.payload.signature,
        decoded2.payload.signature
      );
    });

    it("should handle multiple payment requirements by selecting first one", async () => {
      const multipleRequirements: PaymentRequirements[] = [
        validPaymentRequirements[0],
        {
          scheme: "exact",
          network: "ethereum-mainnet",
          maxAmountRequired: "2000000",
          payTo: "0x9876543210987654321098765432109876543210",
          maxTimeoutSeconds: 7200,
          asset: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          extra: {
            name: "USD Coin",
            version: "2",
          },
        },
      ];

      const header = await createPaymentHeader(testAccount, 1, multipleRequirements);
      const decoded = JSON.parse(Buffer.from(header, "base64").toString());

      // Should use the first payment requirement
      assert.strictEqual(decoded.network, "base-sepolia");
      assert.strictEqual(
        decoded.payload.authorization.to.toLowerCase(),
        validPaymentRequirements[0].payTo.toLowerCase()
      );
    });
  });
});
