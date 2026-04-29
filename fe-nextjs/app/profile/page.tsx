"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { User, Mail, Phone, MapPin, Building, Briefcase, ArrowLeft, Loader2, CheckCircle2, Trash2, Edit3, Save, X } from "lucide-react";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  city: string;
  organization: string;
  job: string;
};

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

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

export default function ProfilePage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const rm = reducedMotion ?? false;
  
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    city: "",
    organization: "",
    job: "",
  });
  const [originalForm, setOriginalForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    city: "",
    organization: "",
    job: "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [deleteAvatar, setDeleteAvatar] = useState(false);
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [notification, setNotification] = useState("");
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (res.ok && data.user) {
        setForm({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          city: data.user.city || "",
          organization: data.user.organization || "",
          job: data.user.job || "",
        });
        setOriginalForm({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          city: data.user.city || "",
          organization: data.user.organization || "",
          job: data.user.job || "",
        });
        setAvatarUrl(data.user.avatar || "");
      }
    } catch (error) {
      setNotification("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const validate = (): ProfileErrors => {
    const newErrors: ProfileErrors = {};
    if (!form.name) newErrors.name = "Nama wajib diisi";
    if (!form.email) newErrors.email = "Email wajib diisi";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = "Format email tidak valid";
    if (form.phone && !/^\d+$/.test(form.phone))
      newErrors.phone = "Nomor telepon harus berupa angka";
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name as keyof ProfileErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleEdit = () => {
    console.log('handleEdit called, isEditing:', isEditing);
    setOriginalForm({ ...form });
    setIsEditing(true);
    setErrors({});
    setDeleteAvatar(false);
  };

  const handleCancel = () => {
    setForm({ ...originalForm });
    setIsEditing(false);
    setErrors({});
    setAvatar(null);
    setDeleteAvatar(false);
  };

  const handleSubmit = async () => {
    setNotification("");
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const errorFields = new Set(Object.keys(validationErrors));
      setShakeFields(errorFields);
      setTimeout(() => setShakeFields(new Set()), 600);
      return;
    }

    setSubmitState("loading");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("city", form.city);
      formData.append("organization", form.organization);
      formData.append("job", form.job);
      if (avatar) {
        formData.append("avatar", avatar);
      }
      if (deleteAvatar) {
        formData.append("delete_avatar", "true");
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitState("success");
        setNotification(data.message || "Informasi profil akun berhasil diperbarui.");
        setOriginalForm({ ...form });
        setAvatar(null);
        if (data.user?.avatar) {
          setAvatarUrl(data.user.avatar);
        }
        setIsEditing(false);
        setTimeout(() => setSubmitState("idle"), 2000);
      } else {
        setSubmitState("idle");
        if (res.status === 422 && data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([key, messages]: any) => `${key}: ${Array.isArray(messages) ? messages[0] : messages}`)
            .join(", ");
          setNotification(errorMessages);
        } else {
          setNotification(data.message || data.error || "Gagal memperbarui profil");
        }
      }
    } catch (err) {
      setSubmitState("idle");
      setNotification(`Terjadi kesalahan: ${String(err)}`);
    }
  };

  const handleDelete = async () => {
    setSubmitState("loading");

    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        setNotification(data.message || "Informasi profil akun berhasil dihapus.");
        setTimeout(() => {
          localStorage.removeItem("bagi_token");
          localStorage.removeItem("bagi_user");
          router.push("/login");
        }, 2000);
      } else {
        setSubmitState("idle");
        setNotification(data.message || data.error || "Gagal menghapus profil");
      }
    } catch (err) {
      setSubmitState("idle");
      setNotification(`Terjadi kesalahan: ${String(err)}`);
    }
  };

  if (loading) {
    return (
      <div className="bagi-theme min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-600)]" />
          <span className="text-[var(--brand-950)]">Memuat profil...</span>
        </div>
      </div>
    );
  }

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
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-900)]/85 via-[var(--brand-900)]/70 to-[var(--brand-950)]/95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(204,255,128,0.12),transparent_55%)]" />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-md">
          <motion.div
            className="bg-[var(--brand-600)] rounded-2xl w-20 h-20 flex items-center justify-center mb-6 shadow-lg"
            initial={{ scale: rm ? 1 : 0, rotate: rm ? 0 : -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={rm ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <User className="text-white h-10 w-10" />
          </motion.div>

          <motion.h1
            className="text-2xl font-bold mb-2 text-white"
            initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.5, delay: 0.3 }}
          >
            Profil Akun
          </motion.h1>

          <motion.p
            className="text-white/60 mb-8 text-center"
            initial={{ opacity: rm ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={rm ? { duration: 0 } : { duration: 0.5, delay: 0.4 }}
          >
            Kelola informasi profil Anda di sini.
          </motion.p>
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
              Profil
            </motion.span>
            <motion.h2
              className="text-3xl font-bold mt-2 mb-4 text-[var(--brand-950)]"
              variants={itemVariants}
            >
              Informasi Akun
            </motion.h2>
          </motion.div>

          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={`mb-4 p-3 rounded-2xl text-sm font-medium ${
                  notification.includes("berhasil") || notification.includes("Berhasil")
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {notification}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Avatar */}
            <motion.div className="mb-6 flex flex-col items-center" variants={itemVariants}>
              <div className="relative w-24 h-24 rounded-full bg-[var(--brand-100)] flex items-center justify-center overflow-hidden border-2 border-[var(--brand-200)]">
                {avatarUrl ? (
                  <img
                    src={`${process.env.LARAVEL_API_BASE ?? "http://localhost:8000"}${avatarUrl}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-[var(--brand-600)]" />
                )}
              </div>
              {isEditing && (
                <div className="mt-3 flex gap-2">
                  <label className="text-sm text-[var(--brand-600)] font-semibold cursor-pointer hover:underline">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAvatar(file);
                          setAvatarUrl(URL.createObjectURL(file));
                          setDeleteAvatar(false);
                        }
                      }}
                      className="hidden"
                    />
                    Ganti Foto
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteAvatarConfirm(true)}
                      className="text-sm text-red-600 font-semibold hover:underline"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Form fields */}
            {[
              { name: "name", label: "Nama lengkap", type: "text", icon: User, readonly: false },
              { name: "email", label: "Email", type: "email", icon: Mail, readonly: true },
              { name: "phone", label: "Nomor telepon", type: "text", icon: Phone, readonly: false },
              { name: "city", label: "Kota", type: "text", icon: MapPin, readonly: false },
              { name: "organization", label: "Organisasi", type: "text", icon: Building, readonly: false },
              { name: "job", label: "Pekerjaan", type: "text", icon: Briefcase, readonly: false },
            ].map((field) => (
              <motion.div
                key={field.name}
                className="mb-4"
                variants={itemVariants}
              >
                <label className="block font-semibold mb-2 text-[var(--brand-950)] text-sm">
                  {field.label}
                  {field.readonly && <span className="text-xs text-[var(--text-mid)] font-normal ml-1">(readonly)</span>}
                </label>
                <div className="relative">
                  <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-mid)]/40" />
                  <motion.input
                    type={field.type}
                    name={field.name}
                    value={form[field.name as keyof ProfileForm]}
                    onChange={handleChange}
                    placeholder={field.label}
                    readOnly={!isEditing || field.readonly}
                    className={`w-full border rounded-xl p-3 pl-12 pr-4 text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/50 focus:outline-none transition-all ${
                      errors[field.name as keyof ProfileErrors]
                        ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : field.readonly || !isEditing
                        ? "border-[var(--brand-100)] bg-[var(--brand-50)] text-[var(--text-mid)] cursor-not-allowed"
                        : "border-[var(--brand-100)] bg-white focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-50)]"
                    }`}
                    animate={shakeFields.has(field.name) ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
                <AnimatePresence>
                  {errors[field.name as keyof ProfileErrors] && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="text-red-600 text-sm mt-1.5 flex items-center gap-1"
                    >
                      <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                      {errors[field.name as keyof ProfileErrors]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Role field (readonly) */}
            <motion.div className="mb-6" variants={itemVariants}>
              <label className="block font-semibold mb-2 text-[var(--brand-950)] text-sm">
                Role
                <span className="text-xs text-[var(--text-mid)] font-normal ml-1">(readonly)</span>
              </label>
              <div className="w-full border border-[var(--brand-100)] bg-[var(--brand-50)] rounded-xl p-3 text-[var(--text-mid)] cursor-not-allowed">
                {form.name ? "Donatur" : "Penerima"}
              </div>
            </motion.div>
          </motion.form>

          {/* Action buttons */}
          <motion.div variants={itemVariants} className="flex flex-col gap-3 mt-6">
            {!isEditing ? (
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 bg-[var(--brand-50)] text-[var(--brand-700)] py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-[var(--brand-100)] hover:bg-[var(--brand-100)] transition-colors"
                  whileHover={rm ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={rm ? undefined : { scale: 0.97 }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleEdit}
                  className="flex-1 bg-[var(--brand-600)] text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_12px_30px_rgba(45,122,79,0.2)] hover:bg-[var(--brand-700)] transition-colors"
                  whileHover={rm ? undefined : { scale: 1.02, y: -2, boxShadow: "0 18px 40px rgba(45,122,79,0.28)" }}
                  whileTap={rm ? undefined : { scale: 0.97 }}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profil
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 bg-red-50 text-red-700 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-red-200 hover:bg-red-100 transition-colors"
                  whileHover={rm ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={rm ? undefined : { scale: 0.97 }}
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Profil
                </motion.button>
              </div>
            ) : (
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitState !== "idle"}
                  className="flex-1 bg-[var(--brand-50)] text-[var(--brand-700)] py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-[var(--brand-100)] hover:bg-[var(--brand-100)] transition-colors disabled:opacity-50"
                  whileHover={rm || submitState !== "idle" ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={rm || submitState !== "idle" ? undefined : { scale: 0.97 }}
                >
                  <X className="h-4 w-4" />
                  Batal
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitState !== "idle"}
                  className="flex-1 bg-[var(--brand-600)] text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_12px_30px_rgba(45,122,79,0.2)] disabled:opacity-70"
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
                          <Save className="h-4 w-4" />
                          Simpan Perubahan
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
              </div>
            )}
          </motion.div>
          </motion.div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-[var(--brand-950)] mb-2">
                Hapus Profil?
              </h3>
              <p className="text-[var(--text-mid)] mb-6">
                Tindakan ini akan menghapus akun Anda secara permanen. Anda tidak dapat membatalkan tindakan ini.
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-[var(--brand-50)] text-[var(--brand-700)] py-3 rounded-xl font-bold hover:bg-[var(--brand-100)] transition-colors"
                  whileHover={rm ? undefined : { scale: 1.02 }}
                  whileTap={rm ? undefined : { scale: 0.97 }}
                >
                  Batal
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  disabled={submitState !== "idle"}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                  whileHover={rm || submitState !== "idle" ? undefined : { scale: 1.02 }}
                  whileTap={rm || submitState !== "idle" ? undefined : { scale: 0.97 }}
                >
                  {submitState === "loading" ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Hapus"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete avatar confirmation modal */}
      <AnimatePresence>
        {showDeleteAvatarConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteAvatarConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-[var(--brand-950)] mb-2">
                Hapus Foto Profil?
              </h3>
              <p className="text-[var(--text-mid)] mb-6">
                Apakah Anda yakin ingin menghapus foto profil Anda?
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowDeleteAvatarConfirm(false)}
                  className="flex-1 bg-[var(--brand-50)] text-[var(--brand-700)] py-3 rounded-xl font-bold hover:bg-[var(--brand-100)] transition-colors"
                  whileHover={rm ? undefined : { scale: 1.02 }}
                  whileTap={rm ? undefined : { scale: 0.97 }}
                >
                  Batal
                </motion.button>
                <motion.button
                  onClick={() => {
                    setDeleteAvatar(true);
                    setAvatar(null);
                    setAvatarUrl("");
                    setShowDeleteAvatarConfirm(false);
                  }}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                  whileHover={rm ? undefined : { scale: 1.02 }}
                  whileTap={rm ? undefined : { scale: 0.97 }}
                >
                  Hapus
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
