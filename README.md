## Account Abstraction Snap

<table align="center">
  <tr>
  <td>
  <img width="100px" src="https://avatars.githubusercontent.com/u/10818037?s=200&v=4" align="center" alt="consensys" />
    </td>
  <td>
  <img width="100px" src="https://avatars.githubusercontent.com/u/11744586?s=200&v=4" align="center" alt="metamask" />
    </td>
    <td>
  <img width="100px" src="https://avatars.githubusercontent.com/u/125581500?s=200&v=4" align="center" alt="pimlico" />
    </td>
    <td>
  <img src="https://github.com/thirdweb-dev/typescript-sdk/blob/main/logo.svg?raw=true" width="100" margin="20 20" alt="thirdweb"/>    
    </td>
  </tr>
</table>

#### Team

- Harpalsinh Jadeja
  - twitter - @harpaljadeja11
  - email - jadejaharpal14@gmail.com

#### Problem

DApps want to add Account Abstraction support but the problem is that every dApp might end up using its own Account Factory leading to different counterfactual address for Smart Contract Wallet

Users will end up having different SCW for every dApp which leads to complex UX

#### Solution

The AA snap will basically offload all the work the frontend devs need to do to add AA support to their dApps, instead the Metamask Snap will use a single Account Factory (so single CounterFactual address) and the dApp developers need not change anything they can keep on request signing transactions as usual!

#### How to use?

No Contracts are to be deployed, the Smart Contract Wallets are deployed using Thirdweb Account Factory and Pimlico.

##### Clone the repo

```bash
git clone https://github.com/therealharpaljadeja/aa-snap.git
```

##### Run the project

```bash
yarn start
```

The above will open up the site at localhost `8081` port

##### Using the snap

- Connect the wallet
- Install the Snap
- Switch network to Base Goerli or Linea Goerli
- Create Account
- I recommend using the `Any Transaction` UI, you will need to specify `to` address and `calldata` which is the simple calldata used in the Ethereum txs.
- In order to quickly test by transferring tokens, transfer some tokens to the Keyring account address.
- Replace the `TOKEN_CONTRACT` value inside `chains` object in `/packages/site/pages/index.tsx` file (make sure to do it under the right chain)
- Then click the button and it will do a simple ERC20 transfer using UserOperations!

##### Future plans for the project

- I wasn't able to intercept `eth_sendTransaction` if that can be done, its endgame!
- I want to publish this snap (when snaps go live for everyone) and add more chains
- I believe it will support mobile wallet as well, but I haven't tried if not I will add support for that!

##### Tech Stack

- Metamask Snaps
- Gatsby (for site)
- ThirdWeb Account Factory and Token Contracts
- Linea Testnet & Infura RPC endpoint (for account deployment and transactions)
- Pimlico Verifying Paymaster (for tx sponsoring)
