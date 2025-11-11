import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CreateX402PaymentHeaderProps,
  CreateX402PaymentHeader,
} from "./tools/create-x402-payment-header.js";
import { LookupAddressProps, LookupAddress } from "./tools/lookup-address.js";

export function createServer() {
  const server = new McpServer({
    name: "MCP Server X402 Payment Headers Creator",
    version: "0.1.0",
  });

  server.tool(
    "CreateX402PaymentHeader",
    "Create the payment headers for a given payment request",
    CreateX402PaymentHeaderProps.shape,
    CreateX402PaymentHeader,
  );

  server.tool(
    "LookupAddress",
    "Lookup the address for account that is used to sign the payment header. Lazily create the account if it does not exist.",
    LookupAddressProps.shape,
    LookupAddress,
  );

  return server;
}
