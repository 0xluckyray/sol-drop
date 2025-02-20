import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

async function getAccountInfo(address: string, network: string = "mainnet") {
  let connection: Connection;
  if (network === "mainnet") {
    connection = new Connection("https://api.mainnet-beta.solana.com");
  } else {
    connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  }
  const publicKey = new PublicKey(address);

  try {
    const accountInfo = await connection.getAccountInfo(publicKey);
    console.log(JSON.stringify(accountInfo, null, 2));
  } catch (error) {
    console.error("Error fetching account info:", error);
  }
}

async function getMintInfo(address: string, network: string = "mainnet") {
  let connection: Connection;
  if (network === "mainnet") {
    connection = new Connection("https://api.mainnet-beta.solana.com");
  } else {
    connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  }
  const publicKey = new PublicKey(address);

  try {
    const mintInfo = await getMint(
      connection,
      publicKey,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    console.log(
      JSON.stringify(
        mintInfo,
        (key, value) => {
          // Convert BigInt to String
          if (typeof value === "bigint") {
            return value.toString();
          }
          // Handle Buffer objects
          if (Buffer.isBuffer(value)) {
            return `<Buffer ${value.toString("hex")}>`;
          }
          return value;
        },
        2
      )
    );
  } catch (error) {
    console.error("Error fetching mint info:", error);
  }
}

// Get Mint Info with Mint account address
const mintAccountAddress = "C33qt1dZGZSsqTrHdtLKXPZNoxs6U1ZBfyDkzmj6mXeR";
getMintInfo(mintAccountAddress, "devnet");
