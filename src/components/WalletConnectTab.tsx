import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { EthSignSignature } from '@gnosis.pm/safe-core-sdk';
import WalletConnectField from './WalletConnectField';
import { CONNECTION_STATUS, useWalletConnect } from '../hooks/useWalletConnect';
import SignRequest from './SignRequest';
import { useWeb3Context } from '../web3.context';
import { getPreValidatedSignature, safeSignMessage, safeSignTypedMessage } from '../utils/safe';
import { tryHexBytesToUtf8 } from '../utils/strings';

const WalletConnectTab = () => {
  const { signer, safe } = useWeb3Context();
  const { wcClientData, wcConnect, wcDisconnect, connectionStatus, pendingRequest, approveRequest, rejectRequest } =
    useWalletConnect();

  const onApprove = async () => {
    if (!pendingRequest || !signer || !safe) return;

    const safeAddress = safe.getAddress();

    switch (pendingRequest.method) {
      case 'eth_signTypedData':
      case 'eth_signTypedData_v4': {
        const [, typedDataString] = pendingRequest.params;
        const signature = await safeSignTypedMessage(signer, safeAddress, typedDataString);

        approveRequest(pendingRequest.id, signature);
        break;
      }

      case 'eth_sign':
      case 'personal_sign': {
        let message = pendingRequest.method === 'eth_sign' ? pendingRequest.params[1] : pendingRequest.params[0];
        message = tryHexBytesToUtf8(message);
        const signature = await safeSignMessage(signer, safeAddress, message);

        approveRequest(pendingRequest.id, signature);
        break;
      }

      case 'eth_sendTransaction':
        const [tx] = pendingRequest.params;
        const { to, data, value } = tx;
        const safeTransaction = await safe.createTransaction({
          safeTransactionData: { to, data, value: !!value ? value : 0 },
          onlyCalls: true,
        });
        const signerAddress = await signer.getAddress();
        // An alternative to pre-validated signatures. Would require approving 2 requests in signer wallet, first
        // for signing a transaction and a second for executing.
        // const safeTxHash = await safe.getTransactionHash(safeTransaction);
        // const signature = await safe.signTransactionHash(safeTxHash);

        const signature = getPreValidatedSignature(signerAddress);
        safeTransaction.addSignature(new EthSignSignature(signerAddress, signature));

        const executeTxResponse = await safe.executeTransaction(safeTransaction);
        const receipt = executeTxResponse.transactionResponse && (await executeTxResponse.transactionResponse.wait());
        approveRequest(pendingRequest.id, receipt?.transactionHash);
        break;
    }
  };

  const onReject = () => {
    rejectRequest(pendingRequest?.id || 1, 'User rejected request');
  };

  return (
    <Box as="main">
      <Flex flexDirection="column" alignItems="center">
        {connectionStatus === CONNECTION_STATUS.DISCONNECTED && (
          <WalletConnectField client={wcClientData} onConnect={wcConnect} />
        )}

        {connectionStatus === CONNECTION_STATUS.CONNECTED && (
          <>
            <Box>
              <Text>Connected to {wcClientData?.url || ''}</Text>
              <br />
              <img src={wcClientData?.icons?.[0]} alt="wc client icon" />
              <Button onClick={wcDisconnect} colorScheme="cyan">
                Disconnect
              </Button>
              <Text mt={8}>Keep this page open during the whole session. Signing requests will appear here.</Text>
            </Box>

            {pendingRequest && <SignRequest request={pendingRequest} onApprove={onApprove} onReject={onReject} />}
          </>
        )}
      </Flex>
    </Box>
  );
};

export default WalletConnectTab;
