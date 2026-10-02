"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addToCart, getCartCount, useCartItems } from "@/lib/cart";

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
};

type Category = {
  id: number;
  name: string;
  items: MenuItem[];
};

function formatPKR(price: number) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

function ItemImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-t-xl bg-gray-100 text-4xl">
        🍽️
      </div>
    );
  }

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-t-xl bg-gray-100">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 400px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function MenuContent() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table");
  const cartItems = useCartItems();
  const cartCount = getCartCount(cartItems);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [tableStatus, setTableStatus] = useState<
    "checking" | "valid" | "invalid"
  >("checking");

  useEffect(() => {
    if (!table) return;

    setTableStatus("checking");
    fetch(`/api/tables/${table}`)
      .then((res) => {
        if (!res.ok) throw new Error("invalid table");
        return res.json();
      })
      .then(() => setTableStatus("valid"))
      .catch(() => setTableStatus("invalid"));
  }, [table]);

  useEffect(() => {
    if (!table || tableStatus !== "valid") return;

    fetch(`/api/menu`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [table, tableStatus]);

  if (!table) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-lg text-gray-700">
          Please scan the QR code on your table to view the menu.
        </p>
      </main>
    );
  }

  if (tableStatus === "invalid") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-lg text-gray-700">
          Invalid table. Please scan the QR code on your restaurant table.
        </p>
      </main>
    );
  }

  if (tableStatus === "checking") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white shadow-sm px-4 py-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Restaurant</h1>
          <p className="text-sm text-gray-500">Table {table}</p>
        </div>
        <Link
          href={`/cart?table=${table}`}
          className="flex items-center gap-1 rounded-full bg-gray-900 px-3 py-2 text-sm font-medium text-white"
        >
          🛒 Cart ({cartCount})
        </Link>
      </header>

      {categories.length > 0 && (
        <nav className="sticky top-[60px] z-10 flex gap-2 overflow-x-auto bg-gray-50 px-4 py-2 border-b border-gray-200">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#category-${category.id}`}
              className="whitespace-nowrap rounded-full bg-white border border-gray-300 px-3 py-1 text-sm text-gray-700"
            >
              {category.name}
            </a>
          ))}
        </nav>
      )}

      <div className="px-4 py-4">
        {loading && <p className="text-gray-500">Loading menu...</p>}
        {error && (
          <p className="text-red-600">
            Could not load the menu. Please try again.
          </p>
        )}

        {addedMessage && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {addedMessage}
          </div>
        )}

        {categories.map((category) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="mb-6 scroll-mt-32"
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100"
                >
                  <ItemImage src={item.image} alt={item.name} />

                  <div className="p-3">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {item.description && (
                      <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-semibold text-gray-900">
                        {formatPKR(item.price)}
                      </p>
                      <button
                        onClick={() => {
                          addToCart({
                            menuItemId: item.id,
                            name: item.name,
                            price: item.price,
                          });
                          setAddedMessage(`${item.name} added to cart`);
                          setTimeout(() => setAddedMessage(null), 1200);
                        }}
                        className="flex-shrink-0 rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <MenuContent />
    </Suspense>
  );
}
