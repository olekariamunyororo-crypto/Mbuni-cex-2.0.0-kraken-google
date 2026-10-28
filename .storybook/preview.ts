import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    backgrounds: {
      default: "mbuni-dark",
      values: [
        { name: "mbuni-dark", value: "oklch(0.16 0.008 250)" },
        { name: "mbuni-card", value: "oklch(0.20 0.008 250)" },
        { name: "light", value: "#ffffff" },
      ],
    },
    docs: {
      theme: undefined,
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Light or dark theme",
      defaultValue: "dark",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "dark", icon: "circlehollow", title: "Dark" },
          { value: "light", icon: "circle", title: "Light" },
        ],
      },
    },
  },
};

export default preview;
