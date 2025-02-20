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

dotenv.config();

// Key from .env
const senderPrivateKeyString = process.env.SENDER_WALLET_PRIVATE_KEY as string;
const receiverPublicKeyString = process.env
  .RECEIVER_WALLET_PUBLIC_KEY as string;

// Get sender Keypair
// const senderSecretKey = JSON.parse(fs.readFileSync('sender-keypair.json', 'utf-8')) as number[];
// const sender = Keypair.fromSecretKey(new Uint8Array(senderSecretKey));
const senderSecretKey = bs58.decode(senderPrivateKeyString);
const sender = Keypair.fromSecretKey(senderSecretKey);

// Get receiver public key
const receiverPublicKey = new PublicKey(receiverPublicKeyString);

// transferSOL function
async function transferSOL(network: string = "mainnet") {
  let connection: Connection;
  if (network === "mainnet") {
    connection = new Connection("https://api.mainnet-beta.solana.com");
  } else {
    connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Airdrop some SOL to the sender's wallet for testing
    const airdropSignature = await connection.requestAirdrop(
      sender.publicKey,
      2 * LAMPORTS_PER_SOL
    );

    // Wait for the airdrop to be confirmed
    await connection.confirmTransaction(airdropSignature);
  }

  const trasnferInstruction = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiverPublicKey,
    lamports: 0.01 * LAMPORTS_PER_SOL,
  });

  const transaction = new Transaction().add(trasnferInstruction);

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [sender]
  );

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

}

transferSOL("devnet");
