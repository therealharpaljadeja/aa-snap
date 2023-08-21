import { Heading, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';
import styled from 'styled-components';

type CardProps = {
  content: {
    title?: string;
    description: ReactNode;
    button?: ReactNode;
  };
  disabled?: boolean;
  fullWidth?: boolean;
};

const Description = styled.div`
  margin-top: 2.4rem;
  margin-bottom: 2.4rem;
`;

export const Card = ({ content, disabled = false, fullWidth }: CardProps) => {
  const { title, description, button } = content;
  return (
    <VStack border="1px solid black" p="4" borderRadius={'md'} width={'100%'}>
      {title && <Heading size={'md'}>{title}</Heading>}
      <Description>{description}</Description>
      {button}
    </VStack>
  );
};
