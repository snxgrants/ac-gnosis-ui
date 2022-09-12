import injectedModule from '@web3-onboard/injected-wallets';
import { ethers } from 'ethers';
import Onboard from '@web3-onboard/core';
import { createContext, ReactNode, useContext, useState } from 'react';

const OPTIMISM_RPC_URL = 'https://mainnet.optimism.io';
const OPTIMISM_NETWORK_ID = 10;

const onboard = Onboard({
  wallets: [injectedModule()],
  chains: [
    {
      id: `0x${OPTIMISM_NETWORK_ID.toString(16)}`,
      token: 'ETH',
      label: 'Optimism Mainnet',
      rpcUrl: OPTIMISM_RPC_URL,
    },
  ],
});
export function Web3Provider({ children }: { children: ReactNode }) {
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(
    null
  );
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);

  const connect = async () => {
    const wallets = await onboard.connectWallet();

    if (wallets[0]) {
      const ethersProvider = new ethers.providers.Web3Provider(
        wallets[0].provider,
        10
      );
      setProvider(ethersProvider);

      setSigner(ethersProvider.getSigner());
    }
  };
  return (
    <Web3Context.Provider value={{ connect, provider, signer }}>
      {children}
    </Web3Context.Provider>
  );
}

interface Web3Context {
  signer: ethers.providers.JsonRpcSigner | null;
  provider: ethers.providers.Web3Provider | null;
  connect: () => Promise<void>;
}

const Web3Context = createContext<unknown>(null);

export const useWeb3Context = () => {
  return useContext(Web3Context) as Web3Context;
};
