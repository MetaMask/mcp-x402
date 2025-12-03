import { PaymentRequirements } from "../types/x402-types";

export function humanReadablePaymentRequest(
  paymentRequest: PaymentRequirements,
): string {
  if (paymentRequest.scheme === "exact") {
    let amount = Number(paymentRequest.maxAmountRequired);
    let displayAmount = amount / 100_000;
    return `$${displayAmount} for ${paymentRequest.description}`;
  } else {
    //TODO think about how to handle this better.
    return JSON.stringify(paymentRequest);
  }
}
