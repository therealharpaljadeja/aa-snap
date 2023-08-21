import styled, { useTheme } from 'styled-components';
import { ReactComponent as MetaMaskFox } from '../assets/metamask_fox.svg';
import { MetaMask } from './MetaMask';
import { PoweredBy } from './PoweredBy';
import { Button, HStack, Image, Link, VStack } from '@chakra-ui/react';

export const Footer = () => {
  return (
    <VStack marginTop={'10'} alignItems={'center'} gap="2">
      <PoweredBy color={'white'} />
      <HStack gap="4">
        <Link href="https://docs.metamask.io/" target="_blank">
          <VStack gap="2" alignItems={'start'}>
            <HStack>
              <MetaMaskFox />
              <MetaMask color={'white'} />
            </HStack>
          </VStack>
        </Link>
        <Link href="https://docs.metamask.io/" target="_blank">
          <HStack>
            <Image width="100px" src="./pimlico.png" />
          </HStack>
        </Link>
      </HStack>
    </VStack>
  );
};
