import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { OrderBook } from "./order-book";
import { useOpenCEX } from "@/lib/opencex/store";

const meta = {
  title: "Mbuni CEX/Trading/OrderBook",
  component: OrderBook,
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
      }, [init]);
      return (
        <div className="h-[600px] w-full max-w-md mx-auto bg-card border border-border rounded-md overflow-hidden">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof OrderBook>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BtcUsdt: Story = {
  args: { pair: "BTC/USDT" },
};

export const EthUsdt: Story = {
  args: { pair: "ETH/USDT" },
};

export const SolUsdt: Story = {
  args: { pair: "SOL/USDT" },
};

export const DogeUsdt: Story = {
  args: { pair: "DOGE/USDT" },
};
