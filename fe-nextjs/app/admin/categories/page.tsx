"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";

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

function getErrorMessage(payload: MutationResponse, fallback: string) {
  const firstError = payload.errors ? Object.values(payload.errors)[0]?.[0] : null;
  return firstError ?? payload.message ?? fallback;
}

async function fetchCategories(status: CategoryStatus): Promise<CategoryResponse> {
  const params = new URLSearchParams({ status, per_page: "100" });
  const res = await fetch(`/api/admin/categories?${params.toString()}`, { cache: "no-store" });
  const payload = (await res.json()) as CategoryResponse;
  if (!res.ok) throw new Error(payload.message ?? "Gagal mengambil daftar kategori");
  return payload;
}

export default function ManajemenKategori() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CategoryStatus>("all");
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
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
        const payload = await fetchCategories(statusFilter);
        if (!ignore) {
          setCategories(payload.data.data);
        }
      } catch (err) {
        if (!ignore) {
          setCategories([]);
          setError(err instanceof Error ? err.message : "Gagal mengambil daftar kategori");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    const timer = window.setTimeout(() => { void loadCategories(); }, 200);
    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [statusFilter, reloadKey]);

  // Client-side name search
  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(false);
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
    setShowForm(true);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setNotice("");
    setError("");
    setShowForm(true);
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
      const target = editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories";
      const res = await fetch(target, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as MutationResponse;

      if (!res.ok) throw new Error(getErrorMessage(payload, "Kategori gagal disimpan"));

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
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: isActive ? JSON.stringify({ is_active: true }) : undefined,
      });
      const payload = (await res.json()) as MutationResponse;

      if (!res.ok) throw new Error(getErrorMessage(payload, "Status kategori gagal diperbarui"));

      setNotice(payload.message ?? "Status kategori berhasil diperbarui");
      if (editing?.id === category.id) resetForm();
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status kategori gagal diperbarui");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<AdminCategory>[] = [
    {
      key: "name",
      header: "Kategori",
      sortable: true,
      sortValue: (c) => c.name,
      render: (c) => (
        <div>
          <p className="font-semibold text-(--brand-900)">{c.name}</p>
          <p className="max-w-xs truncate text-xs text-(--text-mid)">
            {c.description ?? "Tanpa deskripsi"}
          </p>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (c) => <span className="text-xs text-(--text-mid)">{c.slug}</span>,
    },
    {
      key: "donations_count",
      header: "Donasi",
      align: "right",
      sortable: true,
      sortValue: (c) => c.donations_count,
      render: (c) => String(c.donations_count),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <StatusBadge tone={c.is_active ? "success" : "neutral"}>
          {c.is_active ? "Aktif" : "Nonaktif"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => startEdit(c)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--brand-100) bg-white text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
            aria-label={`Edit ${c.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          {c.is_active ? (
            <button
              type="button"
              disabled={busyId === c.id}
              onClick={() => void setCategoryActive(c, false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Nonaktifkan ${c.name}`}
            >
              {busyId === c.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={busyId === c.id}
              onClick={() => void setCategoryActive(c, true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-700 hover:border-green-300 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Aktifkan ${c.name}`}
            >
              {busyId === c.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Manajemen Kategori"
        description="Kelola kategori donasi, tambah kategori baru, dan nonaktifkan kategori tanpa menghapus riwayat donasi."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-(--brand-700) px-4 py-2 text-sm font-semibold text-white hover:bg-(--brand-800)"
          >
            <Plus className="h-4 w-4" />
            Tambah Kategori
          </button>
        }
      />

      {notice && (
        <div className="flex items-center gap-2 rounded-[1.4rem] border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-[1.4rem] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Cari nama kategori…"
        filters={[
          {
            label: "Status",
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as CategoryStatus),
            options: [
              { label: "Semua", value: "all" },
              { label: "Aktif", value: "active" },
              { label: "Nonaktif", value: "inactive" },
            ],
          },
        ]}
      />

      <DataTable<AdminCategory>
        columns={columns}
        data={filtered}
        getRowId={(c) => String(c.id)}
        loading={loading}
        emptyState={
          <EmptyState
            icon={Tags}
            title="Belum ada kategori"
            description="Kategori donasi yang dibuat akan muncul di sini."
          />
        }
      />

      {/* Create / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[1.4rem] border border-(--brand-100) bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-(--brand-900)">
                  {editing ? "Edit Kategori" : "Tambah Kategori"}
                </h3>
                <p className="mt-1 text-sm text-(--text-mid)">Slug dibuat otomatis dari nama kategori.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--brand-100) text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-(--brand-900)">Nama kategori</span>
                <input
                  required
                  maxLength={255}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-(--brand-100) bg-(--brand-50) px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-(--brand-500)"
                  placeholder="Contoh: Frozen Food"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-(--brand-900)">Deskripsi</span>
                <textarea
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-5 w-5 accent-[var(--brand-600)]"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-(--brand-100) px-4 py-2 text-sm font-semibold text-(--brand-700) hover:bg-(--brand-50)"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-(--brand-700) px-4 py-2 text-sm font-semibold text-white hover:bg-(--brand-800) disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editing ? "Simpan Perubahan" : "Tambah Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
