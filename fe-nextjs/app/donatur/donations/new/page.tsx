"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function CreateDonationPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/donatur/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)] mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl border border-dashed border-[var(--brand-300)] bg-white p-10 text-center"
      >
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="bagi-display text-2xl font-semibold text-[var(--brand-950)]">
          Form buat donasi
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-mid)]">
          Form pengisian donasi (judul, jumlah, alamat & jadwal jemput, foto) akan terhubung ke
          endpoint donasi setelah backend siap. Halaman ini sudah disiapkan agar tinggal di-wire
          oleh tim backend.
        </p>
        <Link
          href="/donatur/dashboard"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)]"
        >
          Kembali ke dashboard
        </Link>
      </motion.div>
    </div>
  );
}
