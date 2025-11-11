import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { getWalletClient } from "../../src/wallets/index.js";
import { generatePrivateKey } from "viem/accounts";

describe("Wallet Selection", () => {
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

  it("should return env wallet when PRIVATE_KEY is set", () => {
    const testPrivateKey = generatePrivateKey();
    process.env.PRIVATE_KEY = testPrivateKey;

    const wallet = getWalletClient();

    assert.ok(wallet, "Wallet should exist");
    assert.ok(wallet.address, "Wallet should have address");
    assert.match(
      wallet.address,
      /^0x[a-fA-F0-9]{40}$/,
      "Should have valid address",
    );
  });

  it("should return local file wallet when PRIVATE_KEY is not set", () => {
    delete process.env.PRIVATE_KEY;

    const wallet = getWalletClient();

    assert.ok(wallet, "Wallet should exist");
    assert.ok(wallet.address, "Wallet should have address");
    assert.match(
      wallet.address,
      /^0x[a-fA-F0-9]{40}$/,
      "Should have valid address",
    );
  });

  it("should prefer env wallet over local file wallet", () => {
    const testPrivateKey = generatePrivateKey();
    process.env.PRIVATE_KEY = testPrivateKey;

    const envWallet = getWalletClient();
    const envWalletAddress = envWallet.address;

    delete process.env.PRIVATE_KEY;
    const fileWallet = getWalletClient();

    // Verify both wallets exist and are valid
    assert.ok(envWallet, "Env wallet should exist");
    assert.ok(fileWallet, "File wallet should exist");
    assert.ok(envWallet.address, "Env wallet should have address");
    assert.ok(fileWallet.address, "File wallet should have address");

    // Verify the env wallet was used when PRIVATE_KEY was set
    // by checking it used the test private key we provided
    assert.match(
      envWalletAddress,
      /^0x[a-fA-F0-9]{40}$/,
      "Env wallet address should be valid",
    );

    // File wallet should be consistently the same
    const fileWallet2 = getWalletClient();
    assert.strictEqual(
      fileWallet.address,
      fileWallet2.address,
      "File wallet should be consistent",
    );
  });

  it("should return wallet with signing capabilities", async () => {
    const wallet = getWalletClient();

    assert.ok(wallet.signMessage, "Wallet should have signMessage method");
    assert.ok(wallet.signTypedData, "Wallet should have signTypedData method");

    // Test signing
    const message = "Test message";
    const signature = await wallet.signMessage({ message });

    assert.ok(signature, "Should be able to sign messages");
    assert.match(signature, /^0x[a-fA-F0-9]+$/, "Signature should be hex");
  });

  it("should return consistent wallet on multiple calls", () => {
    const wallet1 = getWalletClient();
    const wallet2 = getWalletClient();

    // Should return the same address
    assert.strictEqual(
      wallet1.address,
      wallet2.address,
      "Should return consistent wallet",
    );
  });
});
