import {
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Container,
  Button,
  Spinner,
  Box,
  Flex,
} from '@chakra-ui/react';
import { useWeb3Context } from './web3.context';
import TransactionList from './TransactionList';
import CreateTransaction from './CreateTransaction';
import HandleOwners from './HandleOwners';
import { useCallback, useEffect, useState } from 'react';
import { History } from './History';
import { useApps } from './hooks/useApps';
import useWalletConnect from './hooks/useWalletConnect';
import WalletConnectField from './WalletConnectField';
import Connecting from './Connecting';

enum CONNECTION_STATUS {
  CONNECTED,
  DISCONNECTED,
  CONNECTING,
}

function App() {
  const { signer, provider, connect } = useWeb3Context();
  const { wcClientData, wcConnect, wcDisconnect } = useWalletConnect();
  const { openSafeApp, findSafeApp } = useApps();
  const [connectionStatus, setConnectionStatus] = useState(
    CONNECTION_STATUS.DISCONNECTED
  );
  const [isNavigatingToSafeApp, setIsNavigatingToSafeApp] = useState(false);

  const handleOpenSafeApp = useCallback(
    (url: string) => {
      openSafeApp(url);
      wcDisconnect();
      setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      setIsNavigatingToSafeApp(true);
    },
    [openSafeApp, wcDisconnect]
  );

  useEffect(() => {
    if (wcClientData) {
      setConnectionStatus(CONNECTION_STATUS.CONNECTING);
    }
  }, [wcClientData]);

  useEffect(() => {
    if (!wcClientData) {
      setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      return;
    }

    if (connectionStatus === CONNECTION_STATUS.CONNECTING) {
      const safeApp = findSafeApp(wcClientData.url);

      if (!safeApp) {
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      }
    }
  }, [connectionStatus, findSafeApp, wcClientData]);

  useEffect(() => {
    localStorage.setItem('chakra-ui-color-mode', 'dark');
  }, []);

  if (isNavigatingToSafeApp) {
    return <Spinner size="md" />;
  }

  return (
    <Container
      display="flex"
      flexDirection="column"
      alignItems="center"
      size="lg"
      gap="2"
      bg="navy.900"
      h="100vh"
    >
      <Heading>Ambassador Council Gnosis Safe</Heading>
      {!(signer && provider) ? (
        <Button onClick={connect}>Connect Wallet</Button>
      ) : (
        <Tabs align="center" w="100%">
          <TabList>
            <Tab>Wallet Connect</Tab>
            <Tab>Create Transaction</Tab>
            <Tab>Remove {'&'} Add Owner</Tab>
            <Tab>Queue</Tab>
            <Tab>History</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Box as="main">
                <Flex flexDirection="column" alignItems="center">
                  {connectionStatus === CONNECTION_STATUS.DISCONNECTED && (
                    <WalletConnectField
                      client={wcClientData}
                      onConnect={(data) => wcConnect(data)}
                    />
                  )}
                  {connectionStatus === CONNECTION_STATUS.CONNECTING && (
                    <Connecting
                      client={wcClientData}
                      onOpenSafeApp={() =>
                        handleOpenSafeApp(wcClientData?.url || '')
                      }
                      onKeepUsingWalletConnect={() =>
                        setConnectionStatus(CONNECTION_STATUS.CONNECTED)
                      }
                    />
                  )}
                  {connectionStatus === CONNECTION_STATUS.CONNECTED && (
                    <Box>
                      Connected
                      <br />
                      <Button
                        onClick={() => {
                          setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
                          wcDisconnect();
                        }}
                        colorScheme="cyan"
                      >
                        Disconnect
                      </Button>
                    </Box>
                  )}
                </Flex>
              </Box>
            </TabPanel>
            <TabPanel>
              <CreateTransaction />
            </TabPanel>
            <TabPanel>
              <HandleOwners />
            </TabPanel>
            <TabPanel>
              <TransactionList />
            </TabPanel>
            <TabPanel>
              <History />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Container>
  );
}

export default App;
