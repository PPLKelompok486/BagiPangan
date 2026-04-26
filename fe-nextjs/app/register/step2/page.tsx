"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, CheckCircle2 } from "lucide-react";

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

export default function RegisterStep2() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const rm = reducedMotion ?? false;
  const [step1, setStep1] = useState<any>(null);
  const [form, setForm] = useState({
    phone: "",
    city: "",
    organization: "",
    job: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [notification, setNotification] = useState("");
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s1 = sessionStorage.getItem("registerStep1");
      if (s1) {
        setStep1(JSON.parse(s1));
      } else {
        router.replace("/register");
      }
    }
  }, [router]);

  const validate = () => {
    const newErrors: any = {};
    if (!form.phone) newErrors.phone = "Nomor telepon wajib diisi";
    else if (!/^\d+$/.test(form.phone))
      newErrors.phone = "Nomor telepon harus berupa angka";
    if (!form.city) newErrors.city = "Kota wajib diisi";
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: undefined });
    }
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

    if (!step1) {
      setNotification("Data step 1 tidak ditemukan. Silakan ulangi registrasi.");
      return;
    }

    setSubmitState("loading");
    const payload = { ...step1, ...form };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitState("success");
        setNotification("Registrasi berhasil! Silakan login.");
        sessionStorage.removeItem("registerStep1");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setSubmitState("idle");
        if (res.status === 422 && data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(
              ([key, messages]: any) =>
                `${key}: ${Array.isArray(messages) ? messages[0] : messages}`,
            )
            .join(", ");
          setNotification(errorMessages);
        } else {
          setNotification(data.message || data.error || "Registrasi gagal");
        }
      }
    } catch (err) {
      setSubmitState("idle");
      setNotification(`Terjadi kesalahan: ${String(err)}`);
    }
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
        {/* Background photo with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            alt="Tangan menyajikan makanan untuk yang membutuhkan"
            src="/images/auth/serving-warmth.jpg"
            className="w-full h-full object-cover opacity-30"
            style={{ objectPosition: "50% 45%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-900)]/85 via-[var(--brand-900)]/70 to-[var(--brand-950)]/95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(204,255,128,0.12),transparent_55%)]" />
        </div>

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
            Satu langkah lagi untuk mulai berbagi.
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

      {/* Right Panel (Form Step 2) */}
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
              Lengkapi data diri Anda
            </motion.h2>

            {/* Progress indicator */}
            <motion.div className="flex items-center gap-2" variants={itemVariants}>
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)] text-sm font-bold border border-[var(--brand-100)]">
                1
              </span>
              <motion.span
                className="h-px flex-1 bg-[var(--brand-600)]"
                initial={{ scaleX: rm ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={rm ? { duration: 0 } : { duration: 0.8, delay: 0.3 }}
                style={{ transformOrigin: "left" }}
              />
              <motion.span
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--brand-600)] text-white text-sm font-bold shadow-md"
                animate={rm ? undefined : { scale: [1, 1.1, 1] }}
                transition={rm ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                2
              </motion.span>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={`mb-4 p-3 rounded-2xl text-sm font-medium ${
                  submitState === "success"
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
            {/* Phone & City row */}
            <motion.div className="mb-4 flex flex-col gap-4 sm:flex-row" variants={itemVariants}>
              <div className="flex-1">
                <label className="block font-semibold mb-2 text-[var(--brand-950)] text-sm">
                  Nomor telepon
                </label>
                <motion.input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className={`w-full border rounded-xl p-3 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 focus:outline-none transition-all ${
                    errors.phone
                      ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-[var(--brand-100)] bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)]"
                  }`}
                  animate={shakeFields.has("phone") ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  whileFocus={rm ? undefined : { scale: 1.01 }}
                />
                <AnimatePresence>
                  {errors.phone && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="text-red-600 text-sm mt-1.5 flex items-center gap-1"
                    >
                      <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                      {errors.phone}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-2 text-[var(--brand-950)] text-sm">
                  Kota
                </label>
                <motion.input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Jakarta"
                  className={`w-full border rounded-xl p-3 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 focus:outline-none transition-all ${
                    errors.city
                      ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-[var(--brand-100)] bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)]"
                  }`}
                  animate={shakeFields.has("city") ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  whileFocus={rm ? undefined : { scale: 1.01 }}
                />
                <AnimatePresence>
                  {errors.city && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="text-red-600 text-sm mt-1.5 flex items-center gap-1"
                    >
                      <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                      {errors.city}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {step1?.role === "donatur" && (
              <motion.div className="mb-4" variants={itemVariants}>
                <label className="block font-semibold mb-2 text-[var(--brand-950)] text-sm">
                  Nama usaha / organisasi{" "}
                  <span className="text-xs text-[var(--text-mid)] font-normal">(Opsional)</span>
                </label>
                <motion.input
                  type="text"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  placeholder="Opsional"
                  className="w-full border border-[var(--brand-100)] rounded-xl p-3 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 focus:outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)] transition-all bg-white"
                  whileFocus={rm ? undefined : { scale: 1.01 }}
                />
              </motion.div>
            )}

            <motion.div className="mb-6" variants={itemVariants}>
              <label className="block font-semibold mb-2 text-[var(--brand-950)] text-sm">
                Pekerjaan{" "}
                <span className="text-xs text-[var(--text-mid)] font-normal">(Opsional)</span>
              </label>
              <motion.input
                type="text"
                name="job"
                value={form.job}
                onChange={handleChange}
                placeholder="Opsional"
                className="w-full border border-[var(--brand-100)] rounded-xl p-3 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 focus:outline-none focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)] transition-all bg-white"
                whileFocus={rm ? undefined : { scale: 1.01 }}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-3">
              <motion.button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-[var(--brand-50)] text-[var(--brand-700)] py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 border border-[var(--brand-100)] hover:bg-[var(--brand-100)] transition-colors"
                whileHover={rm ? undefined : { scale: 1.02, y: -2 }}
                whileTap={rm ? undefined : { scale: 0.97 }}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </motion.button>

              <motion.button
                type="submit"
                disabled={submitState !== "idle"}
                className="flex-1 bg-[var(--brand-600)] text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-[0_12px_30px_rgba(45,122,79,0.2)] disabled:opacity-70"
                whileHover={rm || submitState !== "idle" ? undefined : { scale: 1.02, y: -2, boxShadow: "0 18px 40px rgba(45,122,79,0.28)" }}
                whileTap={rm || submitState !== "idle" ? undefined : { scale: 0.97 }}
              >
                <AnimatePresence mode="wait">
                  {submitState === "idle" && (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      Daftar Sekarang
                    </motion.span>
                  )}
                  {submitState === "loading" && (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </motion.span>
                  )}
                  {submitState === "success" && (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Berhasil!
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
