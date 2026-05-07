import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-login-serif",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-login-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Masuk | BagiPangan",
  description: "Login ke akun BagiPangan Anda dan lanjutkan misi berbagi pangan.",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${newsreader.variable} ${plusJakartaSans.variable}`}>
      {children}
    </div>
  );
}
