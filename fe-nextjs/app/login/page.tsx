'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';

type FieldErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: FieldErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Masukkan alamat email yang valid.';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi.';
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Login gagal. Periksa kembali data Anda.' });
        return;
      }

      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (err) {
      setErrors({ general: 'Terjadi kesalahan. Coba lagi nanti.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fbf7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] items-center">
          <div className="hidden md:flex flex-col justify-center rounded-[32px] bg-emerald-600/10 p-8 shadow-2xl shadow-emerald-200/70 backdrop-blur-xl">
            <div className="rounded-3xl bg-white/80 p-6 shadow-sm border border-white/80">
              <h2 className="text-3xl font-bold text-emerald-700 mb-4">BAGI PANGAN</h2>
              <p className="text-sm text-slate-600 leading-7">
                Sistem donasi pangan yang membantu donatur dan penerima dengan cara yang mudah, bersih, dan terpercaya.
              </p>
            </div>
            <div className="mt-8 rounded-3xl bg-white/90 p-6 border border-white/90 shadow-sm">
              <p className="text-sm text-slate-600">Dukungan kami fokus pada:</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li>• Proses cepat untuk donatur</li>
                <li>• Status jelas untuk penerima</li>
                <li>• Antarmuka bersih dan responsif</li>
              </ul>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] border border-slate-200">
            <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-emerald-100 opacity-70 blur-2xl"></div>
            <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-orange-100 opacity-80 blur-2xl"></div>
            <div className="relative p-8 sm:p-10">
              <div className="mb-8 text-center">
                <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 shadow-sm">
                  BAGI PANGAN
                </span>
                <h1 className="mt-6 text-3xl font-semibold text-slate-900">Selamat Datang Kembali</h1>
                <p className="mt-3 text-sm text-slate-600 max-w-sm mx-auto">
                  Masuk untuk melanjutkan donasi atau menerima bantuan dengan cepat dan aman.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {errors.general && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errors.general}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <FaEnvelope className="h-4 w-4" />
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contoh@mail.com"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:shadow-sm"
                      />
                    </div>
                    {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <FaLock className="h-4 w-4" />
                      </span>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:shadow-sm"
                      />
                    </div>
                    {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link href="/forgot-password" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
                    Lupa Password?
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Memuat...' : 'Login'}
                  </button>
                </div>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
                Belum punya akun?{' '}
                <Link href="/register" className="font-semibold text-emerald-700 hover:text-emerald-900">
                  Daftar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

