import { Code } from '@chakra-ui/react';
import { RpcRequest } from '../../types/rpc';

const SendTransaction = ({ request }: { request: RpcRequest }) => {
  console.log({ request });
  return (
    <Code textAlign="left" maxHeight="500px" overflow="scroll">
      <pre>{JSON.stringify(request.params[0], null, 2)}</pre>
    </Code>
  );
};

export default SendTransaction;
