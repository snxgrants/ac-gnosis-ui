import {
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  Stack,
  Button,
} from '@chakra-ui/react';
import { BigNumber } from 'ethers';
import { useEffect, useState } from 'react';
import { SafeContract } from './utils/contracts';
import { useWeb3Context } from './web3.context';
import { buildSafeTransaction } from './utils/execution';

export default function CreateTransaction() {
  const { signer } = useWeb3Context();
  const [toAddress, setToAddress] = useState('0x');
  const [data, setData] = useState('0x');
  const [value, setValue] = useState('0');
  const [operation, setOperation] = useState('0');
  const [nonce, setNonce] = useState('0');
  useEffect(() => {
    if (signer) {
      SafeContract.connect(signer)
        .nonce()
        .then((nonce: BigNumber) => setNonce(nonce.toString()));
    }
  }, []);

  return (
    <Stack>
      <FormControl>
        <FormLabel>To:</FormLabel>
        <Input
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
        />
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
        <FormHelperText>How much ETH</FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>Operation</FormLabel>
        <Input
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
        />
        <FormHelperText>For Delegate call set it to 1</FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>Nonce:</FormLabel>
        <Input value={nonce} onChange={(e) => setNonce(e.target.value)} />
        <FormHelperText>Contract nonce</FormHelperText>
      </FormControl>
      <Button>Execute Transaction</Button>
      <Button>Sign Transaction</Button>
    </Stack>
  );
}
