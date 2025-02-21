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
  VersionedTransaction
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  mintTo,
  getMint,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

dotenv.config();

// Keys from .env
const fromWalletPrivateKeyString = process.env
  .SENDER_WALLET_PRIVATE_KEY as string;
const receiverPublicKeyString = process.env
  .RECEIVER_WALLET_PUBLIC_KEY as string;

const fromWallet = Keypair.fromSecretKey(bs58.decode(fromWalletPrivateKeyString));
const toWalletPublicKey = new PublicKey(receiverPublicKeyString);

//Token Mint Account Address
// const mint = new PublicKey("C8NEYcW7eoQsrQ7vqeiUTLFxwJQNHgj8LwSc3BUQx6YG"); // Devnet
const mint = new PublicKey("7WphEnjwKtWWMbb7eEVYeLDNN2jodCo871tVt8jHpump"); // Mainnet

// transferSplToken function
async function transferSplToken(network: string = "mainnet") {
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

  // Get token mint info (including decimals)
  const mintInfo = await getMint(
    connection,
    mint,
    "confirmed",
    TOKEN_PROGRAM_ID,
  );
  console.log("Token Decimals:", mintInfo.decimals);

  // Get the token account of the fromWall address, if it doesn't exist, create it
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromWallet.publicKey
  );

  //get the token account of the toWallet address, if it does not exist, create it
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    toWalletPublicKey,
  );

  // Check the balance of the fromTokenAccount
  const fromTokenAccountBalance = await connection.getTokenAccountBalance(fromTokenAccount.address);
  console.log("From Token Account Balance:", fromTokenAccountBalance.value.uiAmount, "tokens");

  // Ensure the fromTokenAccount has enough tokens for the transfer
  const transferAmount = 50; // Adjust this value based on the token's decimals
  if (fromTokenAccountBalance.value.uiAmount === null || fromTokenAccountBalance.value.uiAmount < transferAmount) {
    throw new Error("Insufficient funds in the fromTokenAccount.");
  }

  // Token Transfer Instruction
  const transferInstruction = createTransferInstruction(
    fromTokenAccount.address,
    toTokenAccount.address,
    fromWallet.publicKey,
    transferAmount * Math.pow(10, mintInfo.decimals)
  );

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

transferSplToken();