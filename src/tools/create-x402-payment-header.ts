import { z } from "zod/v3";
import { PaymentRequirementsSchema } from "../types/x402-types";
import { getWalletClient } from "../wallets";
import { createPaymentHeader } from "../utils/payment";

export const CreateX402PaymentHeaderProps = z.object({
  x402Version: z
    .number()
    .describe("The version of the X402 protocol to use")
    .default(1),
  accepts: z
    .array(PaymentRequirementsSchema)
    .describe("The payment requirements for the payment request"),
});

export type CreateX402PaymentHeaderProps = z.infer<
  typeof CreateX402PaymentHeaderProps
>;

export const CreateX402PaymentHeader = async ({
  x402Version,
  accepts,
}: z.infer<typeof CreateX402PaymentHeaderProps>) => {
  const paymentRequest = {
    x402Version,
    accepts,
  };
  const walletClient = getWalletClient();
  return createPaymentHeader(
    walletClient,
    paymentRequest.x402Version,
    paymentRequest.accepts,
  ).then((header) => {
    return {
      content: [
        {
          type: "text" as const,
          text: header,
        },
      ],
    };
  });
};
