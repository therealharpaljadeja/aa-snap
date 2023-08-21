import { useContext, useEffect, useState } from 'react';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import { connectSnap, getSnap, shouldDisplayReconnectButton } from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
} from '../components';
import { encodeFunctionData, parseEther } from 'viem';
import { defaultSnapOrigin } from '../config';
import { KeyringSnapRpcClient } from '@metamask/keyring-api';
import { v4 as uuid } from 'uuid';
import { Button, HStack, Input, Link, Tag, VStack } from '@chakra-ui/react';
import SHeading from '../components/Heading';
import SText from '../components/Text';

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [createdKeyringAccounts, setCreatedKeyringAccounts] = useState([]);
  const [accountName, setAccountName] = useState('');
  const [to, setTo] = useState('0xDe66238AD07e4fe885800f48DF9A5201ce8f6187');
  const [data, setData] = useState('');
  const [accountCreating, setAccountCreating] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [sendingKeyringRequest, setSendingKeyringRequest] = useState(false);

  let keyring = new KeyringSnapRpcClient(defaultSnapOrigin, window.ethereum);

  // Change addresses here
  const chains = {
    '0x14a33': {
      RPC_URL: 'https://goerli.base.org',
      ACCOUNT_FACTORY: '0xeD13bA04d0266a47b548329cD63ACc84178287CF',
      TOKEN_CONTRACT: '0xcEF0f7f7ee1650b4A8151f605d9258bA65D733F5',
      EXPLORER_URL: 'https://goerli.basescan.org/address/',
    },
    '0xe704': {
      RPC_URL:
        'https://linea-goerli.infura.io/v3/985e620362294dddb10524a42b3d43a0',
      ACCOUNT_FACTORY: '0xb68E99D84aCb7C34282086B44bE5105dE7c25496',
      TOKEN_CONTRACT: '0x89274A233b7A48047553408b2aFe1e2815234D26',
      EXPLORER_URL: 'https://goerli.lineascan.build/address/',
    },
  };

  useEffect(() => {
    (async () => {
      if (window.ethereum) {
        let chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        window.ethereum.on('chainChanged', (chainId) => {
          setChainId(chainId);
        });
        setChainId(chainId);
        window.ethereum.on('accountsChanged', (accounts) => {
          setConnectedAccount(accounts[0]);
        });
      }
    })();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {
          console.log('unmount');
        });
        window.ethereum.removeListener('accountsChanged', () => {
          console.log('unmount');
        });
      }
    };
  }, [window.ethereum]);

  useEffect(() => {
    if (state.installedSnap) {
      (async () => {
        let keyringAccounts = await keyring.listAccounts();
        console.log(keyringAccounts);
        setCreatedKeyringAccounts([...keyringAccounts]);
      })();
    }
    return () => {
      setCreatedKeyringAccounts([]);
    };
  }, [state.installedSnap]);

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  async function connectWallet() {
    let accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    console.log(accounts);
    setConnectedAccount(accounts[0]);
  }

  function handleInputChange({ target }) {
    setAccountName(target.value);
  }

  async function createKeyringAccount() {
    if (keyring && accountName) {
      setAccountCreating(true);
      await keyring.createAccount(accountName);
      setAccountCreating(false);
    }
  }

  async function deleteAccount(id) {
    if (keyring && id) {
      setAccountDeleting(true);
      await keyring.deleteAccount(id);
      setAccountDeleting(false);
    }
  }

  async function submitRequest(to, data, chainId) {
    if (keyring && connectedAccount && to && data && chainId) {
      setSendingKeyringRequest(true);

      console.log(createdKeyringAccounts[0]);
      try {
        let response = await keyring.submitRequest({
          account: createdKeyringAccounts[0].id,
          scope: 'eip155:1',
          request: {
            jsonrpc: '2.0',
            id: uuid(),
            method: 'eth_sendTransaction',
            params: [
              createdKeyringAccounts[0].address,
              {
                from: createdKeyringAccounts[0].address,
                to,
                data,
                chainId,
              },
            ],
          },
        });

        console.log(response);
      } catch (e) {
        console.error(e);
      } finally {
        setSendingKeyringRequest(false);
      }
    }
  }

  async function transfer() {
    const to = chains[chainId].TOKEN_CONTRACT;

    const abiItem = {
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [],
      stateMutability: '',
      type: 'function',
    };
    const data = encodeFunctionData({
      abi: [abiItem],
      functionName: 'transfer',
      args: ['0x4F4c70c011b065dc45a7A13Cb72E645c6a50Dde3', parseEther('10')],
    });
    try {
      if (to && connectedAccount) await submitRequest(to, data, chainId);
    } catch (e) {
      console.error(e);
    }
  }

  async function customTx() {
    try {
      if (to && data) await submitRequest(to, data, chainId);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <VStack gap={'4'}>
      <SHeading size={'lg'}>Account Abstraction Snap</SHeading>

      {connectedAccount ? (
        <VStack gap={'3'}>
          {state.error && (
            <HStack
              border="2px solid red"
              backgroundColor={'red.700'}
              p="4"
              borderRadius={'md'}
            >
              <SHeading size="md">
                <b>An error happened:</b> {state.error.message}
              </SHeading>
            </HStack>
          )}
          {!state.isFlask && (
            <VStack
              border="1px solid #8c8fce"
              p="4"
              width={'400px'}
              borderRadius="md"
              alignItems={'flex-start'}
            >
              <SHeading size="md">Install</SHeading>
              <SText>
                Snaps is pre-release software only available in MetaMask Flask,
                a canary distribution for developers with access to upcoming
                features.
              </SText>
              <InstallFlaskButton />
            </VStack>
          )}
          {!state.installedSnap && (
            <VStack
              border="1px solid #8c8fce"
              p="4"
              width={'400px'}
              borderRadius="md"
              alignItems={'flex-start'}
            >
              <SHeading size="md">Connect</SHeading>
              <SText>
                Get started by connecting to and installing the example snap.
              </SText>
              <ConnectButton
                onClick={handleConnectClick}
                disabled={!state.isFlask}
              />
            </VStack>
          )}

          {shouldDisplayReconnectButton(state.installedSnap) && (
            <VStack gap="10">
              <HStack>
                <VStack
                  border="1px solid #8c8fce"
                  p="4"
                  width={'400px'}
                  borderRadius="md"
                  alignItems={'center'}
                >
                  <SHeading size="md">Reconnect</SHeading>
                  <ReconnectButton
                    onClick={handleConnectClick}
                    disabled={!state.installedSnap}
                  />
                </VStack>
                {/* {connectedAccount ? (
                  <VStack
                    border="1px solid #8c8fce"
                    p="4"
                    width={'400px'}
                    borderRadius="md"
                    alignItems={'center'}
                  >
                    <SHeading size="md">Connected as:</SHeading>
                    <Tag backgroundColor="#8c8fce" color="white">
                      {connectedAccount}
                    </Tag>
                  </VStack>
                ) : null} */}
              </HStack>
              <HStack gap="4" alignItems={'flex-start'}>
                <VStack
                  border="1px solid #8c8fce"
                  p="4"
                  width={'400px'}
                  borderRadius="md"
                  alignItems={'flex-start'}
                >
                  <SHeading size="md">Create Account</SHeading>
                  <SText>Create a Snap Keyring Account</SText>
                  <Input
                    color={'white'}
                    onChange={handleInputChange}
                    value={accountName}
                    placeholder="Account Name"
                  />
                  <Button
                    isLoading={accountCreating}
                    onClick={createKeyringAccount}
                  >
                    Send
                  </Button>
                </VStack>
                <VStack>
                  <VStack
                    border="1px solid #8c8fce"
                    p="4"
                    width={'400px'}
                    borderRadius="md"
                    alignItems={'flex-start'}
                  >
                    <SHeading size="md">Transfer Tokens</SHeading>
                    <HStack width="100%">
                      <Button
                        isLoading={sendingKeyringRequest}
                        onClick={transfer}
                        width={'100%'}
                      >
                        Transfer Tokens
                      </Button>
                    </HStack>
                  </VStack>
                  <VStack
                    border="1px solid #8c8fce"
                    p="4"
                    width={'400px'}
                    borderRadius="md"
                    alignItems={'flex-start'}
                  >
                    <SHeading size="md">Any Transaction!</SHeading>
                    <SText>To</SText>
                    <Input
                      value={to}
                      color={'white'}
                      onChange={({ target }) => setTo(target.value)}
                      placeholder="To Address (0x...)"
                    />
                    <SText>Data</SText>
                    <Input
                      value={data}
                      color={'white'}
                      onChange={({ target }) => setData(target.value)}
                      placeholder="calldata (0x...)"
                    />
                    <HStack width="100%">
                      <Button
                        isLoading={sendingKeyringRequest}
                        onClick={customTx}
                        width={'100%'}
                      >
                        Send
                      </Button>
                    </HStack>
                  </VStack>
                </VStack>
                <VStack>
                  {createdKeyringAccounts.map(
                    (account) =>
                      chains[chainId] && (
                        <VStack
                          border="1px solid #8c8fce"
                          p="4"
                          width={'500px'}
                          borderRadius="md"
                          alignItems={'flex-start'}
                          key={account.id}
                          gap="3"
                        >
                          <SHeading size="md">{account.name}</SHeading>
                          <SHeading size="sm">
                            <Link
                              href={`${chains[chainId].EXPLORER_URL}${account.address}`}
                              target="_blank"
                            >
                              {`${account.address}`}
                            </Link>
                          </SHeading>
                          <SHeading size="xs">{account.id}</SHeading>
                          <SHeading size="xs">{`Signer: ${account.options.signer.account.address}`}</SHeading>
                          <Button
                            isLoading={accountDeleting}
                            onClick={() => deleteAccount(account.id)}
                          >
                            Delete
                          </Button>
                        </VStack>
                      ),
                  )}
                </VStack>
              </HStack>
            </VStack>
          )}
        </VStack>
      ) : (
        <Button onClick={connectWallet}>Connect Wallet</Button>
      )}
    </VStack>
  );
};

export default Index;
