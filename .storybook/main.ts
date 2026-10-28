import type { StorybookConfig } from "@storybook/nextjs";

// Storybook v10 — addons are merged into the core `storybook` package.
// Import them as `storybook/addon-essentials` etc., not `@storybook/addon-essentials`.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
  addons: [
    "storybook/addon-essentials",
    "storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["../public"],
};

export default config;
