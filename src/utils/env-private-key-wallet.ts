import { privateKeyToAccount } from 'viem/accounts'

import 'dotenv/config'
export const envPrivateKeyWalletClient = () => {
  return privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
}