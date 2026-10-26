import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ForestJourney } from "@/components/forest-journey-lazy";
import { FireRiskIndex } from "@/components/fire-risk-index";
import { ActiveFires } from "@/components/active-fires";
import { FireImpactStats } from "@/components/fire-impact-stats";
import { WildfireNews } from "@/components/wildfire-news";
import { Press } from "@/components/press";
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
const Features = dynamic(() =>
  import("@/components/features").then((m) => m.Features),
);
const Capabilities = dynamic(() =>
  import("@/components/capabilities").then((m) => m.Capabilities),
);
const HowItWorks = dynamic(() =>
  import("@/components/how-it-works").then((m) => m.HowItWorks),
);
const Stats = dynamic(() => import("@/components/stats").then((m) => m.Stats));
const Team = dynamic(() => import("@/components/team").then((m) => m.Team));
const Awards = dynamic(() =>
  import("@/components/awards").then((m) => m.Awards),
);
const Partners = dynamic(() =>
  import("@/components/partners").then((m) => m.Partners),
);
const InstagramFeed = dynamic(() =>
  import("@/components/instagram").then((m) => m.InstagramFeed),
);
const BlogTeaser = dynamic(() =>
  import("@/components/blog-teaser").then((m) => m.BlogTeaser),
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
        <Features />
        <Capabilities />
        <HowItWorks />
        <Stats />
        <FireRiskIndex />
        <ActiveFires />
        <FireImpactStats />
        <WildfireNews />
        <Team />
        <Awards />
        <Press />
        <Partners />
        <InstagramFeed />
        <BlogTeaser />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
