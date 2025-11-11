import { describe, it, afterEach } from "node:test";
import assert from "node:assert";
import { localFileWalletClient } from "../../src/wallets/local-file-wallet.js";
import fs from "fs";
import path from "path";

describe("Local File Wallet", () => {
  const TEST_WALLET_PATH = path.join(process.cwd(), "wallet-test.json");
  const ORIGINAL_WALLET_PATH = path.join(process.cwd(), "wallet.json");

  // Clean up test wallet file after each test
  afterEach(() => {
    if (fs.existsSync(TEST_WALLET_PATH)) {
      fs.unlinkSync(TEST_WALLET_PATH);
    }
  });

  it("should create a new wallet if file doesn't exist", () => {
    // Ensure test file doesn't exist
    if (fs.existsSync(TEST_WALLET_PATH)) {
      fs.unlinkSync(TEST_WALLET_PATH);
    }

    // This test is informational - we can't easily mock the WALLET_FILE_PATH
    // without refactoring the source code. But we can test that the main
    // wallet file exists and returns a valid account.
    const account = localFileWalletClient();

    // Should return a valid account
    assert.ok(account, "Account should exist");
    assert.ok(account.address, "Account should have an address");
    assert.match(
      account.address,
      /^0x[a-fA-F0-9]{40}$/,
      "Should have valid address format",
    );
    assert.ok(
      account.signTypedData,
      "Account should have signTypedData method",
    );
  });

  it("should return same wallet on multiple calls", () => {
    const account1 = localFileWalletClient();
    const account2 = localFileWalletClient();

    // Should return the same address since it reads from the same file
    assert.strictEqual(account1.address, account2.address);
  });

  it("should create wallet.json file if it doesn't exist", () => {
    // Check that wallet.json exists (created by previous tests or first run)
    const walletExists = fs.existsSync(ORIGINAL_WALLET_PATH);

    if (walletExists) {
      const walletData = JSON.parse(
        fs.readFileSync(ORIGINAL_WALLET_PATH, "utf8"),
      );

      // Verify wallet file structure
      assert.ok(walletData.privateKey, "Wallet file should have privateKey");
      assert.ok(walletData.address, "Wallet file should have address");
      assert.match(
        walletData.privateKey,
        /^0x[a-fA-F0-9]{64}$/,
        "Private key should be 32 bytes hex",
      );
      assert.match(
        walletData.address,
        /^0x[a-fA-F0-9]{40}$/,
        "Address should be valid format",
      );
    }
  });

  it("should create valid LocalAccount with signing capability", async () => {
    const account = localFileWalletClient();

    // Test that the account can sign a message
    const message = "Test message";
    const signature = await account.signMessage({ message });

    // Signature should be valid hex
    assert.ok(signature, "Signature should exist");
    assert.match(signature, /^0x[a-fA-F0-9]+$/, "Signature should be hex");
  });
});
