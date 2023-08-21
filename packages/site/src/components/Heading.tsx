import { Heading } from '@chakra-ui/react';

const SHeading = (props) => {
  return (
    <Heading {...props} color={'white'}>
      {props.children}
    </Heading>
  );
};

export default SHeading;
