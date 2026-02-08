// Brand Colors - mirrors Color extensions in Colors.swift
export const brand = {
  purple: '#A62B9F',
  purpleLight: '#C75BBF',
  purpleDark: '#7A1F75',
  cyan: '#59C8FA',
  cyanLight: '#8EDAFF',
  cyanDark: '#2BA3D4',
  navy: '#092B49',
  navyLight: '#0D4A7A',
  navyDark: '#051A2E',
} as const;

// Semantic colors per theme - mirrors AppColors struct
export const light = {
  background: '#F8F9FA',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F0F2F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  textPrimary: '#1F2328',
  textSecondary: '#656D76',
  textTertiary: '#8C959F',
  textInverse: '#FFFFFF',

  border: '#D0D7DE',
  borderSubtle: '#E8EBED',
  borderStrong: '#AFB8C1',

  primary: brand.purple,
  primaryHover: brand.purpleDark,
  accent: brand.cyan,
  accentHover: brand.cyanDark,

  success: '#1A7F37',
  successBg: '#DAFBE1',
  warning: '#9A6700',
  warningBg: '#FFF8C5',
  error: '#CF222E',
  errorBg: '#FFEBE9',
  info: '#0969DA',
  infoBg: '#DDF4FF',

  sidebarBg: brand.navy,
  sidebarText: '#FFFFFF',
  sidebarTextSecondary: 'rgba(255,255,255,0.7)',
  sidebarHover: 'rgba(255,255,255,0.08)',
  sidebarSelected: 'rgba(255,255,255,0.12)',
  sidebarDivider: 'rgba(89,200,250,0.5)',
} as const;

export const dark = {
  background: '#0D1117',
  backgroundSecondary: '#161B22',
  backgroundTertiary: '#21262D',
  surface: '#1C2128',
  surfaceElevated: '#262C36',

  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textInverse: '#1F2328',

  border: '#30363D',
  borderSubtle: '#21262D',
  borderStrong: '#484F58',

  primary: brand.purple,
  primaryHover: brand.purpleLight,
  accent: brand.cyan,
  accentHover: brand.cyanLight,

  success: '#3FB950',
  successBg: '#1A3D2E',
  warning: '#D29922',
  warningBg: '#3D2E00',
  error: '#F85149',
  errorBg: '#3D1418',
  info: '#58A6FF',
  infoBg: '#0D2D5E',

  sidebarBg: brand.navyDark,
  sidebarText: '#FFFFFF',
  sidebarTextSecondary: 'rgba(255,255,255,0.7)',
  sidebarHover: 'rgba(255,255,255,0.08)',
  sidebarSelected: 'rgba(255,255,255,0.12)',
  sidebarDivider: 'rgba(89,200,250,0.5)',
} as const;

// Status colors
export const statusColors = {
  Planning: '#8250DF',
  Logistics: '#BF8700',
  Ready: '#1A7F37',
  Active: '#0969DA',
  'Post-Show': '#CF222E',
  Closed: '#656D76',
} as const;
