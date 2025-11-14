import { z } from "zod/v3";
import { PaymentRequirementsSchema } from "../types/x402-types";
import { getWalletClient } from "../wallets";
import { createPaymentHeader } from "../utils/payment";
import { server } from "@modelcontextprotocol/sdk";
import { humanReadablePaymentRequest } from "../utils/payment-request-formatter";
let sharedServer: server;

export const initCreatePaymentRequirements = (server: server) => {
  sharedServer = server;
};

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
  let displayRequest = humanReadablePaymentRequest(accepts[0]);
  //todo select the accepts here
  const result = await sharedServer.server.elicitInput({
    message: `Do you wish to approve the payment ${displayRequest}? `,
    requestedSchema: {
      type: "object",
      properties: {
        approvePayment: {
          type: "boolean",
          title: "Approve payment header creation",
          description:
            "Do you approve creating the payment header for this payment request?",
        },
      },
      required: ["approvePayment"],
    },
  });
  console.error(result.content);
  if (!result.content.approvePayment) {
    throw new Error("User did not approve payment header creation.");
  } else {
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
  }
};
