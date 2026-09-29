"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAdmin, useRequireAdmin } from "@/lib/auth";

const CARDS = [
  {
    title: "Counter Orders",
    description: "View and manage customer orders",
    buttonLabel: "Open Counter",
    href: "/admin/orders",
  },
  {
    title: "Kitchen",
    description: "Manage food preparation and order status",
    buttonLabel: "Open Kitchen",
    href: "/admin/kitchen",
  },
  {
    title: "QR Codes",
    description: "Generate and print table QR codes",
    buttonLabel: "Manage QR Codes",
    href: "/admin/qr",
  },
];

export default function AdminDashboardPage() {
  const authorized = useRequireAdmin();
  const router = useRouter();

  if (!authorized) return null;

  function handleLogout() {
    logoutAdmin();
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between bg-white shadow-sm px-6 py-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Restaurant Admin
          </h1>
          <p className="text-gray-500">Management Dashboard</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.href}
            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {card.title}
              </h2>
              <p className="mt-2 text-gray-500">{card.description}</p>
            </div>
            <Link
              href={card.href}
              className="mt-6 block rounded-full bg-gray-900 py-3 text-center text-sm font-semibold text-white"
            >
              {card.buttonLabel}
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
