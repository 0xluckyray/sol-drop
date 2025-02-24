import dotenv from "dotenv";
import bs58 from "bs58";
import {
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
  Connection,
  PublicKey,
  clusterApiUrl,
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  mintTo,
  getMint,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { BN } from "@project-serum/anchor";

dotenv.config();

// Keys from .env
const fromWalletPrivateKeyString = process.env
  .SENDER_WALLET_PRIVATE_KEY as string;
const receiverPublicKeyString = process.env
  .RECEIVER_WALLET_PUBLIC_KEY as string;

const fromWallet = Keypair.fromSecretKey(bs58.decode(fromWalletPrivateKeyString));
const toWalletPublicKey = new PublicKey(receiverPublicKeyString);

// transferSplToken function
async function transferSplToken(mint:PublicKey, transferAmount: number, network: string = "mainnet") {
  let connection: Connection;
  if (network === "mainnet") {
    connection = new Connection("https://api.mainnet-beta.solana.com");
  } else {
    connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  }
  // Check fromWallet balance
  const fromWalletBalance = await connection.getBalance(fromWallet.publicKey);
  console.log("From Wallet Balance:", fromWalletBalance / LAMPORTS_PER_SOL, "SOL");

  if (fromWalletBalance < 0.01 * LAMPORTS_PER_SOL) {
    throw new Error("From wallet does not have enough SOL to pay for transaction fees.");
  }
  
  const accountInfo = await connection.getAccountInfo(mint);
  const tokenProgramID = accountInfo?.owner;
  console.log("Token ProgramID", tokenProgramID);

  // Get token mint info (including decimals)
  const mintInfo = await getMint(
    connection,
    mint,
    "confirmed",
    tokenProgramID // TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID
  );
  console.log("Token Decimals:", mintInfo);

  console.log("ASSOCIATED_TOKEN_PROGRAM_ID: ", ASSOCIATED_TOKEN_PROGRAM_ID);

  // Get the token account of the fromWall address, if it doesn't exist, create it
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromWallet.publicKey,
    false,
    undefined,
    undefined,
    tokenProgramID, // TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  //get the token account of the toWallet address, if it does not exist, create it
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet, // payer
    mint,
    toWalletPublicKey,
    false,
    undefined,
    undefined,
    tokenProgramID, // TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log ("fromTokenAccount::", fromTokenAccount.toString());
  
  // Check the balance of the fromTokenAccount
  const fromTokenAccountBalance = await connection.getTokenAccountBalance(fromTokenAccount.address);
  console.log("From Token Account Balance:", fromTokenAccountBalance.value.uiAmount, "tokens");
  
  // Ensure the fromTokenAccount has enough tokens for the transfer
  // const transferAmount = 0.1; // Adjust this value based on the token's decimals
  if (fromTokenAccountBalance.value.uiAmount === null || fromTokenAccountBalance.value.uiAmount < transferAmount) {
    throw new Error("Insufficient funds in the fromTokenAccount.");
  }

  // // Token Transfer Instruction
  let transferInstruction: TransactionInstruction;

  if(String(tokenProgramID) == String(TOKEN_PROGRAM_ID)){
    transferInstruction = createTransferInstruction(
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      transferAmount * Math.pow(10, mintInfo.decimals)
    );
  } else { 
    //tokenProgramID == TOKEN_2022_PROGRAM_ID
    transferInstruction = createTransferCheckedInstruction(
      fromTokenAccount.address,
      mint,
      toTokenAccount.address,
      fromWallet.publicKey,
      new BN(transferAmount * Math.pow(10, mintInfo.decimals)),
      mintInfo.decimals,
      [],
      TOKEN_2022_PROGRAM_ID
    );
  }

  // Priority fee instruction
  const PRIORITY_FEE_MICRO_LAMPORTS = 200000; // 0.2 lamports per compute unit (adjust as needed)
  // Instruction to set the compute unit price for priority fee
  const PRIORITY_FEE_INSTRUCTIONS = ComputeBudgetProgram.setComputeUnitPrice({microLamports: PRIORITY_FEE_MICRO_LAMPORTS});

  // Fetch a fresh blockhash
  const latestBlockhash = await connection.getLatestBlockhash();
  
  // Compiles and signs the transaction message with the sender's Keypair.
  const messageV0 = new TransactionMessage({
    payerKey: fromWallet.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [PRIORITY_FEE_INSTRUCTIONS, transferInstruction],
  }).compileToV0Message();
  
  const versionedTransaction = new VersionedTransaction(messageV0);
  
  // Sign transaction, broadcast, and confirm
  versionedTransaction.sign([fromWallet]);

  // Attempts to send the transaction to the network, handling success or failure.
  try {
    const transactionSignature = await connection.sendTransaction(versionedTransaction, {
      maxRetries: 20,
    });

    const confirmation = await connection.confirmTransaction(
      {
        signature: transactionSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "confirmed"
    );
    if (confirmation.value.err) {
      throw new Error("🚨Transaction not confirmed.");
    }

    if(network === "mainnet"){
      console.log(
        "Transaction Signature: ",
        `https://solscan.io/tx/${transactionSignature}`
      );
    } else {
      console.log(
        "Transaction Signature: ",
        `https://solscan.io/tx/${transactionSignature}?cluster=devnet`
      );
    }
    
  } catch (error) {
    console.error("Transaction failed", error);
  }
}

// Test
let mint: PublicKey;  // Mint Account Address (Token Address)
mint = new PublicKey("C8NEYcW7eoQsrQ7vqeiUTLFxwJQNHgj8LwSc3BUQx6YG"); // Devnet SPL Token
transferSplToken(mint, 1000000, "devnet");

mint = new PublicKey("13pkrcqF47rF2oF4kZnBVzH5omQ2f7nF429vzpjgL896"); // Devnet Token2022 SPL Token
transferSplToken(mint, 1000000, "devnet");

mint = new PublicKey("7WphEnjwKtWWMbb7eEVYeLDNN2jodCo871tVt8jHpump"); // Mainnet SPL Token
transferSplToken(mint, 10, "mainnet");

mint = new PublicKey("HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC"); // Mainnet Token2022 SPL Token
transferSplToken(mint, 0.05, "mainnet");