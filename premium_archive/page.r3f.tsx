"use client";

import dynamic from "next/dynamic";
import HeroOverlay from "./components/HeroOverlay";
import SectionBlock from "./components/SectionBlock";
import CTAButton from "./components/CTAButton";

// Dynamic import to avoid SSR issues with Three.js
const ConstellationScene = dynamic(
  () => import("./components/ConstellationScene"),
  { ssr: false }
);

// ── Section Content ───────────────────────────────────────────────────────────
// Edit these to customize the proposal sections.

const SECTIONS = [
  {
    title: "Why Constellation",
    body: (
      <>
        <p>
          The human nervous system is a multimodal sensor network - brain
          signals, physiological rhythms, movement patterns, and environmental
          context all converge into a single latent state that drives behavior
          and experience.
        </p>
        <p>
          Constellation is built on the thesis that no single signal tells the
          full story. By fusing neural, physiological, and environmental data
          streams in real time, we can infer the hidden states that matter most -
          cognitive load, emotional valence, fatigue, flow, and intent - with a
          fidelity that isolated signals can never reach.
        </p>
        <p>
          This is not another wearable dashboard. This is inference
          infrastructure for the latent human state.
        </p>
      </>
    ),
  },
  {
    title: "30-Day Pilot",
    body: (
      <>
        <p>
          We propose a focused 30-day engagement to validate core technical
          assumptions and demonstrate measurable signal quality. The pilot
          is scoped to a single use case with clear success criteria.
        </p>
        <p>
          <span className="text-blue-300/70">Week 1-2:</span> Sensor integration and
          baseline data collection across three modalities. Hardware-agnostic
          ingestion pipeline deployed.
        </p>
        <p>
          <span className="text-blue-300/70">Week 2-3:</span> Multimodal fusion model
          trained on collected data. Latent state inference validated against
          ground-truth labels.
        </p>
        <p>
          <span className="text-blue-300/70">Week 3-4:</span> Real-time inference
          demo. Technical report with quantitative results, failure analysis,
          and recommended next steps.
        </p>
      </>
    ),
  },
  {
    title: "Why Me",
    body: (
      <>
        <p>
          I build at the intersection of neuroscience, machine learning, and
          product engineering. My background spans brain-computer interfaces,
          real-time signal processing, and production ML systems.
        </p>
        <p>
          The operator wedge here is clear: the frontier NeuroAI space needs
          builders who can move between research and engineering without
          translation overhead. I ship fast, think rigorously, and have the
          domain depth to make this work.
        </p>
        <p>
          I&rsquo;m not proposing a research project. I&rsquo;m proposing a proof of
          capability - one that becomes the foundation of a real product.
        </p>
      </>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Hero Section */}
      <section id="hero" className="relative w-full h-screen">
        <ConstellationScene />
        <HeroOverlay />
      </section>

      {/* Content Sections */}
      <section className="relative z-20 py-24 md:py-36">
        {/* Gradient transition from hero */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#020617] to-transparent pointer-events-none" />

        <div className="space-y-24 md:space-y-36">
          {SECTIONS.map((section, i) => (
            <SectionBlock
              key={section.title}
              title={section.title}
              body={section.body}
              index={i}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-24 md:mt-36">
          <CTAButton href="#hero">Begin the Conversation</CTAButton>
        </div>

        {/* Footer */}
        <footer className="mt-32 md:mt-48 text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-blue-400/20 font-light">
            NeuralAI - Constellation
          </p>
        </footer>
      </section>
    </div>
  );
}
