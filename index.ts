import { Connection, PublicKey } from "@solana/web3.js";

async function getAccountInfo(walletAddress: string) {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const publicKey = new PublicKey(walletAddress);

  try {
    const accountInfo = await connection.getAccountInfo(publicKey);
    console.log(JSON.stringify(accountInfo, null, 2));
  } catch (error) {
    console.error("Error fetching account info:", error);
  }
}

// Replace with your actual wallet address
const walletAddress = "hYn1ZbfAdhSgwezgVADHR6nNzGWe7F71JGVdFvqk8L3";
getAccountInfo(walletAddress);
