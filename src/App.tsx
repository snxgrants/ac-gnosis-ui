import { Heading, Tabs, TabList, Tab, TabPanels, TabPanel, Container, Button, Box, Flex } from '@chakra-ui/react';
import { useWeb3Context } from './web3.context';
import TransactionList from './components/TransactionList';
import CreateTransaction from './components/CreateTransaction';
import HandleOwners from './components/HandleOwners';
import { useEffect, useState } from 'react';
import { History } from './components/History';
import useWalletConnect from './hooks/useWalletConnect';
import WalletConnectField from './components/WalletConnectField';
import Connecting from './components/Connecting';

enum CONNECTION_STATUS {
  CONNECTED,
  DISCONNECTED,
  CONNECTING,
}

function App() {
  const { signer, provider, connect } = useWeb3Context();
  const { wcClientData, wcConnect, wcDisconnect } = useWalletConnect();
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.DISCONNECTED);
  const signerWalletNotConnected = !(provider && signer);

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
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
    }
  }, [connectionStatus, wcClientData]);

  useEffect(() => {
    localStorage.setItem('chakra-ui-color-mode', 'dark');
  }, []);

  return (
    <Container
      display="flex"
      flexDirection="column"
      alignItems="center"
      maxW="100vw"
      gap="2"
      bg="navy.900"
      h="100vh"
      pt="100px"
    >
      <Heading>Ambassador Council Safe</Heading>
      {signerWalletNotConnected ? (
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
                    <WalletConnectField client={wcClientData} onConnect={(data) => wcConnect(data)} />
                  )}
                  {connectionStatus === CONNECTION_STATUS.CONNECTING && (
                    <Connecting
                      client={wcClientData}
                      onKeepUsingWalletConnect={() => setConnectionStatus(CONNECTION_STATUS.CONNECTED)}
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
