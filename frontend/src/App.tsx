import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, Paper } from '@mui/material';
import HMIAgentInterface from './components/HMIAgentInterface';
import './App.css';

// ✅ Create a modern theme for our HMI Agent
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Professional blue
    },
    secondary: {
      main: '#10b981', // Success green
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '12px 24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          {/* ✅ Header */}
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h1"
              sx={{
                color: 'white',
                mb: 2,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                fontWeight: 800,
              }}
            >
              🤖 HMI AI Agent
            </Typography>
            <Typography
              variant="h3"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 400,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              Transform FDS Documents into Beautiful HMI Designs
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                mt: 2,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Upload your Functional Design Specification (FDS) document and watch our AI agent 
              create professional HMI screen designs automatically.
            </Typography>
          </Box>

          {/* ✅ Main Interface */}
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <HMIAgentInterface />
          </Paper>

          {/* ✅ Footer */}
          <Box textAlign="center" mt={4}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontStyle: 'italic',
              }}
            >
              ------------------------------
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
