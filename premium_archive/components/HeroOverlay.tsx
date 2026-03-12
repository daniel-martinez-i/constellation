"use client";

import { motion } from "framer-motion";

export default function HeroOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none select-none px-6">
      {/* Subtle radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(2,6,23,0.7)_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
        className="relative flex flex-col items-center"
      >
        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-b from-blue-50 via-blue-200 to-blue-500/80 text-center leading-tight pb-2">
          NeuralAI
        </h1>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1.2, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-48 sm:w-64 md:w-80 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent my-5 md:my-7"
        />

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 1.8, ease: "easeOut" }}
          className="text-sm sm:text-base md:text-lg lg:text-xl font-light tracking-[0.35em] uppercase text-blue-300/80 text-center"
        >
          Constellation
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 2 }}
          className="mt-6 md:mt-10 text-xs sm:text-sm md:text-base font-light text-blue-200/40 text-center max-w-md tracking-wide"
        >
          Brains. Bodies. Environments.
          <br />
          One latent state.
        </motion.p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 1 }}
        className="absolute bottom-8 md:bottom-12 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-blue-400/30 font-light">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-6 bg-gradient-to-b from-blue-400/30 to-transparent"
        />
      </motion.div>
    </div>
  );
}
