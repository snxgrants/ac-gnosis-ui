import { useState, useCallback, useEffect } from 'react';
import WalletConnect from '@walletconnect/client';
import { IClientMeta, IWalletConnectSession } from '@walletconnect/types';
import { getSafe } from '../utils/safe';
import { useWeb3Context } from '../web3.context';
import { WALLETCONNECT_BRIDGE_URL } from '../constants';

const rejectWithMessage = (connector: WalletConnect, id: number | undefined, message: string) => {
  connector.rejectRequest({ id, error: { message } });
};

enum CONNECTION_STATUS {
  CONNECTED,
  DISCONNECTED,
}

const useWalletConnect = () => {
  const { signer } = useWeb3Context();

  const [wcClientData, setWcClientData] = useState<IClientMeta | undefined>();
  const [connector, setConnector] = useState<WalletConnect | undefined>();
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.DISCONNECTED);

  const wcDisconnect = useCallback(async () => {
    try {
      await connector?.killSession();
      setConnector(undefined);
      setWcClientData(undefined);
      setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
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
      setWcClientData(wcConnector.peerMeta ?? undefined);
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
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
      const session = localStorage.getItem('walletconnect');
      if (session) {
        wcConnect({ session: JSON.parse(session) });
      }
    }
  }, [connector, wcConnect]);

  return { wcClientData, wcConnect, wcDisconnect, connectionStatus };
};

export { useWalletConnect, CONNECTION_STATUS };
