import { useState, useCallback, useEffect } from 'react';
import { IWalletConnectSession, IClientMeta } from '@walletconnect/types';
import { Input, Spinner } from '@chakra-ui/react';

type WcConnectProps = {
  uri?: string | undefined;
  session?: IWalletConnectSession | undefined;
};

type WalletConnectFieldProps = {
  client: IClientMeta | null;
  onConnect: ({ uri }: WcConnectProps) => Promise<void>;
};

const WalletConnectField = ({
  client,
  onConnect,
}: WalletConnectFieldProps): React.ReactElement => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // WalletConnect does not provide a loading/connecting status
  // This effects simulates a connecting status, and prevents
  // the user to initiate two connections in simultaneous.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnecting) {
      interval = setTimeout(() => setIsConnecting(false), 2_000);
    }

    return () => clearTimeout(interval);
  }, [isConnecting]);

  const onPaste = useCallback(
    (event: React.ClipboardEvent) => {
      const connectWithUri = (data: string) => {
        if (data.startsWith('wc:')) {
          setIsConnecting(true);
          onConnect({ uri: data });
        }
      };

      setInputValue('');

      if (client) {
        return;
      }

      const items = event.clipboardData.items;

      for (const index in items) {
        const item = items[index];

        if (item.kind === 'string' && item.type === 'text/plain') {
          connectWithUri(event.clipboardData.getData('Text'));
        }
      }
    },
    [client, onConnect]
  );

  if (isConnecting) {
    return <Spinner size="md" />;
  }

  return (
    <>
      <Input
        id="wc-uri"
        name="wc-uri"
        placeholder="Connection link"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onPaste={onPaste}
        autoComplete="off"
      />
    </>
  );
};

export default WalletConnectField;
