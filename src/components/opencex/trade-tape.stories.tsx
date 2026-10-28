import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { TradeTape } from "./trade-tape";
import { useOpenCEX } from "@/lib/opencex/store";

const meta = {
  title: "Mbuni CEX/Trading/TradeTape",
  component: TradeTape,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "mbuni-card" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      const init = useOpenCEX((s) => s.init);
      useEffect(() => {
        init();
        // Wait for the engine to produce some trades, then re-render
        const t = setTimeout(() => init(), 2000);
        return () => clearTimeout(t);
      }, [init]);
      return (
        <div className="h-[500px] w-full max-w-md mx-auto bg-card border border-border rounded-md overflow-hidden">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof TradeTape>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BtcUsdt: Story = {
  args: { pair: "BTC/USDT", limit: 30 },
};

export const EthUsdt: Story = {
  args: { pair: "ETH/USDT", limit: 30 },
};

export const Limited10: Story = {
  args: { pair: "BTC/USDT", limit: 10 },
  render: (args) => <TradeTape {...args} />,
};
