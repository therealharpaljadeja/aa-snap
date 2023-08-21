import { ComponentProps } from 'react';
import styled from 'styled-components';
import { MetamaskState } from '../hooks';
import { ReactComponent as FlaskFox } from '../assets/flask_fox.svg';
import { shouldDisplayReconnectButton } from '../utils';
import { Button, Container, HStack, Link, Tag, Text } from '@chakra-ui/react';
import SText from './Text';

export const InstallFlaskButton = () => (
  <Link href="https://metamask.io/flask/" target="_blank">
    <HStack backgroundColor={'#4823b0'} px="4" py="2" borderRadius={'md'}>
      <FlaskFox />
      <SText>Install Flask</SText>
    </HStack>
  </Link>
);

export const ConnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button
      {...props}
      backgroundColor={'#4823b0'}
      px="4"
      py="2"
      borderRadius={'md'}
      gap={'3'}
      _hover={{ backgroundColor: '#4823b0' }}
    >
      <FlaskFox />
      <SText>Connect</SText>
    </Button>
  );
};

export const ReconnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button
      {...props}
      backgroundColor={'#4823b0'}
      px="4"
      py="2"
      borderRadius={'md'}
      gap="3"
      _hover={{ backgroundColor: '#4823b0' }}
    >
      <FlaskFox />
      <SText>Reconnect</SText>
    </Button>
  );
};

export const SendHelloButton = (props: ComponentProps<typeof Button>) => {
  return <Button {...props}>Send message</Button>;
};

export const HeaderButtons = ({
  state,
  onConnectClick,
}: {
  state: MetamaskState;
  onConnectClick(): unknown;
}) => {
  if (!state.isFlask && !state.installedSnap) {
    return <InstallFlaskButton />;
  }

  if (!state.installedSnap) {
    return <ConnectButton onClick={onConnectClick} />;
  }

  if (shouldDisplayReconnectButton(state.installedSnap)) {
    return <ReconnectButton onClick={onConnectClick} />;
  }

  return (
    <Button>
      <Container
        height="10px"
        width={'10px'}
        borderRadius={'full'}
        backgroundColor={'green.900'}
      />
      <ButtonText>Connected</ButtonText>
    </Button>
  );
};
