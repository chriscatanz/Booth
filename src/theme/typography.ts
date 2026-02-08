// Typography scale - mirrors AppTypography struct
// Values in px; Tailwind utility classes preferred but these serve as reference

export const typography = {
  // Display
  displayLarge: { size: 48, weight: 700 },
  displayMedium: { size: 40, weight: 700 },
  displaySmall: { size: 32, weight: 700 },

  // Title
  titleLarge: { size: 28, weight: 600 },
  titleMedium: { size: 24, weight: 600 },
  titleSmall: { size: 20, weight: 600 },

  // Headline
  headlineLarge: { size: 18, weight: 600 },
  headlineMedium: { size: 16, weight: 600 },
  headlineSmall: { size: 14, weight: 600 },

  // Body
  bodyLarge: { size: 16, weight: 400 },
  bodyMedium: { size: 14, weight: 400 },
  bodySmall: { size: 13, weight: 400 },

  // Label
  labelLarge: { size: 14, weight: 500 },
  labelMedium: { size: 12, weight: 500 },
  labelSmall: { size: 11, weight: 500 },

  // Caption
  captionLarge: { size: 12, weight: 400 },
  captionMedium: { size: 11, weight: 400 },
  captionSmall: { size: 10, weight: 400 },
} as const;
