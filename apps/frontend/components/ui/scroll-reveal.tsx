import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type Direction = "up" | "down" | "left" | "right";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}

type DirectionOffset = {
  x?: number;
  y?: number;
};

export const ScrollReveal = ({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: ScrollRevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });

  const directionOffset: Record<Direction, DirectionOffset> = {
    up: { y: 50 },
    down: { y: -50 },
    left: { x: 50 },
    right: { x: -50 },
  };

  const initialOffset = directionOffset[direction];

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...initialOffset,
      }}
      animate={{
        opacity: isInView ? 1 : 0,
        x: isInView ? 0 : (initialOffset.x ?? 0),
        y: isInView ? 0 : (initialOffset.y ?? 0),
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.21, 0.45, 0.27, 0.99],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
