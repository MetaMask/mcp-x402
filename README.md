# x402 MCP Server - Experimental ⚠️

A Model Context Protocol (MCP) server that will create an x402 header using the provided private key.

## Overview

x402 is an open protocol for internet-native payments

https://www.x402.org/

This project provides a is a minimal mcp server that can be run on a local machine to create x402 `X-PAYMENT` headers

It exposes two mcp tools:

- _CreateX402PaymentHeader_ which will create the payment headers for a given payment request, using the wallet for the tool
- _LookupAddress_ which will lookup the address for account that is used to sign the payment header. Lazily create the account if it does not exist.

[Learn more about MCP](https://modelcontextprotocol.io/docs/getting-started/intro)

[Learn more about x402](https://www.x402.org/)

## Installation

```bash
yarn install
yarn build
```

## Testing

You can test the MCP server using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

A nice move when doing this is to do a yarn build first:

```bash
yarn build && npx @modelcontextprotocol/inspector node build/index.js
```

There is a simple helper simple shell script for creating requests using curl:

- x402-helper.sh

This depends on curl and [jq](https://jqlang.org/)

A test scenario that can work well is:

1. start the server `npx @modelcontextprotocol/inspector node build/index.js`
2. lookup the payment details for a x402 protected resource `./x402-helper.sh https://x402.smoyer.dev/premium-joke`
3. past the array into the web page for the inspector, connecting to the server, Listing Tools, then running the CreateX402PaymentHeader
4. Copy the tool result and paste it into the terminal as a 2nd arg to the x402-helper command:

```
./x402-helper.sh https://x402.smoyer.dev/premium-joke {base-64-encoded-string}
```

## Roadmap

- [ ] Testing
- [ ] Configurable key management and signing
- [ ] Integration with the Delegation Toolkit https://docs.metamask.io/delegation-toolkit
