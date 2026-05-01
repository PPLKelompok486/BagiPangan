"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Heart, 
  CreditCard, 
  Calendar, 
  User, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const PAYMENT_METHODS = [
  { id: "credit_card", label: "Kartu Kredit", icon: CreditCard },
  { id: "bank_transfer", label: "Transfer Bank", icon: CreditCard },
  { id: "gopay", label: "GoPay", icon: CreditCard },
  { id: "shopeepay", label: "ShopeePay", icon: CreditCard },
];

export default function NewFundDonationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    donor_name: "",
    amount: "",
    donation_date: new Date().toISOString().split("T")[0],
    payment_method: "gopay",
    additional_details: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/fund-donations", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setSuccess(true);
      // Wait for success animation then redirect to payment or list
      setTimeout(() => {
        router.push("/donatur/fund-donations");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Gagal membuat donasi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-[var(--brand-950)] mb-2">Terima Kasih!</h1>
        <p className="text-[var(--text-mid)] max-w-md">
          Donasi Anda telah tercatat. Kami akan mengalihkan Anda untuk menyelesaikan pembayaran.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--brand-950)] flex items-center gap-3">
          <Heart className="text-red-500 fill-red-500" />
          Donasi Dana
        </h1>
        <p className="text-[var(--text-mid)] mt-2">
          Bantu kami menjaga keberlangsungan BagiPangan dengan donasi dana operasional.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-[var(--brand-100)] p-8 shadow-sm space-y-6">
          {/* Donor Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--brand-950)] flex items-center gap-2">
              <User className="w-4 h-4" /> Nama Lengkap Donor
            </label>
            <input
              required
              type="text"
              value={formData.donor_name}
              onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--brand-100)] focus:ring-2 focus:ring-[var(--brand-500)] outline-none"
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--brand-950)] flex items-center gap-2">
                Rp Jumlah Donasi
              </label>
              <input
                required
                type="number"
                min="1000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--brand-100)] focus:ring-2 focus:ring-[var(--brand-500)] outline-none"
                placeholder="Min. Rp 1.000"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--brand-950)] flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Tanggal Donasi
              </label>
              <input
                required
                type="date"
                value={formData.donation_date}
                onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--brand-100)] focus:ring-2 focus:ring-[var(--brand-500)] outline-none"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-[var(--brand-950)]">Metode Pembayaran</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: method.id })}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    formData.payment_method === method.id
                      ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)] shadow-sm"
                      : "border-[var(--brand-100)] hover:border-[var(--brand-300)] text-[var(--text-mid)]"
                  }`}
                >
                  <method.icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-semibold">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--brand-950)]">Detail Tambahan (Opsional)</label>
            <textarea
              value={formData.additional_details}
              onChange={(e) => setFormData({ ...formData, additional_details: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--brand-100)] focus:ring-2 focus:ring-[var(--brand-500)] outline-none min-h-[100px]"
              placeholder="Catatan untuk kami..."
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[var(--brand-200)] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Buat Donasi
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
