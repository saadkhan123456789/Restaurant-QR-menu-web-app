"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAdmin } from "@/lib/auth";

const NAV_LINKS = [
  { label: "Orders", href: "/admin/orders" },
  { label: "Kitchen", href: "/admin/kitchen" },
  { label: "QR Codes", href: "/admin/qr" },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logoutAdmin();
    router.push("/admin/login");
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={handleLogout}
        className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700"
      >
        Logout
      </button>
    </nav>
  );
}
