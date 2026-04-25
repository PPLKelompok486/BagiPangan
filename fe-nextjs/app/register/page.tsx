"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, Package, ArrowRight, Eye, EyeOff, Check, Clock, UsersRound, Gift } from "lucide-react";
import { AuthSidePanel } from "@/app/_components/auth-side-panel";

const registerBenefits = [
  { icon: Clock, text: "Onboarding dua langkah — selesai dalam < 2 menit." },
  { icon: UsersRound, text: "Langsung terhubung ke komunitas penerima & donatur terdekat." },
  { icon: Gift, text: "Gratis selamanya. Tanpa biaya tersembunyi, tanpa komisi." },
];

type RegisterForm = {
  role: "donatur" | "penerima";
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const easeOutQuart: [number, number, number, number] = [0.16, 1, 0.3, 1];

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutQuart },
  },
};

type PasswordCheck = {
  key: string;
  label: string;
  test: (s: string) => boolean;
};

const passwordChecks: PasswordCheck[] = [
  { key: "length", label: "Minimal 8 karakter", test: (s) => s.length >= 8 },
  { key: "upper", label: "Huruf besar (A-Z)", test: (s) => /[A-Z]/.test(s) },
  { key: "lower", label: "Huruf kecil (a-z)", test: (s) => /[a-z]/.test(s) },
  { key: "number", label: "Angka (0-9)", test: (s) => /\d/.test(s) },
];

function getStrength(password: string): { score: number; label: string; color: string } {
  const score = passwordChecks.reduce((acc, c) => acc + (c.test(password) ? 1 : 0), 0);
  if (!password) return { score: 0, label: "", color: "bg-[var(--brand-100)]" };
  if (score <= 1) return { score, label: "Lemah", color: "bg-red-400" };
  if (score === 2) return { score, label: "Cukup", color: "bg-amber-400" };
  if (score === 3) return { score, label: "Kuat", color: "bg-[var(--brand-400)]" };
  return { score, label: "Sangat kuat", color: "bg-[var(--brand-600)]" };
}

