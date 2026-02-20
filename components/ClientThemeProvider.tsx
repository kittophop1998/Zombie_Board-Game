'use client';

import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ReactNode } from 'react';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',   // blue-500
    },
    secondary: {
      main: '#ef4444',   // red-500
    },
    success: {
      main: '#22c55e',   // green-500
    },
    warning: {
      main: '#eab308',   // yellow-500
    },
    background: {
      default: '#0f172a', // slate-900
      paper: '#1e293b',   // slate-800
    },
    text: {
      primary: '#f1f5f9',   // slate-100
      secondary: '#94a3b8', // slate-400
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #334155', // slate-700
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          border: '1px solid #334155',
          backgroundColor: '#1e293b',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 12,
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
          borderRadius: 8,
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
