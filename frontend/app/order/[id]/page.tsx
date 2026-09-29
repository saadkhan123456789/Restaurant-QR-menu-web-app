"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  order_status: string;
  notes: string | null;
  created_at: string;
};

function formatPKR(price: number) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

const PAYMENT_STATUS_ICON: Record<string, string> = {
  UNPAID: "🟠",
  PAID: "🟢",
  PENDING: "🟡",
  FAILED: "🔴",
};

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading order...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-700">Order not found.</p>
        <Link
          href="/menu"
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to Menu
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <p className="text-3xl">✅</p>
          <h1 className="mt-2 text-xl font-bold text-gray-900">
            ORDER CONFIRMED
          </h1>
          <p className="mt-1 text-gray-500">Order #{order.id}</p>
          <p className="text-gray-500">Table {order.table_number}</p>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-gray-200 pt-4">
          {order.items.map((item) => (
            <div
              key={item.menu_item_id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-700">
                {item.quantity} × {item.name}
              </span>
              <span className="text-gray-900">
                {formatPKR(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {order.notes && (
          <p className="mt-3 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Notes: </span>
            {order.notes}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {formatPKR(order.total)}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment</span>
            <span className="font-medium text-gray-900">
              {order.payment_method === "PAY_AT_COUNTER"
                ? "💵 Pay at Counter"
                : "💳 Pay Now"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment Status</span>
            <span className="font-medium text-gray-900">
              {PAYMENT_STATUS_ICON[order.payment_status] ?? ""}{" "}
              {order.payment_status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Order Status</span>
            <span className="font-medium text-gray-900">
              {order.order_status}
            </span>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          {order.payment_status === "PAID"
            ? "Your order has been received. Thank you!"
            : "Your order has been received. Please pay at the counter."}
        </p>
      </div>
    </main>
  );
}
