"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

const CATEGORIES = [
  { value: 1, label: "Makanan berat" },
  { value: 2, label: "Snack" },
  { value: 3, label: "Minuman" },
];

export default function CreateDonationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    category_id: "",
    description: "",
    portion_count: "",
    available_until: "",
    location_address: "",
    food_photo: null,
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;
    if (name === "food_photo") {
      setForm((f) => ({ ...f, food_photo: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const validate = () => {
    const newErr: any = {};
    if (!form.title) newErr.title = "Wajib diisi";
    if (!form.category_id) newErr.category_id = "Wajib diisi";
    if (!form.description) newErr.description = "Wajib diisi";
    if (!form.portion_count || isNaN(Number(form.portion_count))) newErr.portion_count = "Wajib angka";
    if (!form.available_until) newErr.available_until = "Wajib diisi";
    if (!form.location_address) newErr.location_address = "Wajib diisi";
    return newErr;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrors({});
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setLoading(true);
    const body = new FormData();
    body.append("title", form.title);
    body.append("category_id", form.category_id);
    body.append("description", form.description);
    body.append("portion_count", form.portion_count);
    body.append("available_until", form.available_until);
    body.append("location_address", form.location_address);
    if (form.food_photo) body.append("food_photo", form.food_photo);
    try {
      const token = getToken();
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("/api/donations", {
        method: "POST",
        headers,
        body,
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors(data.errors || { general: data.message || "Gagal menyimpan" });
      } else {
        router.push("/donatur/dashboard?success=1");
      }
    } catch (err) {
      setErrors({ general: "Terjadi kesalahan jaringan" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/donatur/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)] mb-6">
        <ArrowLeft className="h-4 w-4" /> Kembali ke dashboard
      </Link>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl border border-dashed border-[var(--brand-300)] bg-white p-8"
        encType="multipart/form-data"
      >
        <h1 className="bagi-display text-xl font-semibold mb-6 text-[var(--brand-950)]">Buat Donasi Baru</h1>
        {errors.general && <div className="mb-4 text-red-600">{errors.general}</div>}
        <div className="mb-4 text-left">
          <label className="block font-medium mb-1">Nama Produk *</label>
          <input name="title" value={form.title} onChange={handleChange} className="input" />
          {errors.title && <div className="text-red-600 text-xs mt-1">{errors.title}</div>}
        </div>
        <div className="mb-4 text-left">
          <label className="block font-medium mb-1">Kategori *</label>
          <select name="category_id" value={form.category_id} onChange={handleChange} className="input">
            <option value="">Pilih Kategori</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {errors.category_id && <div className="text-red-600 text-xs mt-1">{errors.category_id}</div>}
        </div>
        <div className="mb-4 text-left">
          <label className="block font-medium mb-1">Deskripsi *</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={3} />
          {errors.description && <div className="text-red-600 text-xs mt-1">{errors.description}</div>}
        </div>
        <div className="mb-4 text-left">
          <label className="block font-medium mb-1">Jumlah Porsi *</label>
          <input name="portion_count" type="number" min="1" value={form.portion_count} onChange={handleChange} className="input" />
          {errors.portion_count && <div className="text-red-600 text-xs mt-1">{errors.portion_count}</div>}
        </div>
        <div className="mb-4 text-left">
          <label className="block font-medium mb-1">Tanggal Kedaluwarsa *</label>
          <input name="available_until" type="date" value={form.available_until} onChange={handleChange} className="input" />
          {errors.available_until && <div className="text-red-600 text-xs mt-1">{errors.available_until}</div>}
        </div>
        <div className="mb-4 text-left">
          <label className="block font-medium mb-1">Alamat *</label>
          <textarea name="location_address" value={form.location_address} onChange={handleChange} className="input" rows={2} />
          {errors.location_address && <div className="text-red-600 text-xs mt-1">{errors.location_address}</div>}
        </div>
        <div className="mb-6 text-left">
          <label className="block font-medium mb-1">Foto Makanan (opsional)</label>
          <input name="food_photo" type="file" accept="image/*" ref={fileInputRef} onChange={handleChange} className="input" />
        </div>
        <div className="flex gap-3 mt-8">
          <button type="button" className="btn-secondary" onClick={() => router.push("/donatur/dashboard")}>Batal</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </motion.form>
    </div>
  );
}
