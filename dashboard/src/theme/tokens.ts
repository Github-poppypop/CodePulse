export const themeTokens = {
  colors: {
    // Base
    bg: '#0d1117',
    bgSecondary: '#161b22',
    bgTertiary: '#21262d',
    bgHover: '#30363d',
    bgActive: '#3d444d',

    // Foreground
    fg: '#e6edf3',
    fgMuted: '#8b949e',
    fgSubtle: '#6e7681',

    // Accent
    accent: '#58a6ff',
    accentHover: '#79b8ff',
    accentMuted: '#1f3a5f',
    accentFg: '#0d1117',

    // Semantic
    success: '#3fb950',
    successHover: '#56d364',
    successMuted: '#163d22',
    warning: '#d29922',
    warningHover: '#e3b341',
    warningMuted: '#3d3311',
    error: '#f85149',
    errorHover: '#ff7b72',
    errorMuted: '#491e1d',

    // Border
    border: '#30363d',
    borderHover: '#484f58',
    borderActive: '#8b949e',

    // Overlay
    overlay: 'rgba(13, 17, 23, 0.8)',
    overlayDark: 'rgba(13, 17, 23, 0.95)',

    // Code/Terminal
    codeBg: '#0d1117',
    codeFg: '#e6edf3',
    codeComment: '#8b949e',
    codeKeyword: '#ff7b72',
    codeString: '#a5d6ff',
    codeNumber: '#79c0ff',
    codeFunction: '#d2a8ff',
  },

  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },

  typography: {
    fontFamilies: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  radii: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    focus: '0 0 0 3px rgba(88, 166, 255, 0.4)',
  },

  transitions: {
    fast: '100ms ease',
    normal: '150ms ease',
    slow: '250ms ease',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndices: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1300,
    popover: 1400,
    toast: 1500,
    tooltip: 1600,
  },
} as const;

export type ThemeTokens = typeof themeTokens;
export type ColorToken = keyof typeof themeTokens.colors;
export type SpacingToken = keyof typeof themeTokens.spacing;
export type RadiusToken = keyof typeof themeTokens.radii;
export type ShadowToken = keyof typeof themeTokens.shadows;