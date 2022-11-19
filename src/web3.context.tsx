import injectedModule from '@web3-onboard/injected-wallets';
import { ethers } from 'ethers';
import Onboard from '@web3-onboard/core';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import coinbaseWalletModule from '@web3-onboard/coinbase';
import ledgerModule from '@web3-onboard/ledger';
import gnosisModule from '@web3-onboard/gnosis';
import torusModule from '@web3-onboard/torus';
import { OPTIMISM_CHAIN_ID, OPTIMISM_RPC_URL } from './constants';

const injected = injectedModule();
const coinbaseWalletSdk = coinbaseWalletModule({ darkMode: true });
const ledger = ledgerModule();
const gnosis = gnosisModule();
const torus = torusModule();

const onboard = Onboard({
  wallets: [injected, ledger, coinbaseWalletSdk, gnosis, torus],
  chains: [
    {
      id: `0x${OPTIMISM_CHAIN_ID.toString(16)}`,
      token: 'ETH',
      label: 'Optimism Mainnet',
      rpcUrl: OPTIMISM_RPC_URL,
    },
  ],
});

function Web3Provider({ children }: { children: ReactNode }) {
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signerChainId, setSignerChainId] = useState<number>(-1);

  useEffect(() => {
    // @ts-expect-error ethers is missing the listener type
    provider?.provider?.on('chainChanged', (chainId: string) => {
      setSignerChainId(parseInt(chainId, 16));
    });

    return () => {
      // @ts-expect-error ethers is missing the listener type
      provider?.provider?.removeAllListeners('chainChanged');
    };
  }, [provider]);

  const connect = async () => {
    const wallets = await onboard.connectWallet();

    if (wallets[0]) {
      await onboard.setChain({ chainId: `0x${OPTIMISM_CHAIN_ID.toString(16)}` });
      try {
        const ethersProvider = new ethers.providers.Web3Provider(wallets[0].provider);
        const providerChainId = await wallets[0].provider.request({ method: 'eth_chainId' });
        setProvider(ethersProvider);
        setSignerChainId(Number(providerChainId));
        setSigner(ethersProvider.getSigner());
      } catch (err) {
        console.log(`error when connecting: ${err}`);
      }
    }
  };
  return <Web3Context.Provider value={{ connect, provider, signer, signerChainId }}>{children}</Web3Context.Provider>;
}

type Web3ContextType = {
  signer: ethers.providers.JsonRpcSigner | null;
  provider: ethers.providers.Web3Provider | null;
  connect: () => Promise<void>;
  signerChainId: number;
};

const Web3Context = createContext<Web3ContextType>({
  signer: null,
  provider: null,
  connect: async () => void 0,
  signerChainId: -1,
});

const useWeb3Context = () => {
  return useContext(Web3Context);
};

export { Web3Provider, useWeb3Context, onboard };