export default function RegisterPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const rm = reducedMotion ?? false;
  const [form, setForm] = useState<RegisterForm>({
    role: "donatur",
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [notification, setNotification] = useState("");
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const strength = useMemo(() => getStrength(form.password), [form.password]);

  const validate = (): RegisterErrors => {
    const newErrors: RegisterErrors = {};
    if (!form.name) newErrors.name = "Nama wajib diisi";
    if (!form.email) newErrors.email = "Email wajib diisi";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = "Format email tidak valid";
    if (!form.password) newErrors.password = "Password wajib diisi";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password))
      newErrors.password =
        "Password minimal 8 karakter, kombinasi huruf besar, kecil, dan angka";
    if (!form.password_confirmation)
      newErrors.password_confirmation = "Konfirmasi password wajib diisi";
    else if (form.password !== form.password_confirmation)
      newErrors.password_confirmation = "Password dan konfirmasi harus sama";
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name as keyof RegisterErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleEmailBlur = () => {
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setErrors((prev) => ({ ...prev, email: "Format email tidak valid" }));
    }
  };

  const handleRoleChange = (role: "donatur" | "penerima") => {
    setForm({ ...form, role });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotification("");
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const errorFields = new Set(Object.keys(validationErrors));
      setShakeFields(errorFields);
      setTimeout(() => setShakeFields(new Set()), 600);
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("registerStep1", JSON.stringify(form));
    }
    router.push("/register/step2");
  };

  const showPasswordHelp = passwordFocused || form.password.length > 0;

  return (
    <div className="bagi-theme flex min-h-screen items-stretch bg-[var(--cream)]">
      <AuthSidePanel
        eyebrow="Mulai Berbagi Hari Ini"
        title="Bergabung dengan jaringan yang menyelamatkan pangan, bukan membuangnya."
        description="Daftar gratis dalam dua langkah singkat. Anda langsung bisa mendonasikan atau menerima makanan dari komunitas di kota Anda."
        benefits={registerBenefits}
        socialProof="800+ donatur & penerima sudah bergabung di 20+ kota"
        imageSrc="/images/auth-register-community.jpg"
      />

      <div className="flex w-full flex-col justify-center px-6 sm:px-12 lg:w-1/2 lg:px-20">
        <motion.div
          className="mx-auto w-full max-w-lg rounded-3xl border border-[var(--brand-100)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-12"
          initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 30, scale: rm ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={rm ? { duration: 0 } : { duration: 0.6, ease: easeOutQuart, delay: 0.1 }}
        >
          <motion.div
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-600)]"
              variants={itemVariants}
            >
              Registrasi — Langkah 1 dari 2
            </motion.span>
            <motion.h2
              className="bagi-display mt-2 mb-4 text-3xl font-semibold text-[var(--brand-950)]"
              variants={itemVariants}
            >
              Siapkan akses Anda
            </motion.h2>

            <motion.div className="flex items-center gap-2" variants={itemVariants}>
              <motion.span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-600)] text-sm font-bold text-white shadow-md"
                animate={rm ? undefined : { scale: [1, 1.1, 1] }}
                transition={rm ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                1
              </motion.span>
              <motion.span
                className="h-px flex-1 bg-[var(--brand-100)]"
                initial={{ scaleX: rm ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={rm ? { duration: 0 } : { duration: 0.8, delay: 0.5 }}
                style={{ transformOrigin: "left" }}
              />
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--brand-100)] bg-[var(--brand-50)] text-sm font-bold text-[var(--brand-600)]">
                2
              </span>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {notification && (
              <motion.div
                key={notification}
                role={notification.includes("berhasil") ? "status" : "alert"}
                aria-live={notification.includes("berhasil") ? "polite" : "assertive"}
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={`mb-4 rounded-2xl p-3 text-sm font-medium ${
                  notification.includes("berhasil")
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
            <motion.div className="mb-6" variants={itemVariants}>
              <label className="mb-3 block font-semibold text-[var(--brand-950)]">
                Pilih peran Anda
              </label>
              <div className="flex gap-3">
                {(["donatur", "penerima"] as const).map((role) => {
                  const isActive = form.role === role;
                  return (
                    <motion.button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`relative flex flex-1 flex-col items-start rounded-2xl border-2 p-4 transition-colors ${
                        isActive
                          ? "border-[var(--brand-600)] bg-[var(--brand-50)]"
                          : "border-[var(--brand-100)] bg-white hover:border-[var(--brand-300)]"
                      }`}
                      whileHover={rm ? undefined : { y: -2 }}
                      whileTap={rm ? undefined : { scale: 0.97 }}
                      animate={
                        isActive && !rm
                          ? { scale: [1, 1.03, 1] }
                          : { scale: 1 }
                      }
                      transition={
                        isActive && !rm
                          ? { duration: 0.4, ease: "easeOut" }
                          : { type: "spring", stiffness: 300, damping: 20 }
                      }
                    >
                      <motion.div
                        animate={
                          isActive && !rm
                            ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }
                            : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.4 }}
                      >
                        {role === "donatur" ? (
                          <Heart
                            className={`h-6 w-6 ${isActive ? "text-[var(--brand-600)]" : "text-[var(--brand-400)]"}`}
                            fill={isActive ? "var(--brand-600)" : "none"}
                          />
                        ) : (
                          <Package
                            className={`h-6 w-6 ${isActive ? "text-[var(--brand-600)]" : "text-[var(--brand-400)]"}`}
                          />
                        )}
                      </motion.div>
                      <span
                        className={`mt-2 font-bold ${isActive ? "text-[var(--brand-600)]" : "text-[var(--brand-950)]"}`}
                      >
                        {role === "donatur" ? "Donatur" : "Penerima"}
                      </span>
                      <span className="mt-0.5 text-xs text-[var(--text-mid)]">
                        {role === "donatur"
                          ? "Saya ingin mendonasikan makanan"
                          : "Saya ingin menerima donasi makanan"}
                      </span>

                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-600)]"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div className="mb-4" variants={itemVariants}>
              <label htmlFor="reg-name" className="mb-2 block text-sm font-semibold text-[var(--brand-950)]">
                Nama lengkap
              </label>
              <motion.input
                id="reg-name"
                type="text"
                name="name"
                autoComplete="name"
                autoCapitalize="words"
                value={form.name}
                onChange={handleChange}
                placeholder="Nama Anda"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "reg-name-error" : undefined}
                className={`w-full rounded-xl border p-3 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 transition-all focus:outline-none ${
                  errors.name
                    ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-[var(--brand-100)] bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)]"
                }`}
                animate={shakeFields.has("name") ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                whileFocus={rm ? undefined : { scale: 1.01 }}
                transition={{ duration: 0.15 }}
              />
              <AnimatePresence>
                {errors.name && (
                  <motion.div
                    id="reg-name-error"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    className="mt-1.5 flex items-center gap-1 text-sm text-red-600"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.name}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div className="mb-4" variants={itemVariants}>
              <label htmlFor="reg-email" className="mb-2 block text-sm font-semibold text-[var(--brand-950)]">
                Email
              </label>
              <motion.input
                id="reg-email"
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
                aria-describedby={errors.email ? "reg-email-error" : undefined}
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
                    id="reg-email-error"
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
              <label htmlFor="reg-password" className="mb-2 block text-sm font-semibold text-[var(--brand-950)]">
                Password
              </label>
              <div className="relative">
                <motion.input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Buat password yang kuat"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={
                    [errors.password ? "reg-password-error" : null, showPasswordHelp ? "reg-password-hint" : null]
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
                {showPasswordHelp && (
                  <motion.div
                    id="reg-password-hint"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-1.5 flex-1 gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            className={`flex-1 rounded-full ${
                              i < strength.score ? strength.color : "bg-[var(--brand-100)]"
                            }`}
                            initial={false}
                            animate={{ scaleX: i < strength.score ? 1 : 0.9 }}
                            transition={{ duration: 0.25, ease: easeOutQuart }}
                            style={{ transformOrigin: "left" }}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <span className="text-xs font-semibold text-[var(--text-mid)]">
                          {strength.label}
                        </span>
                      )}
                    </div>
                    <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {passwordChecks.map((c) => {
                        const ok = c.test(form.password);
                        return (
                          <li
                            key={c.key}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${
                              ok ? "text-[var(--brand-700)]" : "text-[var(--text-mid)]"
                            }`}
                          >
                            <span
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                                ok ? "bg-[var(--brand-600)] text-white" : "bg-[var(--brand-100)]"
                              }`}
                            >
                              {ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                            </span>
                            {c.label}
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {errors.password && (
                  <motion.div
                    id="reg-password-error"
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

            <motion.div className="mb-4" variants={itemVariants}>
              <label htmlFor="reg-password-confirmation" className="mb-2 block text-sm font-semibold text-[var(--brand-950)]">
                Konfirmasi Password
              </label>
              <div className="relative">
                <motion.input
                  id="reg-password-confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirmation"
                  autoComplete="new-password"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Ketik ulang password"
                  aria-invalid={errors.password_confirmation ? true : undefined}
                  aria-describedby={errors.password_confirmation ? "reg-password-confirmation-error" : undefined}
                  className={`w-full rounded-xl border p-3 pr-10 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 transition-all focus:outline-none ${
                    errors.password_confirmation
                      ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-[var(--brand-100)] bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)]"
                  }`}
                  animate={shakeFields.has("password_confirmation") ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                  whileFocus={rm ? undefined : { scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-mid)] transition-colors hover:text-[var(--brand-600)]"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password_confirmation && (
                  <motion.div
                    id="reg-password-confirmation-error"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    className="mt-1.5 flex items-center gap-1 text-sm text-red-600"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.password_confirmation}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-6">
              <motion.button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-600)] py-3.5 text-base font-bold text-white shadow-[0_12px_30px_rgba(45,122,79,0.2)]"
                whileHover={rm ? undefined : { scale: 1.02, y: -2, boxShadow: "0 18px 40px rgba(45,122,79,0.28)" }}
                whileTap={rm ? undefined : { scale: 0.97 }}
              >
                Lanjut
                <motion.span
                  animate={rm ? undefined : { x: [0, 4, 0] }}
                  transition={rm ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </motion.button>

              <p className="mt-3 text-center text-xs text-[var(--text-mid)]">
                Dengan mendaftar, Anda menyetujui{" "}
                <a href="/terms" className="font-semibold text-[var(--brand-600)] hover:underline">
                  Ketentuan
                </a>{" "}
                &{" "}
                <a href="/privacy" className="font-semibold text-[var(--brand-600)] hover:underline">
                  Privasi
                </a>{" "}
                kami.
              </p>
            </motion.div>
          </motion.form>

          <motion.div
            className="mt-6 text-center text-sm text-[var(--text-mid)]"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            Sudah punya akun?{" "}
            <a
              href="/login"
              className="font-semibold text-[var(--brand-600)] hover:underline"
            >
              Masuk di sini
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
