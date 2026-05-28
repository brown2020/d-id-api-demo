import { fixupConfigRules } from "@eslint/compat";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...fixupConfigRules([...coreWebVitals, ...typescript]),
  {
    rules: {
      "@next/next/no-img-element": "off",
      // Pre-existing Firestore/auth/canvas/form effects; not security bugs.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/refs": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "yarn.lock",
      "package-lock.json",
    ],
  },
];

export default config;
