curl https://x402.smoyer.dev/premium-joke | jq ./accepts

```
{
  "accepts": [
    {
      "scheme": "exact",
      "network": "base",
      "maxAmountRequired": "10000",
      "resource": "https://x402.smoyer.dev/premium-joke",
      "description": "A premium programming joke",
      "mimeType": "",
      "payTo": "0x60ac86571E55F9735F00cE9e28361d203977B260",
      "maxTimeoutSeconds": 60,
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "extra": {
        "name": "USD Coin",
        "version": "2"
      }
    }
  ],
  "error": "X-PAYMENT header is required",
  "x402Version": 1
}
curl -H "X-PAYMENT: eyJ4NDAyVmVyc2lvbiI6MSwic2NoZW1lIjoiZXhhY3QiLCJuZXR3b3JrIjoiYmFzZSIsInBheWxvYWQiOnsic2lnbmF0dXJlIjoiMHhkMTZiYzhmZGE5ZDZjYWQ4YjQ2NThjN2EyZGVmYTA3MmUzNTkzZGExNzkzNjE4NzA2MjM3ODRiOTVlYTdlOTFlNmNmODVjOTg4NGU3NDFmNTk3ODFiOWE0MjY2NzBiYjM0MGNlMTBlZmFjNDEzZTAzNTAxMzcxOWZiMTkwNzczYjFiIiwiYXV0aG9yaXphdGlvbiI6eyJmcm9tIjoiMHhFNzc0MTkyOWM3ZTA1NTg5NUVhYmVCZjMwMmVhMjA3OTY5YTBiMzdkIiwidG8iOiIweDYwYWM4NjU3MUU1NUY5NzM1RjAwY0U5ZTI4MzYxZDIwMzk3N0IyNjAiLCJ2YWx1ZSI6IjEwMDAwIiwidmFsaWRBZnRlciI6IjE3NTc4NjU4NTgiLCJ2YWxpZEJlZm9yZSI6IjE3NTc4NjY1MTgiLCJub25jZSI6IjB4MmRkYWJlMThiNjM1YzMzMmEwODc4N2VkOGY0MzYyMTgzODg5YzNlYmJlNzc4N2FmZjY5MWQ2YzkzOTQwMDcyOSJ9fX0=" https://x402.smoyer.dev/premium-joke | jq .

```

curl https://blast-mainnet.gateway.din.dev/rpc -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId"}' -H "Content-Type:application/json" | jq .
{
"accepts": [
{
"scheme": "exact",
"network": "base",
"maxAmountRequired": "20",
"resource": "http://example.com/rpc",
"description": "Call to 1 method: eth_chainId",
"mimeType": "",
"payTo": "0x8d6Efb97F6E3d218647eD74AF418d47489550Ae2",
"maxTimeoutSeconds": 60,
"asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
"extra": {
"name": "USD Coin",
"version": "2"
}
}
],
"error": "X-PAYMENT header is required",
"x402Version": 1
}
