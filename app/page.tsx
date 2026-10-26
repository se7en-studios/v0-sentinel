import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ForestJourney } from "@/components/forest-journey-lazy";
import { ScrollProgress } from "@/components/scroll-progress";
import { SectionDots } from "@/components/ui/section-dots";
import { WhatsAppButton } from "@/components/whatsapp-button";

// ponytail: everything below the hero is off-screen on first load, so its
// JS doesn't need to be in the initial bundle React hydrates right away —
// splitting it into its own chunks cuts down the main-thread work that was
// competing with the hero for the browser's attention during LCP/TBT.
// Content itself still renders server-side (ssr defaults to true), so
// there's no loading flash, no CLS, and no SEO impact — only the timing of
// when each chunk's JS is parsed/hydrated changes.
const Problem = dynamic(() =>
  import("@/components/problem").then((m) => m.Problem),
);
const Statement = dynamic(() =>
  import("@/components/statement").then((m) => m.Statement),
);
const Platform = dynamic(() =>
  import("@/components/platform").then((m) => m.Platform),
);
const Stats = dynamic(() => import("@/components/stats").then((m) => m.Stats));
const LiveChapter = dynamic(() =>
  import("@/components/live").then((m) => m.LiveChapter),
);
const Audiences = dynamic(() =>
  import("@/components/audiences").then((m) => m.Audiences),
);
const Proof = dynamic(() => import("@/components/proof").then((m) => m.Proof));
const ContentStrip = dynamic(() =>
  import("@/components/content-strip").then((m) => m.ContentStrip),
);
const FAQ = dynamic(() => import("@/components/faq").then((m) => m.FAQ));
const CTA = dynamic(() => import("@/components/cta").then((m) => m.CTA));
const Footer = dynamic(() =>
  import("@/components/footer").then((m) => m.Footer),
);

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <header>
        <Navbar />
      </header>
      {/* ponytail: rendered after the header, not before, so keyboard tab
          order reaches the real nav before this fixed floating aid - it's
          visually independent of DOM position either way. */}
      <SectionDots />
      <main id="main-content" className="min-h-screen bg-[#faf7f0]">
        <Hero />
        <ForestJourney />
        <Problem />
        <Statement
          text="Cada minuto que el fuego crece sin que nadie lo vea, se cuenta en hectáreas."
          accent="se cuenta en hectáreas."
        />
        <Platform />
        <Stats />
        <LiveChapter />
        <Audiences />
        <Proof />
        <ContentStrip />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
