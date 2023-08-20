import { Common, Hardfork } from '@ethereumjs/common';
import { JsonTx, TransactionFactory } from '@ethereumjs/tx';
import {
  Address,
  ecsign,
  stripHexPrefix,
  toBuffer,
  toChecksumAddress,
} from '@ethereumjs/util';
import {
  SignTypedDataVersion,
  TypedDataV1,
  TypedMessage,
  concatSig,
  personalSign,
  recoverPersonalSignature,
  signTypedData,
} from '@metamask/eth-sig-util';
import {
  Keyring,
  KeyringAccount,
  KeyringRequest,
  SubmitRequestResponse,
} from '@metamask/keyring-api';
import type { Json, JsonRpcRequest } from '@metamask/utils';
import { Buffer } from 'buffer';
import { v4 as uuid } from 'uuid';

import { SigningMethods } from './permissions';
import { getState, saveState } from './stateManagement';
import { isEvmChain, serializeTransaction, isUniqueAccountName } from './utils';
import { ethers } from 'ethers';
import { BaseAccountAPI } from '@account-abstraction/sdk';
import { BaseApiParams } from '@account-abstraction/sdk/dist/src/BaseAccountAPI';
import {
  defaultAbiCoder,
  hexConcat,
  hexDataSlice,
  hexlify,
  keccak256,
} from 'ethers/lib/utils';
import { EntryPoint__factory } from '@account-abstraction/contracts';

export type KeyringState = {
  wallets: Record<string, Wallet>;
  requests: Record<string, KeyringRequest>;
  signer: Wallet;
};

export type Wallet = {
  account: KeyringAccount;
  privateKey: string;
};

export type NotPromise<T> = {
  [P in keyof T]: Exclude<T[P], Promise<any>>;
};

const BASE_ACCOUNT_FACTORY = '0xeD13bA04d0266a47b548329cD63ACc84178287CF';
const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
const BASE_RPC_URL = 'https://goerli.base.org';

class AccountAPI extends BaseAccountAPI {
  ownerAddress: Wallet;
  constructor(params: BaseApiParams & { ownerAddress: Wallet }) {
    let { ownerAddress } = params;
    super(params);
    this.ownerAddress = ownerAddress;
  }

  async getAccountInitCode(): Promise<string> {
    let SimpleAccountFactory = new ethers.Contract(
      BASE_ACCOUNT_FACTORY,
      [
        {
          type: 'function',
          name: 'createAccount',
          inputs: [
            {
              type: 'address',
              name: '_admin',
              internalType: 'address',
            },
            {
              type: 'bytes',
              name: '_data',
              internalType: 'bytes',
            },
          ],
          outputs: [
            {
              type: 'address',
              name: '',
              internalType: 'address',
            },
          ],
          stateMutability: 'nonpayable',
        },
      ],
      this.provider,
    );

    return hexConcat([
      BASE_ACCOUNT_FACTORY,
      SimpleAccountFactory.interface.encodeFunctionData('createAccount', [
        this.ownerAddress.account.address,
        0,
      ]),
    ]);
  }

