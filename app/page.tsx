import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ScrollProgress } from "@/components/scroll-progress";
import { WhatsAppButton } from "@/components/whatsapp-button";

// ponytail: everything below the hero is off-screen on first load, so its
// JS doesn't need to be in the initial bundle React hydrates right away —
// splitting it into its own chunks cuts down the main-thread work that was
// competing with the hero for the browser's attention during LCP/TBT.
// Content itself still renders server-side (ssr defaults to true), so
// there's no loading flash, no CLS, and no SEO impact — only the timing of
// when each chunk's JS is parsed/hydrated changes.
const Manifesto = dynamic(() =>
  import("@/components/manifesto").then((m) => m.Manifesto),
);
const ArcSequence = dynamic(() =>
  import("@/components/arc-sequence").then((m) => m.ArcSequence),
);
const FireTimeline = dynamic(() =>
  import("@/components/fire-timeline").then((m) => m.FireTimeline),
);
const Problem = dynamic(() =>
  import("@/components/problem").then((m) => m.Problem),
);
const Platform = dynamic(() =>
  import("@/components/platform").then((m) => m.Platform),
);
const LiveChapter = dynamic(() =>
  import("@/components/live").then((m) => m.LiveChapter),
);
const Audiences = dynamic(() =>
  import("@/components/audiences").then((m) => m.Audiences),
);
const Proof = dynamic(() => import("@/components/proof").then((m) => m.Proof));
const Pilot = dynamic(() => import("@/components/pilot").then((m) => m.Pilot));
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
      <main id="main-content" className="a-root min-h-screen">
        <Hero />
        <Manifesto />
        <ArcSequence />
        <Problem />
        <FireTimeline />
        <Platform />
        <LiveChapter />
        <Audiences />
        <Proof />
        <Pilot />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
