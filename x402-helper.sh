#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Usage: $0 <url>"
    echo "Example: $0 https://x402.smoyer.dev/premium-joke"
    echo "Then copy the accepts array into the inspector, after pasting it into the inspector, run the following command to send the payment"
    echo "Usage: $0 <url> <payment>"
    exit 1
fi


if [ $# -eq 1 ]; then
    curl "$1" | jq .accepts 
    exit 1
fi

if [ $# -eq 2 ]; then
    curl -H "X-PAYMENT: $2" "$1" | jq .
    exit 1
fi
