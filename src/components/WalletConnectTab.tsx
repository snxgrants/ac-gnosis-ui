import { Box, Button, Flex } from '@chakra-ui/react';
import WalletConnectField from './WalletConnectField';
import { CONNECTION_STATUS, useWalletConnect } from '../hooks/useWalletConnect';

const WalletConnectTab = () => {
  const { wcClientData, wcConnect, wcDisconnect, connectionStatus } = useWalletConnect();

  return (
    <Box as="main">
      <Flex flexDirection="column" alignItems="center">
        {connectionStatus === CONNECTION_STATUS.DISCONNECTED && (
          <WalletConnectField client={wcClientData} onConnect={(data) => wcConnect(data)} />
        )}

        {connectionStatus === CONNECTION_STATUS.CONNECTED && (
          <Box>
            Connected to {wcClientData?.url || ''}
            <br />
            <img src={wcClientData?.icons?.[0]} alt="wc client icon" />
            <Button onClick={wcDisconnect} colorScheme="cyan">
              Disconnect
            </Button>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default WalletConnectTab;
