import { privateKeyToAccount } from "viem/accounts";

import "dotenv/config";

export const envPrivateKeyWalletClient = () => {
  if (!process.env.PRIVATE_KEY) {
    return null;
  } else {
    return privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  }
};
