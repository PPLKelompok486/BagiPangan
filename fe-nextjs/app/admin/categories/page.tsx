"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

type CategoryStatus = "active" | "inactive" | "all";

type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  donations_count: number;
  created_at: string;
  updated_at: string;
};

type CategoryResponse = {
  message: string;
  data: {
    data: AdminCategory[];
  };
};

type MutationResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

type CategoryFormState = {
  name: string;
  description: string;
  is_active: boolean;
};

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  is_active: true,
};

const statusOptions: { label: string; value: CategoryStatus }[] = [
  { label: "Aktif", value: "active" },
  { label: "Nonaktif", value: "inactive" },
  { label: "Semua", value: "all" },
];

function getErrorMessage(payload: MutationResponse, fallback: string) {
  const firstError = payload.errors ? Object.values(payload.errors)[0]?.[0] : null;
  return firstError ?? payload.message ?? fallback;
}

async function fetchCategories(search: string, status: CategoryStatus): Promise<CategoryResponse> {
  const params = new URLSearchParams({
    status,
    per_page: "100",
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const res = await fetch(`/api/admin/categories?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await res.json()) as CategoryResponse;
  if (!res.ok) {
    throw new Error(payload.message ?? "Gagal mengambil daftar kategori");
  }

  return payload;
}

export default function ManajemenKategori() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CategoryStatus>("all");
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      setLoading(true);
      setError("");
      try {
        const payload = await fetchCategories(search, status);
        if (!ignore) {
          setCategories(payload.data.data);
        }
      } catch (err) {
        if (!ignore) {
          setCategories([]);
          setError(err instanceof Error ? err.message : "Gagal mengambil daftar kategori");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadCategories();
    }, 200);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [search, status, reloadKey]);

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  function startEdit(category: AdminCategory) {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? "",
      is_active: category.is_active,
    });
    setNotice("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    try {
      const target = editing
        ? `/api/admin/categories/${editing.id}`
        : "/api/admin/categories";
      const res = await fetch(target, {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as MutationResponse;

      if (!res.ok) {
        throw new Error(getErrorMessage(payload, "Kategori gagal disimpan"));
      }

      setNotice(payload.message ?? "Kategori berhasil disimpan");
      resetForm();
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kategori gagal disimpan");
    } finally {
      setSaving(false);
    }
  }

  async function setCategoryActive(category: AdminCategory, isActive: boolean) {
    setBusyId(category.id);
    setError("");
    setNotice("");

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: isActive ? "PATCH" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: isActive ? JSON.stringify({ is_active: true }) : undefined,
      });
      const payload = (await res.json()) as MutationResponse;

      if (!res.ok) {
        throw new Error(getErrorMessage(payload, "Status kategori gagal diperbarui"));
      }

      setNotice(payload.message ?? "Status kategori berhasil diperbarui");
      if (editing?.id === category.id) {
        resetForm();
      }
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status kategori gagal diperbarui");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <section className="rounded-[1.6rem] border border-(--brand-100) bg-white p-6 shadow-(--shadow-card)">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-(--brand-600)">Manajemen</p>
            <h2 className="bagi-display mt-2 text-4xl text-(--brand-900)">Kategori</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-mid)">
              Kelola kategori donasi, tambah kategori baru, dan nonaktifkan kategori tanpa
              menghapus riwayat donasi.
            </p>
          </div>
          <div className="rounded-2xl border border-(--brand-100) bg-(--brand-50) px-4 py-3 text-sm text-(--brand-900)">
            <span className="block text-xs uppercase tracking-[0.12em] text-(--text-mid)">
              Total terlihat
            </span>
            <span className="text-2xl font-semibold">{categories.length}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card)"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-(--brand-900)">
                {editing ? "Edit Kategori" : "Tambah Kategori"}
              </h3>
              <p className="mt-1 text-sm text-(--text-mid)">
                Slug dibuat otomatis dari nama kategori.
              </p>
            </div>
            {editing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--brand-100) text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
                aria-label="Batal edit"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-(--brand-900)">Nama kategori</span>
              <input
                required
                maxLength={255}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-(--brand-100) bg-(--brand-50) px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-(--brand-500)"
                placeholder="Contoh: Frozen Food"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-(--brand-900)">Deskripsi</span>
              <textarea
                maxLength={1000}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="mt-2 min-h-28 w-full rounded-2xl border border-(--brand-100) bg-(--brand-50) px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-(--brand-500)"
                placeholder="Ringkas jenis makanan dalam kategori ini."
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-(--brand-100) bg-(--brand-50) px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-(--brand-900)">Aktif</span>
                <span className="block text-xs text-(--text-mid)">Tampil di form donasi publik</span>
              </span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                className="h-5 w-5 accent-[var(--brand-600)]"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-(--brand-700) px-4 py-3 text-sm font-semibold text-white hover:bg-(--brand-800) disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editing ? "Simpan Perubahan" : "Tambah Kategori"}
            </button>
          </div>
        </form>

        <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card)">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-(--brand-900)">Daftar Kategori</h3>
              <p className="mt-1 text-sm text-(--text-mid)">Cari, edit, aktifkan, atau nonaktifkan kategori.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    status === option.value
                      ? "border-(--brand-700) bg-(--brand-700) text-white"
                      : "border-(--brand-100) bg-(--brand-50) text-(--text-mid) hover:border-(--brand-300)"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </header>

          <div className="mb-4">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-mid)" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-(--brand-100) bg-(--brand-50) py-3 pl-11 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-(--brand-500)"
                placeholder="Cari nama atau deskripsi kategori"
              />
            </label>
          </div>

          {notice ? (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-(--brand-100) bg-(--brand-50) px-4 py-5 text-sm text-(--text-mid)">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat daftar kategori...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-(--text-mid)">
                    <th className="px-3 py-2">Kategori</th>
                    <th className="px-3 py-2">Slug</th>
                    <th className="px-3 py-2">Donasi</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td className="px-3 py-5 text-(--text-mid)" colSpan={5}>
                        Tidak ada kategori yang cocok.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category.id} className="rounded-2xl bg-(--brand-50) text-(--brand-900)">
                        <td className="rounded-l-2xl px-3 py-3">
                          <p className="font-semibold">{category.name}</p>
                          <p className="max-w-xs truncate text-xs text-(--text-mid)">
                            {category.description ?? "Tanpa deskripsi"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-xs text-(--text-mid)">{category.slug}</td>
                        <td className="px-3 py-3">{category.donations_count}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              category.is_active
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            {category.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--brand-100) bg-white text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
                              aria-label={`Edit ${category.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {category.is_active ? (
                              <button
                                type="button"
                                disabled={busyId === category.id}
                                onClick={() => void setCategoryActive(category, false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label={`Nonaktifkan ${category.name}`}
                              >
                                {busyId === category.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === category.id}
                                onClick={() => void setCategoryActive(category, true)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-700 hover:border-green-300 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label={`Aktifkan ${category.name}`}
                              >
                                {busyId === category.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </>
  );
}
