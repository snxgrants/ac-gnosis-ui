import { Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { getTransactions } from './firebase';
import { SafeTransaction } from '@gnosis.pm/safe-core-sdk-types';

interface HistoryTransactionState extends SafeTransaction {
  executed: boolean;
}

export function History() {
  const [txs, setTxs] = useState<HistoryTransactionState[]>();
  useEffect(() => {
    getTransactions().then((txs) => setTxs(txs as HistoryTransactionState[]));
  }, []);
  return <Flex></Flex>;
}
