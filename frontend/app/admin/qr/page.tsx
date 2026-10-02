"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useRequireAdmin } from "@/lib/auth";

type TableQR = {
  tableNumber: number;
  url: string;
  dataUrl: string;
};

export default function QrPage() {
  const authorized = useRequireAdmin();
  const [tables, setTables] = useState<TableQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Prefer an explicitly configured app URL (e.g. a custom domain), but
    // never fall back to a hardcoded localhost in production - derive it
    // from the page's own origin instead, which is always correct for
    // wherever this is actually being served from.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    fetch(`/api/tables`)
      .then((res) => res.json())
      .then(async (data: { table_number: number }[]) => {
        const generated = await Promise.all(
          data.map(async (t) => {
            const url = `${appUrl}/menu?table=${t.table_number}`;
            const dataUrl = await QRCode.toDataURL(url, {
              width: 240,
              margin: 1,
            });
            return { tableNumber: t.table_number, url, dataUrl };
          })
        );
        generated.sort((a, b) => a.tableNumber - b.tableNumber);
        setTables(generated);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-gray-100 pb-10 print:bg-white">
      <header className="flex items-center justify-between bg-white shadow-sm px-6 py-5 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Table QR Codes
          </h1>
          <p className="text-gray-500">
            Print this sheet and place one code per table.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          PRINT
        </button>
      </header>

      <div className="px-6 py-6">
        {loading && <p className="text-gray-500">Generating QR codes...</p>}
        {error && (
          <p className="text-red-600">
            Could not load tables. Is the backend running?
          </p>
        )}

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 print:grid-cols-2">
          {tables.map((t) => (
            <div
              key={t.tableNumber}
              className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm print:break-inside-avoid"
            >
              <p className="text-lg font-bold text-gray-900">
                TABLE {t.tableNumber}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.dataUrl}
                alt={`QR code for table ${t.tableNumber}`}
                className="h-40 w-40"
              />
              <p className="break-all text-xs text-gray-400 print:hidden">
                {t.url}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
