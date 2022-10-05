import {
  BigNumber,
  BigNumberish,
  constants,
  Contract,
  PopulatedTransaction,
  Signer,
  utils,
  Wallet,
} from 'ethers';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { bufferToHex, ecrecover, pubToAddress } from 'ethereumjs-util';

export const EIP_DOMAIN = {
  EIP712Domain: [
    { type: 'uint256', name: 'chainId' },
    { type: 'address', name: 'verifyingContract' },
  ],
};

export const EIP712_SAFE_TX_TYPE = {
  // "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
  SafeTx: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'value' },
    { type: 'bytes', name: 'data' },
    { type: 'uint8', name: 'operation' },
    { type: 'uint256', name: 'safeTxGas' },
    { type: 'uint256', name: 'baseGas' },
    { type: 'uint256', name: 'gasPrice' },
    { type: 'address', name: 'gasToken' },
    { type: 'address', name: 'refundReceiver' },
    { type: 'uint256', name: 'nonce' },
  ],
};

export const EIP712_SAFE_MESSAGE_TYPE = {
  // "SafeMessage(bytes message)"
  SafeMessage: [{ type: 'bytes', name: 'message' }],
};

export interface MetaTransaction {
  to: string;
  value: string | number | BigNumber;
  data: string;
  operation: number;
}

export interface SafeTransaction extends MetaTransaction {
  safeTxGas: string | number;
  baseGas: string | number;
  gasPrice: string | number;
  gasToken: string;
  refundReceiver: string;
  nonce: string | number;
}

export interface SafeSignature {
  signer: string;
  data: string;
}

export const calculateSafeDomainSeparator = (
  safe: Contract,
  chainId: BigNumberish
): string => {
  return utils._TypedDataEncoder.hashDomain({
    verifyingContract: safe.address,
    chainId,
  });
};

export const preimageSafeTransactionHash = (
  safe: Contract,
  safeTx: SafeTransaction,
  chainId: BigNumberish
): string => {
  return utils._TypedDataEncoder.encode(
    { verifyingContract: safe.address, chainId },
    EIP712_SAFE_TX_TYPE,
    safeTx
  );
};

export const calculateSafeTransactionHash = (
  safe: Contract,
  safeTx: SafeTransaction
): string => {
  return utils._TypedDataEncoder.hash(
    { verifyingContract: safe.address },
    EIP712_SAFE_TX_TYPE,
    safeTx
  );
};

export const calculateSafeMessageHash = (
  safe: Contract,
  message: string,
  chainId: BigNumberish
): string => {
  return utils._TypedDataEncoder.hash(
    { verifyingContract: safe.address, chainId },
    EIP712_SAFE_MESSAGE_TYPE,
    { message }
  );
};

export const safeApproveHash = async (
  signer: Signer,
  safe: Contract,
  safeTx: SafeTransaction,
  skipOnChainApproval?: boolean
): Promise<SafeSignature> => {
  if (!skipOnChainApproval) {
    if (!signer.provider)
      throw Error('Provider required for on-chain approval');
    const typedDataHash = utils.arrayify(
      calculateSafeTransactionHash(safe, safeTx)
    );
    const signerSafe = safe.connect(signer);
    await signerSafe.approveHash(typedDataHash);
  }
  const signerAddress = await signer.getAddress();
  return {
    signer: signerAddress,
    data:
      '0x000000000000000000000000' +
      signerAddress.slice(2) +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '01',
  };
};

export const safeSignTypedData = async (
  signer: Signer & TypedDataSigner,
  safe: Contract,
  safeTx: SafeTransaction,
  chainId?: BigNumberish
): Promise<SafeSignature> => {
  if (!chainId && !signer.provider)
    throw Error('Provider required to retrieve chainId');
  const cid = chainId || (await signer.provider!!.getNetwork()).chainId;
  const signerAddress = await signer.getAddress();
  return {
    signer: signerAddress,
    data: await signer._signTypedData(
      { verifyingContract: safe.address, chainId: cid },
      EIP712_SAFE_TX_TYPE,
      safeTx
    ),
  };
};

export const signHash = async (
  signer: Signer,
  hash: string
): Promise<SafeSignature> => {
  const typedDataHash = utils.arrayify(hash);
  const signerAddress = await signer.getAddress();
  return {
    signer: signerAddress,
    data: (await signer.signMessage(typedDataHash))
      .replace(/1b$/, '1f')
      .replace(/1c$/, '20'),
  };
};

export const safeSignMessage = async (
  signer: Signer,
  safe: Contract,
  safeTx: SafeTransaction
): Promise<SafeSignature> => {
  return signHash(signer, calculateSafeTransactionHash(safe, safeTx));
};

export const buildSignatureBytes = (signatures: SafeSignature[]): string => {
  signatures.sort((left, right) =>
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
  );
  let signatureBytes = '0x';
  for (const sig of signatures) {
    signatureBytes += sig.data.slice(2);
  }
  return signatureBytes;
};

export const logGas = async (
  message: string,
  tx: Promise<any>,
  skip?: boolean
): Promise<any> => {
  return tx.then(async (result) => {
    const receipt = await result.wait();
    if (!skip)
      console.log(
        '           Used',
        receipt.gasUsed.toNumber(),
        `gas for >${message}<`
      );
    return result;
  });
};

export const executeTx = async (
  safe: Contract,
  safeTx: SafeTransaction,
  signatures: SafeSignature[],
  overrides?: any
): Promise<any> => {
  const signatureBytes = buildSignatureBytes(signatures);
  return safe.execTransaction(
    safeTx.to,
    safeTx.value,
    safeTx.data,
    safeTx.operation,
    safeTx.safeTxGas,
    safeTx.baseGas,
    safeTx.gasPrice,
    safeTx.gasToken,
    safeTx.refundReceiver,
    signatureBytes,
    overrides || {}
  );
};

