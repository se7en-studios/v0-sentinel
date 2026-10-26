"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full relative"
      style={{ fontFamily: "var(--font-sans)" }}
      ref={containerRef}
    >
      <div ref={ref} className="relative max-w-4xl mx-auto pb-10">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-20 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs md:w-full">
              <div
                className="h-8 absolute left-3 md:left-3 w-8 rounded-full flex items-center justify-center"
                style={{
                  background: "#faf7f0",
                  border: "0.5px solid rgba(15,122,79,0.3)",
                }}
              >
                <div
                  className="h-3 w-3 rounded-full motion-safe:animate-ping absolute"
                  style={{ background: "#0f7a4f", opacity: 0.5 }}
                />
                <div
                  className="h-3 w-3 rounded-full relative"
                  style={{ background: "#0f7a4f" }}
                />
              </div>
              <h3
                className="hidden md:block text-lg md:pl-20 font-semibold"
                style={{ color: "var(--green-aa)" }}
              >
                {item.title}
              </h3>
            </div>

            <div className="relative pl-16 pr-4 md:pl-4 w-full">
              <h3
                className="md:hidden block text-base mb-2 text-left font-semibold"
                style={{ color: "var(--green-aa)" }}
              >
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-px"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(26,24,18,0.1) 10%, rgba(26,24,18,0.1) 90%, transparent 100%)",
            }}
          />
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
              background: "#0f7a4f",
            }}
            className="absolute inset-x-0 top-0 w-px rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
