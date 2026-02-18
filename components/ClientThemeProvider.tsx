'use client';

import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ReactNode } from 'react';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3498db',
    },
    secondary: {
      main: '#e74c3c',
    },
    success: {
      main: '#27ae60',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default function ClientThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