  async getNonce(): Promise<ethers.BigNumber> {
    let Entrypoint = new ethers.Contract(
      ENTRYPOINT_ADDRESS,
      [
        {
          inputs: [
            { internalType: 'address', name: 'sender', type: 'address' },
            { internalType: 'uint192', name: 'key', type: 'uint192' },
          ],
          name: 'getNonce',
          outputs: [
            { internalType: 'uint256', name: 'nonce', type: 'uint256' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      this.provider,
    );

    return await Entrypoint.getNonce(this.accountAddress, 0);
  }

  async encodeExecute(
    target: string,
    value: ethers.BigNumberish,
    data: string,
  ): Promise<string> {
    let iface = new ethers.utils.Interface([
      'function execute(address _target,uint256 _value,bytes calldata _calldata) external',
    ]);

    return iface.encodeFunctionData('execute', [target, value, data]);
  }

  async signUserOpHash(userOpHash: string): Promise<string> {
    let owner = new ethers.Wallet(this.ownerAddress.privateKey);

    return await owner.signMessage(ethers.utils.arrayify(userOpHash));
  }
}

export class ERC4337Keyring implements Keyring {
  #signer: Wallet;

  #wallets: Record<string, Wallet>;

  #requests: Record<string, KeyringRequest>;

  constructor(state: KeyringState) {
    this.#wallets = state.wallets;
    this.#requests = state.requests;
    this.#signer = state.signer;
  }

  createSigner(options: Record<string, Json> | null = null): Wallet {
    console.log('Creating Signer');
    const { privateKey, address } = this.#generateKeyPair();

    const account: KeyringAccount = {
      id: uuid(),
      name: 'ERC4337Signer',
      options,
      address,
      supportedMethods: [
        'eth_sendTransaction',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData_v1',
        'eth_signTypedData_v2',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
        'eth_signTypedData',
        'personal_sign',
      ],
      type: 'eip155:eoa',
    };

    return { account, privateKey };
  }

  async listAccounts(): Promise<KeyringAccount[]> {
    return Object.values(this.#wallets).map((wallet) => wallet.account);
  }

  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    return this.#wallets[id].account;
  }

  async createAccount(
    name: string,
    options: Record<string, Json> | null = null,
  ): Promise<KeyringAccount> {
    // Create signer for SCWs if not available.

    let keyringState = await getState();
    console.log(keyringState);
    if (keyringState.signer == undefined) {
      this.#signer = this.createSigner();
    } else {
      this.#signer = keyringState.signer;
    }

    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

    const contract = new ethers.Contract(
      BASE_ACCOUNT_FACTORY,
      [
        {
          type: 'function',
          name: 'getAddress',
          inputs: [
            {
              type: 'address',
              name: '_adminSigner',
              internalType: 'address',
            },
            {
              type: 'bytes',
              name: '_data',
              internalType: 'bytes',
            },
          ],
          outputs: [
            {
              type: 'address',
              name: '',
              internalType: 'address',
            },
          ],
          stateMutability: 'view',
        },
      ],
      provider,
    );

    let data = await contract.getAddress(
      this.#signer.account.address,
      ethers.utils.defaultAbiCoder.encode(['bytes'], [0]),
    );

    if (!isUniqueAccountName(name, Object.values(this.#wallets))) {
      throw new Error(`Account name already in use: ${name}`);
    }

    const account: KeyringAccount = {
      id: uuid(),
      name,
      // options,
      options: { signer: this.#signer },
      address: data,
      supportedMethods: [
        'eth_sendTransaction',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData_v1',
        'eth_signTypedData_v2',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
        'eth_signTypedData',
        'personal_sign',
      ],
      type: 'eip155:erc4337',
    };

    this.#wallets[account.id] = {
      account,
      privateKey: this.#signer.privateKey,
    };
    await this.#saveState();

    await snap.request({
      method: 'snap_manageAccounts',
      params: {
        method: 'createAccount',
        params: { account },
      },
    });
    return account;
  }

  async filterAccountChains(_id: string, chains: string[]): Promise<string[]> {
    // The `id` argument is not used because all accounts created by this snap
    // are expected to be compatible with any EVM chain.
    return chains.filter((chain) => isEvmChain(chain));
  }

  async updateAccount(account: KeyringAccount): Promise<void> {
    const currentAccount = this.#wallets[account.id].account;
    const newAccount: KeyringAccount = {
      ...currentAccount,
      ...account,
      // Restore read-only properties.
      address: currentAccount.address,
      supportedMethods: currentAccount.supportedMethods,
      type: currentAccount.type,
      options: currentAccount.options,
    };

    if (!isUniqueAccountName(account.name, Object.values(this.#wallets))) {
      throw new Error(`Account name already in use: ${account.name}`);
    }

    this.#wallets[account.id].account = newAccount;
    await this.#saveState();

    await snap.request({
      method: 'snap_manageAccounts',
      params: {
        method: 'updateAccount',
        params: { account },
      },
    });
  }

  async deleteAccount(id: string): Promise<void> {
    delete this.#wallets[id];
    await this.#saveState();

    await snap.request({
      method: 'snap_manageAccounts',
      params: {
        method: 'deleteAccount',
        params: { id },
      },
    });
  }

  async listRequests(): Promise<KeyringRequest[]> {
    return Object.values(this.#requests);
  }

  async getRequest(id: string): Promise<KeyringRequest> {
    return this.#requests[id];
  }

  // This snap implements a synchronous keyring, which means that the request
  // doesn't need to be approved and the execution result will be returned to
  // the caller by the `submitRequest` method.
  //
  // In an asynchronous implementation, the request should be stored in queue
  // of pending requests to be approved or rejected by the user.
  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    const { method, params = '' } = request.request as JsonRpcRequest;
    const signature = await this.#handleSigningRequest(method, params);
    return {
      pending: false,
      result: signature,
    };
  }

  async approveRequest(_id: string): Promise<void> {
    throw new Error(
      'The "approveRequest" method is not available on this snap.',
    );
  }

  async rejectRequest(_id: string): Promise<void> {
    throw new Error(
      'The "rejectRequest" method is not available on this snap.',
    );
  }

  #getWalletByAddress(address: string): Wallet {
    const walletMatch = Object.values(this.#wallets).find(
      (wallet) =>
        wallet.account.address.toLowerCase() === address.toLowerCase(),
    );

    if (walletMatch === undefined) {
      throw new Error(`Cannot find wallet for address: ${address}`);
    }
    return walletMatch;
  }

  #generateKeyPair(): {
    privateKey: string;
    address: string;
  } {
    // eslint-disable-next-line no-restricted-globals
    const pk = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
    const address = toChecksumAddress(Address.fromPrivateKey(pk).toString());
    return { privateKey: pk.toString('hex'), address };
  }

  async #handleSigningRequest(method: string, params: Json): Promise<Json> {
    switch (method) {
      case 'personal_sign': {
        const [from, message] = params as string[];
        return this.#signPersonalMessage(from, message);
      }

      case 'eth_sendTransaction':
      case 'eth_signTransaction':
      case SigningMethods.SignTransaction: {
        const [from, tx, opts] = params as [string, JsonTx, Json];
        let provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

        let account = new AccountAPI({
          provider,
          entryPointAddress: ENTRYPOINT_ADDRESS,
          accountAddress: from,
          ownerAddress: this.#signer,
        });

        let initCode = '0x';
        // Check if account is deployed?
        if (await account.checkAccountPhantom()) {
          initCode = await account.getInitCode();
        }

        let nonce = (await account.getNonce()).toNumber();
        let callData = await account.encodeExecute(
          tx.to,
          tx.value ? tx.value : 0,
          tx.data,
        );

        let userOp = {
          sender: from,
          nonce,
          initCode,
          callData,
          paymasterAndData: '0x',
          signature: '0x',
        };

        let chainId = await ethereum.request({
          method: 'eth_chainId',
        });

        console.log(`ChainId: ${chainId}`);

        let gasPriceResponseRaw = await fetch(
          'https://api.pimlico.io/v1/base-goerli/rpc?apikey=67ed1d98-34bf-410c-8bdb-711a474f192e',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'pimlico_getUserOperationGasPrice',
            }),
          },
        );

        let { result: gasPriceResponse } = await gasPriceResponseRaw.json();
        if (gasPriceResponse) {
          const maxFeePerGas = gasPriceResponse.fast.maxFeePerGas;
          const maxPriorityFeePerGas =
            gasPriceResponse.fast.maxPriorityFeePerGas;

          userOp.maxFeePerGas = maxFeePerGas;
          userOp.maxPriorityFeePerGas = maxPriorityFeePerGas;
          userOp.preVerificationGas = ethers.utils.hexlify(50_000);
          userOp.verificationGasLimit = ethers.utils.hexlify(400_000);
          userOp.callGasLimit = ethers.utils.hexlify(100_000);

          let sponsorResponseRaw = await fetch(
            `https://api.pimlico.io/v1/base-goerli/rpc?apikey=67ed1d98-34bf-410c-8bdb-711a474f192e`,
            {
              method: 'POST',
              headers: {
                'Content-type': 'application/json',
              },
              body: JSON.stringify({
                method: 'pm_sponsorUserOperation',
                id: 1,
                jsonrpc: '2.0',
                params: [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'],
              }),
            },
          );

          let { result: sponsorResponse } = await sponsorResponseRaw.json();

          console.log(sponsorResponse);

          userOp.paymasterAndData = sponsorResponse.paymasterAndData;

          const entryPoint = EntryPoint__factory.connect(
            ENTRYPOINT_ADDRESS,
            provider,
          );

          let userOpHash = await entryPoint.getUserOpHash(userOp);

          console.log(userOpHash);

          let signature = await account.signUserOpHash(userOpHash);
          console.log(signature);

          userOp.signature = signature;

          // let signedOpHash = await account.signUserOpHash(userOpHash);
          // userOp.signature = signedOpHash;
          let sendUserOpResponseRaw = await fetch(
            `https://api.pimlico.io/v1/base-goerli/rpc?apikey=67ed1d98-34bf-410c-8bdb-711a474f192e`,
            {
              method: 'POST',
              headers: {
                'Content-type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_sendUserOperation',
                id: 1,
                params: [userOp, ENTRYPOINT_ADDRESS],
              }),
            },
          );

          let { result: sendUserOp } = await sendUserOpResponseRaw.json();
          console.log(sendUserOp);
        }

        // send the userOp to the paymaster
        return this.#signTransaction(from, tx, opts);
      }

      case 'eth_signTypedData':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v2':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4': {
        const [from, data, opts] = params as [
          string,
          Json,
          { version: SignTypedDataVersion },
        ];
        return this.#signTypedData(from, data, opts);
      }

      case 'eth_sign': {
        const [from, data] = params as [string, string];
        return this.#signMessage(from, data);
      }

      default: {
        throw new Error(`EVM method not supported: ${method}`);
      }
    }
  }

  #signTransaction(from: string, tx: any, _opts: any): Json {
    // Patch the transaction to make sure that the `chainId` is a hex string.
    if (!tx.chainId.startsWith('0x')) {
      tx.chainId = `0x${parseInt(tx.chainId, 10).toString(16)}`;
    }

    const wallet = this.#getWalletByAddress(from);
    const privateKey = Buffer.from(wallet.privateKey, 'hex');
    const common = Common.custom(
      { chainId: tx.chainId },
      {
        hardfork:
          tx.maxPriorityFeePerGas || tx.maxFeePerGas
            ? Hardfork.London
            : Hardfork.Istanbul,
      },
    );

    const signedTx = TransactionFactory.fromTxData(tx, {
      common,
    }).sign(privateKey);

    return serializeTransaction(signedTx.toJSON(), signedTx.type);
  }

  #signTypedData(
    from: string,
    data: Json,
    opts: { version: SignTypedDataVersion } = {
      version: SignTypedDataVersion.V1,
    },
  ): string {
    const { privateKey } = this.#getWalletByAddress(from);
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');

    return signTypedData({
      privateKey: privateKeyBuffer,
      data: data as unknown as TypedDataV1 | TypedMessage<any>,
      version: opts.version,
    });
  }

  #signPersonalMessage(from: string, request: string): string {
    const { privateKey } = this.#getWalletByAddress(from);
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    const messageBuffer = Buffer.from(request.slice(2), 'hex');

    const signature = personalSign({
      privateKey: privateKeyBuffer,
      data: messageBuffer,
    });

    const recoveredAddress = recoverPersonalSignature({
      data: messageBuffer,
      signature,
    });
    if (recoveredAddress !== from) {
      throw new Error(
        `Signature verification failed for account "${from}" (got "${recoveredAddress}")`,
      );
    }

    return signature;
  }

  #signMessage(from: string, data: string): string {
    const { privateKey } = this.#getWalletByAddress(from);
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    const message = stripHexPrefix(data);
    const signature = ecsign(Buffer.from(message, 'hex'), privateKeyBuffer);
    return concatSig(toBuffer(signature.v), signature.r, signature.s);
  }

  async #saveState(): Promise<void> {
    await saveState({
      wallets: this.#wallets,
      requests: this.#requests,
      signer: this.#signer,
    });
  }
}
