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

#### Bounties

##### To Infura and Beyond

I am using Infura's Linea testnet RPC [here](https://github.com/therealharpaljadeja/aa-snap/blob/a183b184b3e19af2e842238b894daf1a5be17f1d/packages/snap/src/keyring.ts#L44), [here](https://github.com/therealharpaljadeja/aa-snap/blob/a183b184b3e19af2e842238b894daf1a5be17f1d/packages/snap/src/keyring.ts#L214) and [here](https://github.com/therealharpaljadeja/aa-snap/blob/a183b184b3e19af2e842238b894daf1a5be17f1d/packages/site/src/pages/index.tsx#L56) to query the blockchain and make read calls, basically when creating Keyring accounts I need to read from the Entrypoint the counterfactual address of the Smart Contract Wallet which will in-turn be deployed on first transaction!

##### IYKYK Linea edition

- I am using [Thirdweb's Account Factory on Linea Testnet](https://thirdweb.com/linea-testnet/0xb68E99D84aCb7C34282086B44bE5105dE7c25496) and Pimlico VerifyingPaymaster on Linea Testnet.
- All the Smart Contract Wallets created using the Snap get deployed on Linea testnet [here](https://goerli.lineascan.build/address/0x92DE48F5896ffb67395832d335999B99F2Cd585F#code) is one example.
- To demo ERC20 transfer on Linea Testnet I deployed a [token](https://thirdweb.com/linea-testnet/0x89274A233b7A48047553408b2aFe1e2815234D26/tokens) on Linea Testnet

##### OH SNAP!

- Instructions above!

##### Make a Dapp That Slaps, No Cap

- The project basically is a Metamask Account Abstraction Snap which aims to improve UX, what I envision is that soon many dApps would want to use AA features.
- But, if every dApp uses a different Account Factory then the user will end up having different accounts for every website!
- This will make their lives even worse, so instead of AA features being on the dApp-side this project brings them on the Wallet-side!
- Only one account needed (more can be created) and can be connected to dApps who want to provide AA features all they need to do is use the right JSON-RPC methods!
- Proof of Consensys products used is above!

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
