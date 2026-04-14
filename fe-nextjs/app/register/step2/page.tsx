"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


export default function RegisterStep2() {
  const router = useRouter();
  const [step1, setStep1] = useState<any>(null);
  const [form, setForm] = useState({
    phone: "",
    city: "",
    organization: "",
    job: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [notification, setNotification] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s1 = sessionStorage.getItem("registerStep1");
      if (s1) {
        setStep1(JSON.parse(s1));
      } else {
        // Jika tidak ada data step1, redirect ke step1
        router.replace("/register");
      }
    }
  }, [router]);

  const validate = () => {
    const newErrors: any = {};
    if (!form.phone) newErrors.phone = "Nomor telepon wajib diisi";
    else if (!/^\d+$/.test(form.phone)) newErrors.phone = "Nomor telepon harus berupa angka";
    if (!form.city) newErrors.city = "Kota wajib diisi";
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotification("");
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    if (!step1) {
      setNotification("Data step 1 tidak ditemukan. Silakan ulangi registrasi.");
      return;
    }
    // Gabungkan data step1 dan step2
    const payload = {
      ...step1,
      ...form,
    };
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("Register response:", { status: res.status, data });
      
      if (res.ok) {
        setNotification("✅ Registrasi berhasil! Silakan login.");
        sessionStorage.removeItem("registerStep1");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        // Handle validation errors
        if (res.status === 422 && data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([key, messages]: any) => `${key}: ${Array.isArray(messages) ? messages[0] : messages}`)
            .join(", ");
          setNotification(`❌ ${errorMessages}`);
        } else {
          setNotification(`❌ ${data.message || data.error || "Registrasi gagal"}`);
        }
      }
    } catch (err) {
      console.error("Register error:", err);
      setNotification(`❌ Terjadi kesalahan: ${String(err)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[#f3f8f3]">
      {/* Left Panel (copy dari step 1) */}
      <div className="w-1/2 flex flex-col justify-center items-center bg-[#eaf5ec] p-12">
        <div className="flex flex-col items-center">
          <div className="bg-[#388e5c] rounded-xl w-20 h-20 flex items-center justify-center mb-6">
            <span className="text-white text-3xl font-bold">BP</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-[#1a3c34]">Bagi Pangan</h1>
          <p className="text-[#4b6652] mb-6 text-center max-w-xs">Platform donasi pangan yang lebih tenang, cepat, dan jelas.</p>
          <div className="space-y-3 w-full max-w-xs">
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <span className="text-[#388e5c] text-xl">&#9829;</span>
              <span className="text-[#1a3c34] text-sm">Donatur mengunggah makanan, admin memoderasi, penerima melacak status.</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <span className="text-[#388e5c] text-xl">&#128100;</span>
              <span className="text-[#1a3c34] text-sm">Frontend Next.js dan backend Laravel berjalan sebagai satu pengalaman.</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
              <span className="text-[#388e5c] text-xl">&#127793;</span>
              <span className="text-[#1a3c34] text-sm">Misi sosial dengan dashboard operasional yang rapi dan modern.</span>
            </div>
          </div>
        </div>
      </div>
      {/* Right Panel (Form Step 2) */}
      <div className="w-1/2 flex flex-col justify-center px-24">
        <div className="bg-white rounded-xl shadow-lg p-12 w-full max-w-lg mx-auto">
          <div className="mb-8">
            <span className="text-xs tracking-widest text-[#388e5c] font-semibold">REGISTRASI</span>
            <h2 className="text-3xl font-bold mt-2 mb-2 text-[#1a3c34]">Lengkapi data diri Anda</h2>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#e0e0e0] text-[#388e5c] font-bold">1</span>
              <span className="h-px flex-1 bg-[#e0e0e0]"></span>
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#388e5c] text-white font-bold">2</span>
            </div>
          </div>
          {notification && (
            <div className={`mb-4 p-3 rounded-lg font-semibold text-sm ${
              notification.includes("✅")
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}>
              {notification}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="block font-semibold mb-2 text-[#1a3c34]">Nomor telepon</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#388e5c]" />
                {errors.phone && <div className="text-red-600 text-sm mt-1">{errors.phone}</div>}
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-2 text-[#1a3c34]">Kota</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="Jakarta" className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#388e5c]" />
                {errors.city && <div className="text-red-600 text-sm mt-1">{errors.city}</div>}
              </div>
            </div>
            {step1?.role === "donatur" && (
              <div className="mb-4">
                <label className="block font-semibold mb-2 text-[#1a3c34]">Nama usaha / organisasi <span className="text-xs text-[#bdbdbd]">(Opsional)</span></label>
                <input type="text" name="organization" value={form.organization} onChange={handleChange} placeholder="Opsional" className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#388e5c]" />
              </div>
            )}
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-[#1a3c34]">Pekerjaan <span className="text-xs text-[#bdbdbd]">(Opsional)</span></label>
              <input type="text" name="job" value={form.job} onChange={handleChange} placeholder="Opsional" className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#388e5c]" />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => router.back()} className="flex-1 bg-[#e0e0e0] text-[#388e5c] py-3 rounded-lg font-bold text-lg hover:bg-[#d0d0d0] transition-all">Kembali</button>
              <button type="submit" className="flex-1 bg-[#388e5c] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#2e6e4a] transition-all">Daftar Sekarang</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
