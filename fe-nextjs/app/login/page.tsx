"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, Sparkles, Users } from "lucide-react";
import { ApiError, apiFetch, saveAuth, type AuthUser } from "@/lib/api";
import { AuthSidePanel } from "@/app/_components/auth-side-panel";

type LoginForm = { email: string; password: string };
type LoginErrors = Partial<Record<keyof LoginForm, string>>;

const easeOutQuart: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutQuart },
  },
};

const loginBenefits = [
  { icon: Sparkles, text: "Lihat donasi aktif dan klaim terbaru dari dashboard Anda." },
  { icon: ShieldCheck, text: "Riwayat pengambilan lengkap dengan bukti foto." },
  { icon: Users, text: "Lanjutkan percakapan dengan donatur & penerima di kota Anda." },
];

export default function LoginPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const rm = reducedMotion ?? false;

  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [notification, setNotification] = useState("");
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("login.rememberedEmail");
    if (saved) setForm((f) => ({ ...f, email: saved }));
  }, []);

  const validate = (): LoginErrors => {
    const e: LoginErrors = {};
    if (!form.email) e.email = "Email wajib diisi";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Format email tidak valid";
    if (!form.password) e.password = "Password wajib diisi";
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name as keyof LoginErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleEmailBlur = () => {
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setErrors((prev) => ({ ...prev, email: "Format email tidak valid" }));
    }
  };

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLock(e.getModifierState("CapsLock"));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotification("");
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) {
      setShakeFields(new Set(Object.keys(v)));
      setTimeout(() => setShakeFields(new Set()), 600);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ token: string; user: AuthUser }>("/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      saveAuth(res.token, res.user);
      if (typeof window !== "undefined") {
        if (remember) localStorage.setItem("login.rememberedEmail", form.email);
        else localStorage.removeItem("login.rememberedEmail");
      }
      setNotification("Login berhasil, mengalihkan...");
      const dest = res.user.role === "penerima" ? "/receiver/dashboard" : "/";
      setTimeout(() => router.push(dest), 400);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Tidak bisa menghubungi server. Periksa koneksi Anda dan coba lagi.";
      setNotification(msg);
      setShakeFields(new Set(["email", "password"]));
      setTimeout(() => setShakeFields(new Set()), 600);
    } finally {
      setSubmitting(false);
    }
  };

  const isSuccess = notification.includes("berhasil");

  return (
    <div className="bagi-theme flex min-h-screen items-stretch bg-[var(--cream)]">
      <AuthSidePanel
        eyebrow="Selamat Datang Kembali"
        title="Lanjutkan dampak Anda — satu porsi, satu keluarga."
        description="Masuk untuk memantau donasi aktif, melihat klaim terbaru, dan melanjutkan kontribusi di komunitas Anda."
        benefits={loginBenefits}
        socialProof="Telah dipercaya 800+ donatur & penerima di 20+ kota"
        imageSrc="/images/auth-login-hands.jpg"
      />

      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-1/2 lg:px-20">
        <motion.div
          className="mx-auto w-full max-w-lg rounded-3xl border border-[var(--brand-100)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-12"
          initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 30, scale: rm ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={rm ? { duration: 0 } : { duration: 0.6, ease: easeOutQuart, delay: 0.1 }}
        >
          <motion.div className="mb-8" variants={containerVariants} initial="hidden" animate="visible">
            <motion.span
              className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-600)]"
              variants={itemVariants}
            >
              Masuk
            </motion.span>
            <motion.h2
              className="bagi-display mt-2 mb-2 text-3xl font-semibold text-[var(--brand-950)]"
              variants={itemVariants}
            >
              Selamat datang kembali
            </motion.h2>
            <motion.p className="text-sm text-[var(--text-mid)]" variants={itemVariants}>
              Masuk untuk melanjutkan berbagi makanan di komunitas Anda.
            </motion.p>
          </motion.div>

          <AnimatePresence>
            {notification && (
              <motion.div
                key={notification}
                role={isSuccess ? "status" : "alert"}
                aria-live={isSuccess ? "polite" : "assertive"}
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={`mb-4 rounded-2xl p-3 text-sm font-medium ${
                  isSuccess
                    ? "border border-[var(--brand-100)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {notification}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            onSubmit={handleSubmit}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            noValidate
          >
            <motion.div className="mb-4" variants={itemVariants}>
              <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-[var(--brand-950)]">
                Email
              </label>
              <motion.input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                placeholder="email@contoh.com"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className={`w-full rounded-xl border p-3 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 transition-all focus:outline-none ${
                  errors.email
                    ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-[var(--brand-100)] bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)]"
                }`}
                animate={shakeFields.has("email") ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                whileFocus={rm ? undefined : { scale: 1.01 }}
                transition={{ duration: 0.15 }}
              />
              <AnimatePresence>
                {errors.email && (
                  <motion.div
                    id="login-email-error"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    className="mt-1.5 flex items-center gap-1 text-sm text-red-600"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.email}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div className="mb-4" variants={itemVariants}>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-semibold text-[var(--brand-950)]">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)] hover:underline"
                >
                  Lupa password?
                </a>
              </div>
              <div className="relative">
                <motion.input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  onKeyDown={handlePasswordKey}
                  onKeyUp={handlePasswordKey}
                  placeholder="Password Anda"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={
                    [errors.password ? "login-password-error" : null, capsLock ? "login-caps-hint" : null]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  className={`w-full rounded-xl border p-3 pr-10 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 transition-all focus:outline-none ${
                    errors.password
                      ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-[var(--brand-100)] bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)]"
                  }`}
                  animate={shakeFields.has("password") ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                  whileFocus={rm ? undefined : { scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-mid)] transition-colors hover:text-[var(--brand-600)]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {capsLock && (
                  <motion.div
                    id="login-caps-hint"
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Caps Lock aktif
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {errors.password && (
                  <motion.div
                    id="login-password-error"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    className="mt-1.5 flex items-center gap-1 text-sm text-red-600"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.password}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.label
              variants={itemVariants}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--text-mid)] select-none"
            >
              <span className="relative flex h-4 w-4 items-center justify-center">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="peer absolute h-full w-full cursor-pointer appearance-none rounded border border-[var(--brand-300)] bg-white checked:border-[var(--brand-600)] checked:bg-[var(--brand-600)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
                />
                <svg
                  viewBox="0 0 12 12"
                  className="pointer-events-none relative h-2.5 w-2.5 opacity-0 peer-checked:opacity-100"
                  fill="none"
                >
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Ingat email saya di perangkat ini
            </motion.label>

            <motion.div variants={itemVariants} className="mt-6">
              <motion.button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-600)] py-3.5 text-base font-bold text-white shadow-[0_12px_30px_rgba(45,122,79,0.2)] disabled:opacity-60"
                whileHover={rm || submitting ? undefined : { scale: 1.02, y: -2 }}
                whileTap={rm || submitting ? undefined : { scale: 0.97 }}
              >
                {submitting ? (
                  <>
                    <motion.span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--text-mid)]">
                <Lock className="h-3 w-3" />
                Koneksi aman — data Anda tidak dibagikan ke pihak ketiga.
              </div>
            </motion.div>
          </motion.form>

          <motion.div
            className="mt-6 text-center text-sm text-[var(--text-mid)]"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            Belum punya akun?{" "}
            <a href="/register" className="font-semibold text-[var(--brand-600)] hover:underline">
              Daftar di sini
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
