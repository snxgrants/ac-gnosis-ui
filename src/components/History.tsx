import { Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { SafeTransaction } from '@gnosis.pm/safe-core-sdk-types';
import { getTransactions } from '../firebase';

interface HistoryTransactionState extends SafeTransaction {
  executed: boolean;
}

const History = () => {
  const [, setTxs] = useState<HistoryTransactionState[]>();
  useEffect(() => {
    getTransactions().then((txs) => setTxs(txs as HistoryTransactionState[]));
  }, []);
  return <Flex></Flex>;
};

export default History;
