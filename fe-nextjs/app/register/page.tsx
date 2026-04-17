"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, Package, ArrowRight, Eye, EyeOff } from "lucide-react";

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
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: easeOutQuart },
  },
};

const floatVariants = [
  { y: [0, -12, 0], duration: 5.2 },
  { y: [0, -8, 0], duration: 4.6 },
  { y: [0, -10, 0], duration: 5.8 },
];

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

  return (
    <div className="bagi-theme min-h-screen flex items-stretch bg-[var(--cream)]">
      {/* Left Panel */}
      <motion.div
        className="hidden w-1/2 flex-col justify-center items-center bg-[var(--brand-900)] p-12 relative overflow-hidden lg:flex"
        initial={{ opacity: rm ? 1 : 0, x: rm ? 0 : -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={rm ? { duration: 0 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Background blobs */}
        <motion.div
          className="absolute left-[-10%] top-[15%] h-72 w-72 rounded-full bg-[var(--brand-600)] opacity-15 blur-3xl"
          animate={rm ? undefined : { scale: [1, 1.1, 1], x: [0, 20, 0] }}
          transition={rm ? { duration: 0 } : { duration: 12, repeat: Infinity, repeatType: "mirror" }}
        />
        <motion.div
          className="absolute right-[-8%] bottom-[20%] h-64 w-64 rounded-full bg-[var(--lime)] opacity-10 blur-3xl"
          animate={rm ? undefined : { scale: [1, 1.15, 1], y: [0, -15, 0] }}
          transition={rm ? { duration: 0 } : { duration: 10, repeat: Infinity, repeatType: "mirror" }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-md">
          <motion.div
            className="bg-[var(--brand-600)] rounded-2xl w-20 h-20 flex items-center justify-center mb-6 shadow-lg"
            initial={{ scale: rm ? 1 : 0, rotate: rm ? 0 : -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={rm ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <span className="text-white text-3xl font-bold">BP</span>
          </motion.div>

          <motion.h1
            className="text-2xl font-bold mb-2 text-white"
            initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.5, delay: 0.3 }}
          >
            Bagi Pangan
          </motion.h1>

          <motion.p
            className="text-white/60 mb-8 text-center"
            initial={{ opacity: rm ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={rm ? { duration: 0 } : { duration: 0.5, delay: 0.4 }}
          >
            Platform donasi pangan yang lebih tenang, cepat, dan jelas.
          </motion.p>

          <div className="space-y-3 w-full">
            {[
              { text: "Donatur mengunggah makanan, admin memoderasi, penerima melacak status.", icon: "heart" },
              { text: "Frontend Next.js dan backend Laravel berjalan sebagai satu pengalaman.", icon: "code" },
              { text: "Misi sosial dengan dashboard operasional yang rapi dan modern.", icon: "plant" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-2xl p-4 backdrop-blur-sm"
                initial={{ opacity: rm ? 1 : 0, x: rm ? 0 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={rm ? { duration: 0 } : { duration: 0.5, delay: 0.5 + i * 0.1 }}
              >
                <motion.div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-600)] text-white"
                  animate={rm ? undefined : { y: floatVariants[i].y }}
                  transition={rm ? { duration: 0 } : { duration: floatVariants[i].duration, repeat: Infinity, ease: "easeInOut" }}
                >
                  {item.icon === "heart" && <Heart className="h-4 w-4" />}
                  {item.icon === "code" && <span className="text-sm font-bold">&lt;/&gt;</span>}
                  {item.icon === "plant" && <span className="text-lg">🌱</span>}
                </motion.div>
                <span className="text-white/80 text-sm leading-relaxed">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Panel (Form) */}
      <div className="w-full flex flex-col justify-center px-6 sm:px-12 lg:w-1/2 lg:px-20">
        <motion.div
          className="bg-white rounded-3xl shadow-[var(--shadow-soft)] p-8 sm:p-12 w-full max-w-lg mx-auto border border-[var(--brand-100)]"
          initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 30, scale: rm ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={rm ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <motion.div
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              className="text-xs tracking-[0.24em] text-[var(--brand-600)] font-semibold uppercase"
              variants={itemVariants}
            >
              Registrasi
            </motion.span>
            <motion.h2
              className="text-3xl font-bold mt-2 mb-4 text-[var(--brand-950)]"
              variants={itemVariants}
            >
              Siapkan akses Anda
            </motion.h2>

            {/* Progress indicator */}
            <motion.div className="flex items-center gap-2" variants={itemVariants}>
              <motion.span
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--brand-600)] text-white text-sm font-bold shadow-md"
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
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)] text-sm font-bold border border-[var(--brand-100)]">
                2
              </span>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={`mb-4 p-3 rounded-2xl text-sm font-medium ${
                  notification.includes("berhasil")
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]"
                    : "bg-red-50 text-red-700 border border-red-200"
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
          >
            {/* Role selection */}
            <motion.div className="mb-6" variants={itemVariants}>
              <label className="block font-semibold mb-3 text-[var(--brand-950)]">
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
                      className={`relative flex-1 flex flex-col items-start border-2 rounded-2xl p-4 transition-colors ${
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
                        className={`font-bold mt-2 ${isActive ? "text-[var(--brand-600)]" : "text-[var(--brand-950)]"}`}
                      >
                        {role === "donatur" ? "Donatur" : "Penerima"}
                      </span>
                      <span className="text-xs text-[var(--text-mid)] mt-0.5">
                        {role === "donatur"
                          ? "Saya ingin mendonasikan makanan"
                          : "Saya ingin menerima donasi makanan"}
                      </span>

                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[var(--brand-600)] flex items-center justify-center"
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

            {/* Form fields */}
            {[
              { name: "name", label: "Nama lengkap", type: "text", placeholder: "Nama Anda" },
              { name: "email", label: "Email", type: "email", placeholder: "email@contoh.com" },
              { name: "password", label: "Password", type: "password", placeholder: "Password" },
              { name: "password_confirmation", label: "Konfirmasi Password", type: "password", placeholder: "Konfirmasi Password" },
            ].map((field) => (
              <motion.div
                key={field.name}
                className="mb-4"
                variants={itemVariants}
              >
                <label className="block font-semibold mb-2 text-[var(--brand-950)] text-sm">
                  {field.label}
                </label>
                <div className="relative">
                  <motion.input
                    type={
                      field.name === "password"
                        ? showPassword ? "text" : "password"
                        : field.name === "password_confirmation"
                          ? showConfirmPassword ? "text" : "password"
                          : field.type
                    }
                    name={field.name}
                    value={form[field.name as keyof RegisterForm]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className={`w-full border rounded-xl p-3 pr-10 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 focus:outline-none transition-all ${
                      errors[field.name as keyof RegisterErrors]
                        ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-[var(--brand-100)] bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)]"
                    }`}
                    animate={shakeFields.has(field.name) ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                    whileFocus={rm ? undefined : { scale: 1.01 }}
                    transition={{ duration: 0.15 }}
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-mid)] hover:text-[var(--brand-600)] transition-colors"
                      onClick={() =>
                        field.name === "password"
                          ? setShowPassword(!showPassword)
                          : setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {(field.name === "password" ? showPassword : showConfirmPassword) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {errors[field.name as keyof RegisterErrors] && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="text-red-600 text-sm mt-1.5 flex items-center gap-1"
                    >
                      <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                      {errors[field.name as keyof RegisterErrors]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            <motion.div variants={itemVariants} className="mt-6">
              <motion.button
                type="submit"
                className="w-full bg-[var(--brand-600)] text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-[0_12px_30px_rgba(45,122,79,0.2)]"
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
            </motion.div>
          </motion.form>

          <motion.div
            className="mt-6 text-center text-[var(--text-mid)] text-sm"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            Sudah punya akun?{" "}
            <a
              href="/login"
              className="text-[var(--brand-600)] font-semibold hover:underline"
            >
              Masuk di sini
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
