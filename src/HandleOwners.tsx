import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Stack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { SafeContract } from './utils/contracts';
import { useWeb3Context } from './web3.context';
import Safe from '@gnosis.pm/safe-core-sdk';
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types';
import { getSafe } from './utils/safe';

export default function HandleOwners() {
  const { signer } = useWeb3Context();
  const [oldAddress, setOldAddress] = useState('0x');
  const [newAddress, setNewAddress] = useState('0x');

  const exec = async (addOwner?: boolean) => {
    if (signer) {
      let dataTx: string;
      if (!addOwner) {
        const owners: string[] = await SafeContract.connect(signer).getOwners();
        const toBeRemovedOwner = oldAddress.toLowerCase();
        const index = owners
          .map((o) => o.toLowerCase())
          .findIndex((o) => o === toBeRemovedOwner);
        dataTx = SafeContract.interface.encodeFunctionData('removeOwner', [
          !index
            ? '0x0000000000000000000000000000000000000001'
            : owners[index - 1],
          toBeRemovedOwner,
          1,
        ]);
      } else {
        dataTx = SafeContract.interface.encodeFunctionData(
          'addOwnerWithThreshold',
          [newAddress, 1]
        );
      }

      const safeTransactionData: SafeTransactionDataPartial = {
        to: SafeContract.address,
        value: '0',
        data: dataTx!,
      };
      const safeSdk: Safe = await getSafe(signer);
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
      <Button onClick={() => exec()}>Remove Owner</Button>
      <FormControl>
        <FormLabel>New Owner</FormLabel>
        <Input
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value.trim())}
        />
        <FormHelperText>New Owner Address</FormHelperText>
      </FormControl>
      <Button onClick={() => exec(true)}>Add New Owner</Button>
    </Stack>
  );
}
