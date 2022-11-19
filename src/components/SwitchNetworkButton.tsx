import { Button, Text, Flex } from '@chakra-ui/react';
import { onboard } from '../web3.context';

type Props = {
  targetChainId: number;
  targetNetworkName: string;
};

const SwitchNetworkButton = ({ targetChainId, targetNetworkName }: Props) => {
  const switchNetwork = async () => {
    await onboard.setChain({ chainId: `0x${targetChainId.toString(16)}` });
  };

  return (
    <Flex flexDirection="column" justifyContent="center">
      <Text>Wrong network. Click the button below</Text>
      <Button size="lg" onClick={switchNetwork} mt={4}>
        Switch to {targetNetworkName}
      </Button>
    </Flex>
  );
};

export default SwitchNetworkButton;
