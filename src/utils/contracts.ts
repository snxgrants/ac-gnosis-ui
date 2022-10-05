import { Contract } from 'ethers';
import GnosisSafeL2 from '../abi/GnosisSafeL2.json';

export const SafeContract = new Contract(
  '0xd9B144b971aFbBd25668b907c87F1872458345b3',
  // '0x46abFE1C972fCa43766d6aD70E1c1Df72F4Bb4d1',
  GnosisSafeL2.abi
);
