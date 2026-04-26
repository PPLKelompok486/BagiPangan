"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowLeft, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { saveAuth, type AuthUser } from "@/lib/api";

const ROLE_LANDING: Record<AuthUser["role"], string> = {
  penerima: "/receiver/dashboard",
  donatur: "/donatur/dashboard",
};

type AuthMode = "login" | "reset-step1" | "reset-step2";

export default function LoginPage() {
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

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.token && data.user) {
        saveAuth(data.token, data.user as AuthUser);
        setFailedAttempts(0);
        setNotification({ type: "success", message: "Login berhasil! Mengalihkan..." });

        const role = (data.user as AuthUser).role;
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
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (!email) {
        setNotification({ type: "error", message: "Masukkan email Anda." });
        return;
      }
      setMode("reset-step2");
    }, 1000);
  };

  const handleResetStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    resetNotification();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (newPassword !== confirmPassword) {
        setNotification({ type: "error", message: "Konfirmasi password tidak cocok." });
        return;
      }
      if (newPassword.length < 8) {
        setNotification({ type: "error", message: "Password minimal 8 karakter." });
        return;
      }
      setNotification({ type: "success", message: "Password berhasil diperbarui! Silakan login." });
      setTimeout(() => {
        setMode("login");
        resetNotification();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#111412] text-[#e1e3de] font-sans selection:bg-[#ccff80] selection:text-[#213600]">
      {/* Dynamic Google Fonts Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
        
        :root {
          --brand-primary: #ccff80;
          --brand-primary-container: #a3e635;
          --brand-surface: #111412;
          --brand-on-surface: #e1e3de;
          --brand-on-surface-variant: #c2cab0;
          --font-serif: 'Newsreader', serif;
          --font-sans: 'Plus Jakarta Sans', sans-serif;
        }

        .font-serif { font-family: var(--font-serif); }
        .font-sans { font-family: var(--font-sans); }
      `}</style>

      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 opacity-55">
        <img
          alt="Relawan menyalurkan donasi pangan kepada komunitas"
          src="/images/auth/helping-community.jpg"
          className="w-full h-full object-cover scale-105"
          style={{ objectPosition: "50% 40%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111412]/90 via-[#111412]/70 to-[#111412]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#111412]/50 via-transparent to-[#111412]/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(204,255,128,0.10),transparent_55%)]"></div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center relative z-10 px-6 py-20 w-full max-w-7xl mx-auto">
        <motion.div
          className="w-full max-w-md bg-[#1d201e]/45 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 sm:p-12 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.7)] overflow-hidden relative ring-1 ring-white/5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Accent Glows */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#ccff80] opacity-15 blur-[90px]"></div>
          <div className="absolute -bottom-32 -left-24 w-56 h-56 bg-[#a3e635] opacity-8 blur-[100px]"></div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ccff80]/40 to-transparent"></div>

          <AnimatePresence mode="wait">
            {/* LOGIN MODE */}
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-10">
                  <motion.div
                    className="relative inline-flex items-center justify-center mb-6"
                    whileHover={{ scale: 1.04 }}
                  >
                    <div className="absolute inset-0 -m-6 rounded-full bg-[#ccff80]/15 blur-3xl" aria-hidden />
                    <span className="relative font-serif text-5xl font-semibold text-[#ccff80] tracking-tighter">
                      BagiPangan
                    </span>
                  </motion.div>
                  <h1 className="font-serif text-3xl text-[#e1e3de] mb-2">Selamat datang kembali</h1>
                  <p className="font-sans text-[#c2cab0] text-sm">Lanjutkan misi mengurangi food waste hari ini</p>
                </div>

                {notification.message && (
                  <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold border ${
                    notification.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {notification.message}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#c2cab0] font-bold ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c2cab0]/40 group-focus-within:text-[#ccff80] transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="hello@bagipangan.org"
                        className="w-full bg-[#272b28]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#ccff80]/50 focus:ring-4 focus:ring-[#ccff80]/5 transition-all text-[#e1e3de] placeholder-[#c2cab0]/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#c2cab0] font-bold">Password</label>
                      <button 
                        type="button"
                        onClick={() => setMode("reset-step1")}
                        className="text-[10px] uppercase tracking-[0.2em] text-[#ccff80] font-bold hover:text-white transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c2cab0]/40 group-focus-within:text-[#ccff80] transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#272b28]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-[#ccff80]/50 focus:ring-4 focus:ring-[#ccff80]/5 transition-all text-[#e1e3de] placeholder-[#c2cab0]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c2cab0]/40 hover:text-[#ccff80]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !!lockoutUntil}
                    className="w-full bg-[#ccff80] hover:bg-[#b2f746] text-[#213600] font-bold py-4 rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(163,230,53,0.3)] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : lockoutUntil ? (
                      `Terkunci (${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')})`
                    ) : (
                      "Login"
                    )}
                    {!loading && !lockoutUntil && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {[
                      { value: "4.5K+", label: "Porsi tersalur" },
                      { value: "320+", label: "Donatur aktif" },
                      { value: "12 Kota", label: "Jangkauan" },
                    ].map((stat, i) => (
                      <div
                        key={stat.label}
                        className={`text-center px-1 ${i !== 0 ? "border-l border-white/5" : ""}`}
                      >
                        <div className="font-serif text-xl text-[#ccff80] font-bold leading-none">{stat.value}</div>
                        <div className="text-[9px] uppercase tracking-[0.18em] text-[#c2cab0]/65 font-bold mt-1.5">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#ccff80]/70" />
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#c2cab0]/60 font-bold">
                      Koneksi aman & terenkripsi
                    </span>
                  </div>

                  <p className="text-center text-sm text-[#c2cab0]">
                    Belum punya akun?{" "}
                    <Link href="/register" className="text-[#ccff80] font-bold hover:underline">Daftar di sini</Link>
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
              >
                <button 
                  onClick={() => setMode("login")}
                  className="flex items-center gap-2 text-[#c2cab0] hover:text-[#ccff80] transition-colors mb-10 text-[10px] font-bold uppercase tracking-widest"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </button>

                <div className="text-center mb-10">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#ccff80]/10 text-[#ccff80] mb-6">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h1 className="font-serif text-4xl text-[#e1e3de] mb-2">Reset Password</h1>
                  <p className="font-sans text-[#c2cab0] text-sm leading-relaxed">Enter your email to receive a password reset link.</p>
                </div>

                <form onSubmit={handleResetStep1} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#c2cab0] font-bold ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c2cab0]/40 group-focus-within:text-[#ccff80] transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="hello@bagipangan.org"
                        className="w-full bg-[#272b28]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#ccff80]/50 focus:ring-4 focus:ring-[#ccff80]/5 transition-all text-[#e1e3de]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ccff80] text-[#213600] py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
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
              >
                <div className="text-center mb-10">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#ccff80]/10 text-[#ccff80] mb-6">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h1 className="font-serif text-4xl text-[#e1e3de] mb-2">New Password</h1>
                  <p className="font-sans text-[#c2cab0] text-sm leading-relaxed">Account verified! Create a strong new password.</p>
                </div>

                {notification.message && (
                  <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold border ${
                    notification.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {notification.message}
                  </div>
                )}

                <form onSubmit={handleResetStep2} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#c2cab0] font-bold ml-1">New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c2cab0]/40 group-focus-within:text-[#ccff80] transition-colors" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#272b28]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#ccff80]/50 focus:ring-4 focus:ring-[#ccff80]/5 transition-all text-[#e1e3de]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#c2cab0] font-bold ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c2cab0]/40 group-focus-within:text-[#ccff80] transition-colors" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#272b28]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#ccff80]/50 focus:ring-4 focus:ring-[#ccff80]/5 transition-all text-[#e1e3de]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ccff80] text-[#213600] py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group mt-4"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
                    {!loading && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 mt-auto bg-[#1A3A32]/40 backdrop-blur-md border-t border-white/5 relative z-10 flex flex-col items-center px-8 gap-6">
        <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-7xl gap-6">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#c2cab0]/40 text-center md:text-left">
            © 2024 BagiPangan. Cultivating Community Sustainability.
          </p>
          <div className="flex gap-8">
            {["Privacy Policy", "Terms of Service", "Support"].map((item) => (
              <Link 
                key={item} 
                href="#" 
                className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#c2cab0]/40 hover:text-[#ccff80] transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
