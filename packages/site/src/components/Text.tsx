import { Text } from '@chakra-ui/react';

const SText = (props) => {
  return (
    <Text {...props} color={'white'}>
      {props.children}
    </Text>
  );
};

export default SText;
