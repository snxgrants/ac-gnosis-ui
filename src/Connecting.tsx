import { Flex, Image, Link, Text } from '@chakra-ui/react';
import { IClientMeta } from '@walletconnect/types';

type ConnectingProps = {
  client: IClientMeta | null;
  onKeepUsingWalletConnect: () => void;
};

const Connecting = ({
  client,
  onKeepUsingWalletConnect,
}: ConnectingProps) => {
  if (!client) {
    return null;
  }

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <Flex>
        <Text size="xl">
          Trying to connect <Text as="span">{client.name}</Text>
        </Text>
      </Flex>

      <Flex>
        <Text>
          For a better experience use a Safe optimised app. It allows you to
          operate an app without interruption.
        </Text>
      </Flex>

      <Flex alignItems="center" justifyContent="center" gap={3}>
        <Flex>
          <Image src={client.icons[0]} />
        </Flex>
        <Flex flexDirection="column" gap={1}>
          <Text>SAFE OPTIMISED</Text>
          <Text size="lg">
            {client.name ? client.name : new URL(client.url).hostname}
          </Text>
        </Flex>
      </Flex>

      <Flex>
        <Link onClick={onKeepUsingWalletConnect}>Keep using WalletConnect</Link>
      </Flex>
    </Flex>
  );
};

export default Connecting;
