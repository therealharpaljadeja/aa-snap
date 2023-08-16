## Account Abstraction Snap

#### Problem

DApps want to add Account Abstraction support but the problem is that every dApp might end up using its own Account Factory leading to different counterfactual address for Smart Contract Wallet

Users will end up having different SCW for every dApp which leads to complex UX

#### Solution

The AA snap will basically offload all the work the frontend devs need to do to add AA support to their dApps, instead the Metamask Snap will use a single Account Factory (so single CounterFactual address) and the dApp developers need not change anything they can keep on request signing transactions as usual!
