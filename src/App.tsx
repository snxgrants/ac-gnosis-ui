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
import { useState } from 'react';
import {
  buildSafeTransaction,
  executeTx,
  safeSignMessage,
} from './utils/execution';
import { Contract } from 'ethers';
import GnosisSafeL2 from './abi/GnosisSafeL2.json';
import { getTransactions, setTransaction } from './firebase';
// 0xd9B144b971aFbBd25668b907c87F1872458345b3
// AC: 0x46abFE1C972fCa43766d6aD70E1c1Df72F4Bb4d1
const safeReduceThresholdTx = buildSafeTransaction({
  to: '0x46abFE1C972fCa43766d6aD70E1c1Df72F4Bb4d1',
  value: 0,
  data: '0x694e80c30000000000000000000000000000000000000000000000000000000000000001',
  operation: 0,
  nonce: 0,
});

const SafeContract = new Contract(
  '0x46abFE1C972fCa43766d6aD70E1c1Df72F4Bb4d1',
  GnosisSafeL2.abi
);

function App() {
  const { signer, provider, connect } = useWeb3Context();
  const [isLoading, setIsLoading] = useState(false);
  const signTx = async () => {
    if (signer) {
      setIsLoading(true);
      const sig = await safeSignMessage(
        signer,
        SafeContract,
        safeReduceThresholdTx,
        10
      );
      try {
        await setTransaction(safeReduceThresholdTx, sig);
      } catch (error) {
        console.error(Error);
      }
      setIsLoading(false);
    }
  };
  const executeThresholdTx = async () => {
    if (signer) {
      const getTxs = await getTransactions();
      const connectedContract = SafeContract.connect(signer);
      console.log(getTxs[0]);
      executeTx(connectedContract, safeReduceThresholdTx, getTxs[0].signatures);
    }
  };
  return (
    <Container
      display="flex"
      flexDirection="column"
      alignItems="center"
      size="lg"
      gap="2"
    >
      <Heading>Ambassador Council Gnosis Safe</Heading>
      {!(signer && provider) ? (
        <Button onClick={connect}>Connect Wallet</Button>
      ) : (
        <Tabs align="center" w="100%">
          <TabList>
            <Tab>Reduce Threshold Tx</Tab>
            <Tab>Create Transaction</Tab>
            <Tab>Queue</Tab>
            <Tab>History</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Heading>Reduce Threshold Tx</Heading>
              <Button isLoading={isLoading} onClick={signTx}>
                Sign Transaction
              </Button>
              <Button onClick={executeThresholdTx}>Execute Transaction</Button>
            </TabPanel>
            <TabPanel>
              <CreateTransaction />
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
