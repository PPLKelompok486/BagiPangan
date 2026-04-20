import { CtaBanner } from "./components/sections/cta-banner";
import { DashboardPreview } from "./components/sections/dashboard-preview";
import { FAQ } from "./components/sections/faq";
import { FeaturesGrid } from "./components/sections/features-grid";
import { FoodMarquee } from "./components/sections/food-marquee";
import { Footer } from "./components/sections/footer";
import { Hero } from "./components/sections/hero";
import { HowItWorks } from "./components/sections/how-it-works";
import { Navbar } from "./components/sections/navbar";
import { PartnerLogos } from "./components/sections/partner-logos";
import { ProblemStatement } from "./components/sections/problem-statement";
import { ImpactStats } from "./components/sections/stats";
import { Testimonials } from "./components/sections/testimonials";
import { ScrollProgress } from "./components/ui/scroll-progress";

export default function BagiPanganPage() {
  return (
    <main className="relative overflow-x-clip bg-[var(--cream)] text-[var(--text-dark)]">
      <ScrollProgress />
      <Navbar />
      <Hero />
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
    </main>
  );
}
