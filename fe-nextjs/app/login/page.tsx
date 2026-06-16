"use client";

import { useState, useEffect, Suspense, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowLeft, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { saveAuth, type AuthUser } from "@/lib/api";

const ROLE_LANDING: Record<AuthUser["role"], string> = {
  penerima: "/receiver/dashboard",
  donatur: "/donatur/dashboard",
  admin: "/admin",
};

type AuthMode = "login" | "reset-step1" | "reset-step2";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bagi-theme min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-600)]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Lockout States
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);

  const resetNotification = () => setNotification({ type: "", message: "" });

  // Handle Lockout Timer
  useEffect(() => {
    if (!lockoutUntil) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
      
      if (remaining === 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        setTimeLeft(0);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutUntil]);

  // Handle Recovery Link Detection (from URL params, e.g. email link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    const tokenParam = params.get("token") || window.location.hash.split("token=")[1]?.split("&")[0];
    const emailParam = params.get("email");

    if ((modeParam === "reset" || tokenParam) && tokenParam) {
      setMode("reset-step2");
      setResetToken(tokenParam);
      if (emailParam) setEmail(emailParam);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetNotification();

    if (lockoutUntil && Date.now() < lockoutUntil) {
      setNotification({
        type: "error",
        message: `Terlalu banyak percobaan. Silakan coba lagi dalam ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}.`,
      });
      return;
    }

    if (!email || !password) {
      setNotification({ type: "error", message: "Email dan password wajib diisi." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.token && data.user) {
        const user = data.user as AuthUser;

        if (user.role === "admin") {
          const adminRes = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!adminRes.ok) {
            const adminData = await adminRes.json().catch(() => null);
            setNotification({
              type: "error",
              message: adminData?.message || "Login admin gagal.",
            });
            return;
          }
        }

        saveAuth(data.token, user);
        setFailedAttempts(0);
        setNotification({ type: "success", message: "Login berhasil! Mengalihkan..." });

        const role = user.role;
        const fromParam = searchParams.get("from");
        const target =
          (fromParam && fromParam.startsWith("/") ? fromParam : null) ??
          ROLE_LANDING[role] ??
          "/";

        setTimeout(() => router.replace(target), 800);
        return;
      }

      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (res.status === 401) {
        if (newAttempts >= 3) {
          setLockoutUntil(Date.now() + 2 * 60 * 1000);
          setNotification({
            type: "error",
            message: "Akun terkunci sementara. Terlalu banyak kesalahan password (3x). Silakan tunggu 2 menit.",
          });
        } else {
          setNotification({
            type: "error",
            message: `Email atau password salah. Sisa percobaan: ${3 - newAttempts}`,
          });
        }
      } else {
        setNotification({
          type: "error",
          message: data.message || data.error || `Login gagal (${res.status})`,
        });
      }
    } catch (err) {
      setNotification({ type: "error", message: `Tidak bisa menghubungi server: ${String(err)}` });
    } finally {
      setLoading(false);
    }
  };

  const handleResetStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    resetNotification();

    if (!email) {
      setNotification({ type: "error", message: "Masukkan email Anda." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        if (data.debug_token) {
          // Local/dev runs only — backend exposes the token directly so we can
          // advance straight to step 2 without an email round-trip.
          setResetToken(data.debug_token);
          setNotification({
            type: "success",
            message: "Verifikasi berhasil! Silakan buat password baru.",
          });
          setMode("reset-step2");
        } else {
          setNotification({
            type: "success",
            message:
              data.message ||
              "Permintaan reset password terkirim. Silakan periksa email Anda untuk melanjutkan.",
          });
        }
      } else {
        setNotification({ type: "error", message: data.message || "Gagal mengirim link reset." });
      }
    } catch {
      setLoading(false);
      setNotification({ type: "error", message: "Terjadi kesalahan koneksi." });
    }
  };

  const handleResetStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    resetNotification();

    if (newPassword !== confirmPassword) {
      setNotification({ type: "error", message: "Konfirmasi password tidak cocok." });
      return;
    }
    
    // Gunakan token dari state (dari step1) atau fallback ke URL params
    const params = new URLSearchParams(window.location.search);
    const token = resetToken || params.get("token") || window.location.hash.split("token=")[1]?.split("&")[0];

    if (!token) {
      setNotification({ type: "error", message: "Token tidak ditemukan. Silakan ulangi proses reset password." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          token, 
          password: newPassword, 
          password_confirmation: confirmPassword 
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setResetToken(null);
        setNotification({ type: "success", message: "Password berhasil diperbarui! Silakan login." });
        setTimeout(() => {
          setMode("login");
          setNewPassword("");
          setConfirmPassword("");
          resetNotification();
        }, 2000);
      } else {
        setNotification({ type: "error", message: data.message || "Gagal memperbarui password." });
      }
    } catch {
      setLoading(false);
      setNotification({ type: "error", message: "Terjadi kesalahan koneksi." });
    }
  };

  return (
    <div className="bagi-theme min-h-screen flex items-stretch bg-[var(--cream)] selection:bg-[var(--lime)] selection:text-[var(--brand-950)]">
      {/* Left Panel */}
      <motion.div
        className="hidden w-1/2 flex-col justify-center items-center bg-[var(--brand-900)] p-12 relative overflow-hidden lg:flex"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 z-0">
          <Image
            alt="Relawan menyalurkan donasi pangan"
            src="/images/auth/helping-community.jpg"
            fill
            sizes="50vw"
            className="object-cover opacity-40 mix-blend-overlay"
            style={{ objectPosition: "50% 40%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-950)] via-[var(--brand-900)]/80 to-[var(--brand-800)]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(204,255,128,0.15),transparent_60%)]" />
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute right-[-10%] top-[10%] h-80 w-80 rounded-full bg-[var(--brand-600)] opacity-20 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], x: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[-5%] bottom-[15%] h-72 w-72 rounded-full bg-[var(--lime)] opacity-15 blur-[90px]"
          animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-md mt-auto mb-auto">
          <motion.div
            className="mb-8 relative group cursor-pointer"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            onClick={() => router.push("/")}
          >
            <div className="absolute inset-0 -m-8 rounded-full bg-[var(--lime)]/10 blur-2xl group-hover:bg-[var(--lime)]/20 transition-all duration-500" />
            <div className="relative bg-[var(--brand-600)] rounded-[2rem] w-24 h-24 flex items-center justify-center shadow-[0_8px_32px_rgba(34,197,94,0.3)] ring-1 ring-white/20 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent">
              <span className="text-[var(--lime)] text-4xl font-serif font-bold italic pr-1">BP</span>
            </div>
          </motion.div>

          <motion.span
            className="text-[10px] tracking-[0.35em] uppercase text-[var(--lime)] font-bold mb-4 px-4 py-1.5 rounded-full border border-[var(--lime)]/30 bg-[var(--lime)]/5 backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Akses Platform
          </motion.span>

          <motion.h1
            className="text-4xl md:text-5xl font-serif text-white mb-4 text-center leading-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Selamat datang <br/><span className="text-[var(--lime)] italic">kembali.</span>
          </motion.h1>

          <motion.p
            className="text-white/70 text-center mb-10 max-w-[85%] text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Lanjutkan misi mengurangi food waste dan berbagi kebaikan hari ini.
          </motion.p>
          
          <div className="grid grid-cols-3 gap-4 w-full px-4">
            {[
              { value: "4.5K+", label: "Porsi tersalur" },
              { value: "320+", label: "Donatur aktif" },
              { value: "12 Kota", label: "Jangkauan" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              >
                <div className="absolute inset-0 bg-white/5 rounded-2xl scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
                <div className="relative p-3">
                  <div className="font-serif text-2xl text-[var(--lime)] font-bold mb-1">{stat.value}</div>
                  <div className="text-[9px] uppercase tracking-widest text-white/50 font-bold">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 mt-auto w-full flex justify-between items-center text-xs text-white/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--lime)]/50" />
            Terverifikasi & Aman
          </div>
          <span>BagiPangan © {new Date().getFullYear()}</span>
        </div>
      </motion.div>

      {/* Right Panel (Form) */}
      <div className="w-full flex flex-col justify-center px-6 sm:px-12 lg:w-1/2 lg:px-20 relative overflow-hidden">
        {/* Subtle background pattern for right panel */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--brand-900) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        <motion.div
          className="relative z-10 w-full max-w-md mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >

          <AnimatePresence mode="wait">
            {/* LOGIN MODE */}
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl shadow-[var(--shadow-soft)] p-8 sm:p-12 w-full border border-[var(--brand-100)]"
              >
                <div className="mb-8 lg:hidden flex justify-center">
                  <div className="bg-[var(--brand-600)] rounded-xl w-12 h-12 flex items-center justify-center shadow-md">
                    <span className="text-[var(--lime)] text-xl font-serif font-bold italic pr-0.5">BP</span>
                  </div>
                </div>

                <div className="mb-10 text-center lg:text-left">
                  <span className="text-xs tracking-[0.24em] text-[var(--brand-600)] font-semibold uppercase">Masuk</span>
                  <h2 className="text-3xl font-bold mt-2 mb-2 text-[var(--brand-950)]">Selamat datang kembali</h2>
                  <p className="text-[var(--text-mid)] text-sm">Masuk untuk melanjutkan sesi Anda</p>
                </div>

                {notification.message && (
                  <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold border flex items-start gap-3 ${
                    notification.type === "success" ? "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]" : "bg-red-50 text-red-600 border-red-200"
                  }`}>
                    {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />}
                    <span>{notification.message}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="block font-semibold text-[var(--brand-950)] text-sm">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-light)] group-focus-within:text-[var(--brand-600)] transition-colors" />
                      <input
                        id="login-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="hello@bagipangan.org"
                        className="w-full bg-white border border-[var(--brand-200)] rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-50)] transition-all text-[var(--brand-950)] placeholder:text-[var(--text-light)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="login-password" className="block font-semibold text-[var(--brand-950)] text-sm">Kata Sandi</label>
                      <button
                        type="button"
                        onClick={() => setMode("reset-step1")}
                        className="text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-800)] hover:underline transition-colors"
                      >
                        Lupa sandi?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-light)] group-focus-within:text-[var(--brand-600)] transition-colors" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-[var(--brand-200)] rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-50)] transition-all text-[var(--brand-950)] placeholder:text-[var(--text-light)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--brand-600)] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !!lockoutUntil}
                    className="w-full bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_8px_20px_rgba(45,122,79,0.2)] hover:shadow-[0_12px_25px_rgba(45,122,79,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-8 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none group"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : lockoutUntil ? (
                      `Terkunci (${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')})`
                    ) : (
                      "Masuk"
                    )}
                    {!loading && !lockoutUntil && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-[var(--brand-100)]">
                  <p className="text-center text-sm text-[var(--text-mid)]">
                    Belum punya akun?{" "}
                    <Link href="/register" className="text-[var(--brand-600)] font-bold hover:underline">
                      Daftar sekarang
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* RESET PASSWORD STEP 1 */}
            {mode === "reset-step1" && (
              <motion.div
                key="reset1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl shadow-[var(--shadow-soft)] p-8 sm:p-12 w-full border border-[var(--brand-100)]"
              >
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="flex items-center gap-2 text-[var(--text-mid)] hover:text-[var(--brand-600)] transition-colors mb-8 text-xs font-bold uppercase tracking-widest"
                >
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </button>

                <div className="mb-10 text-center lg:text-left">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] mb-6 border border-[var(--brand-100)]">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2 text-[var(--brand-950)]">Lupa kata sandi?</h2>
                  <p className="text-[var(--text-mid)] text-sm">Masukkan email yang terdaftar, kami akan mengirimkan tautan reset.</p>
                </div>

                {notification.message && (
                  <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold border flex items-start gap-3 ${
                    notification.type === "success" ? "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]" : "bg-red-50 text-red-600 border-red-200"
                  }`}>
                    {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />}
                    <span>{notification.message}</span>
                  </div>
                )}

                <form onSubmit={handleResetStep1} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="reset-email" className="block font-semibold text-[var(--brand-950)] text-sm">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-light)] group-focus-within:text-[var(--brand-600)] transition-colors" />
                      <input
                        id="reset-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="hello@bagipangan.org"
                        className="w-full bg-white border border-[var(--brand-200)] rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-50)] transition-all text-[var(--brand-950)] placeholder:text-[var(--text-light)]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_8px_20px_rgba(45,122,79,0.2)] hover:shadow-[0_12px_25px_rgba(45,122,79,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-8 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none group"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kirim tautan"}
                    {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </motion.div>
            )}

            {/* RESET PASSWORD STEP 2 */}
            {mode === "reset-step2" && (
              <motion.div
                key="reset2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl shadow-[var(--shadow-soft)] p-8 sm:p-12 w-full border border-[var(--brand-100)]"
              >
                <div className="mb-10 text-center lg:text-left">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] mb-6 border border-[var(--brand-100)]">
                    <Lock className="h-7 w-7" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2 text-[var(--brand-950)]">Kata sandi baru</h2>
                  <p className="text-[var(--text-mid)] text-sm">Silakan buat kata sandi baru untuk akun Anda.</p>
                </div>

                {notification.message && (
                  <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold border flex items-start gap-3 ${
                    notification.type === "success" ? "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]" : "bg-red-50 text-red-600 border-red-200"
                  }`}>
                    {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />}
                    <span>{notification.message}</span>
                  </div>
                )}

                <form onSubmit={handleResetStep2} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="block font-semibold text-[var(--brand-950)] text-sm">Sandi Baru</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-light)] group-focus-within:text-[var(--brand-600)] transition-colors" />
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        name="new-password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-[var(--brand-200)] rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-50)] transition-all text-[var(--brand-950)] placeholder:text-[var(--text-light)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--brand-600)] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="block font-semibold text-[var(--brand-950)] text-sm">Konfirmasi Sandi Baru</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-light)] group-focus-within:text-[var(--brand-600)] transition-colors" />
                      <input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        name="confirm-password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-[var(--brand-200)] rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-50)] transition-all text-[var(--brand-950)] placeholder:text-[var(--text-light)]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_8px_20px_rgba(45,122,79,0.2)] hover:shadow-[0_12px_25px_rgba(45,122,79,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-8 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none group"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Simpan sandi"}
                    {!loading && <CheckCircle2 className="h-5 w-5" />}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
