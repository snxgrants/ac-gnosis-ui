import { Heading, Tabs, TabList, Tab, TabPanels, TabPanel, Container, Button } from '@chakra-ui/react';
import TransactionList from './components/TransactionList';
import CreateTransaction from './components/CreateTransaction';
import HandleOwners from './components/HandleOwners';
import History from './components/History';
import { useWeb3Context } from './web3.context';
import { OPTIMISM_CHAIN_ID } from './constants';
import SwitchNetworkButton from './components/SwitchNetworkButton';
import WalletConnectTab from './components/WalletConnectTab';

const App = () => {
  const { signer, signerChainId, provider, connect } = useWeb3Context();
  const signerWalletNotConnected = !(provider && signer);
  const wrongSignerNetwork = signerChainId !== -1 && signerChainId !== OPTIMISM_CHAIN_ID;

  let content: React.ReactElement;
  switch (true) {
    case signerWalletNotConnected:
      content = <Button onClick={connect}>Connect Wallet</Button>;
      break;
    case wrongSignerNetwork:
      content = <SwitchNetworkButton targetChainId={OPTIMISM_CHAIN_ID} targetNetworkName="Optimism" />;
      break;
    default:
      content = (
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
              <WalletConnectTab />
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
      );
  }

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
      {content}
    </Container>
  );
};

export default App;
