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

    // Track mouse globally for the custom cursor too
    const handleGlobalMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    class Star {
      x: number;
      y: number;
      z: number;
      originalZ: number;

      constructor() {
        this.x = (Math.random() - 0.5) * 2000;
        this.y = (Math.random() - 0.5) * 2000;
        this.z = Math.random() * 2000;
        this.originalZ = this.z;
      }

      update(time: number) {
        // Slowly fly towards the camera
        this.z -= 0.5;
        if (this.z < 1) {
          this.z = 2000;
          this.x = (Math.random() - 0.5) * 2000;
          this.y = (Math.random() - 0.5) * 2000;
        }
      }

      draw(cx: number, cy: number, mx: number, my: number, fov: number) {
        if (this.z < 1) return null;

        // Apply mouse rotation offsets (parallax)
        const rx = this.x + mx * this.z * 0.0005;
        const ry = this.y + my * this.z * 0.0005;

        // 3D Projection
        const scale = fov / (fov + this.z);
        const px = cx + rx * scale;
        const py = cy + ry * scale;

        let size = Math.max(0.1, 2.5 * scale);
        let opacity = Math.min(1, Math.max(0.1, 1 - this.z / 2000));

        // Interactive mouse glow
        const dxMouse = px - (mx + cx);
        const dyMouse = py - (my + cy);
        const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
        
        if (distMouseSq < 15000 && ctx) {
          const hoverIntensity = 1 - Math.sqrt(distMouseSq) / Math.sqrt(15000);
          size += hoverIntensity * 3 * scale;
          opacity = Math.min(1, opacity + hoverIntensity * 0.8);
          
          // Draw glow
          ctx.beginPath();
          ctx.arc(px, py, size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${hoverIntensity * 0.15})`;
          ctx.fill();
        }

        if (ctx) {
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(147, 197, 253, ${opacity})`;
          ctx.fill();
        }

        return { px, py, scale, opacity };
      }
    }

    const numStars = 500;
    const fov = 300;
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
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX - width / 2;
      mouseY = e.clientY - height / 2;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;

    const render = (time: number) => {
      // Smooth mouse interpolation
      currentMouseX += (mouseX - currentMouseX) * 0.05;
      currentMouseY += (mouseY - currentMouseY) * 0.05;

      if (ctx) {
        // Deep dark blue background with trailing effect
        ctx.fillStyle = "rgba(2, 6, 23, 0.4)";
        ctx.fillRect(0, 0, width, height);
      }

      const cx = width / 2;
      const cy = height / 2;
      const projectedStars = [];

      // Update and draw stars
      for (const star of stars) {
        star.update(time);
        const p = star.draw(cx, cy, currentMouseX, currentMouseY, fov);
        if (p) {
          projectedStars.push({ star, ...p });
        }
      }

      if (ctx) {
        // Draw constellation connections
        ctx.lineWidth = 0.5;
        for (let i = 0; i < projectedStars.length; i++) {
          for (let j = i + 1; j < projectedStars.length; j++) {
            const p1 = projectedStars[i];
            const p2 = projectedStars[j];

            // Check 3D distance
            const dx = p1.star.x - p2.star.x;
            const dy = p1.star.y - p2.star.y;
            const dz = p1.star.z - p2.star.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < 30000) {
              const dist = Math.sqrt(distSq);
              const lineOpacity = (1 - dist / Math.sqrt(30000)) * 0.4 * p1.opacity * p2.opacity;
              
              if (lineOpacity > 0.01) {
                ctx.beginPath();
                ctx.moveTo(p1.px, p1.py);
                ctx.lineTo(p2.px, p2.py);
                ctx.strokeStyle = `rgba(56, 189, 248, ${lineOpacity})`;
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
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <main className="relative w-full overflow-x-hidden bg-[#020617] cursor-none">
      {/* Custom Magic Cursor (Tiny glowing dot) */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: "radial-gradient(4px 4px at var(--mouse-x) var(--mouse-y), rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
          mixBlendMode: "screen",
          filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))",
        }}
      />

    <section className="relative w-full h-screen overflow-hidden sticky top-0">
      {/* Deep gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#020617]/90 to-[#020617] pointer-events-none" />
      
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pointer-events-none select-none px-4">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-medium text-white text-center pb-2">
            Constellation
          </h1>
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 1.5, ease: "anticipate" }}
            className="w-full max-w-[250px] md:max-w-md h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent my-4 md:my-6" 
          />
          <motion.p 
            initial={{ opacity: 0, letterSpacing: "0em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ delay: 1.5, duration: 2, ease: "easeOut" }}
            className="text-sm md:text-base lg:text-lg font-light text-blue-300/90 uppercase text-center ml-2"
          >
            Building foundation models of human state
          </motion.p>
        </motion.div>
      </div>
    </section>

    {/* Proposal Content Section - Minimalistic & Lowkey */}
    <section className="relative z-10 w-full min-h-screen bg-[#020617] text-white/80 px-6 py-32 md:py-48 flex justify-center">
      <div className="max-w-3xl w-full flex flex-col gap-24 font-light text-lg md:text-xl leading-relaxed">
        
        {/* Intro */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-3xl md:text-4xl font-playfair font-medium text-white mb-6">Constellation Systems &mdash; a proposal</h2>
          <p className="text-blue-300/70 uppercase tracking-widest text-sm mb-4">For Avery & the Constellation team</p>
          <div className="flex gap-6 text-sm text-white/50 mb-8 border-b border-white/10 pb-8">
            <p><span className="text-white/30 mr-2">Role:</span>Operator &middot; Ex-founder</p>
            <p><span className="text-white/30 mr-2">Date:</span>March 2026</p>
          </div>
        </motion.div>

        {/* Hypotheses */}
        <div className="space-y-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
          >
            <p className="text-blue-400/50 uppercase tracking-widest text-xs mb-4 font-normal">Hypothesis 1</p>
            <h3 className="text-2xl font-playfair font-medium text-white mb-4">Research participant pools are a bottleneck.</h3>
            <p className="mb-6">Sourcing and managing qualified research participants takes time that could go toward science. I'd own this end-to-end.</p>
            
            <div className="pl-6 border-l border-white/10 space-y-4 text-base text-white/60 mb-6">
              <p><strong className="text-white/80 font-medium">W1:</strong> Audit what's working for competitors and Constellation. Decide: double down or test a side strategy.</p>
              <p><strong className="text-white/80 font-medium">W2:</strong> Enough data to commit to one approach. Begin full execution.</p>
              <p><strong className="text-white/80 font-medium">W3:</strong> Optimize and push the system hard.</p>
              <p><strong className="text-white/80 font-medium">W4:</strong> Evaluate results. Ship a report. Begin testing the next lever.</p>
            </div>
            
            <p className="text-sm font-medium text-blue-300/80">&rarr; KPI: Qualified participants who complete a session.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
          >
            <p className="text-blue-400/50 uppercase tracking-widest text-xs mb-4 font-normal">Hypothesis 2</p>
            <h3 className="text-2xl font-playfair font-medium text-white mb-4">Ops overhead is draining technical talent.</h3>
            <p className="mb-6">Same logic here. I'd identify the highest-friction tasks &mdash; founder bandwidth drains, ops chaos, partnerships &mdash; and eliminate them.</p>
            
            <div className="pl-6 border-l border-white/10 space-y-4 text-base text-white/60 mb-6">
              <p><strong className="text-white/80 font-medium">W1:</strong> Shadow the team. Map every recurring task that isn't core research.</p>
              <p><strong className="text-white/80 font-medium">W2:</strong> Systematize, delegate, or kill the top offenders.</p>
              <p><strong className="text-white/80 font-medium">W3:</strong> Deliver a clean ops playbook. The team doesn't touch these again.</p>
            </div>

            <p className="text-sm font-medium text-blue-300/80">&rarr; KPI: Researcher/founder hours reclaimed per week.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
          >
            <p className="text-blue-400/50 uppercase tracking-widest text-xs mb-4 font-normal">Hypothesis 3</p>
            <h3 className="text-2xl font-playfair font-medium text-white mb-4">The real bottleneck is one I haven't named yet.</h3>
            <p className="mb-4">These first two are my best guesses from the outside. The actual constraint worth solving lives in a conversation between us.</p>
            <p className="italic text-white/60 mb-6">"What's the thing your team keeps bumping into that no job description has captured?"</p>
            <p className="text-sm font-medium text-blue-300/80">&rarr; KPI: Defined together.</p>
          </motion.div>
        </div>

        {/* Expectations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="pt-12 border-t border-white/10"
        >
          <h2 className="text-3xl font-playfair font-medium text-white mb-8">Expectations</h2>
          <ul className="space-y-6 text-white/70">
            <li className="flex gap-4">
              <span className="text-blue-400 mt-1">&bull;</span>
              <span>Full ownership. I'll consult the team for key decisions and always come with proposals, not just problems.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-400 mt-1">&bull;</span>
              <span>A mission-driven operator who's also the grounded person you want around in a moment of crisis.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-400 mt-1">&bull;</span>
              <span>For those building foundational models to understand the human condition.</span>
            </li>
          </ul>

          <div className="mt-16 text-sm text-center">
            <a 
              href="https://www.linkedin.com/in/daniel-martinez111" 
              target="_blank" 
              rel="noreferrer"
              className="inline-block border border-white/10 hover:border-white/30 rounded-full px-8 py-3 transition-colors text-white/80 hover:text-white"
            >
              linkedin.com/in/daniel-martinez111
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  </main>
  );
}
