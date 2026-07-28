import { useRef, type ReactNode } from "react";
import { motion, useInView } from "motion/react";

export const EASE = [0.16, 1, 0.3, 1] as const;
export const TRANSITION_MICRO = { duration: 0.18, ease: EASE };
export const TRANSITION_MACRO = { duration: 0.5, ease: EASE };

export const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: TRANSITION_MACRO,
  },
};
export const stagger = (d = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: d } },
});

export function FadeUpWhenVisible({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            ...TRANSITION_MACRO,
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

