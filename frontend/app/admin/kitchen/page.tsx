"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAdmin } from "@/lib/auth";

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

type ViewFilter = "ACTIVE" | "COMPLETED";

function byOldestFirst(a: Order, b: Order) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function KitchenOrderCard({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: (orderId: number, nextStatus: "READY" | "COMPLETED") => void;
}) {
  const isPreparing = order.order_status === "PREPARING";
  const isReady = order.order_status === "READY";

  return (
    <div
      className={`rounded-xl border-4 bg-white p-5 shadow-sm ${
        isReady ? "border-green-500" : "border-amber-400"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-3xl font-extrabold text-gray-900">
          #{order.id}
        </h2>
        <span className="text-2xl font-bold text-gray-700">
          Table {order.table_number}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-3">
        {order.items.map((item) => (
          <div
            key={item.menu_item_id}
            className="text-xl font-medium text-gray-900"
          >
            {item.quantity} × {item.name}
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mt-3 rounded-md bg-yellow-50 p-3">
          <p className="text-sm font-semibold uppercase text-yellow-700">
            Notes
          </p>
          <p className="text-lg text-yellow-900">{order.notes}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
        <span className="text-lg font-semibold text-gray-600">Status</span>
        <span
          className={`text-xl font-bold ${
            isReady ? "text-green-600" : "text-amber-600"
          }`}
        >
          {isReady ? "🟢 READY" : "🔥 PREPARING"}
        </span>
      </div>

      {isPreparing && (
        <button
          onClick={() => onAdvance(order.id, "READY")}
          className="mt-4 w-full rounded-lg bg-amber-500 py-4 text-xl font-bold text-white"
        >
          MARK READY
        </button>
      )}
      {isReady && (
        <button
          onClick={() => onAdvance(order.id, "COMPLETED")}
          className="mt-4 w-full rounded-lg bg-green-600 py-4 text-xl font-bold text-white"
        >
          MARK COMPLETED
        </button>
      )}
    </div>
  );
}

export default function KitchenPage() {
  const authorized = useRequireAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<ViewFilter>("ACTIVE");
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function advanceStatus(orderId: number, nextStatus: "READY" | "COMPLETED") {
    setActionError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_status: nextStatus }),
        }
      );
      if (!res.ok) throw new Error();
      fetchOrders();
    } catch {
      setActionError("Could not update order status.");
    }
  }

  const preparingOrders = orders
    .filter((o) => o.order_status === "PREPARING")
    .sort(byOldestFirst);
  const readyOrders = orders
    .filter((o) => o.order_status === "READY")
    .sort(byOldestFirst);
  const completedOrders = orders
    .filter((o) => o.order_status === "COMPLETED")
    .sort(byOldestFirst)
    .reverse();

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-white shadow-sm px-6 py-5">
        <h1 className="text-3xl font-extrabold text-gray-900">KITCHEN</h1>
      </header>

      <div className="flex gap-2 px-6 py-4">
        {(["ACTIVE", "COMPLETED"] as ViewFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setView(f)}
            className={`rounded-full border px-5 py-2 text-lg font-semibold ${
              view === f
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

      {view === "ACTIVE" ? (
        <div className="px-6">
          <section>
            <h2 className="mb-3 text-xl font-bold text-amber-600">
              🔥 PREPARING
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {preparingOrders.length === 0 && (
                <p className="col-span-full text-gray-500">
                  No orders preparing.
                </p>
              )}
              {preparingOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onAdvance={advanceStatus}
                />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold text-green-600">
              🟢 READY
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {readyOrders.length === 0 && (
                <p className="col-span-full text-gray-500">
                  No orders ready.
                </p>
              )}
              {readyOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onAdvance={advanceStatus}
                />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedOrders.length === 0 && (
              <p className="col-span-full text-gray-500">
                No completed orders yet.
              </p>
            )}
            {completedOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border-4 border-gray-300 bg-white p-5 opacity-75 shadow-sm"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-3xl font-extrabold text-gray-900">
                    #{order.id}
                  </h2>
                  <span className="text-2xl font-bold text-gray-700">
                    Table {order.table_number}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-3">
                  {order.items.map((item) => (
                    <div
                      key={item.menu_item_id}
                      className="text-xl font-medium text-gray-900"
                    >
                      {item.quantity} × {item.name}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-lg font-bold text-gray-500">
                  ✅ COMPLETED
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
