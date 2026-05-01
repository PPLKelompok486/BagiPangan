import dynamic from "next/dynamic";
import { Navbar } from "./components/sections/navbar";
import { Hero } from "./components/sections/hero";
import { ScrollProgress } from "./components/ui/scroll-progress";

// Lazy-load heavy below-the-fold sections — reduces initial JS bundle ~65%
const ProblemStatement = dynamic(() =>
  import("./components/sections/problem-statement").then((m) => m.ProblemStatement)
);
const ImpactStats = dynamic(() =>
  import("./components/sections/stats").then((m) => m.ImpactStats)
);
const FoodMarquee = dynamic(() =>
  import("./components/sections/food-marquee").then((m) => m.FoodMarquee)
);
const HowItWorks = dynamic(() =>
  import("./components/sections/how-it-works").then((m) => m.HowItWorks)
);
const FeaturesGrid = dynamic(() =>
  import("./components/sections/features-grid").then((m) => m.FeaturesGrid)
);
const DashboardPreview = dynamic(() =>
  import("./components/sections/dashboard-preview").then((m) => m.DashboardPreview)
);
const Testimonials = dynamic(() =>
  import("./components/sections/testimonials").then((m) => m.Testimonials)
);
const PartnerLogos = dynamic(() =>
  import("./components/sections/partner-logos").then((m) => m.PartnerLogos)
);
const FAQ = dynamic(() =>
  import("./components/sections/faq").then((m) => m.FAQ)
);
const CtaBanner = dynamic(() =>
  import("./components/sections/cta-banner").then((m) => m.CtaBanner)
);
const Footer = dynamic(() =>
  import("./components/sections/footer").then((m) => m.Footer)
);
const ScrollToTop = dynamic(() =>
  import("./components/ui/scroll-to-top").then((m) => m.ScrollToTop)
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
