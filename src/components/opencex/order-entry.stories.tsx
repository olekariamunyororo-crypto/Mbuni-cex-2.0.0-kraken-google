import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { OrderEntry } from "./order-entry";
import { useOpenCEX } from "@/lib/opencex/store";

const meta = {
  title: "Mbuni CEX/Trading/OrderEntry",
  component: OrderEntry,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "mbuni-card" },
  },
  tags: ["autodocs"],
  argTypes: {
    pair: { control: "select", options: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "DOGE/USDT"] },
  },
  decorators: [
    (Story) => {
      const init = useOpenCEX((s) => s.init);
      useEffect(() => {
        init();
      }, [init]);
      return (
        <div className="h-[700px] w-full max-w-sm mx-auto bg-card border border-border rounded-md overflow-hidden">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof OrderEntry>;

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

export const PreSetBuy: Story = {
  name: "Pre-set to BUY (mobile sheet scenario)",
  args: { pair: "BTC/USDT", initialSide: "BUY" },
};

export const PreSetSell: Story = {
  name: "Pre-set to SELL (mobile sheet scenario)",
  args: { pair: "BTC/USDT", initialSide: "SELL" },
};
