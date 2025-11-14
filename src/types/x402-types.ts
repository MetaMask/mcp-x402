import { z } from "zod/v3";

export const schemes = ["exact"] as const;
export const x402Versions = [1] as const;
export const NetworkSchema = z.enum([
  "base-sepolia",
  "base",
  "avalanche-fuji",
  "avalanche",
  "iotex",
  "sei",
  "sei-testnet",
  "linea",
  "linea-sepolia",
]);
export const NetworkToChainId = new Map([
  ["base-sepolia", 84532],
  ["base", 8453],
  ["avalanche-fuji", 43113],
  ["avalanche", 43114],
  ["iotex", 4689],
  ["sei", 1329],
  ["sei-testnet", 713715],
  ["linea", 59144],
  ["linea-sepolia", 59141],
]);

const isInteger: (value: string) => boolean = (value) =>
  Number.isInteger(Number(value)) && Number(value) >= 0;

const AddressRegex = /^0x[0-9a-fA-F]{40}$/;
const Address = z.string().regex(AddressRegex);

const SignatureRegex = /^0x[0-9a-fA-F]+$/; // Flexible hex signature validation

export type Network = z.infer<typeof NetworkSchema>;

// Authorization types for EIP-712 signing
export const authorizationTypes = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export const PaymentRequirementsSchema = z.object({
  scheme: z.enum(schemes),
  network: NetworkSchema,
  maxAmountRequired: z.string().refine(isInteger),
  resource: z.string().url().optional(),
  description: z.string().optional(),
  // mimeType: z.string(),
  payTo: Address,
  maxTimeoutSeconds: z.number().int(),
  asset: Address,
  extra: z.record(z.any()).optional(),
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

export const PayloadAuthorizationSchema = z.object({
  from: z.string().regex(AddressRegex),
  to: z.string().regex(AddressRegex),
  value: z.string().refine(isInteger),
  validAfter: z.string().refine(isInteger),
  validBefore: z.string().refine(isInteger),
  nonce: z.string(),
});

export type PayloadAuthorization = z.infer<typeof PayloadAuthorizationSchema>;

export const PayloadSchema = z.object({
  signature: z.string().regex(SignatureRegex),
  authorization: PayloadAuthorizationSchema,
});

export type Payload = z.infer<typeof PayloadSchema>;
