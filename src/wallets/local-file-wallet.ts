import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { LocalAccount } from "viem";
import fs from "fs";
import path from "path";

interface WalletFile {
  privateKey: string;
  address: string;
}

const WALLET_FILE_PATH = path.join(process.cwd(), "wallet.json");

export function localFileWalletClient(): LocalAccount {
  let walletData: WalletFile;

  try {
    // Try to read existing wallet file
    const fileContent = fs.readFileSync(WALLET_FILE_PATH, "utf8");
    walletData = JSON.parse(fileContent);
  } catch (error) {
    // File doesn't exist or is invalid, create a new wallet
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    walletData = {
      privateKey,
      address: account.address,
    };

    // Save the new wallet to file
    fs.writeFileSync(WALLET_FILE_PATH, JSON.stringify(walletData, null, 2));
    console.error(`New wallet created and saved to ${WALLET_FILE_PATH}`);
    console.error(`Wallet address: ${walletData.address}`);
  }

  // Create and return the account from the private key
  return privateKeyToAccount(walletData.privateKey as `0x${string}`);
}
