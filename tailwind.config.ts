import { nextui } from "@nextui-org/theme";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/components/popover.js"
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        'pop-up-shadow': '0px 5px 20px rgba(0, 0, 0, 0.20)',
        'left': '-4px 0 10px rgba(0, 0, 0, 0.5)',
        'right': 'rgba(0, 0, 0, 0.20) 20px 0px 10px -20px',
        'bottom': 'rgba(0, 0, 0, 0.20) 0px 20px 10px -20px',
        'drop-shadow': 'rgba(0, 0, 0, 0.20) 0px 4px 8px 0px',
      },
    },
  },
  plugins: [
    nextui()
  ],
};
export default config;
