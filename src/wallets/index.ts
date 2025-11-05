import { envPrivateKeyWalletClient } from "./env-private-key-wallet";
import { localFileWalletClient } from "./local-file-wallet";

export const getWalletClient = () => {
  //First try to use the private key from the environment variables
  //If that fails, use the local file wallet
  const walletClient = envPrivateKeyWalletClient();
  if (walletClient) {
    return walletClient;
  } else {
    return localFileWalletClient();
  }
};
