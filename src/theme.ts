import { createTheme } from '@mui/material/styles';

// Pursuit brand colors
const PURSUIT_BLUE = '#4646EF';
const PURSUIT_BLUE_DARK = '#3838CC';
const PURSUIT_BLUE_LIGHT = '#7575FF';
const PURSUIT_BLUE_LIGHTER = '#DEDEFF';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F5F7FA';
const GRAY_200 = '#E4E7EB';
const GRAY_300 = '#CBD2D9';
const GRAY_400 = '#9AA5B1';
const GRAY_500 = '#7B8794';
const GRAY_600 = '#616E7C';
const GRAY_700 = '#52606D';
const GRAY_800 = '#3E4C59';
const GRAY_900 = '#323F4B';
const BLACK = '#1F2933';

const theme = createTheme({
  palette: {
    primary: {
      main: PURSUIT_BLUE,
      light: PURSUIT_BLUE_LIGHT,
      dark: PURSUIT_BLUE_DARK,
      contrastText: WHITE,
    },
    secondary: {
      main: GRAY_700,
      light: GRAY_500,
      dark: GRAY_900,
      contrastText: WHITE,
    },
    error: {
      main: '#FF4D4F',
    },
    warning: {
      main: '#FAAD14',
    },
    info: {
      main: PURSUIT_BLUE_LIGHT,
    },
    success: {
      main: '#52C41A',
    },
    text: {
      primary: GRAY_900,
      secondary: GRAY_700,
      disabled: GRAY_500,
    },
    background: {
      default: GRAY_100,
      paper: WHITE,
    },
    divider: GRAY_200,
    action: {
      active: PURSUIT_BLUE,
      hover: PURSUIT_BLUE_LIGHTER,
      hoverOpacity: 0.08,
      selected: PURSUIT_BLUE_LIGHTER,
      selectedOpacity: 0.16,
      disabled: GRAY_300,
      disabledBackground: GRAY_200,
      disabledOpacity: 0.38,
      focus: PURSUIT_BLUE_LIGHTER,
      focusOpacity: 0.12,
      activatedOpacity: 0.24,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '8px 16px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(70, 70, 239, 0.15)',
          },
          '&.Mui-disabled': {
            backgroundColor: GRAY_200,
            color: GRAY_400,
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: PURSUIT_BLUE_DARK,
          },
        },
        outlinedPrimary: {
          borderColor: PURSUIT_BLUE,
          '&:hover': {
            backgroundColor: 'rgba(70, 70, 239, 0.04)',
          },
        },
        textPrimary: {
          '&:hover': {
            backgroundColor: 'rgba(70, 70, 239, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.05)',
        },
        elevation4: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
        colorPrimary: {
          backgroundColor: PURSUIT_BLUE,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: PURSUIT_BLUE_LIGHTER,
          color: PURSUIT_BLUE_DARK,
          '&.MuiChip-outlined': {
            borderColor: PURSUIT_BLUE,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: PURSUIT_BLUE,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: PURSUIT_BLUE_LIGHTER,
        },
        barColorPrimary: {
          backgroundColor: PURSUIT_BLUE,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${GRAY_400} ${GRAY_200}`,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: GRAY_200,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: GRAY_400,
            borderRadius: 4,
            '&:hover': {
              backgroundColor: GRAY_500,
            },
          },
        },
      },
    },
  },
});

export default theme; 