export const populateExecuteTx = async (
  safe: Contract,
  safeTx: SafeTransaction,
  signatures: SafeSignature[],
  overrides?: any
): Promise<PopulatedTransaction> => {
  const signatureBytes = buildSignatureBytes(signatures);
  return safe.populateTransaction.execTransaction(
    safeTx.to,
    safeTx.value,
    safeTx.data,
    safeTx.operation,
    safeTx.safeTxGas,
    safeTx.baseGas,
    safeTx.gasPrice,
    safeTx.gasToken,
    safeTx.refundReceiver,
    signatureBytes,
    overrides || {}
  );
};

export const buildContractCall = (
  contract: Contract,
  method: string,
  params: any[],
  nonce: number,
  delegateCall?: boolean,
  overrides?: Partial<SafeTransaction>
): SafeTransaction => {
  const data = contract.interface.encodeFunctionData(method, params);
  return buildSafeTransaction(
    Object.assign(
      {
        to: contract.address,
        data,
        operation: delegateCall ? 1 : 0,
        nonce,
      },
      overrides
    )
  );
};

export const executeTxWithSigners = async (
  safe: Contract,
  tx: SafeTransaction,
  signers: Wallet[],
  overrides?: any
) => {
  const sigs = await Promise.all(
    signers.map((signer) => safeSignTypedData(signer, safe, tx))
  );
  return executeTx(safe, tx, sigs, overrides);
};

export const executeContractCallWithSigners = async (
  safe: Contract,
  contract: Contract,
  method: string,
  params: any[],
  signers: Wallet[],
  delegateCall?: boolean,
  overrides?: Partial<SafeTransaction>
) => {
  const tx = buildContractCall(
    contract,
    method,
    params,
    await safe.nonce(),
    delegateCall,
    overrides
  );
  return executeTxWithSigners(safe, tx, signers);
};

export const buildSafeTransaction = (template: {
  to: string;
  value?: BigNumber | number | string;
  data?: string;
  operation?: number;
  safeTxGas?: number | string;
  baseGas?: number | string;
  gasPrice?: number | string;
  gasToken?: string;
  refundReceiver?: string;
  nonce: number;
}): SafeTransaction => {
  return {
    to: template.to,
    value: template.value || 0,
    data: template.data || '0x',
    operation: template.operation || 0,
    safeTxGas: template.safeTxGas || 0,
    baseGas: template.baseGas || 0,
    gasPrice: template.gasPrice || 0,
    gasToken: template.gasToken || constants.AddressZero,
    refundReceiver: template.refundReceiver || constants.AddressZero,
    nonce: template.nonce,
  };
};

export const isTxHashSignedWithPrefix = (
  txHash: string,
  signature: string,
  ownerAddress: string
): boolean => {
  let hasPrefix;
  try {
    const rsvSig = {
      r: Buffer.from(signature.slice(2, 66), 'hex'),
      s: Buffer.from(signature.slice(66, 130), 'hex'),
      v: parseInt(signature.slice(130, 132), 16),
    };
    const recoveredData = ecrecover(
      Buffer.from(txHash.slice(2), 'hex'),
      rsvSig.v,
      rsvSig.r,
      rsvSig.s
    );
    const recoveredAddress = bufferToHex(pubToAddress(recoveredData));
    hasPrefix = !sameString(recoveredAddress, ownerAddress);
  } catch (e) {
    hasPrefix = true;
  }
  return hasPrefix;
};

type AdjustVOverload = {
  (signingMethod: 'eth_signTypedData', signature: string): string;
  (
    signingMethod: 'eth_sign',
    signature: string,
    safeTxHash: string,
    sender: string
  ): string;
};

export const adjustV: AdjustVOverload = (
  signingMethod: 'eth_sign' | 'eth_signTypedData',
  signature: string,
  safeTxHash?: string,
  sender?: string
): string => {
  const MIN_VALID_V_VALUE = 27;
  let sigV = parseInt(signature.slice(-2), 16);

  if (signingMethod === 'eth_sign') {
    /*
      Usually returned V (last 1 byte) is 27 or 28 (valid ethereum value)
      Metamask with ledger returns v = 01, this is not valid for ethereum
      In case V = 0 or 1 we add it to 27 or 28
      Adding 4 is required if signed message was prefixed with "\x19Ethereum Signed Message:\n32"
      Some wallets do that, some wallets don't, V > 30 is used by contracts to differentiate between prefixed and non-prefixed messages
      https://github.com/gnosis/safe-contracts/blob/main/contracts/GnosisSafe.sol#L292
    */
    if (sigV < MIN_VALID_V_VALUE) {
      sigV += MIN_VALID_V_VALUE;
    }
    const adjusted = signature.slice(0, -2) + sigV.toString(16);
    const signatureHasPrefix = isTxHashSignedWithPrefix(
      safeTxHash as string,
      adjusted,
      sender as string
    );
    if (signatureHasPrefix) {
      sigV += 4;
    }
  }

  if (signingMethod === 'eth_signTypedData') {
    // Metamask with ledger returns V=0/1 here too, we need to adjust it to be ethereum's valid value (27 or 28)
    if (sigV < MIN_VALID_V_VALUE) {
      sigV += MIN_VALID_V_VALUE;
    }
  }

  return signature.slice(0, -2) + sigV.toString(16);
};

export const sameString = (
  str1: string | undefined,
  str2: string | undefined
): boolean => {
  if (!str1 || !str2) {
    return false;
  }

  return str1.toLowerCase() === str2.toLowerCase();
};
