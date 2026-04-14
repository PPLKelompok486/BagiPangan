"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaHeart, FaBox } from "react-icons/fa";


type RegisterForm = {
  role: "donatur" | "penerima";
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};


type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    role: "donatur",
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [notification, setNotification] = useState("");

  const validate = (): RegisterErrors => {
    const newErrors: RegisterErrors = {};
    if (!form.name) newErrors.name = "Nama wajib diisi";
    if (!form.email) newErrors.email = "Email wajib diisi";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Format email tidak valid";
    if (!form.password) newErrors.password = "Password wajib diisi";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) newErrors.password = "Password minimal 8 karakter, kombinasi huruf besar, kecil, dan angka";
    if (!form.password_confirmation) newErrors.password_confirmation = "Konfirmasi password wajib diisi";
    else if (form.password !== form.password_confirmation) newErrors.password_confirmation = "Password dan konfirmasi harus sama";
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: "donatur" | "penerima") => {
    setForm({ ...form, role });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotification("");
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    // Simpan data step 1 ke sessionStorage dan lanjut ke step 2
    if (typeof window !== "undefined") {
      sessionStorage.setItem("registerStep1", JSON.stringify(form));
    }
    router.push("/register/step2");
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[#f3f8f3]">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col justify-center items-center bg-[#eaf5ec] p-12">
        <div className="flex flex-col items-center">
          <div className="bg-[#388e5c] rounded-xl w-20 h-20 flex items-center justify-center mb-6">
            <span className="text-white text-3xl font-bold">BP</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-[#1a3c34]">Bagi Pangan</h1>
          <p className="text-[#4b6652] mb-6 text-center max-w-xs">Platform donasi pangan yang lebih tenang, cepat, dan jelas.</p>
          <div className="space-y-3 w-full max-w-xs">
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <FaHeart color="#388e5c" size={24} />
              <span className="text-[#1a3c34] text-sm">Donatur mengunggah makanan, admin memoderasi, penerima melacak status.</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#388e5c"/></svg>
              <span className="text-[#1a3c34] text-sm">Frontend Next.js dan backend Laravel berjalan sebagai satu pengalaman.</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#388e5c"/></svg>
              <span className="text-[#1a3c34] text-sm">Misi sosial dengan dashboard operasional yang rapi dan modern.</span>
            </div>
          </div>
        </div>
      </div>
      {/* Right Panel (Form) */}
      <div className="w-1/2 flex flex-col justify-center px-24">
        <div className="bg-white rounded-xl shadow-lg p-12 w-full max-w-lg mx-auto">
          <div className="mb-8">
            <span className="text-xs tracking-widest text-[#388e5c] font-semibold">REGISTRASI</span>
            <h2 className="text-3xl font-bold mt-2 mb-2 text-[#1a3c34]">Siapkan akses Anda</h2>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#388e5c] text-white font-bold">1</span>
              <span className="h-px flex-1 bg-[#e0e0e0]"></span>
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#e0e0e0] text-[#388e5c] font-bold">2</span>
            </div>
          </div>
          {notification && (
            <div className={`mb-4 p-2 rounded ${notification === "Registrasi Berhasil (dummy)" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
              {notification}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-[#1a3c34]">Pilih peran Anda</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => handleRoleChange("donatur")}
                  className={`flex-1 flex flex-col items-start border rounded-xl p-4 transition-all ${form.role === "donatur" ? "border-[#388e5c] bg-[#f3f8f3]" : "border-[#e0e0e0] bg-white"}`}
                >
                  <FaHeart color="#388e5c" size={24} />
                  <span className={`font-bold mb-1 ${form.role === "donatur" ? "text-[#388e5c]" : "text-[#1a3c34]"}`}>Donatur</span>
                  <span className="text-xs text-[#4b6652]">Saya ingin mendonasikan makanan</span>
                </button>
                <button type="button" onClick={() => handleRoleChange("penerima")}
                  className={`flex-1 flex flex-col items-start border rounded-xl p-4 transition-all ${form.role === "penerima" ? "border-[#388e5c] bg-[#f3f8f3]" : "border-[#e0e0e0] bg-white"}`}
                >
                  <FaBox color="#388e5c" size={24} />
                  <span className={`font-bold mb-1 ${form.role === "penerima" ? "text-[#388e5c]" : "text-[#1a3c34]"}`}>Penerima</span>
                  <span className="text-xs text-[#4b6652]">Saya ingin menerima donasi makanan</span>
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-[#1a3c34]">Nama lengkap</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Nama Anda" className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#388e5c]" />
              {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-[#1a3c34]">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@contoh.com" className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#388e5c]" />
              {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-[#1a3c34]">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#388e5c]" />
              {errors.password && <div className="text-red-600 text-sm mt-1">{errors.password}</div>}
            </div>
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-[#1a3c34]">Konfirmasi Password</label>
              <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} placeholder="Konfirmasi Password" className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#388e5c]" />
              {errors.password_confirmation && <div className="text-red-600 text-sm mt-1">{errors.password_confirmation}</div>}
            </div>
            <button type="submit" className="w-full bg-[#388e5c] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#2e6e4a] transition-all">Lanjut</button>
          </form>
          <div className="mt-6 text-center text-[#4b6652]">
            Sudah punya akun? <a href="/login" className="text-[#388e5c] font-semibold hover:underline">Masuk di sini</a>
          </div>
        </div>
      </div>
    </div>
  );
}
