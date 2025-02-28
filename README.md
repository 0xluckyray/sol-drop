# Solana Web3 guide project

This project involves 3 main features - fetch information from various Solana Accounts, transfer SOL, transfer SPL Tokens.
You can check branches for each feature.

### Step 1: Setup Environment
- For convenience, let's develop our own code using VS Code. Let's assume that you have installed Node.js (version 18.0 or later).
- Also, we need wallet A and wallet B. To be precise, to send money from wallet A to wallet B, you will need the private key of wallet A and the public key of wallet B.
- Initialize your project using `npm init`.
- Install dependencies using this command:
```bash
npm install typescript ts-node @solana/web3.js @solana/spl-token dotenv bs58
```
- Check `package.json` file and edit script with Run commands.
- Install Typescript environment using `tsc --init` command.
- Edit `tsconfig.json` file like this:
```json
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```
- .env file
```
SENDER_WALLET_PRIVATE_KEY="PRIVATE KEY OF WALLET A"
RECEIVER_WALLET_PUBLIC_KEY="PUBLIC KEY OF WALLET B"
```
---
### **Step 2: Main code (index.ts)**
You can check main code in index.ts file.

---

### **Step 3: Run the code**
- In terminal, run this command:
```bash
npm run start
```
- If the transaction is successful, you will receive a transaction link from solscan.

---

### **📧My contact info**
**Gmail**: saivietthanh0314@gmail.com
[**Telegram**](https://t.me/super_a_a)
