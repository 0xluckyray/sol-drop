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
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createTransferInstruction,
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
const mint = new PublicKey("C8NEYcW7eoQsrQ7vqeiUTLFxwJQNHgj8LwSc3BUQx6YG"); // Devnet

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  // const connection = new Connection("https://api.mainnet-bet.solana.com");

  // Generate a wallet keypair and airdrop SOL
  // const fromWallet = Keypair.generate();
  // const airdropSignature = await connection.requestAirdrop(
  //   fromWallet.publicKey,
  //   LAMPORTS_PER_SOL
  // );

  // Wait for airdrop cofirmation
  // await connection.confirmTransaction(airdropSignature);

  // Generate a wallet keypair to receive newly minted token
  // const toWallet = Keypair.generate();

  // Create new token mint
  // const mint = await createMint(
  //   connection,
  //   fromWallet,
  //   fromWallet.publicKey,
  //   null,
  //   9
  // );

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

  // // Minting 1000 000 000 tokens to the fromTokenAccount we just returned/created
  // await mintTo(
  //   connection,
  //   fromWallet,
  //   mint,
  //   fromTokenAccount.address,
  //   fromWallet.publicKey,
  //   1000000000 * LAMPORTS_PER_SOL, // it's 1 token, but in lamports
  //   []
  // );

  // // Add token transfer instructions to transaction
  const transaction = new Transaction().add(
    createTransferInstruction(
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      1000000 * LAMPORTS_PER_SOL
    )
  );

  // // Sign transaction, broadcast, and confirm
  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet]
  );

  console.log(
    "Transaction Signature: ",
    `https://solscan.io/tx/${transactionSignature}?cluster=devnet`
  );
})();
