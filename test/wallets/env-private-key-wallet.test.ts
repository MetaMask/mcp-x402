import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { envPrivateKeyWalletClient } from "../../src/wallets/env-private-key-wallet.js";
import { generatePrivateKey } from "viem/accounts";

describe("Env Private Key Wallet", () => {
  let originalPrivateKey: string | undefined;

  beforeEach(() => {
    // Save original env value
    originalPrivateKey = process.env.PRIVATE_KEY;
  });

  afterEach(() => {
    // Restore original env value
    if (originalPrivateKey !== undefined) {
      process.env.PRIVATE_KEY = originalPrivateKey;
    } else {
      delete process.env.PRIVATE_KEY;
    }
  });

  it("should return null when PRIVATE_KEY is not set", () => {
    delete process.env.PRIVATE_KEY;

    const account = envPrivateKeyWalletClient();

    assert.strictEqual(account, null, "Should return null when PRIVATE_KEY is not set");
  });

  it("should return null when PRIVATE_KEY is empty string", () => {
    process.env.PRIVATE_KEY = "";

    const account = envPrivateKeyWalletClient();

    assert.strictEqual(account, null, "Should return null when PRIVATE_KEY is empty");
  });

  it("should create account when PRIVATE_KEY is set", () => {
    const testPrivateKey = generatePrivateKey();
    process.env.PRIVATE_KEY = testPrivateKey;

    const account = envPrivateKeyWalletClient();

    assert.ok(account, "Account should exist when PRIVATE_KEY is set");
    assert.ok(account?.address, "Account should have an address");
    assert.match(
      account?.address || "",
      /^0x[a-fA-F0-9]{40}$/,
      "Should have valid address format"
    );
  });

  it("should create same account for same private key", () => {
    const testPrivateKey = generatePrivateKey();
    process.env.PRIVATE_KEY = testPrivateKey;

    const account1 = envPrivateKeyWalletClient();
    const account2 = envPrivateKeyWalletClient();

    assert.strictEqual(
      account1?.address,
      account2?.address,
      "Same private key should produce same address"
    );
  });

  it("should create account with signing capability", async () => {
    const testPrivateKey = generatePrivateKey();
    process.env.PRIVATE_KEY = testPrivateKey;

    const account = envPrivateKeyWalletClient();

    assert.ok(account, "Account should exist");

    // Test that the account can sign a message
    const message = "Test message";
    const signature = await account!.signMessage({ message });

    assert.ok(signature, "Signature should exist");
    assert.match(signature, /^0x[a-fA-F0-9]+$/, "Signature should be hex");
  });

  it("should support signTypedData", () => {
    const testPrivateKey = generatePrivateKey();
    process.env.PRIVATE_KEY = testPrivateKey;

    const account = envPrivateKeyWalletClient();

    assert.ok(account, "Account should exist");
    assert.ok(account?.signTypedData, "Account should have signTypedData method");
    assert.strictEqual(
      typeof account?.signTypedData,
      "function",
      "signTypedData should be a function"
    );
  });
});
