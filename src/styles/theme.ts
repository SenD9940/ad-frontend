const theme = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryActive: '#1e40af',
    primaryLight: '#dbeafe',
    background: '#f5f8ff',
    surface: '#ffffff',
    surfaceMuted: '#eff6ff',
    text: '#172554',
    textSecondary: '#475569',
    textMuted: '#64748b',
    onPrimary: '#ffffff',
    border: '#cbd5e1',
    borderHover: '#94a3b8',
    disabledBackground: '#e2e8f0',
    disabledText: '#64748b',
    success: '#15803d',
    warning: '#b45309',
    error: '#b91c1c',
  },
  fonts: {
    body: "'Pretendard Variable', sans-serif",
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
    sm: '0 2px 8px rgb(30 64 175 / 6%)',
    md: '0 8px 24px rgb(30 64 175 / 10%)',
  },
} as const

export type Theme = typeof theme

export default theme
