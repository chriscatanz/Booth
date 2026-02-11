import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Disable overly strict React 19 compiler rules
    // These are experimental and require significant refactoring
    rules: {
      // Allow setState in useEffect (common pattern, rule is too strict)
      "react-hooks/set-state-in-effect": "off",
      // Allow impure functions like Math.random during render
      "react-hooks/purity": "off",
      // Allow accessing functions before declaration in useEffect
      "react-hooks/immutability": "off",
      // Allow defining components inside render (common pattern)
      "react-hooks/static-components": "off",
      // Downgrade unused vars to warning
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow any type (with warning)
      "@typescript-eslint/no-explicit-any": "warn",
      // Downgrade unescaped entities to warning
      "react/no-unescaped-entities": "warn",
      // Downgrade img element to warning
      "@next/next/no-img-element": "warn",
    },
  },
]);

export default eslintConfig;
