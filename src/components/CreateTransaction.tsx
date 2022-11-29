import { FormControl, FormLabel, Input, FormHelperText, Stack, Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { setTransaction } from '../firebase';
import { getSafe } from '../utils/safe';
import { useWeb3Context } from '../web3.context';

const CreateTransaction = () => {
  const { signer } = useWeb3Context();
  const [toAddress, setToAddress] = useState('');
  const [data, setData] = useState('');
  const [value, setValue] = useState('0');
  const [operation, setOperation] = useState('0');
  const [nonce, setNonce] = useState('0');
  useEffect(() => {
    if (signer) {
      getSafe(signer)
        .then((safe) => safe.getNonce())
        .then((nonce: number) => setNonce(nonce.toString()));
    }
  }, [signer]);

  const postAndSignTx = async () => {
    if (signer) {
      const safe = await getSafe(signer);
      const safeTx = await safe.createTransaction({
        safeTransactionData: {
          nonce: Number(nonce),
          data: data || '0x',
          value,
          to: toAddress,
        },
      });
      const signedTx = await safe.signTransaction(safeTx);
      setTransaction(signedTx, nonce, false);
    }
  };

  return (
    <Stack>
      <FormControl>
        <FormLabel>To:</FormLabel>
        <Input value={toAddress} onChange={(e) => setToAddress(e.target.value)} />
        <FormHelperText>Contract Address</FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>Data:</FormLabel>
        <Input value={data} onChange={(e) => setData(e.target.value)} />
        <FormHelperText>Transaction Data</FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>Value:</FormLabel>
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
        <FormHelperText>How much ETH in WEI</FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>Operation</FormLabel>
        <Input value={operation} onChange={(e) => setOperation(e.target.value)} />
        <FormHelperText>For Delegate call set it to 1</FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>Nonce:</FormLabel>
        <Input value={nonce} onChange={(e) => setNonce(e.target.value)} />
        <FormHelperText>Safe nonce</FormHelperText>
      </FormControl>
      <Button onClick={postAndSignTx} disabled={!toAddress}>
        Create and Sign Transaction
      </Button>
    </Stack>
  );
};

export default CreateTransaction;
