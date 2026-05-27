import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Pre-existing Firestore/auth/canvas effects; not security bugs.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
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

export default eslintConfig;
