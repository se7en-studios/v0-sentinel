import { MarqueeRow } from "@/components/ui/marquee-row";

export type FaqScrollerItem = { question: string; answer: string };

// Preguntas en filas que corren solas en sentidos opuestos y pausan al pasar el mouse.
// Con reduced-motion no se animan: MarqueeRow deja la fila desplazable a mano.
const REPEAT = 3;

function Card({ item, hidden }: { item: FaqScrollerItem; hidden: boolean }) {
  return (
    <li
      aria-hidden={hidden || undefined}
      className="a-card flex w-[19rem] shrink-0 flex-col gap-4 !bg-white/[0.035] p-6 sm:w-[24rem]"
    >
      <h4 className="font-[family-name:var(--font-display)] text-[1.5rem] leading-[1.15] text-[#ece9e2]">
        {item.question}
      </h4>
      <p className="text-[1rem] leading-relaxed text-[#b9b6ae]">{item.answer}</p>
    </li>
  );
}

function Row({ items, seconds, reverse }: { items: FaqScrollerItem[]; seconds: number; reverse?: boolean }) {
  return (
    <MarqueeRow fade="#161816" seconds={seconds} reverse={reverse}>
      {(hidden) =>
        Array.from({ length: REPEAT }, (_, n) =>
          items.map((it) => (
            <Card key={`${n}-${it.question}`} item={it} hidden={hidden || n > 0} />
          )),
        ).flat()
      }
    </MarqueeRow>
  );
}

export function FaqScroller({ title, items }: { title: string; items: FaqScrollerItem[] }) {
  const mid = Math.ceil(items.length / 2);
  return (
    <div id="faq" className="scroll-mt-20 text-center">
      <p className="a-eyebrow flex items-center justify-center gap-3 !text-a-accent">
        <span aria-hidden className="h-px w-8 bg-a-accent/60" />
        FAQ
      </p>
      <h3 className="a-display-m mx-auto mt-4 !text-[clamp(2.25rem,4.2vw,3.75rem)] text-[#ece9e2]">{title}</h3>
      <div className="mt-12 flex flex-col gap-6 text-left">
        <Row items={items.slice(0, mid)} seconds={70} />
        <Row items={items.slice(mid)} seconds={55} reverse />
      </div>
    </div>
  );
}
