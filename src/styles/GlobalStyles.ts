import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  :root {
    color-scheme: light;
    accent-color: ${({ theme }) => theme.colors.primary};

    /* 일반 CSS에서도 공통 테마 색상을 사용할 수 있습니다. */
    --color-primary: ${({ theme }) => theme.colors.primary};
    --color-primary-hover: ${({ theme }) => theme.colors.primaryHover};
    --color-primary-light: ${({ theme }) => theme.colors.primaryLight};
    --color-background: ${({ theme }) => theme.colors.background};
    --color-surface: ${({ theme }) => theme.colors.surface};
    --color-text: ${({ theme }) => theme.colors.text};
    --color-text-secondary: ${({ theme }) => theme.colors.textSecondary};
    --color-border: ${({ theme }) => theme.colors.border};
  }

  html { scroll-behavior: smooth; scroll-padding-top: 7rem; }

  body {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 0.9375rem;
    line-height: 1.6;
    overflow-wrap: break-word;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    min-height: 100dvh;
  }

  button, a, input, select, textarea { -webkit-tap-highlight-color: transparent; }
  svg { flex-shrink: 0; }

  ::selection {
    background-color: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.text};
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 3px;
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${({ theme }) => theme.colors.text};
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.025em;
    word-break: keep-all;
  }

  h1 {
    font-size: clamp(2rem, 4vw, 3rem);
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }

  button,
  input:is([type='button'], [type='submit'], [type='reset']) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.sm};
    min-height: 2.75rem;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    border: 1px solid transparent;
    border-radius: ${({ theme }) => theme.borderRadius.md};
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
    font-weight: 600;
    line-height: 1.5;
    cursor: pointer;
    transition: background-color 160ms ease, border-color 160ms ease;
  }

  :where(button:hover:not(:disabled), input:is([type='button'], [type='submit'], [type='reset']):hover:not(:disabled)) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }

  :where(button:active:not(:disabled), input:is([type='button'], [type='submit'], [type='reset']):active:not(:disabled)) {
    background-color: ${({ theme }) => theme.colors.primaryActive};
  }

  input:not(
    [type='checkbox'], [type='radio'], [type='range'], [type='color'],
    [type='file'], [type='hidden'], [type='button'], [type='submit'], [type='reset']
  ),
  textarea,
  select {
    min-height: 2.75rem;
    max-width: 100%;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.5;
    transition: border-color 160ms ease;

    &:hover:not(:disabled):not(:focus):not([aria-invalid='true']) {
      border-color: ${({ theme }) => theme.colors.borderHover};
    }

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
    }

    &[aria-invalid='true'] {
      border-color: ${({ theme }) => theme.colors.error};
    }
  }

  input::placeholder,
  textarea::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    opacity: 1;
  }

  button:disabled,
  input:disabled,
  textarea:disabled,
  select:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBackground};
    color: ${({ theme }) => theme.colors.disabledText};
    cursor: not-allowed;
  }

  hr {
    margin-block: ${({ theme }) => theme.spacing.lg};
    border: 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }
`

export default GlobalStyles
