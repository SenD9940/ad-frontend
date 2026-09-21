const theme = {
  colors: {
    primary: '#635bff',
    primaryHover: '#5146e5',
    primaryActive: '#4338ca',
    primaryLight: '#eeecff',
    background: '#f7f8fb',
    surface: '#ffffff',
    surfaceMuted: '#f4f4f8',
    text: '#202331',
    textSecondary: '#626879',
    textMuted: '#747b8c',
    onPrimary: '#ffffff',
    border: '#e8e9f0',
    borderHover: '#c9cbd8',
    disabledBackground: '#e2e8f0',
    disabledText: '#64748b',
    success: '#15803d',
    warning: '#b45309',
    error: '#b91c1c',
  },
  fonts: {
    body: "'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  fontSizes: {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.5rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.625rem',
    lg: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 2px 6px rgb(32 35 49 / 3%)',
    md: '0 12px 40px rgb(32 35 49 / 5%)',
  },
} as const

export type Theme = typeof theme

export default theme
