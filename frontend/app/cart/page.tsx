"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCartTotal,
  getNotes,
  removeFromCart,
  setNotes as saveNotes,
  updateQuantity,
  useCartItems,
} from "@/lib/cart";

function formatPKR(price: number) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

function CartContent() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table");
  const items = useCartItems();
  const total = getCartTotal(items);

  const [notes, setNotesState] = useState("");

  useEffect(() => {
    setNotesState(getNotes());
  }, []);

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

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
        {table && <p className="text-sm text-gray-500">Table {table}</p>}
      </header>

      <div className="px-4 py-4 flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.menuItemId}
            className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-gray-100"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500">
                {formatPKR(item.price)} each
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatPKR(item.price * item.quantity)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateQuantity(item.menuItemId, item.quantity - 1)
                }
                className="h-8 w-8 rounded-full border border-gray-300 text-gray-700"
              >
                −
              </button>
              <span className="w-6 text-center font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  updateQuantity(item.menuItemId, item.quantity + 1)
                }
                className="h-8 w-8 rounded-full border border-gray-300 text-gray-700"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeFromCart(item.menuItemId)}
              className="ml-1 text-sm text-red-600"
              aria-label={`Remove ${item.name}`}
            >
              Remove
            </button>
          </div>
        ))}

        <div className="mt-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Order Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotesState(e.target.value);
              saveNotes(e.target.value);
            }}
            placeholder="e.g. No onions, please"
            rows={2}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-lg font-bold text-gray-900">
            {formatPKR(total)}
          </span>
        </div>
        <Link
          href={`/checkout?table=${table ?? ""}`}
          className="block w-full rounded-full bg-gray-900 py-3 text-center text-sm font-semibold text-white"
        >
          PROCEED TO CHECKOUT
        </Link>
      </div>
    </main>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartContent />
    </Suspense>
  );
}
