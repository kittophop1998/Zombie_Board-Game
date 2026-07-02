'use client';

import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ReactNode } from 'react';

// Neon Survival Playground palette — see DESIGN.md
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7C5CFF',      // --color-primary
      dark: '#4E35B8',      // --color-primary-dark
      light: '#EEE9FF',     // --color-primary-soft
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00D9C0',      // --color-secondary
      dark: '#009A89',
      light: '#E5FFFB',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#00D9C0',      // safe / ready
      dark: '#009A89',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF4D6D',      // --color-danger
      dark: '#B8203D',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFD166',      // --color-accent-yellow
      contrastText: '#202238',
    },
    info: {
      main: '#7C5CFF',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8F7FF',   // --color-bg
      paper: '#FFFFFF',     // --color-bg-card
    },
    text: {
      primary: '#202238',   // --color-text-main
      secondary: '#6B6F8A', // --color-text-secondary
    },
    divider: '#E4E7F5',     // --color-border
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, Prompt, Roboto, Arial, sans-serif',
    fontWeightBold: 700,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #E4E7F5',
          borderRadius: 20,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          border: '1px solid #E4E7F5',
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          boxShadow: '0 16px 40px rgba(32, 34, 56, 0.14)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 16,
          minHeight: 44, // DESIGN.md §15 — touch target ≥ 44px
        },
        containedPrimary: {
          boxShadow: '0 8px 24px rgba(124, 92, 255, 0.25)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
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
