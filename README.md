Setup:- 

npm install

cd frontend

npm install

***

Run Hardhat:-

npx hardhat node

***

Deploy Token Locally:-

npx hardhat run scripts/deploy.js --network localhost

***

Start Frontend:-

cd frontend

npm run dev

***


The project includes a special Switch Wallet button using:
wallet_requestPermissions

This forces MetaMask to refresh permission for eth_accounts and ensures correct wallet switching even on Hardhat localhost networks.

This solves the issue where MetaMask would otherwise keep returning the old approved account.
