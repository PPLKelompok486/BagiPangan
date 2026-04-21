"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "../ui/brand-mark";

// ─── Data ────────────────────────────────────────────────────────────────────

const platformLinks = [
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Fitur Utama", href: "#fitur" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Donasi Aktif", href: "/donasi" },
] as const;

const accountLinks = [
  { label: "Daftar Akun", href: "/register" },
  { label: "Masuk", href: "/login" },
  { label: "Profil Donatur", href: "/profil" },
  { label: "Riwayat Donasi", href: "/riwayat" },
] as const;

type SocialEntry = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1.05rem] w-[1.05rem]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect
        height="20"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.75"
        width="20"
        x="2"
        y="2"
      />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.5" cy="6.5" fill="currentColor" r="1.1" />
    </svg>
  );
}

function TwitterXIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1.05rem] w-[1.05rem]"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.857L2.016 2.25H8.28l4.26 5.632 5.704-5.632Z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1.05rem] w-[1.05rem]"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type FooterLinkListProps = {
  links: readonly { label: string; href: string }[];
  reducedMotion: boolean;
};

function FooterLinkList({ links, reducedMotion }: Readonly<FooterLinkListProps>) {
  return (
    <ul className="space-y-3" role="list">
      {links.map((link) => (
        <motion.li
          key={link.href}
          transition={
            reducedMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }
          }
          whileHover={reducedMotion ? undefined : { x: 4 }}
        >
          <Link
            className="text-sm text-white/55 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]"
            href={link.href}
          >
            {link.label}
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}

type SocialButtonProps = {
  social: SocialEntry;
  size?: "md" | "sm";
  reducedMotion: boolean;
};

function SocialButton({ social, size = "md", reducedMotion }: Readonly<SocialButtonProps>) {
  const sizeClass = size === "md" ? "h-11 w-11" : "h-9 w-9";
  return (
    <motion.a
      aria-label={`${social.label} BagiPangan`}
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/55 transition-colors duration-150 hover:border-white/22 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]`}
      href={social.href}
      rel="noopener noreferrer"
      target="_blank"
      whileHover={reducedMotion ? undefined : { scale: 1.08 }}
      whileTap={reducedMotion ? undefined : { scale: 0.92 }}
    >
      {social.icon}
    </motion.a>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  const reducedMotion = useReducedMotion() ?? false;
  const currentYear = new Date().getFullYear();

  const socials: SocialEntry[] = [
    { label: "Instagram", href: "#", icon: <InstagramIcon /> },
    { label: "Twitter", href: "#", icon: <TwitterXIcon /> },
    { label: "LinkedIn", href: "#", icon: <LinkedinIcon /> },
  ];

  return (
    <footer
      aria-label="Footer BagiPangan"
      className="bg-[var(--brand-900)] px-4 pb-8 pt-16 text-white sm:px-6 lg:px-10 lg:pb-10 lg:pt-20"
    >
      <div className="mx-auto max-w-7xl">
        {/* Four-column grid */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* ── Col 1: Brand ─────────────────────────────── */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-1">
            <BrandMark inverse />
            <p className="max-w-[22rem] text-sm leading-7 text-white/52">
              Platform distribusi makanan berlebih yang menghubungkan donatur
              dengan penerima secara cepat, aman, dan transparan. Bersama
              memutus rantai pemborosan pangan.
            </p>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/30">
              Bagi Makanan, Kurangi Pemborosan
            </p>
          </div>

          {/* ── Col 2: Platform ──────────────────────────── */}
          <div>
            <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/38">
              Platform
            </h3>
            <FooterLinkList links={platformLinks} reducedMotion={reducedMotion} />
          </div>

          {/* ── Col 3: Akun ──────────────────────────────── */}
          <div>
            <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/38">
              Akun
            </h3>
            <FooterLinkList links={accountLinks} reducedMotion={reducedMotion} />
          </div>

          {/* ── Col 4: Kontak ────────────────────────────── */}
          <div>
            <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/38">
              Kontak
            </h3>
            <div className="space-y-6">
              <div>
                <motion.div
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 0.18, ease: "easeOut" }
                  }
                  whileHover={reducedMotion ? undefined : { x: 4 }}
                >
                  <a
                    className="text-sm text-white/55 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]"
                    href="mailto:halo@bagipangan.id"
                  >
                    halo@bagipangan.id
                  </a>
                </motion.div>
                <motion.div
                  className="mt-2"
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 0.18, ease: "easeOut" }
                  }
                  whileHover={reducedMotion ? undefined : { x: 4 }}
                >
                  <a
                    className="text-sm text-white/55 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]"
                    href="mailto:partner@bagipangan.id"
                  >
                    partner@bagipangan.id
                  </a>
                </motion.div>
              </div>

              {/* Social icons in contact column */}
              <div className="flex gap-3" role="list" aria-label="Media sosial BagiPangan">
                {socials.map((social) => (
                  <div key={social.label} role="listitem">
                    <SocialButton
                      reducedMotion={reducedMotion}
                      social={social}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-16 h-px bg-white/8" />

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-sm text-white/36">
            © {currentYear}{" "}
            <span className="text-white/55">BagiPangan</span>. Dibuat dengan{" "}
            <span aria-label="cinta" className="text-[var(--lime)]">
              ♥
            </span>{" "}
            untuk Indonesia yang lebih baik.
          </p>

          {/* Bottom social icon row */}
          <div
            aria-label="Ikuti kami"
            className="flex gap-2.5"
            role="list"
          >
            {socials.map((social) => (
              <div key={`bottom-${social.label}`} role="listitem">
                <SocialButton
                  reducedMotion={reducedMotion}
                  size="sm"
                  social={social}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
