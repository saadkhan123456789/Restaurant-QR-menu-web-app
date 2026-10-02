"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAdmin } from "@/lib/auth";
import AdminNavbar from "@/components/AdminNavbar";

type OrderItem = {
  menu_item_id: number;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  table_number: number;
  items: OrderItem[];
  total: number;
  payment_method: "PAY_NOW" | "PAY_AT_COUNTER";
  payment_status: "PENDING" | "PAID" | "UNPAID" | "FAILED";
  order_status: "PLACED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  created_at: string;
};

const FILTERS = ["ALL", "NEW", "PREPARING", "READY", "COMPLETED"] as const;
type Filter = (typeof FILTERS)[number];

function formatPKR(price: number) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

const PAYMENT_STATUS_ICON: Record<string, string> = {
  UNPAID: "🟠",
  PAID: "🟢",
  PENDING: "🟡",
  FAILED: "🔴",
};

export default function CounterOrdersPage() {
  const authorized = useRequireAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    fetch(`/api/orders`)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (printingId === null) return;
    const timer = setTimeout(() => window.print(), 50);
    const handleAfterPrint = () => setPrintingId(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printingId]);

  async function sendToKitchen(orderId: number) {
    setActionError(null);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_status: "PREPARING" }),
        }
      );
      if (!res.ok) throw new Error();
      fetchOrders();
    } catch {
      setActionError("Could not send order to kitchen.");
    }
  }

  async function markPaid(orderId: number) {
    setActionError(null);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/payment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: "PAID" }),
        }
      );
      if (!res.ok) throw new Error();
      fetchOrders();
    } catch {
      setActionError("Could not mark order as paid.");
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === "ALL") return true;
    if (filter === "NEW") return order.order_status === "PLACED";
    return order.order_status === filter;
  });

  const printingOrder = orders.find((o) => o.id === printingId) ?? null;

  if (!authorized) return null;

  return (
    <>
      <main className="min-h-screen bg-gray-100 pb-10 print:hidden">
        <AdminNavbar />
        <header className="bg-white shadow-sm px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">RESTAURANT</h1>
          <p className="text-gray-500">Counter Orders</p>
        </header>

        <div className="flex flex-wrap gap-2 px-6 py-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                filter === f
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {actionError && (
          <p className="px-6 pb-2 text-sm text-red-600">{actionError}</p>
        )}

        <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.length === 0 && (
            <p className="col-span-full text-gray-500">No orders.</p>
          )}

          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                order.order_status === "PLACED"
                  ? "border-amber-400 ring-2 ring-amber-200"
                  : "border-gray-200"
              }`}
            >
              {order.order_status === "PLACED" && (
                <p className="mb-1 text-xs font-bold uppercase text-amber-600">
                  New Order
                </p>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  #{order.id}
                </h2>
                <span className="text-sm text-gray-500">
                  Table {order.table_number}
                </span>
              </div>

              <div className="mt-2 flex flex-col gap-1 border-t border-gray-100 pt-2">
                {order.items.map((item) => (
                  <div
                    key={item.menu_item_id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      {item.quantity} × {item.name}
                    </span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="mt-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Notes: </span>
                  {order.notes}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">
                  {formatPKR(order.total)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
                <span className="text-gray-600">
                  {order.payment_method === "PAY_AT_COUNTER"
                    ? "💵 Pay at Counter"
                    : "💳 Pay Now"}
                </span>
                <span className="font-medium text-gray-900">
                  {PAYMENT_STATUS_ICON[order.payment_status] ?? ""}{" "}
                  {order.payment_status}
                </span>
              </div>

              <div className="mt-1 text-sm text-gray-600">
                Order Status:{" "}
                <span className="font-medium text-gray-900">
                  {order.order_status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setPrintingId(order.id)}
                  className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700"
                >
                  PRINT
                </button>
                {order.order_status === "PLACED" && (
                  <button
                    onClick={() => sendToKitchen(order.id)}
                    className="rounded-full bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
                  >
                    SEND TO KITCHEN
                  </button>
                )}
                {order.payment_status === "UNPAID" && (
                  <button
                    onClick={() => markPaid(order.id)}
                    className="rounded-full bg-green-600 px-3 py-1.5 text-sm font-medium text-white"
                  >
                    MARK PAID
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {printingOrder && (
        <div className="hidden p-6 print:block">
          <h1 className="text-xl font-bold">RESTAURANT</h1>
          <p className="mt-2">ORDER #{printingOrder.id}</p>
          <p>TABLE {printingOrder.table_number}</p>
          <div className="mt-3">
            {printingOrder.items.map((item) => (
              <p key={item.menu_item_id}>
                {item.quantity} × {item.name}
              </p>
            ))}
          </div>
          <p className="mt-3 font-bold">
            TOTAL: {formatPKR(printingOrder.total)}
          </p>
          <p className="mt-2">
            PAYMENT:{" "}
            {printingOrder.payment_method === "PAY_AT_COUNTER"
              ? "PAY AT COUNTER"
              : "PAY NOW"}
          </p>
          <p>STATUS: {printingOrder.payment_status}</p>
          {printingOrder.notes && (
            <>
              <p className="mt-2">NOTES:</p>
              <p>{printingOrder.notes}</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
