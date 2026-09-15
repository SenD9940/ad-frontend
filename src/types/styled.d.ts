import 'styled-components'
import type { Theme } from '../styles/theme'

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: Theme['colors']
    fonts: Theme['fonts']
    fontSizes: Theme['fontSizes']
    spacing: Theme['spacing']
    borderRadius: Theme['borderRadius']
    shadows: Theme['shadows']
  }
}
