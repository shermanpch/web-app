"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import Line from "./Line";

// Animation variants for the container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3, // Increased to account for longer line animations
      delayChildren: 0.3, // Slight initial delay
    },
  },
};

const lineEntranceVariants = {
  hidden: { opacity: 0, y: 10 }, // Added subtle upward movement
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

interface AnimatedHexagramProps {
  lines?: ("solid" | "broken")[];
}

const AnimatedHexagram = ({
  lines = ["solid", "broken", "solid", "broken", "solid", "broken"],
}: AnimatedHexagramProps) => {
  const hasAnimated = useRef(false);

  return (
    <motion.div
      variants={containerVariants}
      initial={hasAnimated.current ? "visible" : "hidden"}
      animate="visible"
      onAnimationComplete={() => {
        hasAnimated.current = true;
      }}
      // Adjusted classes for spacing, ensure Line component has height
      className="flex flex-col-reverse items-center space-y-reverse space-y-1 w-full h-full justify-center"
    >
      {lines.map((lineType, index) => (
        <Line
          key={index}
          type={lineType}
          entranceVariants={lineEntranceVariants} // Pass variants for staggering
        />
      ))}
    </motion.div>
  );
};

export default AnimatedHexagram;
