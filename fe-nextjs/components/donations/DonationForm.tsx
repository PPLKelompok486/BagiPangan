"use client";

import { useEffect, useMemo, useState } from "react";
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
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export type DonationFormData = {
  title: string;
  description: string;
  location_city: string;
  location_address: string;
  latitude: string;
  longitude: string;
  address_detail: string;
  available_from: string;
  available_until: string;
  portion_count: number | "";
  category_id: string;
};

export type DonationPayload = {
  title: string;
  description: string;
  location_city: string;
  location_address: string;
  latitude: number | null;
  longitude: number | null;
  address_detail: string | null;
  available_from: string;
  available_until: string;
  portion_count: number;
  category_id: number | null;
};

type DonationFormProps = {
  initialData?: Partial<DonationFormData>;
  onSubmit: (payload: DonationPayload) => Promise<void>;
  backHref: string;
  backLabel: string;
  heading: string;
  subheading: string;
  submitLabel: string;
  successTitle: string;
  successMessage: string;
  redirectTo?: string;
  redirectDelayMs?: number;
};

const defaultFormData: DonationFormData = {
  title: "",
  description: "",
  location_city: "",
  location_address: "",
  latitude: "",
  longitude: "",
  address_detail: "",
  available_from: "",
  available_until: "",
  portion_count: "1",
  category_id: "",
};

function buildFormData(initialData?: Partial<DonationFormData>): DonationFormData {
  return {
    ...defaultFormData,
    ...initialData,
  };
}

export default function DonationForm({
  initialData,
  onSubmit,
  backHref,
  backLabel,
  heading,
  subheading,
  submitLabel,
  successTitle,
  successMessage,
  redirectTo,
  redirectDelayMs = 2000,
}: DonationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [formData, setFormData] = useState<DonationFormData>(() => buildFormData(initialData));

  useEffect(() => {
    setFormData(buildFormData(initialData));
  }, [initialData]);

  const redirectTarget = useMemo(() => redirectTo, [redirectTo]);

  useEffect(() => {
    if (!success || !redirectTarget) return;
    const timer = setTimeout(() => router.push(redirectTarget), redirectDelayMs);
    return () => clearTimeout(timer);
  }, [success, redirectTarget, redirectDelayMs, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch<{ data: { id: number; name: string }[] }>(
          "/donations/categories",
        );
        setCategories(res.data);
      } catch {
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

    try {
      const payload: DonationPayload = {
        title: formData.title,
        description: formData.description,
        location_city: formData.location_city,
        location_address: formData.location_address,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        address_detail: formData.address_detail ? formData.address_detail : null,
        available_from: formData.available_from,
        available_until: formData.available_until,
        portion_count: Number(formData.portion_count) || 1,
        category_id: formData.category_id ? Number(formData.category_id) : null,
      };

      await onSubmit(payload);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : "Gagal menyimpan donasi. Periksa kembali data Anda.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
        >
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </motion.div>
        <h1 className="mb-2 text-3xl font-bold text-[var(--brand-950)]">{successTitle}</h1>
        <p className="max-w-md text-[var(--text-mid)]">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <Link
        href={backHref}
        className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)]"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        {backLabel}
      </Link>

      <div className="mb-10">
        <h1 className="bagi-display text-3xl font-bold text-[var(--brand-950)]">{heading}</h1>
        <p className="mt-2 text-[var(--text-mid)]">{subheading}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-8 rounded-[2.5rem] border border-[var(--brand-100)] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10">
          <section className="space-y-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--brand-950)]">
              <FileText className="h-5 w-5 text-[var(--brand-600)]" /> Informasi Dasar
            </h2>

            <div className="space-y-2">
              <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Judul Donasi</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 px-5 py-4 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                placeholder="Contoh: 10 Bungkus Nasi Ayam Bakar"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Kategori</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-mid)]" />
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 py-4 pl-12 pr-5 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Jumlah Porsi</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-mid)]" />
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.portion_count}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        portion_count: e.target.value,
                      });
                    }}
                    className="w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 py-4 pl-12 pr-5 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">
                Deskripsi & Kondisi Makanan
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[120px] w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 px-5 py-4 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                placeholder="Jelaskan kondisi makanan, bahan, atau instruksi penyimpanan..."
              />
            </div>
          </section>

          <hr className="border-[var(--brand-100)]" />

          <section className="space-y-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--brand-950)]">
              <MapPin className="h-5 w-5 text-[var(--brand-600)]" /> Lokasi & Penjemputan
            </h2>

            <div className="space-y-2">
              <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Kota</label>
              <input
                required
                type="text"
                value={formData.location_city}
                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                className="w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 px-5 py-4 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                placeholder="Contoh: Jakarta Selatan"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Alamat Lengkap</label>
              <textarea
                required
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                className="min-h-[80px] w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 px-5 py-4 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                placeholder="Sebutkan jalan, nomor rumah, atau patokan..."
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Detail Patokan</label>
              <input
                type="text"
                value={formData.address_detail}
                onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                className="w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 px-5 py-4 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                placeholder="Contoh: lobi utama, dekat pos satpam"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Latitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  min="-90"
                  max="90"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 px-5 py-4 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                  placeholder="-6.2088000"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Longitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  min="-180"
                  max="180"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 px-5 py-4 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                  placeholder="106.8456000"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Mulai Tersedia</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-mid)]" />
                  <input
                    required
                    type="datetime-local"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                    className="w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 py-4 pl-12 pr-5 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-[var(--brand-900)]">Batas Penjemputan</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-mid)]" />
                  <input
                    required
                    type="datetime-local"
                    value={formData.available_until}
                    onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                    className="w-full rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/30 py-4 pl-12 pr-5 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)]"
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
            className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </motion.div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="group flex w-full items-center justify-center gap-3 rounded-[2rem] bg-[var(--brand-600)] py-5 font-bold text-white shadow-xl shadow-[var(--brand-100)] transition-all hover:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {submitLabel}
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </motion.div>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
