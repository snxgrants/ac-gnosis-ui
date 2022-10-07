import {
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Container,
  Button,
} from '@chakra-ui/react';
import { useWeb3Context } from './web3.context';
import TransactionList from './TransactionList';
import CreateTransaction from './CreateTransaction';
import HandleOwners from './HandleOwners';
import { useEffect } from 'react';

function App() {
  const { signer, provider, connect } = useWeb3Context();

  useEffect(() => {
    localStorage.setItem('chakra-ui-color-mode', 'dark');
  }, []);
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
            <Tab>Create Transaction</Tab>
            <Tab>Remove {'&'} Add Owner</Tab>
            <Tab>Queue</Tab>
            <Tab>History</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <CreateTransaction />
            </TabPanel>
            <TabPanel>
              <HandleOwners />
            </TabPanel>
            <TabPanel>
              <TransactionList />
            </TabPanel>
            <TabPanel>history</TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Container>
  );
}

export default App;
