import {
    createMeeClient,
    getChain,
    toMultichainNexusAccount
  } from "@biconomy/abstractjs";
  import { createWalletClient, formatUnits, http, publicActions } from "viem";
  import { privateKeyToAccount } from "viem/accounts";
  import dotenv from 'dotenv';
import { baseSepolia } from "viem/chains";
  
  // Load environment variables
  dotenv.config();
  
  async function main() {
    // Get private key from environment variable
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is not set');
    }

    // Get stx count from environment variable
    const stxCount = Number(process.env.STX_COUNT);
    if (!stxCount) {
      throw new Error('STX_COUNT environment variable is not set');
    }

    // Get chain from environment variable
    const chainId = process.env.CHAIN_ID;
    if (!chainId) {
      throw new Error('CHAIN_ID environment variable is not set');
    }
    const chain = getChain(Number(chainId));
    if (!chain) {
      throw new Error('Unrecognized chainId: ' + chainId);
    }

    // Set up account
    const eoa = privateKeyToAccount(privateKey as `0x${string}`);

    // Set up wallet client for Base Sepolia
    const walletClient = createWalletClient({
        account: eoa,
        chain,
        transport: http()
    }).extend(publicActions);

    // Create multichain smart account
    const smartAccount = await toMultichainNexusAccount({
      signer: eoa,
      chains: [chain],
      transports: [http()]
    });

    // Fetch smart account balance using wallet client
    const balance = await walletClient.getBalance({
        address: smartAccount.addressOn(chain.id) as `0x${string}`
    });

    if (balance === BigInt(0)) {
        throw new Error("Smart account balance is 0");
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("EOA:", eoa.address);
    console.log("Nexus Account:", smartAccount.addressOn(chain.id));
    console.log(`${chain.name} Balance:`, Number(formatUnits(balance, 18)).toFixed(4), "ETH");
    console.log("--------------------------------------------------------------------------------");
    
    // Initialize the orchestration client
    const meeClient = await createMeeClient({
      account: smartAccount,
      url: "https://tnop.biconomy.io/v1"
    });

    const hashes = [];
    for (let i = 0; i < stxCount; i++) {
      try {
        const instruction = await smartAccount.build({
          type: "default",
          data: {
            calls: [
              {
                to: eoa.address,
                value: BigInt(1),
                data: "0x",
              }
            ],
            chainId: chain.id
          }
        });
        const result = await meeClient.execute({
          feeToken: {
            address: "0x0000000000000000000000000000000000000000",
            chainId: chain.id
          },
          instructions: [instruction]
        });
    
        console.log(`Supertransaction ${i+1} of ${stxCount} broadcasted. Hash: ${result.hash}`);
        hashes.push(result.hash);
      } catch (error: any) {
        console.error(`Supertransaction ${i+1} of ${stxCount} failed:`, error.message);
      }
    }
  
    // Process promises in batches of 10
    const batchSize = 10;
    const receipts = [];
    for (let i = 0; i < hashes.length; i += batchSize) {
      const batch = hashes.slice(i, i + batchSize);
      console.log(`\nAwaiting batch results ${i / batchSize + 1} of ${Math.ceil(hashes.length / batchSize)}`);
      console.log(`Processing transactions ${i + 1} to ${Math.min(i + batchSize, hashes.length)}`);
      
      const startTime = Date.now();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Batch timeout after 3 seconds')), 3000);
      });
  
      try {
        const batchReceipts = await Promise.allSettled(batch.map(async (hash) => {
          try {
            const receipt = await Promise.race([
              meeClient.waitForSupertransactionReceipt({
                hash: hash as `0x${string}`,
              }),
              timeoutPromise
            ]);
            return { hash, status: "SUCCESS", receipt };
          } catch (error) {
            return { hash, status: "FAILED" };
          }
        }));
        
        const endTime = Date.now();
        receipts.push(...batchReceipts);
        
        const successfulTransactions = batchReceipts.filter(r => r.status === "fulfilled" && r.value.status === "SUCCESS").length;
        const failedTransactions = batchReceipts.filter(r => r.status === "fulfilled" && r.value.status === "FAILED").length;
        
        console.log(`Batch ${i / batchSize + 1} completed in ${(endTime - startTime) / 1000} seconds`);
        console.log(`Successfully processed ${successfulTransactions} transactions`);
        console.log(`Failed transactions: ${failedTransactions}`);
      } catch (error: any) {
        console.error(`Batch ${i / batchSize + 1} failed:`, error.message);
        console.log(`Continuing with next batch...`);
      }
      
      console.log(`Total progress: ${Math.min(i + batchSize, hashes.length)}/${hashes.length} transactions`);
      console.log('----------------------------------------');
    }
  }
  
  main().then(() => {
    console.log("Done");
  }).catch(console.error);
  