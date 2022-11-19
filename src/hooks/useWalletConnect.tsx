import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import WalletConnect from '@walletconnect/client';
import { IClientMeta, IWalletConnectSession } from '@walletconnect/types';
import { getSafe } from '../utils/safe';
import { useWeb3Context } from '../web3.context';
import { SAFE_ADDRESS, WALLETCONNECT_BRIDGE_URL } from '../constants';

const rejectWithMessage = (connector: WalletConnect, id: number | undefined, message: string) => {
  connector.rejectRequest({ id, error: { message } });
};

const useWalletConnect = () => {
  const { signer } = useWeb3Context();

  const [wcClientData, setWcClientData] = useState<IClientMeta | null>(null);
  const [connector, setConnector] = useState<WalletConnect | undefined>();
  const localStorageSessionKey = useRef(`wc_session_${SAFE_ADDRESS}`);

  const wcDisconnect = useCallback(async () => {
    try {
      await connector?.killSession();
      setConnector(undefined);
      setWcClientData(null);
    } catch (error) {
      console.log('Error trying to close WC session: ', error);
    }
  }, [connector]);

  const wcConnect = useCallback(
    async ({ uri, session }: { uri?: string; session?: IWalletConnectSession }) => {
      if (!signer) return;

      const wcConnector = new WalletConnect({
        uri,
        bridge: WALLETCONNECT_BRIDGE_URL,
        session,
      });
      setConnector(wcConnector);
      setWcClientData(wcConnector.peerMeta);
      wcConnector.on('session_request', (error, payload) => {
        if (error) {
          throw error;
        }
        getSafe(signer).then((s) => {
          s.getChainId().then((chain) => {
            wcConnector.approveSession({
              accounts: [s.getAddress()],
              chainId: chain,
            });
            setWcClientData(payload.params[0].peerMeta);
          });
        });
      });

      wcConnector.on('call_request', async (error, payload) => {
        if (error) {
          throw error;
        }

        try {
          const result = await signer.provider.send(payload.method, payload.params);

          wcConnector.approveRequest({
            id: payload.id,
            result,
          });
        } catch (err) {
          rejectWithMessage(wcConnector, payload.id, (err as Error).message);
        }
      });

      wcConnector.on('disconnect', (error) => {
        if (error) {
          throw error;
        }
        wcDisconnect();
      });
    },
    [wcDisconnect, signer],
  );

  useEffect(() => {
    if (!connector) {
      const session = localStorage.getItem(localStorageSessionKey.current);
      if (session) {
        wcConnect({ session: JSON.parse(session) });
      }
    }
  }, [connector, wcConnect]);

  return { wcClientData, wcConnect, wcDisconnect };
};

export default useWalletConnect;
