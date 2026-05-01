"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Clock, 
  FileText, 
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function CreateDonationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location_city: "",
    location_address: "",
    available_from: "",
    available_until: "",
    portion_count: 1,
    category_id: "",
  });

  // Fetch categories dynamically
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch<{data: {id: number, name: string}[]}>("/donations/categories");
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
        // Fallback static list just in case, but using real IDs is priority
        setCategories([
          { id: 2, name: "Makanan Siap Saji" },
          { id: 3, name: "Bahan Pokok" },
          { id: 4, name: "Sayur & Buah" },
          { id: 5, name: "Roti & Kue" },
        ]);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("Submitting donation:", formData);

    try {
      const res = await apiFetch("/donations", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setSuccess(true);
      setTimeout(() => router.push("/donatur/dashboard"), 2000);
    } catch (err: any) {
      setError(err.message || "Gagal membuat donasi. Periksa kembali data Anda.");
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
        <h1 className="text-3xl font-bold text-[var(--brand-950)] mb-2">Berhasil!</h1>
        <p className="text-[var(--text-mid)] max-w-md">
          Donasi Anda telah diajukan dan sedang menunggu verifikasi admin. Terima kasih atas kebaikan Anda!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20">
      <Link
        href="/donatur/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)] mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
        Kembali ke Dashboard
      </Link>

      <div className="mb-10">
        <h1 className="bagi-display text-3xl font-bold text-[var(--brand-950)]">Buat Donasi Baru</h1>
        <p className="text-[var(--text-mid)] mt-2">Bagikan kelebihan makanan Anda kepada yang membutuhkan.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-[2.5rem] border border-[var(--brand-100)] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
          
          {/* Basic Info */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-[var(--brand-950)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--brand-600)]" /> Informasi Dasar
            </h2>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--brand-900)] ml-1">Judul Donasi</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[var(--brand-50)]/30 border border-[var(--brand-100)] rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white outline-none transition-all"
                placeholder="Contoh: 10 Bungkus Nasi Ayam Bakar"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--brand-900)] ml-1">Kategori</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-mid)]" />
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-[var(--brand-50)]/30 border border-[var(--brand-100)] rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white outline-none appearance-none transition-all"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--brand-900)] ml-1">Jumlah Porsi</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-mid)]" />
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.portion_count || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ 
                        ...formData, 
                        portion_count: val === "" ? "" : parseInt(val) 
                      });
                    }}
                    className="w-full bg-[var(--brand-50)]/30 border border-[var(--brand-100)] rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--brand-900)] ml-1">Deskripsi & Kondisi Makanan</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[var(--brand-50)]/30 border border-[var(--brand-100)] rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white outline-none transition-all min-h-[120px]"
                placeholder="Jelaskan kondisi makanan, bahan, atau instruksi penyimpanan..."
              />
            </div>
          </section>

          <hr className="border-[var(--brand-100)]" />

          {/* Logistics */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-[var(--brand-950)] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--brand-600)]" /> Lokasi & Penjemputan
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--brand-900)] ml-1">Kota</label>
              <input
                required
                type="text"
                value={formData.location_city}
                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                className="w-full bg-[var(--brand-50)]/30 border border-[var(--brand-100)] rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white outline-none transition-all"
                placeholder="Contoh: Jakarta Selatan"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--brand-900)] ml-1">Alamat Lengkap</label>
              <textarea
                required
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                className="w-full bg-[var(--brand-50)]/30 border border-[var(--brand-100)] rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white outline-none transition-all min-h-[80px]"
                placeholder="Sebutkan jalan, nomor rumah, atau patokan..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--brand-900)] ml-1">Mulai Tersedia</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-mid)]" />
                  <input
                    required
                    type="datetime-local"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                    className="w-full bg-[var(--brand-50)]/30 border border-[var(--brand-100)] rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--brand-900)] ml-1">Batas Penjemputan</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-mid)]" />
                  <input
                    required
                    type="datetime-local"
                    value={formData.available_until}
                    onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                    className="w-full bg-[var(--brand-50)]/30 border border-[var(--brand-100)] rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-[var(--brand-500)] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </motion.div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white py-5 rounded-[2rem] font-bold shadow-xl shadow-[var(--brand-100)] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Kirim Pengajuan Donasi
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </motion.div>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
