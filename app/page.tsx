import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ScrollProgress } from "@/components/scroll-progress";
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
const Tunnel = dynamic(() => import("@/components/tunnel").then((m) => m.Tunnel));
const Platform = dynamic(() =>
  import("@/components/platform").then((m) => m.Platform),
);
const Coverage = dynamic(() =>
  import("@/components/coverage").then((m) => m.Coverage),
);
const LiveChapter = dynamic(() =>
  import("@/components/live").then((m) => m.LiveChapter),
);
const Audiences = dynamic(() =>
  import("@/components/audiences").then((m) => m.Audiences),
);
const World = dynamic(() => import("@/components/world").then((m) => m.World));
const Proof = dynamic(() => import("@/components/proof").then((m) => m.Proof));
const CTA = dynamic(() => import("@/components/cta").then((m) => m.CTA));
const Footer = dynamic(() =>
  import("@/components/footer").then((m) => m.Footer),
);

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <header>
        <Navbar />
      </header>
      <main id="main-content" className="a-root min-h-screen">
        <Hero />
        <Problem />
        <Tunnel />
        <Platform />
        <Coverage />
        <LiveChapter />
        <Audiences />
        <World />
        <Proof />
        <CTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
