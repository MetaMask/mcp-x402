import { describe, it } from "node:test";
import assert from "node:assert";
import { createNonce, signAuthorization } from "../../src/utils/sign.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type {
  PayloadAuthorization,
  PaymentRequirements,
} from "../../src/types/x402-types.js";

describe("Sign Utils", () => {
  describe("createNonce", () => {
    it("should create a valid 32-byte hex nonce", () => {
      const nonce = createNonce();

      // Should be a hex string starting with 0x
      assert.match(nonce, /^0x[a-fA-F0-9]+$/);

      // Should be 32 bytes = 64 hex chars + '0x' prefix = 66 total chars
      assert.strictEqual(nonce.length, 66);
    });

    it("should create unique nonces on each call", () => {
      const nonce1 = createNonce();
      const nonce2 = createNonce();
      const nonce3 = createNonce();

      // All nonces should be different
      assert.notStrictEqual(nonce1, nonce2);
      assert.notStrictEqual(nonce2, nonce3);
      assert.notStrictEqual(nonce1, nonce3);
    });
  });

  describe("signAuthorization", () => {
    const testAccount = privateKeyToAccount(generatePrivateKey());

    const authorization: PayloadAuthorization = {
      from: testAccount.address,
      to: "0x1234567890123456789012345678901234567890",
      value: "1000000",
      validAfter: "0",
      validBefore: "9999999999",
      nonce: createNonce(),
    };

    const paymentRequirements: PaymentRequirements = {
      scheme: "exact",
      network: "base-sepolia",
      maxAmountRequired: "1000000",
      payTo: "0x1234567890123456789012345678901234567890",
      maxTimeoutSeconds: 3600,
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
      extra: {
        name: "USD Coin",
        version: "2",
      },
    };

    it("should sign authorization and return valid signature", async () => {
      const result = await signAuthorization(
        testAccount,
        authorization,
        paymentRequirements,
      );

      // Should return an object with signature
      assert.ok(result.signature, "Signature should exist");

      // Signature should be a valid hex string
      assert.match(result.signature, /^0x[a-fA-F0-9]+$/);

      // EIP-712 signatures are typically 65 bytes = 130 hex chars + '0x' = 132 chars
      assert.strictEqual(result.signature.length, 132);
    });

    it("should produce different signatures for different nonces", async () => {
      const auth1 = { ...authorization, nonce: createNonce() };
      const auth2 = { ...authorization, nonce: createNonce() };

      const result1 = await signAuthorization(
        testAccount,
        auth1,
        paymentRequirements,
      );
      const result2 = await signAuthorization(
        testAccount,
        auth2,
        paymentRequirements,
      );

      // Different nonces should produce different signatures
      assert.notStrictEqual(result1.signature, result2.signature);
    });

    it("should produce same signature for same data", async () => {
      const fixedNonce = createNonce();
      const auth1 = { ...authorization, nonce: fixedNonce };
      const auth2 = { ...authorization, nonce: fixedNonce };

      const result1 = await signAuthorization(
        testAccount,
        auth1,
        paymentRequirements,
      );
      const result2 = await signAuthorization(
        testAccount,
        auth2,
        paymentRequirements,
      );

      // Same data should produce same signature
      assert.strictEqual(result1.signature, result2.signature);
    });

    it("should throw error if wallet client doesn't support signTypedData", async () => {
      const invalidAccount = {
        address: testAccount.address,
        // Missing signTypedData method
      } as any;

      await assert.rejects(
        async () => {
          await signAuthorization(
            invalidAccount,
            authorization,
            paymentRequirements,
          );
        },
        {
          name: "Error",
          message:
            /Invalid wallet client provided does not support signTypedData/,
        },
      );
    });
  });
});
