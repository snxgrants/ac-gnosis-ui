import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Stack,
} from '@chakra-ui/react';
import { BigNumber, ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { SafeContract } from './utils/contracts';
import { useWeb3Context } from './web3.context';
import Safe from '@gnosis.pm/safe-core-sdk';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types';

export default function HandleOwners() {
  const { signer } = useWeb3Context();
  const [oldAddress, setOldAddress] = useState('0x');
  const [newAddress, setNewAddress] = useState('0x');
  const [nonce, setNonce] = useState('0');
  useEffect(() => {
    if (signer) {
      SafeContract.connect(signer)
        .nonce()
        .then((nonce: BigNumber) => setNonce(nonce.toString()));
    }
  }, []);

  const exec = async () => {
    if (signer) {
      const signerAddress = await signer.getAddress();
      const dataTx = SafeContract.interface.encodeFunctionData('removeOwner', [
        signerAddress,
        oldAddress,
        1,
      ]);
      const safeTransactionData: SafeTransactionDataPartial = {
        to: SafeContract.address,
        value: '0',
        data: dataTx,
      };
      const safeSdk: Safe = await Safe.create({
        ethAdapter: new EthersAdapter({ ethers, signer }),
        safeAddress: SafeContract.address,
      });
      const safeTransaction = await safeSdk.createTransaction({
        safeTransactionData,
      });
      const signedSafeTransaction = await safeSdk.signTransaction(
        safeTransaction
      );
      safeSdk.executeTransaction(signedSafeTransaction);
    }
  };
  return (
    <Stack>
      <FormControl>
        <FormLabel>Old Owner</FormLabel>
        <Input
          value={oldAddress}
          onChange={(e) => setOldAddress(e.target.value.trim())}
        />
        <FormHelperText>Old Owner Address</FormHelperText>
      </FormControl>
      {/* <FormControl>
        <FormLabel>New Owner</FormLabel>
        <Input
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value.trim())}
        />
        <FormHelperText>New Owner Address</FormHelperText>
      </FormControl> */}
      <Button onClick={exec}>Execute</Button>
    </Stack>
  );
}
