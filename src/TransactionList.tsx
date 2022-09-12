import { useEffect, useState } from 'react';
import { getTransactions } from './firebase';
import { DocumentData } from 'firebase/firestore';
import {
  Accordion,
  AccordionItem,
  AccordionIcon,
  AccordionButton,
} from '@chakra-ui/react';

export default function TransactionList() {
  const [txs, setTxs] = useState<DocumentData[]>([]);
  useEffect(() => {
    getTransactions().then((data) => setTxs(data));
  }, []);
  return (
    <>
      {txs.map((tx) => (
        <Accordion key={tx.nonce}>
          <AccordionItem>
            <AccordionButton>
              <AccordionIcon />
            </AccordionButton>
            {JSON.stringify(tx)}
          </AccordionItem>
        </Accordion>
      ))}
    </>
  );
}
