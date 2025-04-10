"use client";

import React from "react";
import { motion } from "framer-motion";

interface LineProps {
  type: "solid" | "broken";
  entranceVariants: any;
}

// Simple fade and scale animation for both line types
const lineVariants = {
  initial: {
    opacity: 0,
    scaleX: 0,
  },
  animate: {
    opacity: 1,
    scaleX: 1,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
  visible: {
    opacity: 1,
    scaleX: 1,
  },
};

export default function Line({ type, entranceVariants }: LineProps) {
  return (
    <motion.div
      variants={entranceVariants}
      className="w-full h-4 flex justify-center items-center"
    >
      <motion.div
        variants={lineVariants}
        className={`w-16 flex ${type === "broken" ? "justify-between" : "justify-center"}`}
      >
        {type === "solid" ? (
          <div className="h-2 w-16 bg-brand-hexagram rounded-full" />
        ) : (
          <>
            <div className="h-2 w-6 bg-brand-hexagram rounded-full" />
            <div className="h-2 w-6 bg-brand-hexagram rounded-full" />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
