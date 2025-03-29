"use client";

import React from "react";
import Hero from "@sections/hero";
import Features from "@sections/features";
import Testimonials from "@sections/testimonials";
import { ScrollReveal } from "@ui/scroll-reveal";

export default function Home() {
  return (
    <>
      <ScrollReveal>
        <Hero />
      </ScrollReveal>

      <ScrollReveal delay={0.2} className="mb-128">
        <Features />
      </ScrollReveal>

      <ScrollReveal delay={0.3}>
        <Testimonials />
      </ScrollReveal>
    </>
  );
}
