"use client";
import { useMemo } from "react";
import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtQty, fmtDateTime } from "@/lib/opencex/format";
import { Button } from "@/components/ui/Button";
import { CoinIcon } from "@/components/opencex/coin-icon";
import { X } from "lucide-react";
import type { Order } from "@/lib/opencex/types";

const STATUS_COLOR: Record<Order["status"], string> = {
  NEW: "text-blue-400",
  PARTIALLY_FILLED: "text-gold",
  FILLED: "text-primary",
  CANCELLED: "text-secondary",
  REJECTED: "text-danger",
};

export function OpenOrders({ pair }: { pair?: string }) {
  const orders = useOpenCEX((s) => s.orders);
  const cancelOrder = useOpenCEX((s) => s.cancelOrder);
  const pairs = useOpenCEX((s) => s.pairs);

  const sorted = useMemo(() => {
    const filtered = pair ? orders.filter((o) => o.pair === pair) : orders;
    return [...filtered].sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, pair]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
          My Orders <span className="text-secondary/60 normal-case">· {sorted.length}</span>
        </span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="text-secondary border-b border-border">
              <th className="text-left px-3 py-1.5 font-medium">Time</th>
              <th className="text-left px-3 py-1.5 font-medium">Pair</th>
              <th className="text-left px-3 py-1.5 font-medium">Type</th>
              <th className="text-left px-3 py-1.5 font-medium">Side</th>
              <th className="text-right px-3 py-1.5 font-medium">Price</th>
              <th className="text-right px-3 py-1.5 font-medium">Amount</th>
              <th className="text-right px-3 py-1.5 font-medium">Filled</th>
              <th className="text-left px-3 py-1.5 font-medium">Status</th>
              <th className="text-right px-3 py-1.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-secondary">
                  No orders yet. Place an order from the right panel.
                </td>
              </tr>
            )}
            {sorted.map((o) => {
              const p = pairs.find((x) => x.symbol === o.pair);
              return (
                <tr key={o.id} className="border-b border-border/50 hover:bg-elevated/40 tabular">
                  <td className="px-3 py-1.5 text-secondary">{fmtDateTime(o.timestamp)}</td>
                  <td className="px-3 py-1.5 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <CoinIcon asset={o.pair.split("/")[0]} size={14} />
                      {o.pair}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">{o.type}</td>
                  <td className={`px-3 py-1.5 ${o.side === "BUY" ? "text-primary" : "text-danger"}`}>{o.side}</td>
                  <td className="px-3 py-1.5 text-right">{o.price !== null ? fmtPrice(o.price, p?.priceDecimals ?? 2) : "—"}</td>
                  <td className="px-3 py-1.5 text-right">{fmtQty(o.qty, p?.baseDecimals ?? 4)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtQty(o.filledQty, p?.baseDecimals ?? 4)}</td>
                  <td className={`px-3 py-1.5 ${STATUS_COLOR[o.status]}`}>{o.status.replace("_", " ")}</td>
                  <td className="px-3 py-1.5 text-right">
                    {(o.status === "NEW" || o.status === "PARTIALLY_FILLED") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] text-secondary hover:text-danger"
                        onClick={() => cancelOrder(o.id)}
                      >
                        <X className="w-3 h-3 mr-0.5" /> Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
