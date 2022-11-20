import { useState, useCallback, useEffect, useRef } from 'react';
import WalletConnect from '@walletconnect/client';
import { IClientMeta, IWalletConnectSession } from '@walletconnect/types';
import { useWeb3Context } from '../web3.context';
import { WALLETCONNECT_BRIDGE_URL } from '../configuration';
import { areStringsEqual } from '../utils/strings';
import { isObjectEIP712TypedData } from '../utils/eip712';
import { RpcRequest } from '../types/rpc';

const rejectWithMessage = (connector: WalletConnect, id: number | undefined, message: string) => {
  connector.rejectRequest({ id, error: { message } });
};

enum CONNECTION_STATUS {
  CONNECTED,
  DISCONNECTED,
}

const useWalletConnect = () => {
  const { signer, safe } = useWeb3Context();
  const triedToReinitiateTheSession = useRef(false);

  const [wcClientData, setWcClientData] = useState<IClientMeta | undefined>();
  const [connector, setConnector] = useState<WalletConnect | undefined>();
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.DISCONNECTED);
  const [pendingRequest, setPendingRequest] = useState<RpcRequest>();

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
      if (!signer || !safe || connector) return;

      const wcConnector = new WalletConnect({
        uri,
        bridge: WALLETCONNECT_BRIDGE_URL,
        session,
      });
      setConnector(wcConnector);
      setWcClientData(wcConnector.peerMeta ?? undefined);
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);

      wcConnector.on('session_request', async (error, payload) => {
        if (error) {
          throw error;
        }
        if (safe) {
          wcConnector.approveSession({
            accounts: [safe.getAddress()],
            chainId: await safe.getChainId(),
          });

          setWcClientData(payload.params[0].peerMeta);
        }
      });

      wcConnector.on('call_request', async (error, payload) => {
        if (error) {
          throw error;
        }

        const result = '0x';
        try {
          switch (payload.method) {
            case 'eth_sendTransaction': {
              setPendingRequest(payload);
              return;
            }

            case 'personal_sign': {
              const [, address] = payload.params;
              const safeAddress = safe?.getAddress() ?? '';

              if (!areStringsEqual(address, safeAddress)) {
                throw new Error('The address or message hash is invalid');
              }

              setPendingRequest(payload);
              return;
            }

            case 'eth_sign': {
              const [address] = payload.params;
              const safeAddress = safe?.getAddress() ?? '';

              if (!areStringsEqual(address, safeAddress)) {
                throw new Error('The address or message hash is invalid');
              }

              setPendingRequest(payload);
              break;
            }

            case 'eth_signTypedData':
            case 'eth_signTypedData_v4': {
              const [address, typedDataString] = payload.params;
              const safeAddress = safe?.getAddress() ?? '';
              const typedData = JSON.parse(typedDataString);

              if (!areStringsEqual(address, safeAddress)) {
                throw new Error('The address is invalid');
              }

              if (isObjectEIP712TypedData(typedData)) {
                setPendingRequest(payload);
                return;
              } else {
                throw new Error('Invalid typed data');
              }
            }
            default: {
              rejectWithMessage(wcConnector, payload.id, 'METHOD_NOT_SUPPORTED');
              break;
            }
          }

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
    [wcDisconnect, signer, safe, connector],
  );

  const approveRequest = useCallback(
    (id: number, result: any) => {
      if (!connector) return;
      connector.approveRequest({ id, result });
      setPendingRequest(undefined);
    },
    [connector],
  );

  const rejectRequest = useCallback(
    async (id: number, message: any) => {
      if (!connector) return;
      rejectWithMessage(connector, id, message);
    },
    [connector],
  );

  useEffect(() => {
    if (!connector && !triedToReinitiateTheSession.current) {
      const session = localStorage.getItem('walletconnect');
      if (session) {
        wcConnect({ session: JSON.parse(session) });
        triedToReinitiateTheSession.current = true;
      }
    }
  }, [connector, wcConnect, safe, wcDisconnect]);

  return { wcClientData, wcConnect, wcDisconnect, connectionStatus, pendingRequest, approveRequest, rejectRequest };
};

export { useWalletConnect, CONNECTION_STATUS };
