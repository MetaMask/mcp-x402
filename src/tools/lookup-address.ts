import { z } from "zod";
import { getWalletClient } from "../wallets";

export const LookupAddressProps = z.object({});

export type LookupAddressProps = z.infer<typeof LookupAddressProps>;

export const LookupAddress = async (args: LookupAddressProps) => {
  const walletClient = getWalletClient();
  const address = walletClient.address;
  
  return {
    content: [
      {
        type: "text" as const,
        text: address
      },
    ],
  };
};