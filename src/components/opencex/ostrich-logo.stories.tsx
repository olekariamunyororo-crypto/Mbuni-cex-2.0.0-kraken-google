import type { Meta, StoryObj } from "@storybook/react";
import { OstrichLogo } from "./ostrich-logo";

const meta = {
  title: "Mbuni CEX/Brand/OstrichLogo",
  component: OstrichLogo,
  parameters: {
    layout: "centered",
    backgrounds: { default: "mbuni-card" },
  },
  tags: ["autodocs"],
  argTypes: {
    className: { control: "text", description: "Tailwind classes for sizing/coloring" },
    title: { control: "text", description: "Accessibility label" },
  },
  args: {
    className: "w-24 h-24 text-primary",
  },
} satisfies Meta<typeof OstrichLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { className: "w-8 h-8 text-primary" },
};

export const Large: Story = {
  args: { className: "w-40 h-40 text-primary" },
};

export const OnGradientBackground: Story = {
  name: "On brand gradient (as in production)",
  render: () => (
    <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-black overflow-hidden">
      <OstrichLogo className="w-28 h-28" />
    </div>
  ),
};

export const WhiteOnDark: Story = {
  args: { className: "w-32 h-32 text-white" },
  parameters: { backgrounds: { default: "mbuni-dark" } },
};

export const EmeraldOnDark: Story = {
  args: { className: "w-32 h-32 text-primary" },
  parameters: { backgrounds: { default: "mbuni-dark" } },
};

export const RedOnDark: Story = {
  name: "Red (down/sell color)",
  args: { className: "w-32 h-32 text-danger" },
  parameters: { backgrounds: { default: "mbuni-dark" } },
};

export const CustomTitle: Story = {
  args: {
    className: "w-24 h-24 text-primary",
    title: "Mbuni CEX — Spot Cryptocurrency Exchange",
  },
};
