import { Button, FormControl, FormHelperText, FormLabel, Input, Stack } from '@chakra-ui/react';
import { useState } from 'react';
import { useWeb3Context } from '../web3.context';
import Safe from '@gnosis.pm/safe-core-sdk';
import { getSafe } from '../utils/safe';

const HandleOwners = () => {
  const { signer } = useWeb3Context();
  const [oldAddress, setOldAddress] = useState('0x');
  const [newAddress, setNewAddress] = useState('0x');

  const exec = async (removeOwner?: boolean) => {
    if (signer) {
      const safeSdk: Safe = await getSafe(signer);
      const safeTransaction = await (removeOwner
        ? safeSdk.createRemoveOwnerTx({
            ownerAddress: oldAddress,
          })
        : safeSdk.createAddOwnerTx({
            ownerAddress: newAddress,
          }));

      const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction);
      safeSdk.executeTransaction(signedSafeTransaction);
    }
  };

  return (
    <Stack>
      <FormControl>
        <FormLabel>Old Owner</FormLabel>
        <Input value={oldAddress} onChange={(e) => setOldAddress(e.target.value.trim())} />
        <FormHelperText>Old Owner Address</FormHelperText>
      </FormControl>
      <Button onClick={() => exec(true)}>Remove Owner</Button>
      <FormControl>
        <FormLabel>New Owner</FormLabel>
        <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value.trim())} />
        <FormHelperText>New Owner Address</FormHelperText>
      </FormControl>
      <Button onClick={() => exec()}>Add New Owner</Button>
    </Stack>
  );
};

export default HandleOwners;
