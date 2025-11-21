const colorVar = (token: string) => `var(--color-${token})`
const spaceVar = (token: string) => `var(--space-${token})`
const radiusVar = (token: string) => `var(--radius-${token})`

export const designTokens = {
  colors: {
    primary: {
      50: colorVar('primary-50'),
      100: colorVar('primary-100'),
      200: colorVar('primary-200'),
      300: colorVar('primary-300'),
      400: colorVar('primary-400'),
      500: colorVar('primary-500'),
      600: colorVar('primary-600'),
      700: colorVar('primary-700'),
      800: colorVar('primary-800'),
      900: colorVar('primary-900'),
    },
    accent: {
      50: colorVar('accent-50'),
      100: colorVar('accent-100'),
      200: colorVar('accent-200'),
      300: colorVar('accent-300'),
      400: colorVar('accent-400'),
      500: colorVar('accent-500'),
      600: colorVar('accent-600'),
      700: colorVar('accent-700'),
      800: colorVar('accent-800'),
      900: colorVar('accent-900'),
    },
    gray: {
      50: colorVar('gray-50'),
      100: colorVar('gray-100'),
      200: colorVar('gray-200'),
      300: colorVar('gray-300'),
      400: colorVar('gray-400'),
      500: colorVar('gray-500'),
      600: colorVar('gray-600'),
      700: colorVar('gray-700'),
      800: colorVar('gray-800'),
      900: colorVar('gray-900'),
    },
    surface: {
      base: colorVar('surface'),
      muted: colorVar('surface-muted'),
      elevated: colorVar('surface-elevated'),
      inverse: colorVar('surface-inverse'),
    },
    border: {
      subtle: colorVar('border-subtle'),
      strong: colorVar('border-strong'),
    },
    text: {
      primary: colorVar('text-primary'),
      secondary: colorVar('text-secondary'),
      tertiary: colorVar('text-tertiary'),
      onPrimary: colorVar('on-primary'),
      onSecondary: colorVar('on-secondary'),
    },
    danger: {
      50: colorVar('danger-50'),
      200: colorVar('danger-200'),
      500: colorVar('danger-500'),
      600: colorVar('danger-600'),
    },
    success: {
      50: colorVar('success-50'),
      200: colorVar('success-200'),
      500: colorVar('success-500'),
      600: colorVar('success-600'),
    },
    warning: {
      50: colorVar('warning-50'),
      200: colorVar('warning-200'),
      500: colorVar('warning-500'),
      600: colorVar('warning-600'),
    },
  },
  spacing: {
    xs: spaceVar('xs'),
    sm: spaceVar('sm'),
    md: spaceVar('md'),
    lg: spaceVar('lg'),
    xl: spaceVar('xl'),
    '2xl': spaceVar('2xl'),
    '3xl': spaceVar('3xl'),
  },
  radius: {
    sm: radiusVar('sm'),
    md: radiusVar('md'),
    lg: radiusVar('lg'),
    xl: radiusVar('xl'),
    '2xl': radiusVar('2xl'),
    full: radiusVar('full'),
  },
  shadows: {
    soft: 'var(--shadow-soft)',
    elevated: 'var(--shadow-elevated)',
    outline: 'var(--shadow-outline)',
  },
  gradients: {
    primary: 'var(--gradient-primary)',
    accent: 'var(--gradient-accent)',
  },
} as const

export type DesignTokens = typeof designTokens

