"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface SectionBlockProps {
  title: string;
  body: string | React.ReactNode;
  index?: number;
}

export default function SectionBlock({ title, body, index = 0 }: SectionBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
      className="relative max-w-2xl mx-auto px-6"
    >
      {/* Subtle top accent */}
      <div className="w-8 h-px bg-gradient-to-r from-blue-500/40 to-transparent mb-8" />

      <h2 className="text-2xl sm:text-3xl font-light tracking-wide text-blue-50/90 mb-5">
        {title}
      </h2>

      <div className="text-sm sm:text-base font-light leading-7 sm:leading-8 text-blue-200/50 space-y-4">
        {typeof body === "string" ? <p>{body}</p> : body}
      </div>
    </motion.div>
  );
}
