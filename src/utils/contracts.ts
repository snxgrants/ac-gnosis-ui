import { Contract } from 'ethers';
import GnosisSafeL2 from '../abi/GnosisSafeL2.json';

export const SafeContract = new Contract(
  '0x46abFE1C972fCa43766d6aD70E1c1Df72F4Bb4d1',
  GnosisSafeL2.abi
);
