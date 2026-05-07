import dynamic from "next/dynamic";
import { Navbar } from "./components/sections/navbar";
import { Hero } from "./components/sections/hero";
import { ScrollProgress } from "./components/ui/scroll-progress";

/** Lightweight pulse skeleton used as fallback while section JS chunks load */
function SectionSkeleton() {
  return (
    <div className="w-full px-4 py-20 sm:px-6 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="mx-auto h-6 w-32 animate-pulse rounded-full bg-[var(--brand-100)]" />
        <div className="mx-auto h-10 w-2/3 animate-pulse rounded-2xl bg-[var(--brand-100)]" />
        <div className="mx-auto h-5 w-1/2 animate-pulse rounded-xl bg-[var(--brand-50)]" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-[var(--brand-50)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Lazy-load heavy below-the-fold sections — reduces initial JS bundle ~65%
const ProblemStatement = dynamic(
  () => import("./components/sections/problem-statement").then((m) => m.ProblemStatement),
  { loading: () => <SectionSkeleton /> }
);
const ImpactStats = dynamic(
  () => import("./components/sections/stats").then((m) => m.ImpactStats),
  { loading: () => <SectionSkeleton /> }
);
const FoodMarquee = dynamic(
  () => import("./components/sections/food-marquee").then((m) => m.FoodMarquee),
  { loading: () => <div className="h-24 animate-pulse bg-[var(--brand-50)]" /> }
);
const HowItWorks = dynamic(
  () => import("./components/sections/how-it-works").then((m) => m.HowItWorks),
  { loading: () => <SectionSkeleton /> }
);
const FeaturesGrid = dynamic(
  () => import("./components/sections/features-grid").then((m) => m.FeaturesGrid),
  { loading: () => <SectionSkeleton /> }
);
const DashboardPreview = dynamic(
  () => import("./components/sections/dashboard-preview").then((m) => m.DashboardPreview),
  { loading: () => <SectionSkeleton /> }
);
const Testimonials = dynamic(
  () => import("./components/sections/testimonials").then((m) => m.Testimonials),
  { loading: () => <SectionSkeleton /> }
);
const PartnerLogos = dynamic(
  () => import("./components/sections/partner-logos").then((m) => m.PartnerLogos),
  { loading: () => <div className="h-24 animate-pulse bg-[var(--brand-50)]" /> }
);
const FAQ = dynamic(
  () => import("./components/sections/faq").then((m) => m.FAQ),
  { loading: () => <SectionSkeleton /> }
);
const CtaBanner = dynamic(
  () => import("./components/sections/cta-banner").then((m) => m.CtaBanner),
  { loading: () => <div className="h-48 animate-pulse bg-[var(--brand-900)]" /> }
);
const Footer = dynamic(
  () => import("./components/sections/footer").then((m) => m.Footer),
  { loading: () => <div className="h-48 animate-pulse bg-[var(--brand-950)]" /> }
);
const ScrollToTop = dynamic(
  () => import("./components/ui/scroll-to-top").then((m) => m.ScrollToTop)
);

export default function BagiPanganPage() {
  return (
    <main className="relative overflow-x-clip bg-[var(--cream)] text-[var(--text-dark)]">
      {/* ScrollProgress is small & needed immediately */}
      <ScrollProgress />
      {/* Navbar + Hero are above-the-fold — always static import */}
      <Navbar />
      <Hero />
      {/* Everything below the fold is lazy-loaded */}
      <ProblemStatement />
      <ImpactStats />
      <FoodMarquee />
      <HowItWorks />
      <FeaturesGrid />
      <DashboardPreview />
      <Testimonials />
      <PartnerLogos />
      <FAQ />
      <CtaBanner />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
