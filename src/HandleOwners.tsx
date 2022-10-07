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
      const toBeRemovedOwner = oldAddress.toLowerCase();
      const owners: string[] = await SafeContract.connect(signer).getOwners();
      const index = owners
        .map((o) => o.toLowerCase())
        .findIndex((o) => o === toBeRemovedOwner);
      const dataTx = SafeContract.interface.encodeFunctionData('removeOwner', [
        !index
          ? '0x0000000000000000000000000000000000000001'
          : owners[index - 1],
        toBeRemovedOwner,
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
        contractNetworks: {
          '10': {
            multiSendAddress: '0x998739BFdAAdde7C933B942a68053933098f9EDa',
            multiSendCallOnlyAddress:
              '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
            safeProxyFactoryAddress:
              '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC',
            safeMasterCopyAddress: '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA',
          },
        },
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
