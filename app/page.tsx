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
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#020617]">
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
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-blue-50 via-blue-200 to-blue-600 drop-shadow-[0_0_40px_rgba(56,189,248,0.4)] text-center pb-2">
            NeuralAI
          </h1>
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 1.5, ease: "anticipate" }}
            className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent my-6" 
          />
          <motion.p 
            initial={{ opacity: 0, letterSpacing: "0em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ delay: 1.5, duration: 2, ease: "easeOut" }}
            className="text-lg md:text-2xl lg:text-3xl font-light text-blue-300/90 uppercase text-center ml-2"
          >
            Constellation
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
