"use client";

import { motion } from "framer-motion";

interface CTAButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export default function CTAButton({ children, href, onClick }: CTAButtonProps) {
  const className =
    "group relative inline-flex items-center justify-center px-8 py-3.5 text-sm font-light tracking-[0.15em] uppercase text-blue-100 border border-blue-400/20 rounded-full overflow-hidden transition-all duration-500 hover:border-blue-400/50 hover:text-white hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]";

  const inner = (
    <>
      {/* Glow background on hover */}
      <span className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <span className="relative z-10">{children}</span>
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        className={className}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {inner}
    </motion.button>
  );
}
