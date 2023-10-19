# watch-collect-reward
## Overview
This script shows how to watch collectReward instruction.

The target of this script is SAMO reward of SAMO/SOL(1%) whirlpool.

<img width="1333" alt="screenshot 2023-10-19 10 10 37" src="https://github.com/yugure-orca/watch-collect-reward/assets/109891005/5251d508-02a3-4262-9b56-59d80d22de34">

## Vault address
The vault of SAMO reward is ``3xCKFNyZU11N3bZ1DufXskbHJQJ5hrdnTPPNpdq5wXYz``, so we will watch the transactions which is mentioning to it.

We can identify the address of the vault of rewards here:
https://everlastingsong.github.io/account-microscope/#/whirlpool/whirlpool/4nAiqm5QiZiwh1sMpmuJJdVUH12Fst2kPPzApNfppQGd

We can list the transactions related to this account here:
https://solscan.io/account/3xCKFNyZU11N3bZ1DufXskbHJQJ5hrdnTPPNpdq5wXYz

## Method
Transaction history is obtained by polling.
Decode the acquired transactions and extract the collectReward instruction.
Display the amount of tokens actually transferred by collectReward.

<img width="1860" alt="screenshot 2023-10-19 10 02 53" src="https://github.com/yugure-orca/watch-collect-reward/assets/109891005/ef7b5369-2503-4aac-8582-43c48b570602">

## Another method
Using Helius's webhook, we can receive the notification of transactions.
So we don't need to use polling method, but it depends on Helius and it cannot receive old event once you missed it.

In the following screenshot, I received the notification in Discord.

<img width="1545" alt="screenshot 2023-10-19 2 55 41" src="https://github.com/yugure-orca/watch-collect-reward/assets/109891005/e0f388b3-527d-47b4-a4fc-c29337c563a4">

<img width="2095" alt="screenshot 2023-10-19 2 59 47" src="https://github.com/yugure-orca/watch-collect-reward/assets/109891005/0929b237-9fcd-480e-b6fd-e49654f7639d">
