"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Track mouse globally for the custom cursor
    const handleGlobalMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);

    let width = window.innerWidth;
    let height = Math.max(document.body.scrollHeight, window.innerHeight); 
    canvas.width = width;
    canvas.height = height;

    class Star {
      x: number;
      y: number;
      z: number;
      originalZ: number;

      constructor() {
        this.x = (Math.random() - 0.5) * 3000;
        this.y = Math.random() * height;
        this.z = Math.random() * 2000;
        this.originalZ = this.z;
      }

      update(time: number, w: number, h: number) {
        // Slow drift upwards and towards camera
        this.z -= 0.5;
        this.y -= 0.1;
        if (this.z < 1 || this.y < -500) {
          this.z = 2000;
          this.x = (Math.random() - 0.5) * w * 2.5;
          this.y = h + 500;
        }
      }

      draw(cx: number, cy: number, mx: number, my: number, fov: number) {
        if (this.z < 1) return null;

        // Apply mouse rotation offsets (parallax)
        const rx = this.x + mx * this.z * 0.0003;
        const ry = this.y + (my - height / 2) * this.z * 0.0001;

        // 3D Projection
        const scale = fov / (fov + this.z);
        const px = cx + rx * scale;
        const py = ry; // In V2, we keep Y more stable for the full scroll effect

        // Localized illumination (Flashlight)
        const dxMouse = px - (mx + cx);
        const dyMouse = py - my;
        const distSq = dxMouse * dxMouse + dyMouse * dyMouse;
        
        const visibilityRadiusSq = 50000; // ~223px radius
        const glowRadiusSq = 15000;       // ~122px radius
        
        if (distSq < visibilityRadiusSq) {
          let opacity = (1 - Math.sqrt(distSq) / Math.sqrt(visibilityRadiusSq)) * 0.8;
          opacity *= Math.min(1, Math.max(0.1, 1 - this.z / 2000));
          
          let size = Math.max(0.2, 3 * scale);
          
          if (distSq < glowRadiusSq && ctx) {
            const hoverIntensity = 1 - Math.sqrt(distSq) / Math.sqrt(glowRadiusSq);
            size += hoverIntensity * 2;
            
            // Draw glow
            ctx.beginPath();
            ctx.arc(px, py, size * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${hoverIntensity * 0.1})`;
            ctx.fill();
          }

          if (ctx) {
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fill();
          }
          return { px, py, opacity };
        }
        return null;
      }
    }

    const numStars = 400; // Slightly lower for performance since it's document-high
    const fov = 400;
    let stars: Star[] = [];
    
    for (let i = 0; i < numStars; i++) {
      stars.push(new Star());
    }

    let mouseX = 0;
    let mouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleResize = () => {
      width = window.innerWidth;
      height = Math.max(document.body.scrollHeight, window.innerHeight);
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX - width / 2;
      mouseY = e.clientY + window.scrollY;
    };

    const handleScroll = () => {
      // Update height in case content changed
      const newHeight = Math.max(document.body.scrollHeight, window.innerHeight);
      if (newHeight !== height) {
        height = newHeight;
        canvas.height = height;
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    let animationFrameId: number;

    const render = (time: number) => {
      currentMouseX += (mouseX - currentMouseX) * 0.05;
      currentMouseY += (mouseY - currentMouseY) * 0.05;

      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
      }

      const cx = width / 2;
      const cy = height / 2;
      const projectedStars = [];

      for (const star of stars) {
        star.update(time, width, height);
        const p = star.draw(cx, cy, currentMouseX, currentMouseY, fov);
        if (p) {
          projectedStars.push(p);
        }
      }

      if (ctx) {
        ctx.lineWidth = 0.5;
        for (let i = 0; i < projectedStars.length; i++) {
          for (let j = i + 1; j < projectedStars.length; j++) {
            const p1 = projectedStars[i];
            const p2 = projectedStars[j];

            const dx = p1.px - p2.px;
            const dy = p1.py - p2.py;
            const distSq = dx * dx + dy * dy;

            if (distSq < 15000) {
              const lineOpacity = (1 - Math.sqrt(distSq) / Math.sqrt(15000)) * 0.2 * p1.opacity * p2.opacity;
              if (lineOpacity > 0.01) {
                ctx.beginPath();
                ctx.moveTo(p1.px, p1.py);
                ctx.lineTo(p2.px, p2.py);
                ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
                ctx.stroke();
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <main className="relative w-full min-h-screen bg-black cursor-none overflow-x-hidden">
      {/* Magic Cursor Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: "radial-gradient(4px 4px at var(--mouse-x) var(--mouse-y), rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
          mixBlendMode: "screen",
          filter: "drop-shadow(0 0 6px rgba(255,255,255,0.8))",
        }}
      />

      {/* Persistent Star Canvas */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" />

      {/* Hero Section */}
      <section className="relative w-full h-screen z-10 flex flex-col items-center justify-center pointer-events-none select-none px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="flex flex-col items-center max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-medium text-white text-center pb-6">
            Constellation Systems - a proposal
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 2 }}
            className="text-sm md:text-base text-white/40 uppercase tracking-[0.3em] text-center mb-12"
          >
            For Avery & the Constellation team
          </motion.p>
          
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1.5, duration: 2 }}
            className="w-40 h-[1px] bg-white/20 mb-12" 
          />
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 text-sm text-white/40 tracking-widest uppercase"
          >
            <p><span className="text-white/20 mr-3">Role:</span>Operator &middot; Ex-founder</p>
            <p className="hidden sm:block text-white/10">/</p>
            <p><span className="text-white/20 mr-3">Date:</span>March 2026</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Proposal Content */}
      <section className="relative z-10 w-full min-h-screen py-40 flex flex-col items-center px-6">
        
        {/* Side Margin Pulsing Stars (Visual Magic) */}
        <div className="hidden xl:block">
          <div className="fixed left-12 top-1/4 flex flex-col gap-60 opacity-40">
            <motion.div animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
            <motion.div animate={{ opacity: [0.1, 0.6, 0.1], scale: [0.8, 1.1, 0.8] }} transition={{ repeat: Infinity, duration: 5, delay: 1 }} className="w-1 h-1 rounded-full bg-blue-100 shadow-[0_0_6px_white]" />
          </div>
          <div className="fixed right-12 top-1/3 flex flex-col gap-40 opacity-40">
            <motion.div animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 4.5 }} className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
            <motion.div animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.9, 1.2, 0.9] }} transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }} className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
          </div>
        </div>

        <div className="max-w-4xl w-full flex flex-col gap-48 font-light text-xl md:text-2xl leading-relaxed text-white/70">
          
          {/* Intro Text removed - focused on Hypotheses */}

          <div className="space-y-40">
            {/* Hypothesis 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2 }}
              className="p-10 md:p-16 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl"
            >
              <p className="text-white/30 uppercase tracking-[0.4em] text-xs mb-8">Hypothesis 1</p>
              <h3 className="text-4xl md:text-5xl font-playfair font-medium text-white mb-10 leading-tight">Research participant pools are a bottleneck.</h3>
              <p className="mb-10 text-white/80">Sourcing and managing qualified research participants takes time that could go toward science. I'd own this end-to-end.</p>
              
              <div className="pl-8 border-l border-white/10 space-y-8 text-lg md:text-xl text-white/50 mb-12">
                <p><strong className="text-white font-medium mr-4">W1:</strong> Audit what's working for competitors and Constellation. Decide: double down or test a side strategy.</p>
                <p><strong className="text-white font-medium mr-4">W2:</strong> Enough data to commit to one approach. Begin full execution.</p>
                <p><strong className="text-white font-medium mr-4">W3:</strong> Optimize and push the system hard.</p>
                <p><strong className="text-white font-medium mr-4">W4:</strong> Evaluate results. Ship a report. Begin testing the next lever.</p>
              </div>
              
              <p className="text-sm tracking-widest uppercase text-white/40">&rarr; KPI: Qualified participants who complete a session.</p>
            </motion.div>

            {/* Hypothesis 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2 }}
              className="p-10 md:p-16 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl"
            >
              <p className="text-white/30 uppercase tracking-[0.4em] text-xs mb-8">Hypothesis 2</p>
              <h3 className="text-4xl md:text-5xl font-playfair font-medium text-white mb-10 leading-tight">Ops overhead is draining technical talent.</h3>
              <p className="mb-10 text-white/80">Same logic here. I'd identify the highest-friction tasks - founder bandwidth drains, ops chaos, partnerships - and eliminate them.</p>
              
              <div className="pl-8 border-l border-white/10 space-y-8 text-lg md:text-xl text-white/50 mb-12">
                <p><strong className="text-white font-medium mr-4">W1:</strong> Shadow the team. Map every recurring task that isn't core research.</p>
                <p><strong className="text-white font-medium mr-4">W2:</strong> Systematize, delegate, or kill the top offenders.</p>
                <p><strong className="text-white font-medium mr-4">W3:</strong> Deliver a clean ops playbook. The team doesn't touch these again.</p>
              </div>

              <p className="text-sm tracking-widest uppercase text-white/40">&rarr; KPI: Researcher/founder hours reclaimed per week.</p>
            </motion.div>

            {/* Hypothesis 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2 }}
              className="p-10 md:p-16 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl"
            >
              <p className="text-white/30 uppercase tracking-[0.4em] text-xs mb-8">Hypothesis 3</p>
              <h3 className="text-4xl md:text-5xl font-playfair font-medium text-white mb-10 leading-tight">The real bottleneck is one I haven't named yet.</h3>
              <p className="mb-10 text-white/80">These first two are my best guesses from the outside. The actual constraint worth solving lives in a conversation between us.</p>
              <p className="italic text-white/40 text-2xl mb-4 border-l-2 border-white/20 pl-8 py-2">
                "What's the thing your team keeps bumping into that no job description has captured?"
              </p>
              <p className="text-sm tracking-widest uppercase text-white/40">&rarr; KPI: Defined together.</p>
            </motion.div>
          </div>

          {/* Expectations */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2 }}
            className="p-10 md:p-16 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl mt-12"
          >
            <h2 className="text-4xl font-playfair font-medium text-white mb-12">Expectations</h2>
            <ul className="space-y-10 text-white/60 text-lg md:text-xl">
              <li className="flex gap-8 items-start">
                <span className="w-2 h-2 rounded-full bg-white/20 mt-3" />
                <span>Full ownership. I'll consult the team for key decisions and always come with proposals, not just problems.</span>
              </li>
              <li className="flex gap-8 items-start">
                <span className="w-2 h-2 rounded-full bg-white/20 mt-3" />
                <span>A mission-driven operator who's also the grounded person you want around in a moment of crisis.</span>
              </li>
              <li className="flex gap-8 items-start">
                <span className="w-2 h-2 rounded-full bg-white/20 mt-3" />
                <span>For those building foundational models to understand the human condition.</span>
              </li>
            </ul>

            <div className="mt-20 flex justify-center">
              <a 
                href="https://www.linkedin.com/in/daniel-martinez111" 
                target="_blank" 
                rel="noreferrer"
                className="group relative px-12 py-4 text-sm tracking-widest uppercase text-white/80 transition-all hover:text-white"
              >
                <span className="absolute inset-0 border border-white/10 rounded-full group-hover:border-white/30 group-hover:scale-105 transition-all" />
                linkedin.com/in/daniel-martinez111
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
