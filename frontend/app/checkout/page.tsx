"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearCart, getCartTotal, getNotes, useCartItems } from "@/lib/cart";

function formatPKR(price: number) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

type PaymentMethod = "PAY_AT_COUNTER" | "PAY_NOW";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const table = searchParams.get("table");
  const items = useCartItems();
  const total = getCartTotal(items);
  const notes = getNotes();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const menuHref = table ? `/menu?table=${table}` : "/menu";

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-gray-700">Your cart is empty.</p>
        <Link
          href={menuHref}
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to Menu
        </Link>
      </main>
    );
  }

  async function handleConfirm() {
    if (selectedMethod !== "PAY_AT_COUNTER" || !table) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_number: Number(table),
            items: items.map((item) => ({
              menu_item_id: item.menuItemId,
              quantity: item.quantity,
            })),
            payment_method: selectedMethod,
            notes: notes || null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Could not place the order. Please try again.");
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/order/${data.id}`);
    } catch {
      setError("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
        {table && <p className="text-sm text-gray-500">Table {table}</p>}
      </header>

      <div className="px-4 py-4">
        <section className="mb-6 rounded-lg bg-white p-4 shadow-sm border border-gray-100">
          <h2 className="mb-3 font-semibold text-gray-900">Order Summary</h2>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.menuItemId}
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
          {notes && (
            <p className="mt-3 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Notes: </span>
              {notes}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {formatPKR(total)}
            </span>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-gray-900">Payment Method</h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSelectedMethod("PAY_AT_COUNTER")}
              className={`rounded-lg border p-4 text-left ${
                selectedMethod === "PAY_AT_COUNTER"
                  ? "border-gray-900 bg-white ring-2 ring-gray-900"
                  : "border-gray-200 bg-white"
              }`}
            >
              <p className="font-medium text-gray-900">💵 Pay at Counter</p>
              <p className="text-sm text-gray-500">
                Pay when you collect your order.
              </p>
            </button>

            <button
              onClick={() => setSelectedMethod("PAY_NOW")}
              className="rounded-lg border border-gray-200 bg-gray-100 p-4 text-left opacity-70"
            >
              <p className="font-medium text-gray-900">
                💳 Pay Now{" "}
                <span className="text-xs font-normal text-gray-500">
                  (Coming Soon)
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Online payment — coming soon.
              </p>
            </button>

            {selectedMethod === "PAY_NOW" && (
              <p className="text-sm text-red-600">
                Online payment is not available yet. Please choose Pay at
                Counter.
              </p>
            )}
          </div>
        </section>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <button
          onClick={handleConfirm}
          disabled={selectedMethod !== "PAY_AT_COUNTER" || submitting}
          className="block w-full rounded-full bg-gray-900 py-3 text-center text-sm font-semibold text-white disabled:opacity-40"
        >
          {submitting ? "Placing Order..." : "CONFIRM ORDER"}
        </button>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
