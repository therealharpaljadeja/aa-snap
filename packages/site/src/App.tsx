import { FunctionComponent, ReactNode, useContext } from 'react';
import styled from 'styled-components';
import { Footer, Header } from './components';

import { GlobalStyle } from './config/theme';
import { ToggleThemeContext } from './Root';
import { VStack } from '@chakra-ui/react';

export type AppProps = {
  children: ReactNode;
};

export const App: FunctionComponent<AppProps> = ({ children }) => {
  const toggleTheme = useContext(ToggleThemeContext);

  return (
    <>
      <VStack backgroundColor={'#251551'} width="100%" height="100%">
        <Header handleToggleClick={toggleTheme} />
        {children}
        <Footer />
      </VStack>
    </>
  );
};
