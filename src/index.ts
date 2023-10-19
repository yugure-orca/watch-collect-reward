import { Connection, PublicKey, GetVersionedTransactionConfig, ParsedTransactionWithMeta, VersionedTransactionResponse } from "@solana/web3.js";
import { WhirlpoolTransactionDecoder, TransactionJSON } from "@yugure-orca/whirlpool-tx-decoder";
import base58 from "bs58";

const ORCA_WHIRLPOOL_PROGRAM_ID = new PublicKey("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc");
const SAMO_SOL_128_REWARD_VAULT_1 = new PublicKey("3xCKFNyZU11N3bZ1DufXskbHJQJ5hrdnTPPNpdq5wXYz");

async function main() {
  // create connection
  const RPC_ENDPOINT = process.env.RPC_ENDPOINT;
  if (!RPC_ENDPOINT) {
    throw new Error("RPC_ENDPOINT is not defined");
  }
  const connection = new Connection(RPC_ENDPOINT, "confirmed");

  // set target vault and already processed point
  const targetRewardVault = SAMO_SOL_128_REWARD_VAULT_1;
  let lastProcessedTxSignature = "";

  if (lastProcessedTxSignature === "") {
    const txs = await connection.getConfirmedSignaturesForAddress2(
      targetRewardVault,
      { limit: 1 },
    );
    lastProcessedTxSignature = txs[0].signature;
  }
  console.log("lastProcessedTransactionSignature", lastProcessedTxSignature);

  // watch new transactions
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  while (true) {
    // check new transactions every 10 seconds
    await sleep(10 * 1000);

    console.log("check new transactions...");
    const newTxs = await fetchTransactions(connection, targetRewardVault, lastProcessedTxSignature);
    if (newTxs.length === 0) {
      continue;
    }

    // find collectReward instruction
    for (const tx of newTxs) {
      const signature = tx.transaction.signatures[0];
      const decoded = WhirlpoolTransactionDecoder.decode(toTransactionJSON(tx), ORCA_WHIRLPOOL_PROGRAM_ID.toBase58());
      for (const ix of decoded) {
        if (ix.name === "collectReward" && ix.accounts.rewardVault === targetRewardVault.toBase58()) {
          console.log(
            "🚀 signature", signature,
            "collectReward transfer", ix.transfers[0].toString(),
            "to", ix.accounts.rewardOwnerAccount,
            "owner", ix.accounts.positionAuthority,
          );
        }
      }
    }

    lastProcessedTxSignature = newTxs[0].transaction.signatures[0];
  }

}
main();

// fetch new transactions by getConfirmedSignaturesForAddress2 and getTransactions
async function fetchTransactions(
  connection: Connection,
  targetRewardVault: PublicKey,
  lastProcessedTxSignature: string,
  limit: number = 10000,
): Promise<VersionedTransactionResponse[]> {
  const signatures: string[] = [];

  // fetch new signatures
  let before = undefined;
  while (signatures.length < limit) {
    const sigs = await connection.getConfirmedSignaturesForAddress2(
      targetRewardVault,
      { limit: 1000, before },
    );

    const found = sigs.findIndex((tx) => tx.signature === lastProcessedTxSignature);
    if (found !== -1) {
      sigs.slice(0, found).filter((s) => s.err === null).forEach((s) => signatures.push(s.signature));
      break;
    }
    sigs.filter((s) => s.err === null).forEach((s) => signatures.push(s.signature));

    before = sigs[sigs.length - 1].signature;
  }

  // fetch transactions
  const chunk_size = 10;
  const config: GetVersionedTransactionConfig = {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  };

  const transactions: VersionedTransactionResponse[] = [];
  for (let i = 0; i < signatures.length; i += chunk_size) {
    const txs: VersionedTransactionResponse[] = await connection.getTransactions(
      signatures.slice(i, i+chunk_size),
      config
    );
    transactions.push(...txs);
  }

  return transactions;
}

// type conversion
function toTransactionJSON(tx: VersionedTransactionResponse): TransactionJSON {
  return {
    result: {
      meta: {
        loadedAddresses: {
          readonly: tx.meta.loadedAddresses.readonly.map((k) => k.toBase58()),
          writable: tx.meta.loadedAddresses.writable.map((k) => k.toBase58()),
        },
        innerInstructions: tx.meta.innerInstructions.map((i) => {
          return {
            index: i.index,
            instructions: i.instructions.map((ii) => {
              return {
                programIdIndex: ii.programIdIndex,
                accounts: ii.accounts,
                data: ii.data,
              };
            }),
          };
        }),
      },
      transaction: {
        message: {
          accountKeys: tx.transaction.message.staticAccountKeys.map((k) => k.toBase58()),
          instructions: tx.transaction.message.compiledInstructions.map((i) => {
            return {
              programIdIndex: i.programIdIndex,
              accounts: i.accountKeyIndexes,
              data: base58.encode(i.data),
            };
          }),
        }
      }
    }
  };
}
