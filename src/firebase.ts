import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
} from 'firebase/firestore/lite';
import { SafeSignature, SafeTransaction } from './utils/execution';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCf_KRfbmNJrcaQsMgL1pIfky8gIQqto_c',
  authDomain: 'ambassador-council.firebaseapp.com',
  projectId: 'ambassador-council',
  storageBucket: 'ambassador-council.appspot.com',
  messagingSenderId: '171985840217',
  appId: '1:171985840217:web:8f78e7315cdc8ea2a02948',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const getTransactions = async () => {
  const transactionCol = collection(db, 'transactions');
  const transactionSnapshot = await getDocs(transactionCol);
  return transactionSnapshot.docs.map((doc) => doc.data());
};
export const setTransaction = async (
  safeTx: SafeTransaction,
  signature: SafeSignature
) => {
  const allTransaction = await getTransactions();
  const reduceTx = allTransaction[0];
  if (reduceTx) {
    if (
      !reduceTx.signatures.find(
        (sig: SafeSignature) => sig.signer === signature.signer
      )
    ) {
      return await setDoc(doc(db, 'transactions', 'reduce'), {
        ...safeTx,
        signatures: [...reduceTx.signatures, signature],
      });
    } else {
      return new Error('Signature Already Added');
    }
  } else {
    return await setDoc(doc(db, 'transactions', 'reduce'), {
      ...safeTx,
      signatures: [signature],
    });
  }
};
