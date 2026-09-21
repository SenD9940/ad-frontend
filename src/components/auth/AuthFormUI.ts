import styled from 'styled-components'

export const Eyebrow = styled.p`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.13em;
  text-transform: uppercase;
`

export const Title = styled.h1`
  margin-top: 0.6rem;
  font-size: clamp(1.75rem, 3vw, 2rem);
  line-height: 1.35;
  letter-spacing: -0.045em;
`

export const Lead = styled.p`
  margin-top: 0.65rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  line-height: 1.8;
  word-break: keep-all;

  strong {
    color: ${({ theme }) => theme.colors.text};
    overflow-wrap: anywhere;
  }
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  margin-top: 2rem;
`

export const FormAlert = styled.p`
  padding: 0.85rem 1rem;
  border: 1px solid #fecaca;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: #fff5f5;
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.85rem;
  line-height: 1.6;
  word-break: keep-all;
`

export const Field = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.45rem;
`

export const LabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`

export const Label = styled.label`
  display: flex;
  min-height: 1.6rem;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  font-weight: 650;
`

export const TogglePassword = styled.button`
  min-height: 1.6rem;
  padding: 0 0.2rem;
  border: 0;
  border-radius: 0.25rem;
  background: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.75rem;
  font-weight: 600;

  &:hover:not(:disabled),
  &:active:not(:disabled) {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`

export const Input = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 3rem;
  font-size: 0.9rem;

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`

export const Hint = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
  line-height: 1.6;
`

export const FieldError = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.8rem;
  line-height: 1.6;
`

export const Submit = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 3rem;
  margin-top: 0.4rem;
  font-size: 0.9rem;
  box-shadow: 0 4px 10px rgb(99 91 255 / 12%);
`

export const SwitchAuth = styled.p`
  margin-top: 1.5rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.82rem;
  line-height: 1.8;
  text-align: center;

  a {
    margin-left: 0.35rem;
    font-weight: 650;
    text-decoration: none;
  }
`
