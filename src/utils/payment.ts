import { Address, Chain, LocalAccount, Transport } from "viem";
import { createNonce, signAuthorization } from "./sign";
import { NetworkSchema, PayloadSchema, schemes, x402Versions, PaymentRequirements, Payload } from "../types/x402-types";
import { z } from "zod";


/**
 * Prepares an unsigned payment header with the given sender address and payment requirements.
 *
 * @param from - The sender's address from which the payment will be made
 * @param x402Version - The version of the X402 protocol to use
 * @param paymentRequirements - The payment requirements containing scheme and network information
 * @returns An unsigned payment payload containing authorization details
 */
function preparePaymentHeader(
  from: Address,
  x402Version: number,
  paymentRequirements: PaymentRequirements,
): UnsignedPaymentPayload {
  const nonce = createNonce();
  const validAfter = BigInt(
    Math.floor(Date.now() / 1000) - 600, // 10 minutes before
  ).toString();
  const validBefore = BigInt(
    Math.floor(Date.now() / 1000 + paymentRequirements.maxTimeoutSeconds),
  ).toString();

  return {
    x402Version,
    scheme: paymentRequirements.scheme,
    network: paymentRequirements.network,
    payload: {
      signature: undefined,
      authorization: {
        from,
        to: paymentRequirements.payTo as Address,
        value: paymentRequirements.maxAmountRequired,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      },
    },
  };
}

/**
 * Signs a payment header using the provided client and payment requirements.
 *
 * @param client - The signer wallet instance used to sign the payment header
 * @param paymentRequirements - The payment requirements containing scheme and network information
 * @param unsignedPaymentHeader - The unsigned payment payload to be signed
 * @returns A promise that resolves to the signed payment payload
 */
async function signPaymentHeader<transport extends Transport, chain extends Chain>(
  delegatorAccount: LocalAccount,
  paymentRequirements: PaymentRequirements,
  unsignedPaymentHeader: UnsignedPaymentPayload,
): Promise<PaymentPayload> {
  const { signature } = await signAuthorization(
    delegatorAccount,
    unsignedPaymentHeader.payload.authorization,
    paymentRequirements,
  );

  return {
    ...unsignedPaymentHeader,
    payload: {
      ...unsignedPaymentHeader.payload,
      signature,
    },
  };
}

/**
 * Creates a complete payment payload by preparing and signing a payment header.
 *
 * @param client - The signer wallet instance used to create and sign the payment
 * @param x402Version - The version of the X402 protocol to use
 * @param paymentRequirements - The payment requirements containing scheme and network information
 * @returns A promise that resolves to the complete signed payment payload
 */
async function createPayment<transport extends Transport, chain extends Chain>(
  delegatorAccount: LocalAccount,
  x402Version: number,
  paymentRequirements: PaymentRequirements[],
): Promise<PaymentPayload> {
  const from = delegatorAccount.address;
  const selectedPaymentRequirements = preferredPaymentRequirements(paymentRequirements);
  const unsignedPaymentHeader = preparePaymentHeader(from, x402Version, selectedPaymentRequirements);
  return signPaymentHeader(delegatorAccount, selectedPaymentRequirements, unsignedPaymentHeader);
}

//TODO implement a search and select logic for the preferred payment requirements
function preferredPaymentRequirements(paymentRequirements: PaymentRequirements[]): PaymentRequirements {
  return paymentRequirements[0];
}

/**
 * Creates and encodes a payment header for the given client and payment requirements.
 *
 * @param client - The signer wallet instance used to create the payment header
 * @param x402Version - The version of the X402 protocol to use
 * @param paymentRequirements - The payment requirements containing scheme and network information
 * @returns A promise that resolves to the encoded payment header string
 */
export async function createPaymentHeader(
  client: LocalAccount,
  x402Version: number,
  paymentRequirements: PaymentRequirements[],
): Promise<string> {

  const payment = await createPayment(client, x402Version, paymentRequirements);
  return encodePayment(payment);
}


function encodePayment(payment: PaymentPayload): string {
  let safe: PaymentPayload;

    const evmPayload = payment.payload as Payload;
    safe = {
      ...payment,
      payload: {
        ...evmPayload,
        authorization: Object.fromEntries(
          Object.entries(evmPayload.authorization).map(([key, value]) => [
            key,
            typeof value === "bigint" ? (value as bigint).toString() : value,
          ]),
        ) as Payload["authorization"],
      },
    };
    return safeBase64Encode(JSON.stringify(safe));
}


function safeBase64Encode(data: string): string {
  if (typeof globalThis !== "undefined" && typeof globalThis.btoa === "function") {
    return globalThis.btoa(data);
  }
  return Buffer.from(data).toString("base64");
}

 const PaymentPayloadSchema = z.object({
  x402Version: z.number().refine(val => x402Versions.includes(val as 1)),
  scheme: z.enum(schemes),
  network: NetworkSchema,
  payload: PayloadSchema,
});
type PaymentPayload = z.infer<typeof PaymentPayloadSchema>;

type UnsignedPaymentPayload = Omit<PaymentPayload, "payload"> & {
  payload: Omit<PaymentPayload, "signature"> & { signature: undefined };
};
