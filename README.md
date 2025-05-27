# TNOP Stress Test Script

This script is designed to run stress tests for the TNOP program on the Biconomy Network. It broadcasts multiple supertransactions and tracks their execution status.

## Prerequisites

- Node.js v23
- Bun v1.2.5

### Installing Bun

If you don't have Bun installed, you can install it using one of the following methods:

**Using curl:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Using npm:**
```bash
npm install -g bun
```

**Using Homebrew (macOS):**
```bash
brew tap oven-sh/bun
brew install bun
```

After installation, verify the version:
```bash
bun --version
# Should output: 1.2.5
```

## Project Setup

1. Clone the repository:
```bash
git clone https://github.com/bcnmy/tnop-script.git
cd tnop-script
```

2. Install dependencies:
```bash
bun i
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with the following variables:
```env
# Your private key
PRIVATE_KEY=your_private_key_here

# Number of supertransactions to broadcast
STX_COUNT=20
```

## Running the Script

To run the stress test:
```bash
bun run index.ts
```

## What the Script Does

1. Initializes a smart account using your private key
2. Checks the account balance on Base Sepolia
3. Broadcasts the specified number of supertransactions
4. Monitors the execution status of each transaction
5. Reports success/failure for each transaction

## Output Format

The script provides detailed output including:
- EOA (Externally Owned Account) address
- Nexus Account address
- Base Sepolia balance
- Transaction status for each supertransaction
- Batch processing results

## Error Handling

- The script handles timeouts gracefully
- Failed transactions are marked as "FAILED"
- Successful transactions are marked as "SUCCESS"
- The script continues processing even if some transactions fail

## Notes

- Make sure your account has sufficient ETH on Base Sepolia
- The script uses a 3-second timeout for transaction confirmation
- Transactions are processed in batches of 10 for better performance

## Troubleshooting

If you encounter any issues:

1. Verify your Node.js version:
```bash
node --version
# Should be v23.x.x
```

2. Check your Bun version:
```bash
bun --version
# Should be 1.2.5
```

3. Ensure your `.env` file is properly configured
4. Verify you have sufficient ETH in your account
5. Check your internet connection
